from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import ValidationError

from .models import Gasto, CertificacionPOA
from apps.memorias.models import MemoriaCalculo
from apps.memorias.utils import recalcular_saldos_memoria
from apps.presupuestos.models import PresupuestoArea, Gestion


def recalcular_estado_memoria_y_presupuesto(memoria):
    """
    Actualiza:
    1. Los saldos almacenados en MemoriaCalculo (presupuestado, ejecutado, traspasos, saldo disponible).
    2. El monto_actual del PresupuestoArea correspondiente.
    """
    area = memoria.seccion.area
    gestion = memoria.gestion

    # 1. Actualizar saldos almacenados de la memoria
    recalcular_saldos_memoria(memoria)

    # 2. Actualizar PresupuestoArea: Monto_Actual = Monto_Inicial - Gastos_Ejecutados
    presupuesto = PresupuestoArea.objects.filter(gestion=gestion, area=area).first()
    if presupuesto:
        total_gastos_area = Gasto.objects.filter(
            memoria__gestion=gestion,
            memoria__seccion__area=area
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

        presupuesto.monto_actual = max(Decimal('0.00'), presupuesto.monto_inicial - total_gastos_area)
        presupuesto.save(update_fields=['monto_actual'])


class GastoService:
    @staticmethod
    @transaction.atomic
    def registrar_gasto(data, usuario):
        memoria = data.get('memoria')
        if not memoria:
            raise ValidationError({'memoria': 'Debe especificar una memoria de cálculo válida.'})

        # Bloqueo select_for_update para evitar condiciones de carrera concurrentes
        memoria = MemoriaCalculo.objects.select_for_update().get(id=memoria.id)

        # 1. Validar estado de la gestión
        if memoria.gestion.estado == Gestion.EstadoGestion.FINALIZADO:
            raise ValidationError({'non_field_errors': [f'No se pueden registrar gastos en la Gestión {memoria.gestion.anio} porque está finalizada/cerrada.']})

        # 2. Validar que la memoria esté aprobada formalmente
        if memoria.estado != MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS:
            raise ValidationError({'memoria': [f'Solo se pueden ejecutar gastos sobre memorias con Aprobación Presupuestaria Final (APROBADO_FINANZAS). Estado actual: {memoria.get_estado_display()}.']})

        # 3. Validar monto contra saldo disponible real (contemplando traspasos)
        monto = Decimal(str(data.get('monto_ejecutado', 0)))
        if monto <= Decimal('0.00'):
            raise ValidationError({'monto_ejecutado': ['El monto ejecutado debe ser mayor a Bs. 0,00.']})

        if monto > memoria.saldo_disponible:
            raise ValidationError({'monto_ejecutado': [f'Saldo insuficiente. El monto solicitado (Bs. {monto:,.2f}) supera el saldo disponible actual de la memoria (Bs. {memoria.saldo_disponible:,.2f}).']})

        # 4. Crear gasto y recalcular
        gasto = Gasto.objects.create(
            monto_ejecutado=monto,
            fecha_gasto=data.get('fecha_gasto'),
            comprobante_num=data.get('comprobante_num'),
            observacion=data.get('observacion'),
            memoria=memoria,
            usuario_registro=usuario
        )

        recalcular_estado_memoria_y_presupuesto(memoria)
        return gasto

    @staticmethod
    @transaction.atomic
    def actualizar_gasto(gasto, data):
        nuevo_monto = Decimal(str(data.get('monto_ejecutado', gasto.monto_ejecutado)))
        memoria = data.get('memoria', gasto.memoria)
        memoria = MemoriaCalculo.objects.select_for_update().get(id=memoria.id)

        # Saldo disponible sumando el monto previo de este mismo gasto
        monto_anterior = gasto.monto_ejecutado if gasto.memoria_id == memoria.id else Decimal('0.00')
        saldo_maximo = memoria.saldo_disponible + monto_anterior

        if nuevo_monto <= Decimal('0.00'):
            raise ValidationError({'monto_ejecutado': ['El monto ejecutado debe ser mayor a Bs. 0,00.']})

        if nuevo_monto > saldo_maximo:
            raise ValidationError({'monto_ejecutado': [f'Saldo insuficiente. El monto (Bs. {nuevo_monto:,.2f}) excede el disponible restante (Bs. {saldo_maximo:,.2f}).']})

        for key, value in data.items():
            setattr(gasto, key, value)
        gasto.save()

        recalcular_estado_memoria_y_presupuesto(memoria)
        if gasto.memoria_id != memoria.id:
            recalcular_estado_memoria_y_presupuesto(gasto.memoria)

        return gasto

    @staticmethod
    @transaction.atomic
    def eliminar_gasto(gasto):
        memoria = gasto.memoria
        gasto.delete()
        recalcular_estado_memoria_y_presupuesto(memoria)


class CertificacionService:
    @staticmethod
    def get_user_roles(user):
        if not user or not user.is_authenticated:
            return {'is_admin': False, 'is_planif': False, 'is_presupuestos': False, 'is_gerente': False, 'is_readonly': True, 'area_id': None}

        is_admin = bool(user.is_superuser)
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        rol_clean = rol_nombre.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')

        if 'ADMIN' in rol_clean:
            is_admin = True

        is_planif = is_admin or ('PLANIFIC' in rol_clean)
        is_presupuestos = is_admin or ('APROBAD' in rol_clean) or ('PRESUPUEST' in rol_clean) or ('FINANZ' in rol_clean)
        is_tesoreria = is_admin or ('TESORER' in rol_clean)
        is_gerente = 'GERENT' in rol_clean
        is_readonly = not (is_admin or is_planif or is_presupuestos or is_tesoreria or is_gerente)

        area_id = None
        if hasattr(user, 'seccion') and user.seccion:
            area_id = user.seccion.area_id
        elif hasattr(user, 'area') and user.area:
            area_id = user.area.id

        return {
            'is_admin': is_admin,
            'is_planif': is_planif,
            'is_presupuestos': is_presupuestos,
            'is_tesoreria': is_tesoreria,
            'is_gerente': is_gerente,
            'is_readonly': is_readonly,
            'area_id': area_id,
        }

    @staticmethod
    def get_diminutivo_area(area):
        if not area:
            return "OPS"
        codigo = (area.codigo or "").strip().upper()
        nombre = (area.nombre or "").strip().upper()

        if 'OPERACIONES' in nombre or codigo.endswith('-GO'):
            return 'OPS'
        if 'INFORM' in nombre or codigo.endswith('-IF'):
            return 'IF'
        if 'ADMIN' in nombre or codigo.endswith('-GAA'):
            return 'GAA'
        if 'COMERCIAL' in nombre or codigo.endswith('-GC'):
            return 'GC'
        if 'AERONAVE' in nombre or codigo.endswith('-AE'):
            return 'AE'
        if 'SMS' in nombre or codigo.endswith('-SMS'):
            return 'SMS'

        if '-' in codigo:
            tokens = codigo.split('-')
            last = tokens[-1].strip()
            if last and not last.isdigit():
                return last

        clean = (
            nombre.replace('GERENCIA DE ', '')
            .replace('GERENCIA REGIONAL ', '')
            .replace('GERENCIA ', '')
            .replace('UNIDAD DE ', '')
            .replace('UNIDAD ', '')
            .replace('AGENCIA ', '')
            .replace('SUCURSAL ', '')
            .strip()
        )
        return clean[:4] if clean else "OPS"

    @staticmethod
    def obtener_siguiente_correlativo(gestion, area=None):
        if not gestion:
            raise ValidationError({'gestion': ['Gestión no encontrada.']})
        anio = gestion.anio
        anio_2dig = str(anio)[-2:]

        # 1. Correlativo Específico de Gerencia (solo certificaciones emitidas)
        if area:
            count_area = CertificacionPOA.objects.filter(
                gestion=gestion, area=area
            ).exclude(codigo_certificacion="").exclude(estado__in=[
                CertificacionPOA.EstadoCertificacion.BORRADOR,
                CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION,
                CertificacionPOA.EstadoCertificacion.ANULADO
            ]).count()
            correlativo_area = count_area + 1
            area_code = CertificacionService.get_diminutivo_area(area)
            numero_oficio_solicitud = f"GCIA.{area_code}.EPTAM. Stría Nº {correlativo_area}/{anio_2dig}"
        else:
            correlativo_area = 1
            numero_oficio_solicitud = f"GCIA.OPS.EPTAM. Stría Nº {correlativo_area}/{anio_2dig}"

        # 2. Correlativo Global de Planificación (solo certificaciones emitidas)
        count_global = CertificacionPOA.objects.filter(
            gestion=gestion
        ).exclude(codigo_certificacion="").exclude(estado__in=[
            CertificacionPOA.EstadoCertificacion.BORRADOR,
            CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION,
            CertificacionPOA.EstadoCertificacion.ANULADO
        ]).count()
        correlativo_global = count_global + 1
        codigo_certificacion = f"UPLANIF.EPTAM.CP. Nº {correlativo_global}/{anio}"

        return {
            'gestion_id': gestion.id,
            'gestion_anio': anio,
            'area_id': area.id if area else None,
            'correlativo_area': correlativo_area,
            'numero_oficio_solicitud': numero_oficio_solicitud,
            'correlativo_global': correlativo_global,
            'codigo_certificacion': codigo_certificacion,
        }

    @staticmethod
    @transaction.atomic
    def enviar_revision(cert, user, es_contratacion=None):
        roles = CertificacionService.get_user_roles(user)
        if not (roles['is_admin'] or roles['is_gerente']):
            raise ValidationError({'non_field_errors': ['No tienes permisos para enviar solicitudes.']})

        if roles['is_gerente'] and not roles['is_admin'] and cert.area_id != roles['area_id']:
            raise ValidationError({'non_field_errors': ['No puedes enviar solicitudes pertenecientes a otra área.']})

        if cert.estado not in [CertificacionPOA.EstadoCertificacion.BORRADOR, CertificacionPOA.EstadoCertificacion.OBSERVADO]:
            raise ValidationError({'non_field_errors': ['Solo se pueden enviar solicitudes en estado Borrador u Observado.']})

        if not cert.hoja_ruta or not str(cert.hoja_ruta).strip():
            raise ValidationError({'hoja_ruta': ['La Hoja de Ruta / CITE / Razón de la solicitud es OBLIGATORIA antes de enviar.']})

        if cert.monto_solicitado <= Decimal('0.00'):
            raise ValidationError({'monto_solicitado': ['El monto solicitado debe ser mayor a 0.']})

        if cert.memoria:
            saldo_disp = Decimal(str(cert.memoria.saldo_disponible or '0.00'))
            if cert.monto_solicitado > saldo_disp:
                raise ValidationError({
                    'monto_solicitado': [f'El monto solicitado (Bs. {cert.monto_solicitado:,.2f}) supera el saldo disponible de la memoria de cálculo (Bs. {saldo_disp:,.2f}).']
                })

        # Determinar si es Contrataciones:
        if cert.monto_solicitado > Decimal('2000.00'):
            cert.es_contratacion = True
        elif es_contratacion is not None:
            if isinstance(es_contratacion, str):
                cert.es_contratacion = es_contratacion.strip().lower() in ['true', '1']
            else:
                cert.es_contratacion = bool(es_contratacion)

        from apps.notificaciones.services import crear_notificacion, notificar_rol
        from apps.notificaciones.models import Notificacion

        if cert.es_contratacion:
            cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION
            cert.save(update_fields=['estado', 'es_contratacion'])
            notificar_rol(
                'PLANIFICADOR',
                f"Nueva Solicitud de Contratación POA ({cert.hoja_ruta})",
                f"El área {cert.area.nombre} ha remitido la solicitud de Contratación con Hoja de Ruta {cert.hoja_ruta} para revisión técnica y certificación POA.",
                tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE,
                usuario_origen=user,
                enlace='/certificaciones'
            )
            return {
                'status': 'Solicitud de contratación enviada a Planificación para revisión técnica y certificación POA exitosamente.',
                'estado': cert.estado,
                'es_contratacion': cert.es_contratacion
            }
        else:
            cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS
            cert.save(update_fields=['estado', 'es_contratacion'])
            notificar_rol(
                'APROBADOR',
                f"Nueva Solicitud de Gasto Menor ({cert.hoja_ruta})",
                f"El área {cert.area.nombre} ha remitido la solicitud de gasto menor (Hoja de Ruta {cert.hoja_ruta}) directamente para visto bueno presupuestario.",
                tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE,
                usuario_origen=user,
                enlace='/certificaciones'
            )
            return {
                'status': 'Solicitud enviada directamente a Presupuestos para visto bueno financiero exitosamente.',
                'estado': cert.estado,
                'es_contratacion': cert.es_contratacion
            }

    @staticmethod
    @transaction.atomic
    def certificar_planificacion(cert, user, data):
        roles = CertificacionService.get_user_roles(user)
        if not roles['is_planif']:
            raise ValidationError({'non_field_errors': ['Solo el rol de Planificación o Administrador puede emitir la Certificación POA.']})

        if cert.estado != CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION:
            raise ValidationError({'non_field_errors': ['La certificación no se encuentra en revisión de Planificación.']})

        from apps.presupuestos.models import Partida
        from apps.planificacion.models import Operacion
        from apps.notificaciones.services import crear_notificacion, notificar_rol
        from apps.notificaciones.models import Notificacion

        codigo_certificacion = str(data.get('codigo_certificacion') or '').strip()
        numero_oficio = str(data.get('numero_oficio_solicitud') or '').strip()
        observacion = str(data.get('observacion') or '').strip()
        categoria_prog_cod = str(data.get('categoria_programatica_codigo') or '').strip()
        categoria_prog = str(data.get('categoria_programatica') or '').strip()
        notas = str(data.get('notas') or '').strip()
        memoria_id = data.get('memoria_id') or data.get('memoria')
        partida_id = data.get('partida_id') or data.get('partida')
        operacion_id = data.get('operacion_id') or data.get('operacion')

        # Alineación y corrección de Memoria de Cálculo por Planificación
        if memoria_id:
            try:
                memoria_obj = MemoriaCalculo.objects.get(id=memoria_id)
                cert.memoria = memoria_obj
                if not partida_id:
                    primer_detalle = memoria_obj.detalles.select_related('partida').first()
                    if primer_detalle and primer_detalle.partida:
                        cert.partida = primer_detalle.partida
                        cert.partida_literal = primer_detalle.partida.nombre
                if not operacion_id and memoria_obj.operacion:
                    cert.operaciones.set([memoria_obj.operacion])
            except MemoriaCalculo.DoesNotExist:
                raise ValidationError({'memoria_id': ['La memoria de cálculo seleccionada no existe.']})

        # Alineación y corrección de Partida por Planificación
        if partida_id:
            try:
                partida_obj = Partida.objects.get(id=partida_id)
                cert.partida = partida_obj
                cert.partida_literal = partida_obj.nombre
            except Partida.DoesNotExist:
                raise ValidationError({'partida_id': ['La partida presupuestaria seleccionada no existe.']})

        # Alineación y corrección de Operación por Planificación
        if operacion_id:
            try:
                operacion_obj = Operacion.objects.get(id=operacion_id)
                cert.operaciones.set([operacion_obj])
            except Operacion.DoesNotExist:
                raise ValidationError({'operacion_id': ['La operación POA seleccionada no existe.']})

        # 1. Asignar/Confirmar Código Oficial Global de Certificación POA
        if codigo_certificacion:
            cert.codigo_certificacion = codigo_certificacion
        elif not cert.codigo_certificacion:
            anio = cert.gestion.anio
            count_global = CertificacionPOA.objects.filter(
                gestion=cert.gestion
            ).exclude(codigo_certificacion="").exclude(estado__in=[
                CertificacionPOA.EstadoCertificacion.BORRADOR,
                CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION,
                CertificacionPOA.EstadoCertificacion.ANULADO
            ]).count()
            cert.codigo_certificacion = f"UPLANIF.EPTAM.CP. Nº {count_global + 1}/{anio}"

        # 2. Asignar/Confirmar Número de Oficio Correlativo según Gerencia
        if numero_oficio:
            cert.numero_oficio_solicitud = numero_oficio
        elif not cert.numero_oficio_solicitud:
            anio = cert.gestion.anio
            anio_2dig = str(anio)[-2:]
            count_area = CertificacionPOA.objects.filter(
                gestion=cert.gestion, area=cert.area
            ).exclude(codigo_certificacion="").exclude(estado__in=[
                CertificacionPOA.EstadoCertificacion.BORRADOR,
                CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION,
                CertificacionPOA.EstadoCertificacion.ANULADO
            ]).count()
            area_code = CertificacionService.get_diminutivo_area(cert.area)
            cert.numero_oficio_solicitud = f"GCIA.{area_code}.EPTAM. Stría Nº {count_area + 1}/{anio_2dig}"

        if observacion:
            cert.observacion_planificacion = observacion
        if categoria_prog_cod:
            cert.categoria_programatica_codigo = categoria_prog_cod
        if categoria_prog:
            cert.categoria_programatica = categoria_prog
        if notas:
            cert.notas = notas

        # Validar disponibilidad si hay memoria vinculada
        if cert.memoria:
            saldo_disp = Decimal(str(cert.memoria.saldo_disponible or '0.00'))
            if cert.monto_solicitado > saldo_disp:
                raise ValidationError({
                    'monto_solicitado': [f'No hay saldo suficiente en la Memoria de Cálculo ({cert.memoria.codigo}). Solicitado: Bs. {cert.monto_solicitado:,.2f}, Disponible: Bs. {saldo_disp:,.2f}.']
                })

        cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS
        cert.save()

        # Notificar a la Gerencia Solicitante para que recoja el certificado emitido
        if cert.creado_por:
            crear_notificacion(
                cert.creado_por,
                f"Certificación POA Emitida - Lista para recojo ({cert.codigo_certificacion})",
                f"Planificación ha emitido la certificación POA de tu solicitud (Hoja de Ruta {cert.hoja_ruta}). Puedes pasar a recoger el certificado; la solicitud fue remitida a Presupuestos para el visto bueno financiero.",
                tipo=Notificacion.TipoNotificacion.APROBACION,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        # Notificar a Presupuestos para el double check financiero
        notificar_rol(
            'APROBADOR',
            f"Certificación POA para Visto Bueno Financiero ({cert.codigo_certificacion})",
            f"Planificación ha certificado la solicitud de {cert.area.nombre} (Hoja de Ruta {cert.hoja_ruta}). Pendiente verificación y visto bueno presupuestario.",
            tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE,
            usuario_origen=user,
            enlace='/certificaciones'
        )

        return {
            'status': 'Certificación POA emitida exitosamente. Se notificó a la gerencia para recojo y se remitió a Presupuestos.',
            'estado': cert.estado,
            'codigo_certificacion': cert.codigo_certificacion,
            'numero_oficio_solicitud': cert.numero_oficio_solicitud
        }

    @staticmethod
    @transaction.atomic
    def aprobar_presupuestos(cert, user, data=None, observacion=''):
        roles = CertificacionService.get_user_roles(user)
        if not roles['is_presupuestos']:
            raise ValidationError({'non_field_errors': ['Solo el rol de Presupuestos / Aprobador o Administrador puede otorgar el visto bueno financiero.']})

        if cert.estado != CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS:
            raise ValidationError({'non_field_errors': ['La certificación no se encuentra pendiente de visto bueno en Presupuestos.']})

        from apps.presupuestos.models import Partida

        obs_text = observacion or ''
        if isinstance(data, dict):
            obs_text = data.get('observacion', '') or obs_text
            memoria_id = data.get('memoria_id') or data.get('memoria')
            if memoria_id:
                try:
                    memoria_obj = MemoriaCalculo.objects.get(id=memoria_id)
                    cert.memoria = memoria_obj
                except MemoriaCalculo.DoesNotExist:
                    raise ValidationError({'memoria_id': ['La memoria de cálculo seleccionada no existe.']})

            partida_id = data.get('partida_id') or data.get('partida')
            if partida_id:
                try:
                    partida_obj = Partida.objects.get(id=partida_id)
                    cert.partida = partida_obj
                    cert.partida_literal = partida_obj.nombre
                except Partida.DoesNotExist:
                    raise ValidationError({'partida_id': ['La partida presupuestaria seleccionada no existe.']})
        elif isinstance(data, str) and not obs_text:
            obs_text = data

        if cert.memoria:
            saldo_disp = Decimal(str(cert.memoria.saldo_disponible or '0.00'))
            if cert.monto_solicitado > saldo_disp:
                raise ValidationError({
                    'monto_solicitado': [f'Fondos insuficientes en la Memoria de Cálculo ({cert.memoria.codigo}). Solicitado: Bs. {cert.monto_solicitado:,.2f}, Disponible: Bs. {saldo_disp:,.2f}.']
                })

        from django.utils import timezone
        from apps.notificaciones.services import crear_notificacion, notificar_rol
        from apps.notificaciones.models import Notificacion

        if obs_text:
            cert.observacion_presupuestos = obs_text.strip()

        cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_TESORERIA
        cert.aprobado_por = user
        cert.fecha_aprobacion = timezone.now()
        cert.save()

        # Notificar a Tesorería para confirmación del desembolso
        notificar_rol(
            'TESORERIA',
            f"Certificación para Desembolso ({cert.codigo_certificacion or cert.hoja_ruta})",
            f"Presupuestos ha otorgado el visto bueno a la certificación del área {cert.area.nombre} (Hoja de Ruta {cert.hoja_ruta}). Pendiente confirmación de salida de fondos.",
            tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE,
            usuario_origen=user,
            enlace='/certificaciones'
        )

        # Notificar al solicitante
        if cert.creado_por:
            crear_notificacion(
                cert.creado_por,
                f"Visto Bueno Presupuestario Aprobado ({cert.hoja_ruta})",
                f"Tu solicitud con Hoja de Ruta {cert.hoja_ruta} ha recibido el visto bueno financiero de Presupuestos y fue remitida a Tesorería para el desembolso correspondiente.",
                tipo=Notificacion.TipoNotificacion.APROBACION,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        # Si era de contrataciones, notificar a Planificación
        if cert.es_contratacion:
            notificar_rol(
                'PLANIFICADOR',
                f"Certificación Aprobada por Presupuestos ({cert.codigo_certificacion or cert.hoja_ruta})",
                f"Presupuestos ha otorgado el visto bueno financiero a la certificación del área {cert.area.nombre} y la derivó a Tesorería.",
                tipo=Notificacion.TipoNotificacion.APROBACION,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        return {
            'status': 'Visto bueno presupuestario otorgado. Solicitud remitida a Tesorería para desembolso.',
            'estado': cert.estado
        }

    @staticmethod
    @transaction.atomic
    def devolver_a_planificacion(cert, user, motivo):
        roles = CertificacionService.get_user_roles(user)
        if not (roles['is_admin'] or roles['is_presupuestos']):
            raise ValidationError({'non_field_errors': ['Solo el rol de Presupuestos o Administrador puede devolver una certificación a Planificación.']})

        if cert.estado != CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS:
            raise ValidationError({'non_field_errors': ['La certificación no se encuentra en revisión de Presupuestos.']})

        motivo = (motivo or '').strip()
        if not motivo:
            raise ValidationError({'motivo': ['El motivo de devolución a Planificación es obligatorio.']})

        from apps.notificaciones.services import notificar_rol
        from apps.notificaciones.models import Notificacion

        cert.observacion_presupuestos = f"[DEVUELTO A PLANIFICACIÓN]: {motivo}"
        cert.estado = CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION
        cert.save(update_fields=['estado', 'observacion_presupuestos'])

        notificar_rol(
            'PLANIFICADOR',
            f"Certificación Devuelta por Presupuestos ({cert.codigo_certificacion or cert.hoja_ruta})",
            f"Presupuestos ha devuelto la certificación del área {cert.area.nombre} a Planificación para reajuste técnico. Motivo: {motivo}",
            tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE,
            usuario_origen=user,
            enlace='/certificaciones'
        )

        return {
            'status': 'Certificación devuelta a Planificación para ajuste técnico.',
            'estado': cert.estado
        }

    @staticmethod
    @transaction.atomic
    def confirmar_desembolso(cert, user, comprobante_pago=''):
        roles = CertificacionService.get_user_roles(user)
        if not (roles['is_admin'] or roles['is_tesoreria']):
            raise ValidationError({'non_field_errors': ['Solo el rol de Tesorería o Administrador puede confirmar el desembolso.']})

        if cert.estado != CertificacionPOA.EstadoCertificacion.PENDIENTE_TESORERIA:
            raise ValidationError({'non_field_errors': ['La certificación no se encuentra en Tesorería pendiente de desembolso.']})

        if not cert.memoria:
            raise ValidationError({'memoria': ['No se puede registrar el gasto porque la certificación no tiene una Memoria de Cálculo vinculada.']})

        memoria = MemoriaCalculo.objects.select_for_update().get(id=cert.memoria.id)

        if cert.monto_solicitado > memoria.saldo_disponible:
            raise ValidationError({'monto_solicitado': [f'Saldo insuficiente en la memoria ({memoria.codigo}). Solicitado: Bs. {cert.monto_solicitado:,.2f}, Disponible: Bs. {memoria.saldo_disponible:,.2f}.']})

        from django.utils import timezone
        from apps.notificaciones.services import crear_notificacion, notificar_rol
        from apps.notificaciones.models import Notificacion

        comprobante = (comprobante_pago or '').strip()
        if not comprobante:
            comprobante = f"DESEMB-{cert.gestion.anio}-{cert.id:04d}"

        cert.desembolsado_por = user
        cert.fecha_desembolso = timezone.now()
        cert.comprobante_pago = comprobante
        cert.estado = CertificacionPOA.EstadoCertificacion.APROBADO
        cert.save(update_fields=['desembolsado_por', 'fecha_desembolso', 'comprobante_pago', 'estado'])

        # Registro AUTOMÁTICO del Gasto formal en el ledger
        gasto = Gasto.objects.create(
            monto_ejecutado=cert.monto_solicitado,
            fecha_gasto=timezone.now().date(),
            comprobante_num=comprobante,
            observacion=f"Desembolso automático de Certificación POA {cert.codigo_certificacion or cert.hoja_ruta}. Solicitante: {cert.solicitante_nombre or cert.area.nombre}. Concepto: {cert.concepto_gasto or 'Certificación POA'}",
            memoria=memoria,
            usuario_registro=user,
            certificacion=cert
        )

        recalcular_estado_memoria_y_presupuesto(memoria)

        # Notificar al solicitante
        if cert.creado_por:
            crear_notificacion(
                cert.creado_por,
                f"¡Desembolso Confirmado! ({cert.codigo_certificacion or cert.hoja_ruta})",
                f"Tesorería ha confirmado la salida de fondos por Bs. {cert.monto_solicitado:,.2f} con comprobante {comprobante}. El gasto ha sido registrado automáticamente.",
                tipo=Notificacion.TipoNotificacion.APROBACION,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        # Notificar a Presupuestos
        notificar_rol(
            'APROBADOR',
            f"Desembolso Concluido ({cert.codigo_certificacion or cert.hoja_ruta})",
            f"Tesorería confirmó la salida de dinero para la certificación del área {cert.area.nombre}. Gasto registrado: Bs. {cert.monto_solicitado:,.2f}.",
            tipo=Notificacion.TipoNotificacion.APROBACION,
            usuario_origen=user,
            enlace='/certificaciones'
        )

        # Notificar a Planificación
        notificar_rol(
            'PLANIFICADOR',
            f"Desembolso Concluido ({cert.codigo_certificacion or cert.hoja_ruta})",
            f"Tesorería confirmó el desembolso y registro de gasto de la certificación POA {cert.codigo_certificacion}.",
            tipo=Notificacion.TipoNotificacion.APROBACION,
            usuario_origen=user,
            enlace='/certificaciones'
        )

        return {
            'status': 'Desembolso confirmado y registrado automáticamente como gasto ejecutado.',
            'estado': cert.estado,
            'gasto_id': gasto.id,
            'comprobante_pago': comprobante,
            'fecha_desembolso': cert.fecha_desembolso.isoformat() if cert.fecha_desembolso else None,
            'desembolsado_por': user.id,
            'desembolsado_por_nombre': user.get_full_name() or user.username,
        }

    @staticmethod
    @transaction.atomic
    def observar(cert, user, observacion):
        roles = CertificacionService.get_user_roles(user)
        can_observe = False
        is_planif_phase = cert.estado == CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION
        is_presup_phase = cert.estado == CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS

        if roles['is_admin']:
            can_observe = True
        elif is_planif_phase and roles['is_planif']:
            can_observe = True
        elif is_presup_phase and roles['is_presupuestos']:
            can_observe = True

        if not can_observe:
            raise ValidationError({'non_field_errors': ['No tienes permisos para observar esta certificación en su estado actual.']})

        observacion = (observacion or '').strip()
        if not observacion:
            raise ValidationError({'observacion': ['El motivo de la observación es obligatorio.']})

        from apps.notificaciones.services import crear_notificacion
        from apps.notificaciones.models import Notificacion

        if is_planif_phase:
            cert.observacion_planificacion = observacion
            update_fields = ['estado', 'observacion_planificacion']
        else:
            cert.observacion_presupuestos = observacion
            update_fields = ['estado', 'observacion_presupuestos']

        cert.estado = CertificacionPOA.EstadoCertificacion.OBSERVADO
        cert.save(update_fields=update_fields)

        if cert.creado_por:
            origen_str = "Planificación" if is_planif_phase else "Presupuestos"
            crear_notificacion(
                cert.creado_por,
                f"Certificación Observada por {origen_str} ({cert.hoja_ruta})",
                f"Tu solicitud con Hoja de Ruta {cert.hoja_ruta} ha sido observada: {observacion}",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        return {
            'status': 'Certificación devuelta con observaciones a la gerencia solicitante.',
            'estado': cert.estado
        }

    @staticmethod
    @transaction.atomic
    def rechazar(cert, user, motivo):
        roles = CertificacionService.get_user_roles(user)
        can_reject = False
        is_planif_phase = cert.estado == CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION
        is_presup_phase = cert.estado == CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS

        if roles['is_admin']:
            can_reject = True
        elif is_planif_phase and roles['is_planif']:
            can_reject = True
        elif is_presup_phase and roles['is_presupuestos']:
            can_reject = True

        if not can_reject:
            raise ValidationError({'non_field_errors': ['No tienes permisos para rechazar esta certificación en su estado actual.']})

        motivo = (motivo or '').strip()
        if not motivo:
            raise ValidationError({'motivo': ['El motivo del rechazo es obligatorio.']})

        from apps.notificaciones.services import crear_notificacion, notificar_rol
        from apps.notificaciones.models import Notificacion

        if is_planif_phase:
            cert.observacion_planificacion = f"[RECHAZADO POR PLANIFICACIÓN]: {motivo}"
            update_fields = ['estado', 'observacion_planificacion']
        else:
            cert.observacion_presupuestos = f"[RECHAZADO POR PRESUPUESTOS]: {motivo}"
            update_fields = ['estado', 'observacion_presupuestos']

        cert.estado = CertificacionPOA.EstadoCertificacion.RECHAZADO
        cert.save(update_fields=update_fields)

        origen_str = "Planificación" if is_planif_phase else "Presupuestos"

        if cert.creado_por:
            crear_notificacion(
                cert.creado_por,
                f"Solicitud Rechazada por {origen_str} ({cert.hoja_ruta})",
                f"Tu solicitud con Hoja de Ruta {cert.hoja_ruta} ha sido rechazada por {origen_str}. Motivo: {motivo}",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        if is_planif_phase:
            notificar_rol(
                'APROBADOR',
                f"Solicitud Rechazada en Planificación ({cert.hoja_ruta})",
                f"Planificación ha rechazado la solicitud del área {cert.area.nombre} (Hoja de Ruta {cert.hoja_ruta}). Motivo: {motivo}",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )
        else:
            notificar_rol(
                'PLANIFICADOR',
                f"Certificación Denegada en Presupuestos ({cert.codigo_certificacion or cert.hoja_ruta})",
                f"Presupuestos ha denegado la certificación del área {cert.area.nombre}. Motivo: {motivo}",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        return {
            'status': f'Solicitud rechazada formalmente por {origen_str}. Se enviaron las notificaciones correspondientes.',
            'estado': cert.estado
        }

    @staticmethod
    @transaction.atomic
    def cancelar(cert, user, motivo=''):
        roles = CertificacionService.get_user_roles(user)
        if not (roles['is_admin'] or roles['is_gerente']):
            raise ValidationError({'non_field_errors': ['Solo el Gerente solicitante o Administrador puede cancelar la solicitud.']})

        if roles['is_gerente'] and not roles['is_admin'] and cert.area_id != roles['area_id']:
            raise ValidationError({'non_field_errors': ['No puedes cancelar solicitudes pertenecientes a otra área.']})

        if cert.estado in [CertificacionPOA.EstadoCertificacion.APROBADO, CertificacionPOA.EstadoCertificacion.ANULADO]:
            raise ValidationError({'non_field_errors': ['No se puede cancelar una certificación ya aprobada o concluida.']})

        from apps.notificaciones.services import notificar_rol
        from apps.notificaciones.models import Notificacion

        motivo = (motivo or '').strip()
        estado_anterior = cert.estado
        cert.estado = CertificacionPOA.EstadoCertificacion.ANULADO
        if motivo:
            cert.notas = f"{cert.notas}\n[CANCELADA POR EL ÁREA]: {motivo}"
        cert.save(update_fields=['estado', 'notas'])

        if estado_anterior in [CertificacionPOA.EstadoCertificacion.PENDIENTE_PLANIFICACION, CertificacionPOA.EstadoCertificacion.PENDIENTE_PRESUPUESTOS]:
            notificar_rol(
                'PLANIFICADOR',
                f"Solicitud Cancelada por Gerencia ({cert.hoja_ruta})",
                f"El área {cert.area.nombre} ha cancelado su solicitud con Hoja de Ruta {cert.hoja_ruta}.",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )
            notificar_rol(
                'APROBADOR',
                f"Solicitud Cancelada por Gerencia ({cert.hoja_ruta})",
                f"El área {cert.area.nombre} ha cancelado su solicitud con Hoja de Ruta {cert.hoja_ruta}.",
                tipo=Notificacion.TipoNotificacion.RECHAZADO,
                usuario_origen=user,
                enlace='/certificaciones'
            )

        return {
            'status': 'Solicitud cancelada por el área solicitante.',
            'estado': cert.estado
        }

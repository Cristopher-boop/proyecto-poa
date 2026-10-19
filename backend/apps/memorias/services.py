from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from rest_framework.exceptions import ValidationError

from .models import (
    MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria,
    TraspasoPresupuestario, ModificacionPresupuestaria, DetalleModificacion
)
from apps.presupuestos.models import Gestion
from apps.usuarios.models import Usuario

class MemoriaCalculoService:
    
    @staticmethod
    def _notificar(rol_nombre=None, usuario_destino=None, titulo="", mensaje="", enlace="", usuario_origen=None):
        try:
            from apps.notificaciones.services import notificar_rol, crear_notificacion
            if usuario_destino:
                crear_notificacion(
                    usuario_destino=usuario_destino,
                    usuario_origen=usuario_origen,
                    titulo=titulo,
                    mensaje=mensaje,
                    enlace=enlace
                )
            elif rol_nombre:
                notificar_rol(
                    rol_nombre=rol_nombre,
                    titulo=titulo,
                    mensaje=mensaje,
                    enlace=enlace,
                    usuario_origen=usuario_origen
                )
        except Exception as e:
            print("Error enviando notificacion:", e)

    @staticmethod
    @transaction.atomic
    def crear_memoria(data, request_data, usuario):
        gestion = data.get('gestion')
        seccion = data.get('seccion')
        if gestion and gestion.estado != Gestion.EstadoGestion.FORMULACION:
            raise ValidationError(f'No se pueden crear memorias en la Gestión {gestion.anio} porque la formulación está {gestion.get_estado_display().lower()}.')

        if gestion and seccion:
            from apps.presupuestos.models import PresupuestoArea
            pres = PresupuestoArea.objects.filter(gestion=gestion, area=seccion.area).first()
            if pres and pres.techo_reducido:
                raise ValidationError('No se permite crear nuevas memorias de cálculo mientras el área se encuentre en proceso de reajuste por recorte de techo presupuestario. Solo puede modificar o excluir memorias existentes.')
        
        # Generar código automático seguro sin colisión
        if not data.get('codigo'):
            if request_data.get('codigo'):
                data['codigo'] = str(request_data['codigo']).strip().upper()
                
        if not data.get('codigo') or MemoriaCalculo.objects.filter(codigo=data['codigo']).exists():
            anio = gestion.anio if gestion else timezone.now().year
            prefix = f"MEM-{anio}-"
            existing = MemoriaCalculo.objects.filter(codigo__startswith=prefix).values_list('codigo', flat=True)
            max_num = 0
            for c in existing:
                try:
                    num_str = c.split('-')[-1]
                    num_val = int(num_str)
                    if num_val > max_num:
                        max_num = num_val
                except (ValueError, IndexError):
                    pass
            data['codigo'] = f"{prefix}{str(max_num + 1).zfill(3)}"
            
        memoria = MemoriaCalculo.objects.create(**data)
        
        # Guardar detalles
        detalles_data = request_data.get('detalles', [])
        for det_data in detalles_data:
            p_id = det_data.get('partida_id') or det_data.get('partida')
            if p_id:
                DetallePresupuestoMemoria.objects.create(
                    memoria=memoria,
                    partida_id=p_id,
                    descripcion=det_data.get('descripcion', ''),
                    unidad_medida=det_data.get('unidad_medida', 'UNIDAD'),
                    cantidad=det_data.get('cantidad', 1),
                    precio_unitario=det_data.get('precio_unitario', 0)
                )

        # Actualizar total_presupuestado
        total = sum(float(d.cantidad or 0) * float(d.precio_unitario or 0) for d in memoria.detalles.all())
        memoria.total_presupuestado = total
        memoria.save(update_fields=['total_presupuestado'])

        if usuario and usuario.is_authenticated:
            RegistroMemoriaUsuario.objects.create(
                memoria=memoria,
                usuario=usuario,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.ELABORADOR
            )
        return memoria

    @staticmethod
    @transaction.atomic
    def duplicar_lote_gestion(gestion_origen_id, gestion_destino_id, usuario, memorias_ids=None, memorias_modificadas=None):
        gestion_destino = Gestion.objects.filter(id=gestion_destino_id).first()
        if not gestion_destino:
            raise ValidationError('La gestión de destino no existe.')
        if gestion_destino.estado != Gestion.EstadoGestion.FORMULACION:
            raise ValidationError(f'No se pueden crear memorias en la Gestión {gestion_destino.anio} porque la formulación está {gestion_destino.get_estado_display().lower()}.')

        anio_destino = gestion_destino.anio
        prefix = f"MEM-{anio_destino}-"
        existing = MemoriaCalculo.objects.filter(codigo__startswith=prefix).values_list('codigo', flat=True)
        max_num = 0
        for c in existing:
            try:
                num_str = c.split('-')[-1]
                num_val = int(num_str)
                if num_val > max_num:
                    max_num = num_val
            except (ValueError, IndexError):
                pass

        creadas = []

        if memorias_modificadas and isinstance(memorias_modificadas, list):
            for m_item in memorias_modificadas:
                max_num += 1
                cod = f"{prefix}{str(max_num).zfill(3)}"
                sec_id = m_item.get('seccion_id') or m_item.get('seccion')
                op_id = m_item.get('operacion_id') or m_item.get('operacion')
                just = (m_item.get('justificacion') or '').strip().upper()
                es_contratacion = bool(m_item.get('es_contratacion', False))

                nueva_mem = MemoriaCalculo.objects.create(
                    codigo=cod,
                    gestion=gestion_destino,
                    seccion_id=sec_id,
                    operacion_id=op_id,
                    justificacion=just,
                    es_contratacion=es_contratacion,
                    estado=MemoriaCalculo.EstadoMemoria.BORRADOR
                )

                detalles = m_item.get('detalles', [])
                total = Decimal('0.0000')
                for d in detalles:
                    p_id = d.get('partida_id') or d.get('partida')
                    cant = Decimal(str(d.get('cantidad', 1) or 1))
                    pu = Decimal(str(d.get('precio_unitario', 0) or 0))
                    desc = str(d.get('descripcion', '')).strip().upper()
                    um = str(d.get('unidad_medida', 'UNIDAD')).strip().upper()
                    if p_id:
                        DetallePresupuestoMemoria.objects.create(
                            memoria=nueva_mem,
                            partida_id=p_id,
                            descripcion=desc,
                            unidad_medida=um,
                            cantidad=cant,
                            precio_unitario=pu
                        )
                        total += (cant * pu)

                nueva_mem.total_presupuestado = total
                nueva_mem.saldo_disponible = total
                nueva_mem.save(update_fields=['total_presupuestado', 'saldo_disponible'])

                if usuario and usuario.is_authenticated:
                    RegistroMemoriaUsuario.objects.create(
                        memoria=nueva_mem,
                        usuario=usuario,
                        tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.ELABORADOR
                    )
                creadas.append(nueva_mem)
        else:
            qs = MemoriaCalculo.objects.filter(gestion_id=gestion_origen_id).order_by('codigo', 'id')
            if memorias_ids:
                qs = qs.filter(id__in=memorias_ids)

            is_admin_aprobador = usuario.is_superuser or (usuario.rol and usuario.rol.nombre.upper() in ['ADMINISTRADOR', 'APROBADOR'])
            is_planificador = usuario.rol and 'PLANIFIC' in usuario.rol.nombre.upper()
            if not (is_admin_aprobador or is_planificador):
                if hasattr(usuario, 'seccion') and usuario.seccion and usuario.seccion.area_id:
                    qs = qs.filter(seccion__area_id=usuario.seccion.area_id)

            for mem_orig in qs.prefetch_related('detalles'):
                max_num += 1
                cod = f"{prefix}{str(max_num).zfill(3)}"
                nueva_mem = MemoriaCalculo.objects.create(
                    codigo=cod,
                    gestion=gestion_destino,
                    seccion=mem_orig.seccion,
                    operacion=mem_orig.operacion,
                    justificacion=mem_orig.justificacion,
                    es_contratacion=mem_orig.es_contratacion,
                    estado=MemoriaCalculo.EstadoMemoria.BORRADOR
                )
                total = Decimal('0.0000')
                for d in mem_orig.detalles.all():
                    DetallePresupuestoMemoria.objects.create(
                        memoria=nueva_mem,
                        partida_id=d.partida_id,
                        descripcion=d.descripcion,
                        unidad_medida=d.unidad_medida,
                        cantidad=d.cantidad,
                        precio_unitario=d.precio_unitario
                    )
                    total += (Decimal(str(d.cantidad or 0)) * Decimal(str(d.precio_unitario or 0)))

                nueva_mem.total_presupuestado = total
                nueva_mem.saldo_disponible = total
                nueva_mem.save(update_fields=['total_presupuestado', 'saldo_disponible'])

                if usuario and usuario.is_authenticated:
                    RegistroMemoriaUsuario.objects.create(
                        memoria=nueva_mem,
                        usuario=usuario,
                        tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.ELABORADOR
                    )
                creadas.append(nueva_mem)

        return creadas

    @staticmethod
    @transaction.atomic
    def actualizar_memoria(memoria, data, request_data):
        from apps.presupuestos.models import PresupuestoArea
        presupuesto = PresupuestoArea.objects.filter(
            gestion=memoria.gestion,
            area=memoria.seccion.area
        ).first()
        en_reajuste_techo = bool(presupuesto and presupuesto.techo_reducido)

        # Regla estricta: durante reajuste por recorte de techo NO se permite cambiar la Operación POA
        if en_reajuste_techo:
            nueva_op = data.get('operacion')
            if 'operacion' in data and nueva_op is not None and nueva_op != memoria.operacion:
                raise ValidationError({'operacion': ['No está permitido cambiar la Operación POA durante el reajuste por recorte de techo presupuestario. Solo puede ajustar los ítems de gasto o excluir memorias.']})

        # Evitar modificar memorias aprobadas en cualquiera de sus etapas (salvo si el área está en reajuste por recorte de techo)
        estados_aprobados = [
            MemoriaCalculo.EstadoMemoria.APROBADO_GERENCIA,
            MemoriaCalculo.EstadoMemoria.APROBADO_PLANIFICACION,
            MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
        ]
        if memoria.estado in estados_aprobados and 'estado' not in data and not en_reajuste_techo:
            raise ValidationError('No se puede modificar una memoria de cálculo que ya ha sido aprobada.')
        if memoria.gestion.estado not in [Gestion.EstadoGestion.FORMULACION, Gestion.EstadoGestion.EN_EJECUCION] and 'estado' not in data:
            raise ValidationError(f'No se puede editar la memoria de la Gestión {memoria.gestion.anio} porque la gestión está {memoria.gestion.get_estado_display().lower()}.')
            
        for key, value in data.items():
            setattr(memoria, key, value)

        if 'excluida_por_techo' in request_data:
            memoria.excluida_por_techo = bool(request_data['excluida_por_techo'])
            
        # Actualizar detalles si vienen en el request
        if 'detalles' in request_data:
            memoria.detalles.all().delete()
            for det_data in request_data['detalles']:
                p_id = det_data.get('partida_id') or det_data.get('partida')
                if p_id:
                    DetallePresupuestoMemoria.objects.create(
                        memoria=memoria,
                        partida_id=p_id,
                        descripcion=det_data.get('descripcion', ''),
                        unidad_medida=det_data.get('unidad_medida', 'UNIDAD'),
                        cantidad=det_data.get('cantidad', 1),
                        precio_unitario=det_data.get('precio_unitario', 0)
                    )
            
            # Recalcular total
            total = sum(float(d.cantidad or 0) * float(d.precio_unitario or 0) for d in memoria.detalles.all())
            memoria.total_presupuestado = total

        memoria.save()
        return memoria

    @staticmethod
    @transaction.atomic
    def eliminar_memoria(memoria):
        if memoria.estado != MemoriaCalculo.EstadoMemoria.BORRADOR:
            raise ValidationError('Solo se pueden eliminar memorias en estado Borrador.')
        memoria.delete()

    @staticmethod
    @transaction.atomic
    def enviar_gerencia(memoria, usuario, nota=''):
        if memoria.gestion.estado != Gestion.EstadoGestion.FORMULACION:
            raise ValidationError('La formulación de esta gestión está cerrada.')
        
        if nota:
            memoria.motivo_rechazo = nota
        memoria.estado = MemoriaCalculo.EstadoMemoria.PENDIENTE_GERENCIA
        memoria.save()

        if usuario and usuario.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=usuario,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.ELABORADOR
            )

        user_name = usuario.get_full_name() or usuario.username
        MemoriaCalculoService._notificar(
            rol_nombre='GERENTE',
            titulo=f"Revisión Pendiente: {memoria.codigo}",
            mensaje=f"La memoria {memoria.codigo} del área {memoria.seccion.area.nombre} ha sido enviada por {user_name} para revisión gerencial." + (f" Nota: {nota}" if nota else ""),
            enlace=f"/memorias?id={memoria.id}",
            usuario_origen=usuario
        )
        return memoria

    @staticmethod
    @transaction.atomic
    def enviar_todas_gerencia(memorias_qs, usuario):
        total_enviadas = 0
        memorias_list = list(memorias_qs.filter(estado=MemoriaCalculo.EstadoMemoria.BORRADOR))
        for mem in memorias_list:
            mem.estado = MemoriaCalculo.EstadoMemoria.PENDIENTE_GERENCIA
            mem.save()
            if usuario and usuario.is_authenticated:
                RegistroMemoriaUsuario.objects.get_or_create(
                    memoria=mem,
                    usuario=usuario,
                    tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.ELABORADOR
                )
            total_enviadas += 1

        if total_enviadas > 0:
            user_name = usuario.get_full_name() or usuario.username
            area_str = usuario.seccion.area.nombre if getattr(usuario, 'seccion', None) and getattr(usuario.seccion, 'area', None) else "el área"
            MemoriaCalculoService._notificar(
                rol_nombre='GERENTE',
                titulo=f"Paquete de Memorias Enviado ({total_enviadas})",
                mensaje=f"Se han enviado {total_enviadas} memorias de cálculo en borrador de {area_str} por {user_name} para revisión gerencial.",
                enlace="/memorias?tab=pendiente",
                usuario_origen=usuario
            )
        return total_enviadas

    @staticmethod
    @transaction.atomic
    def aprobar_gerencia(memoria, usuario, nota=''):
        if nota:
            memoria.motivo_rechazo = nota

        total_presupuesto = float(memoria.total_presupuestado or 0)
        if total_presupuesto <= 0:
            total_calc = sum(float(d.precio_total or (float(d.cantidad or 0) * float(d.precio_unitario or 0))) for d in memoria.detalles.all())
            if total_calc > 0:
                total_presupuesto = total_calc
                memoria.total_presupuestado = total_calc

        requiere_planificacion = bool(memoria.es_contratacion and total_presupuesto >= 2000.0)

        if requiere_planificacion:
            memoria.estado = MemoriaCalculo.EstadoMemoria.PENDIENTE_PLANIFICACION
            mensaje_exito = 'Memoria aprobada por Gerencia. Pasa a revisión de Planificación (Contratación >= 2.000 Bs).'
        else:
            memoria.estado = MemoriaCalculo.EstadoMemoria.APROBADO_GERENCIA
            mensaje_exito = 'Memoria aprobada por Gerencia. Pasa directamente a Presupuestos.'

        memoria.save()

        if usuario and usuario.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=usuario,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.REVISOR
            )

        user_name = usuario.get_full_name() or usuario.username
        usuarios_area = Usuario.objects.filter(seccion__area_id=memoria.seccion.area_id, is_active=True)
        for u in usuarios_area:
            if usuario and u.id == usuario.id:
                continue
            MemoriaCalculoService._notificar(
                usuario_destino=u,
                usuario_origen=usuario,
                titulo=f"Memoria Aprobada por Gerencia: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} fue ACEPTADA y APROBADA por la Gerencia ({user_name}). " + (f"Nota: {nota}" if nota else ""),
                enlace=f"/memorias?id={memoria.id}"
            )

        if requiere_planificacion:
            MemoriaCalculoService._notificar(
                rol_nombre='PLANIFICACION',
                titulo=f"Alineación Estratégica Pendiente: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} de {memoria.seccion.area.nombre} (Contratación por {total_presupuesto:,.2f} Bs) requiere verificación en Planificación.",
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=usuario
            )
        else:
            MemoriaCalculoService._notificar(
                rol_nombre='APROBADOR',
                titulo=f"Revisión Presupuestaria Pendiente: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} de {memoria.seccion.area.nombre} está lista en la bandeja de Presupuestos.",
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=usuario
            )
            
        return memoria, mensaje_exito

    @staticmethod
    @transaction.atomic
    def aprobar_planificacion(memoria, usuario, nota=''):
        if nota:
            memoria.motivo_rechazo = nota
        
        memoria.estado = MemoriaCalculo.EstadoMemoria.APROBADO_PLANIFICACION
        memoria.save()

        if usuario and usuario.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=usuario,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.REVISOR
            )

        user_name = usuario.get_full_name() or usuario.username
        MemoriaCalculoService._notificar(
            rol_nombre='APROBADOR',
            titulo=f"Alineación SPO Confirmada: {memoria.codigo}",
            mensaje=f"La memoria {memoria.codigo} fue verificada y alineada por Planificación ({user_name}) y pasa a Aprobación Presupuestaria Final." + (f" Nota: {nota}" if nota else ""),
            enlace=f"/memorias?id={memoria.id}",
            usuario_origen=usuario
        )

        elaborador_reg = memoria.participaciones.filter(tipo_participacion='ELABORADOR').first()
        if elaborador_reg:
            MemoriaCalculoService._notificar(
                usuario_destino=elaborador_reg.usuario,
                usuario_origen=usuario,
                titulo=f"Planificación Aprobada: {memoria.codigo}",
                mensaje=f"Tu memoria {memoria.codigo} fue validada por Planificación ({user_name}) y remitida a Presupuestos.",
                enlace=f"/memorias?id={memoria.id}"
            )

        usuarios_gerencia = Usuario.objects.filter(seccion__area_id=memoria.seccion.area_id, is_active=True)
        for g in usuarios_gerencia:
            if g.rol and 'GEREN' in g.rol.nombre.upper():
                if usuario and g.id == usuario.id:
                    continue
                MemoriaCalculoService._notificar(
                    usuario_destino=g,
                    usuario_origen=usuario,
                    titulo=f"Planificación Completada: {memoria.codigo}",
                    mensaje=f"La memoria {memoria.codigo} de su gerencia fue validada por Planificación ({user_name}) y remitida a Presupuestos.",
                    enlace=f"/memorias?id={memoria.id}"
                )

        return memoria

    @staticmethod
    @transaction.atomic
    def aprobar_finanzas(memoria, usuario, nota='Aprobación Presupuestaria Otorgada'):
        memoria.motivo_rechazo = nota
        memoria.estado = MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS
        memoria.fecha_aprobacion = timezone.now()
        memoria.save()

        if usuario and usuario.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=usuario,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.APROBADOR
            )

        user_name = usuario.get_full_name() or usuario.username
        elaborador_reg = memoria.participaciones.filter(tipo_participacion='ELABORADOR').first()
        if elaborador_reg:
            MemoriaCalculoService._notificar(
                usuario_destino=elaborador_reg.usuario,
                usuario_origen=usuario,
                titulo=f"¡Memoria Aceptada y Aprobada!: {memoria.codigo}",
                mensaje=f"Tu memoria {memoria.codigo} ha sido ACEPTADA y APROBADA formalmente por Finanzas / {user_name}. Nota de Aprobación: \"{nota}\"",
                enlace=f"/memorias?id={memoria.id}"
            )
        else:
            MemoriaCalculoService._notificar(
                rol_nombre='ELABORADOR',
                titulo=f"¡Memoria Aceptada y Aprobada!: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} ha sido ACEPTADA y APROBADA por Finanzas. Nota: \"{nota}\"",
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=usuario
            )

        MemoriaCalculoService._notificar(
            rol_nombre='GERENTE',
            titulo=f"¡Memoria Aceptada y Aprobada!: {memoria.codigo}",
            mensaje=f"La memoria {memoria.codigo} de {memoria.seccion.nombre} fue ACEPTADA y APROBADA por Finanzas. Nota: \"{nota}\"",
            enlace=f"/memorias?id={memoria.id}",
            usuario_origen=usuario
        )

        return memoria

    @staticmethod
    @transaction.atomic
    def rechazar(memoria, usuario, nota='Sin motivo especificado'):
        user_name = usuario.get_full_name() or usuario.username
        user_rol = usuario.rol.nombre.upper() if (usuario and usuario.rol) else ''
        estado_previo = memoria.estado

        if 'PLANIFIC' in user_rol or estado_previo == MemoriaCalculo.EstadoMemoria.PENDIENTE_PLANIFICACION:
            nivel_rechazo = 'PLANIFICACIÓN'
        elif 'GEREN' in user_rol or estado_previo == MemoriaCalculo.EstadoMemoria.PENDIENTE_GERENCIA:
            nivel_rechazo = 'GERENCIA DE ÁREA'
        elif 'APROBADOR' in user_rol or 'ADMIN' in user_rol or usuario.is_superuser or estado_previo in [MemoriaCalculo.EstadoMemoria.APROBADO_GERENCIA, MemoriaCalculo.EstadoMemoria.APROBADO_PLANIFICACION]:
            nivel_rechazo = 'PRESUPUESTOS'
        else:
            nivel_rechazo = 'REVISIÓN'

        memoria.motivo_rechazo = f"[{nivel_rechazo}] Rechazado por {user_name}: {nota}"
        memoria.estado = MemoriaCalculo.EstadoMemoria.RECHAZADO
        memoria.save()

        elaborador_reg = memoria.participaciones.filter(tipo_participacion='ELABORADOR').first()
        if elaborador_reg:
            MemoriaCalculoService._notificar(
                usuario_destino=elaborador_reg.usuario,
                usuario_origen=usuario,
                titulo=f"Memoria Rechazada en {nivel_rechazo}: {memoria.codigo}",
                mensaje=f"Tu memoria {memoria.codigo} fue RECHAZADA en {nivel_rechazo} por {user_name}. Motivo: \"{nota}\"",
                enlace=f"/memorias?id={memoria.id}"
            )
        else:
            MemoriaCalculoService._notificar(
                rol_nombre='ELABORADOR',
                titulo=f"Memoria Rechazada en {nivel_rechazo}: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} fue RECHAZADA en {nivel_rechazo} por {user_name}. Motivo: \"{nota}\"",
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=usuario
            )

        if nivel_rechazo in ['PRESUPUESTOS', 'PLANIFICACIÓN']:
            MemoriaCalculoService._notificar(
                rol_nombre='GERENTE',
                titulo=f"Memoria Rechazada en {nivel_rechazo}: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} de {memoria.seccion.nombre} fue RECHAZADA en {nivel_rechazo} por {user_name}. Motivo: \"{nota}\"",
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=usuario
            )

        return memoria, nivel_rechazo

    @staticmethod
    @transaction.atomic
    def volver_borrador(memoria, usuario, nota=''):
        user_name = usuario.get_full_name() or usuario.username
        if nota:
            memoria.motivo_rechazo = f"[REINICIADO A BORRADOR por {user_name}]: {nota}"
        else:
            memoria.motivo_rechazo = ''
        memoria.estado = MemoriaCalculo.EstadoMemoria.BORRADOR
        memoria.save()

        elaborador_reg = memoria.participaciones.filter(tipo_participacion='ELABORADOR').first()
        if elaborador_reg and elaborador_reg.usuario.id != usuario.id:
            MemoriaCalculoService._notificar(
                usuario_destino=elaborador_reg.usuario,
                usuario_origen=usuario,
                titulo=f"Memoria Devuelta a Borrador: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} fue devuelta a Borrador por {user_name} para correcciones. Motivo/Observación: \"{nota}\"",
                enlace=f"/memorias?id={memoria.id}"
            )

        return memoria

    @staticmethod
    def obtener_estado_techo_area(gestion_id, area_id):
        from apps.presupuestos.models import PresupuestoArea, Gestion
        from apps.organizacional.models import Area
        from django.db.models import Sum

        try:
            gestion = Gestion.objects.get(id=gestion_id)
        except Gestion.DoesNotExist:
            raise ValidationError('Gestión no encontrada.')

        try:
            area = Area.objects.get(id=area_id)
        except Area.DoesNotExist:
            raise ValidationError('Área no encontrada.')

        presupuesto = PresupuestoArea.objects.filter(gestion=gestion, area=area).first()
        techo_asignado = presupuesto.monto_inicial if presupuesto else Decimal('0.00')

        memorias_qs = MemoriaCalculo.objects.filter(
            gestion=gestion,
            seccion__area=area
        ).exclude(estado=MemoriaCalculo.EstadoMemoria.RECHAZADO).order_by('codigo', 'id')

        total_formulado = memorias_qs.aggregate(t=Sum('total_presupuestado'))['t'] or Decimal('0.00')
        memorias_incluidas = memorias_qs.filter(excluida_por_techo=False)
        total_incluido = memorias_incluidas.aggregate(t=Sum('total_presupuestado'))['t'] or Decimal('0.00')
        total_excluido = total_formulado - total_incluido

        # Diferencia respecto al techo con las memorias incluidas: si es negativo, hay déficit a recortar
        diferencia = techo_asignado - total_incluido
        techo_reducido = bool(presupuesto and presupuesto.techo_reducido)
        requiere_ajuste = bool(techo_reducido or (techo_asignado > Decimal('0.00') and diferencia < Decimal('0.00')))
        puede_pase_directo = bool(requiere_ajuste and total_incluido <= techo_asignado and total_incluido > Decimal('0.00'))

        memorias_data = []
        for m in memorias_qs:
            memorias_data.append({
                'id': m.id,
                'codigo': m.codigo,
                'justificacion': m.justificacion,
                'total_presupuestado': str(m.total_presupuestado),
                'estado': m.estado,
                'excluida_por_techo': m.excluida_por_techo,
                'operacion_codigo': m.operacion.codigo if m.operacion else None,
                'operacion_descripcion': m.operacion.descripcion if m.operacion else None,
            })

        return {
            'area_id': area.id,
            'area_nombre': area.nombre,
            'area_codigo': area.codigo,
            'gestion_id': gestion.id,
            'gestion_anio': gestion.anio,
            'techo_asignado': str(techo_asignado),
            'total_formulado': str(total_formulado),
            'total_incluido': str(total_incluido),
            'total_excluido': str(total_excluido),
            'diferencia': str(diferencia),
            'deficit_recorte': str(abs(diferencia)) if diferencia < Decimal('0.00') else '0.00',
            'techo_reducido': techo_reducido,
            'requiere_ajuste': requiere_ajuste,
            'puede_pase_directo': puede_pase_directo,
            'motivo_reduccion': presupuesto.motivo_reduccion if presupuesto else '',
            'fecha_reduccion': presupuesto.fecha_reduccion.isoformat() if (presupuesto and presupuesto.fecha_reduccion) else None,
            'memorias': memorias_data,
        }

    @staticmethod
    @transaction.atomic
    def toggle_exclusion_techo(memoria_id, usuario, excluida=None):
        try:
            memoria = MemoriaCalculo.objects.get(id=memoria_id)
        except MemoriaCalculo.DoesNotExist:
            raise ValidationError('Memoria de cálculo no encontrada.')

        if excluida is None:
            memoria.excluida_por_techo = not memoria.excluida_por_techo
        else:
            memoria.excluida_por_techo = bool(excluida)

        memoria.save(update_fields=['excluida_por_techo'])
        return memoria

    @staticmethod
    @transaction.atomic
    def enviar_reajuste_techo(gestion_id, area_id, memorias_seleccionadas_ids, usuario, nota=''):
        from apps.presupuestos.models import PresupuestoArea, Gestion
        from apps.organizacional.models import Area
        from apps.ejecucion.models import Gasto
        from django.db.models import Sum

        try:
            gestion = Gestion.objects.get(id=gestion_id)
        except Gestion.DoesNotExist:
            raise ValidationError('Gestión no encontrada.')

        try:
            area = Area.objects.get(id=area_id)
        except Area.DoesNotExist:
            raise ValidationError('Área no encontrada.')

        presupuesto = PresupuestoArea.objects.filter(gestion=gestion, area=area).first()
        if not presupuesto:
            raise ValidationError('No existe presupuesto registrado para esta área y gestión.')

        memorias_qs = MemoriaCalculo.objects.filter(
            gestion=gestion,
            seccion__area=area
        ).exclude(estado=MemoriaCalculo.EstadoMemoria.RECHAZADO)

        if not memorias_seleccionadas_ids:
            raise ValidationError('Debe seleccionar al menos una memoria de cálculo para incluir en el POA.')

        seleccionadas = list(memorias_qs.filter(id__in=memorias_seleccionadas_ids))
        if not seleccionadas:
            raise ValidationError('No se encontraron memorias válidas en la selección.')

        total_seleccionado = sum((m.total_presupuestado or Decimal('0.00')) for m in seleccionadas)

        if total_seleccionado > presupuesto.monto_inicial:
            exceso = total_seleccionado - presupuesto.monto_inicial
            raise ValidationError(f'El total seleccionado (Bs. {total_seleccionado:,.2f}) excede el nuevo techo de Bs. {presupuesto.monto_inicial:,.2f}. Debe recortar al menos -Bs. {exceso:,.2f}.')

        user_name = usuario.get_full_name() or usuario.username
        # PASE DIRECTO: Aprobado formalmente sin pasar por revisiones intermedias
        for mem in seleccionadas:
            mem.estado = MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS
            mem.excluida_por_techo = False
            mem.fecha_aprobacion = timezone.now()
            mem.motivo_rechazo = nota or f'Aprobado con PASE DIRECTO por adecuación al recorte de techo presupuestario (por {user_name}).'
            mem.save()

            if usuario and usuario.is_authenticated:
                RegistroMemoriaUsuario.objects.get_or_create(
                    memoria=mem,
                    usuario=usuario,
                    tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.REVISOR
                )

        # Memorias no enviadas quedan excluidas en borrador
        excluidas = list(memorias_qs.exclude(id__in=memorias_seleccionadas_ids))
        for mem in excluidas:
            mem.excluida_por_techo = True
            mem.estado = MemoriaCalculo.EstadoMemoria.BORRADOR
            mem.motivo_rechazo = f'Excluida del POA por la gerencia ({user_name}) para adecuarse al recorte de techo presupuestario.'
            mem.save()

        # Regularizar PresupuestoArea
        presupuesto.techo_reducido = False
        gastos_area = Gasto.objects.filter(
            memoria__gestion=gestion,
            memoria__seccion__area=area
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')
        presupuesto.monto_actual = max(Decimal('0.00'), total_seleccionado - gastos_area)
        presupuesto.save()

        # Notificar a Lic. Acha (Aprobador)
        MemoriaCalculoService._notificar(
            rol_nombre='APROBADOR',
            titulo=f"Adecuación Completada (Pase Directo): {area.nombre}",
            mensaje=f"{user_name} ha enviado la adecuación por recorte de techo para {area.nombre}. {len(seleccionadas)} memorias aprobadas formalmente con PASE DIRECTO (Bs. {total_seleccionado:,.2f}) y {len(excluidas)} memoria(s) excluida(s).",
            enlace=f"/presupuestos?area={area.id}",
            usuario_origen=usuario
        )

        return {
            'aprobadas_count': len(seleccionadas),
            'excluidas_count': len(excluidas),
            'total_aprobado': str(total_seleccionado),
            'nuevo_techo': str(presupuesto.monto_inicial),
            'mensaje': f'Adecuación presupuestaria completada con PASE DIRECTO: {len(seleccionadas)} memoria(s) aprobada(s) formalmente por Bs. {total_seleccionado:,.2f}.',
        }


class ModificacionPresupuestariaService:

    @staticmethod
    @transaction.atomic
    def registrar_modificacion(data, usuario):
        from .utils import recalcular_saldos_memoria
        from apps.organizacional.models import Area

        gestion_id = data.get('gestion_id') or data.get('gestion')
        area_id = data.get('area_id') or data.get('area')
        motivo = str(data.get('motivo') or '').strip()
        tipo = data.get('tipo') or ModificacionPresupuestaria.TipoModificacion.TRASPASO_INTRA_AREA
        origenes = data.get('origenes') or []
        destinos = data.get('destinos') or []

        if not gestion_id:
            raise ValidationError({'gestion': ['La gestión fiscal es obligatoria.']})
        if not area_id:
            raise ValidationError({'area': ['El área solicitante es obligatoria.']})
        if not motivo:
            raise ValidationError({'motivo': ['El motivo o justificación de la modificación es obligatorio.']})
        if not origenes:
            raise ValidationError({'origenes': ['Debe especificar al menos una memoria de origen (cedente).']})
        if not destinos:
            raise ValidationError({'destinos': ['Debe especificar al menos una memoria de destino (receptora).']})

        try:
            gestion = Gestion.objects.get(id=gestion_id)
        except Gestion.DoesNotExist:
            raise ValidationError({'gestion': ['La gestión especificada no existe.']})

        try:
            area = Area.objects.get(id=area_id)
        except Area.DoesNotExist:
            raise ValidationError({'area': ['El área especificada no existe.']})

        def parse_item(item, idx, label):
            m_id = item.get('memoria_id') or item.get('memoria')
            if not m_id:
                raise ValidationError({label: [f"Falta el identificador de memoria en la fila {idx + 1}."]})
            try:
                monto = Decimal(str(item.get('monto', 0))).quantize(Decimal('0.01'))
            except Exception:
                raise ValidationError({label: [f"Monto inválido en la fila {idx + 1}."]})
            if monto <= Decimal('0.00'):
                raise ValidationError({label: [f"El monto debe ser mayor a 0 en la fila {idx + 1}."]})
            return int(m_id), monto

        parsed_origenes = [parse_item(it, idx, 'origenes') for idx, it in enumerate(origenes)]
        parsed_destinos = [parse_item(it, idx, 'destinos') for idx, it in enumerate(destinos)]

        orig_ids = [m_id for m_id, _ in parsed_origenes]
        dest_ids = [m_id for m_id, _ in parsed_destinos]

        # Validar no duplicados dentro de la misma lista
        if len(orig_ids) != len(set(orig_ids)):
            raise ValidationError({'origenes': ['No puede repetir la misma memoria en los orígenes.']})
        if len(dest_ids) != len(set(dest_ids)):
            raise ValidationError({'destinos': ['No puede repetir la misma memoria en los destinos.']})

        # Validar que no haya memorias en ambos lados
        comunes = set(orig_ids).intersection(set(dest_ids))
        if comunes:
            raise ValidationError({'non_field_errors': ['Una misma memoria no puede figurar simultáneamente como origen y como destino.']})

        # Cuadre de balance (suma salidas == suma entradas)
        total_salidas = sum((monto for _, monto in parsed_origenes), Decimal('0.00'))
        total_entradas = sum((monto for _, monto in parsed_destinos), Decimal('0.00'))

        if abs(total_salidas - total_entradas) >= Decimal('0.01'):
            raise ValidationError({
                'non_field_errors': [
                    f"La modificación no está compensada: Total Salidas (Bs. {total_salidas:,.2f}) != Total Entradas (Bs. {total_entradas:,.2f}). Diferencia: Bs. {abs(total_salidas - total_entradas):,.2f}."
                ]
            })

        # Bloquear memorias en BD para concurrencia
        all_ids = set(orig_ids + dest_ids)
        memorias_dict = {
            m.id: m for m in MemoriaCalculo.objects.select_for_update().select_related('seccion__area', 'gestion').filter(id__in=all_ids)
        }

        # Validar existencia de todas las memorias
        for m_id in all_ids:
            if m_id not in memorias_dict:
                raise ValidationError({'non_field_errors': [f"La memoria con ID {m_id} no fue encontrada."]})

        # Validar regla intra-área institucional y gestión
        for m_id, m in memorias_dict.items():
            if m.gestion_id != gestion.id:
                raise ValidationError({'non_field_errors': [f"La memoria {m.codigo} pertenece a la gestión {m.gestion.anio}, distinta a la seleccionada ({gestion.anio})."]})
            if m.seccion.area_id != area.id:
                raise ValidationError({
                    'non_field_errors': [
                        f"La memoria {m.codigo} pertenece a {m.seccion.area.nombre}, distinta al área de la modificación ({area.nombre}). Los traspasos son estrictamente intra-área."
                    ]
                })

        # Validar saldo disponible en orígenes
        for m_id, monto in parsed_origenes:
            m = memorias_dict[m_id]
            if m.saldo_disponible < monto:
                raise ValidationError({
                    'origenes': [
                        f"Saldo insuficiente en la memoria {m.codigo}. Saldo disponible: Bs. {m.saldo_disponible:,.2f}, solicitado ceder: Bs. {monto:,.2f}."
                    ]
                })

        # Generar código correlativo oficial
        area_sigla = area.codigo.replace('P-', '').split('-')[-1]
        correlativo = ModificacionPresupuestaria.objects.filter(gestion=gestion, area=area).count() + 1
        codigo = f"MOD-{area_sigla}-{gestion.anio}-{correlativo:03d}"
        while ModificacionPresupuestaria.objects.filter(codigo=codigo).exists():
            correlativo += 1
            codigo = f"MOD-{area_sigla}-{gestion.anio}-{correlativo:03d}"

        user = usuario if (usuario and usuario.is_authenticated) else None

        # Crear cabecera
        modificacion = ModificacionPresupuestaria.objects.create(
            codigo=codigo,
            gestion=gestion,
            area=area,
            tipo=tipo,
            motivo=motivo,
            total_monto=total_salidas,
            estado=ModificacionPresupuestaria.EstadoModificacion.APROBADO,
            usuario_registro=user,
            fecha=timezone.now()
        )

        # Crear líneas de detalle
        for m_id, monto in parsed_origenes:
            DetalleModificacion.objects.create(
                modificacion=modificacion,
                memoria=memorias_dict[m_id],
                tipo_movimiento=DetalleModificacion.TipoMovimiento.DISMINUCION,
                monto=monto
            )

        for m_id, monto in parsed_destinos:
            DetalleModificacion.objects.create(
                modificacion=modificacion,
                memoria=memorias_dict[m_id],
                tipo_movimiento=DetalleModificacion.TipoMovimiento.INCREMENTO,
                monto=monto
            )

        # Recalcular saldos de todas las memorias involucradas
        for m in memorias_dict.values():
            recalcular_saldos_memoria(m)

        # Notificar
        user_name = user.get_full_name() or user.username if user else "Sistema"
        MemoriaCalculoService._notificar(
            rol_nombre='GERENTE',
            titulo=f"Modificación Presupuestaria Aprobada: {modificacion.codigo}",
            mensaje=f"Se registró una modificación presupuestaria en {area.nombre} por Bs. {total_salidas:,.2f} ({len(parsed_origenes)} orígenes a {len(parsed_destinos)} destinos) por {user_name}.",
            enlace="/traspasos",
            usuario_origen=user
        )

        return modificacion

from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from rest_framework.exceptions import ValidationError

from .models import MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria, TraspasoPresupuestario
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
        if gestion and gestion.estado != Gestion.EstadoGestion.FORMULACION:
            raise ValidationError(f'No se pueden crear memorias en la Gestión {gestion.anio} porque la formulación está {gestion.get_estado_display().lower()}.')
        
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
    def actualizar_memoria(memoria, data, request_data):
        # Evitar modificar memorias aprobadas
        if memoria.estado == MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS and 'estado' not in data:
            raise ValidationError('No se puede modificar una memoria que ya cuenta con aprobación final POA.')
        if memoria.gestion.estado not in [Gestion.EstadoGestion.FORMULACION, Gestion.EstadoGestion.EN_EJECUCION] and 'estado' not in data:
            raise ValidationError(f'No se puede editar la memoria de la Gestión {memoria.gestion.anio} porque la gestión está {memoria.gestion.get_estado_display().lower()}.')
            
        for key, value in data.items():
            setattr(memoria, key, value)
            
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
            area_str = usuario.seccion.area.nombre if usuario.seccion and usuario.seccion.area else "el área"
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

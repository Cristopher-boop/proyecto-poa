from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from decimal import Decimal

from .models import MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria, TraspasoPresupuestario
from .utils import recalcular_saldos_memoria
from .serializers import (
    MemoriaCalculoSerializer,
    MemoriaCalculoListSerializer,
    DetallePresupuestoMemoriaSerializer,
    RegistroMemoriaUsuarioSerializer,
    TraspasoSerializer,
)
from apps.presupuestos.models import Gestion


class MemoriaCalculoViewSet(viewsets.ModelViewSet):
    queryset = MemoriaCalculo.objects.select_related('gestion', 'seccion__area').prefetch_related('detalles__partida', 'participaciones__usuario').all().order_by('-created_at')
    serializer_class = MemoriaCalculoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'list':
            return MemoriaCalculoListSerializer
        return MemoriaCalculoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Filtro de visibilidad por roles
        rol_nombre = user.rol.nombre.upper() if user.rol else ''
        is_admin_aprobador = user.is_superuser or rol_nombre in ['ADMINISTRADOR', 'APROBADOR']
        is_gerente = rol_nombre == 'GERENTE'
        
        if not (is_admin_aprobador or is_gerente):
            # Elaboradores y Trabajadores solo ven de su área
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(seccion__area_id=user.seccion.area_id)
            else:
                qs = qs.none()
        
        # Filtros por query params
        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        seccion_id = self.request.query_params.get('seccion')
        estado = self.request.query_params.get('estado')
        search = self.request.query_params.get('search')
        partida_id = self.request.query_params.get('partida')

        if gestion_id:
            qs = qs.filter(gestion_id=gestion_id)
        if gestion_anio:
            qs = qs.filter(gestion__anio=gestion_anio)
        if area_id:
            qs = qs.filter(seccion__area_id=area_id)
        if seccion_id:
            qs = qs.filter(seccion_id=seccion_id)
        if estado:
            qs = qs.filter(estado=estado)
        if partida_id:
            qs = qs.filter(detalles__partida_id=partida_id).distinct()
        if search:
            qs = qs.filter(
                Q(codigo__icontains=search) |
                Q(justificacion__icontains=search) |
                Q(detalles__descripcion__icontains=search) |
                Q(detalles__partida__codigo__icontains=search) |
                Q(detalles__partida__nombre__icontains=search)
            ).distinct()
        return qs

    def check_role_permission(self, allowed_roles):
        user = self.request.user
        if user.is_superuser: return True
        rol = user.rol.nombre.upper() if user.rol else ''
        if 'APROBADOR' in allowed_roles and rol == 'ADMINISTRADOR': return True
        return rol in allowed_roles

    def check_area_permission(self, memoria):
        user = self.request.user
        if user.is_superuser or (user.rol and user.rol.nombre.upper() in ['ADMINISTRADOR', 'APROBADOR']): 
            return True
        if user.seccion and user.seccion.area_id == memoria.seccion.area_id:
            return True
        return False

    def perform_create(self, serializer):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR']):
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para crear memorias.']})

        gestion = serializer.validated_data.get('gestion')
        if gestion and gestion.estado != Gestion.EstadoGestion.FORMULACION:
            raise serializers.ValidationError({
                'non_field_errors': [f'No se pueden crear memorias en la Gestión {gestion.anio} porque la formulación está {gestion.get_estado_display().lower()}.']
            })
        
        # Validar si tiene permiso en el área
        seccion = serializer.validated_data.get('seccion')
        if seccion and not self.check_area_permission(type('obj', (object,), {'seccion': seccion})):
            raise serializers.ValidationError({'non_field_errors': ['No tienes permiso para crear memorias en otra área.']})

        memoria = serializer.save()
        if self.request.user and self.request.user.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=self.request.user,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.ELABORADOR
            )

    def perform_update(self, serializer):
        instance = serializer.instance
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR']):
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para editar memorias.']})
        
        if not self.check_area_permission(instance):
             raise serializers.ValidationError({'non_field_errors': ['No tienes permiso para editar memorias de esta área.']})

        if instance.gestion.estado not in [Gestion.EstadoGestion.FORMULACION, Gestion.EstadoGestion.EN_EJECUCION] and 'estado' not in serializer.validated_data:
            raise serializers.ValidationError({
                'non_field_errors': [f'No se puede editar la memoria de la Gestión {instance.gestion.anio} porque la gestión está {instance.gestion.get_estado_display().lower()}.']
            })
        serializer.save()

    def perform_destroy(self, instance):
        if not self.check_role_permission(['APROBADOR', 'ELABORADOR']):
            raise serializers.ValidationError({'non_field_errors': ['No tienes permiso para eliminar memorias.']})
        
        if not self.check_area_permission(instance):
             raise serializers.ValidationError({'non_field_errors': ['No puedes eliminar memorias de otra área.']})
             
        if instance.estado != MemoriaCalculo.EstadoMemoria.BORRADOR:
            raise serializers.ValidationError({'non_field_errors': ['Solo se pueden eliminar memorias en estado Borrador.']})
            
        instance.delete()

    @action(detail=True, methods=['post'], url_path='enviar-gerencia')
    def enviar_gerencia(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR']):
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        memoria = self.get_object()
        if memoria.gestion.estado != Gestion.EstadoGestion.FORMULACION:
            return Response({'error': 'La formulación de esta gestión está cerrada.'}, status=status.HTTP_400_BAD_REQUEST)
        
        nota = request.data.get('motivo') or request.data.get('nota') or ''
        if nota:
            memoria.motivo_rechazo = nota
        memoria.estado = MemoriaCalculo.EstadoMemoria.PENDIENTE_GERENCIA
        memoria.save()

        if request.user and request.user.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=request.user,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.ELABORADOR
            )

        # Emitir Notificación a Gerencia
        try:
            from apps.notificaciones.services import notificar_rol
            user_name = request.user.get_full_name() or request.user.username
            notificar_rol(
                rol_nombre='GERENTE',
                titulo=f"Revisión Pendiente: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} del área {memoria.seccion.area.nombre} ha sido enviada por {user_name} para revisión gerencial." + (f" Nota: {nota}" if nota else ""),
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=request.user
            )
        except Exception as e:
            print("Error enviando notificacion:", e)

        return Response({
            'message': 'Memoria enviada a revisión de Gerencia.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='aprobar-gerencia')
    def aprobar_gerencia(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE']):
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        memoria = self.get_object()
        if not self.check_area_permission(memoria):
            return Response({'error': 'No puedes aprobar memorias de otra área.'}, status=status.HTTP_403_FORBIDDEN)

        nota = request.data.get('motivo') or request.data.get('nota') or ''
        if nota:
            memoria.motivo_rechazo = nota
        memoria.estado = MemoriaCalculo.EstadoMemoria.APROBADO_GERENCIA
        memoria.save()

        if request.user and request.user.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=request.user,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.REVISOR
            )

        # Emitir Notificación a Trabajadores/Elaboradores del área y Aprobadores
        try:
            from apps.notificaciones.services import notificar_rol, crear_notificacion
            from apps.usuarios.models import Usuario
            user_name = request.user.get_full_name() or request.user.username

            # 1. Notificar a todos los usuarios de la sección/área (Elaboradores y Trabajadores)
            usuarios_area = Usuario.objects.filter(seccion__area_id=memoria.seccion.area_id, is_active=True)
            for u in usuarios_area:
                if request.user and u.id == request.user.id:
                    continue
                crear_notificacion(
                    usuario_destino=u,
                    usuario_origen=request.user,
                    titulo=f"Memoria Aprobada por Gerencia: {memoria.codigo}",
                    mensaje=f"La memoria {memoria.codigo} de {memoria.seccion.area.nombre} fue ACEPTADA y APROBADA por la Gerencia ({user_name})." + (f" Nota: {nota}" if nota else ""),
                    enlace=f"/memorias?id={memoria.id}"
                )

            # 2. Notificar a Planificación y Aprobadores
            notificar_rol(
                rol_nombre='PLANIFICACION',
                titulo=f"Alineación Estratégica Pendiente: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} de {memoria.seccion.area.nombre} fue aprobada por gerencia ({user_name}) y requiere verificación en Planificación.",
                enlace=f"/planificacion",
                usuario_origen=request.user
            )
            notificar_rol(
                rol_nombre='APROBADOR',
                titulo=f"Revisión Finanzas Pendiente: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} fue aprobada por la Gerencia de {memoria.seccion.area.nombre} y está disponible para Aprobación Final de Finanzas.",
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=request.user
            )
        except Exception as e:
            print("Error enviando notificacion:", e)

        return Response({
            'message': 'Memoria aprobada por Gerencia. Pasó a Revisión de Finanzas.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='aprobar-planificacion')
    def aprobar_planificacion(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE']):
            rol_user = request.user.rol.nombre.upper() if request.user and request.user.rol else ''
            if rol_user not in ['PLANIFICACION', 'APROBADOR', 'ADMINISTRADOR'] and not request.user.is_superuser:
                return Response({'error': 'Solo personal de Planificación o Aprobadores pueden verificar alineación.'}, status=status.HTTP_403_FORBIDDEN)

        memoria = self.get_object()
        nota = request.data.get('motivo') or request.data.get('nota') or ''
        if nota:
            memoria.motivo_rechazo = nota
        memoria.estado = MemoriaCalculo.EstadoMemoria.APROBADO_PLANIFICACION
        memoria.save()

        try:
            from apps.notificaciones.services import notificar_rol
            notificar_rol(
                rol_nombre='APROBADOR',
                titulo=f"Alineación Confirmada: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} fue alineada estratégicamente por Planificación y está lista para aprobación financiera final." + (f" Nota: {nota}" if nota else ""),
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=request.user
            )
        except Exception as e:
            print("Error enviando notificacion:", e)

        return Response({
            'message': 'Memoria alineada estratégicamente por Planificación.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='aprobar-finanzas')
    def aprobar_finanzas(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR']):
            return Response({'error': 'Solo Aprobadores pueden realizar esta acción.'}, status=status.HTTP_403_FORBIDDEN)
        memoria = self.get_object()
        nota = request.data.get('motivo') or request.data.get('nota') or 'Aprobación Presupuestaria Otorgada'
        memoria.motivo_rechazo = nota
        memoria.estado = MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS
        memoria.fecha_aprobacion = timezone.now()
        memoria.save()

        if request.user and request.user.is_authenticated:
            RegistroMemoriaUsuario.objects.get_or_create(
                memoria=memoria,
                usuario=request.user,
                tipo_participacion=RegistroMemoriaUsuario.TipoParticipacion.APROBADOR
            )

        try:
            from apps.notificaciones.services import notificar_rol, crear_notificacion
            user_name = request.user.get_full_name() or request.user.username

            # Notificar directamente al Elaborador si existe
            elaborador_reg = memoria.participaciones.filter(tipo_participacion='ELABORADOR').first()
            if elaborador_reg:
                crear_notificacion(
                    usuario_destino=elaborador_reg.usuario,
                    usuario_origen=request.user,
                    titulo=f"¡Memoria Aceptada y Aprobada!: {memoria.codigo}",
                    mensaje=f"Tu memoria {memoria.codigo} ha sido ACEPTADA y APROBADA formalmente por Finanzas / {user_name}. Nota de Aprobación: \"{nota}\"",
                    enlace=f"/memorias?id={memoria.id}"
                )
            else:
                notificar_rol(
                    rol_nombre='ELABORADOR',
                    titulo=f"¡Memoria Aceptada y Aprobada!: {memoria.codigo}",
                    mensaje=f"La memoria {memoria.codigo} ha sido ACEPTADA y APROBADA por Finanzas. Nota: \"{nota}\"",
                    enlace=f"/memorias?id={memoria.id}",
                    usuario_origen=request.user
                )

            # Notificar al Gerente
            notificar_rol(
                rol_nombre='GERENTE',
                titulo=f"¡Memoria Aceptada y Aprobada!: {memoria.codigo}",
                mensaje=f"La memoria {memoria.codigo} de {memoria.seccion.nombre} fue ACEPTADA y APROBADA por Finanzas. Nota: \"{nota}\"",
                enlace=f"/memorias?id={memoria.id}",
                usuario_origen=request.user
            )
        except Exception as e:
            print("Error enviando notificacion:", e)

        return Response({
            'message': 'Memoria aprobada formalmente por Finanzas / Economía.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE']):
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        memoria = self.get_object()
        if not self.check_area_permission(memoria):
             return Response({'error': 'No puedes rechazar memorias de otra área.'}, status=status.HTTP_403_FORBIDDEN)
             
        motivo = request.data.get('motivo') or request.data.get('nota') or 'Sin motivo especificado'
        memoria.motivo_rechazo = motivo
        memoria.estado = MemoriaCalculo.EstadoMemoria.RECHAZADO
        memoria.save()

        try:
            from apps.notificaciones.services import notificar_rol, crear_notificacion
            user_name = request.user.get_full_name() or request.user.username
            user_rol = request.user.rol.nombre if request.user.rol else 'Revisor'

            # Notificar al Elaborador directo
            elaborador_reg = memoria.participaciones.filter(tipo_participacion='ELABORADOR').first()
            if elaborador_reg:
                crear_notificacion(
                    usuario_destino=elaborador_reg.usuario,
                    usuario_origen=request.user,
                    titulo=f"Memoria Rechazada: {memoria.codigo}",
                    mensaje=f"Tu memoria {memoria.codigo} fue RECHAZADA por {user_name} ({user_rol}). Motivo del Rechazo: \"{motivo}\"",
                    enlace=f"/memorias?id={memoria.id}"
                )
            else:
                notificar_rol(
                    rol_nombre='ELABORADOR',
                    titulo=f"Memoria Rechazada: {memoria.codigo}",
                    mensaje=f"La memoria {memoria.codigo} fue RECHAZADA por {user_name} ({user_rol}). Motivo del Rechazo: \"{motivo}\"",
                    enlace=f"/memorias?id={memoria.id}",
                    usuario_origen=request.user
                )

            # Si lo rechazó el Aprobador, notificar también al Gerente
            if user_rol.upper() in ['APROBADOR', 'ADMINISTRADOR']:
                notificar_rol(
                    rol_nombre='GERENTE',
                    titulo=f"Memoria Rechazada por Aprobador: {memoria.codigo}",
                    mensaje=f"La memoria {memoria.codigo} de {memoria.seccion.nombre} fue RECHAZADA por el Aprobador ({user_name}). Motivo: \"{motivo}\"",
                    enlace=f"/memorias?id={memoria.id}",
                    usuario_origen=request.user
                )
        except Exception as e:
            print("Error enviando notificacion:", e)

        return Response({
            'message': 'Memoria rechazada.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='volver-borrador')
    def volver_borrador(self, request, pk=None):
        if not self.check_role_permission(['APROBADOR', 'GERENTE', 'ELABORADOR']):
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
        memoria = self.get_object()
        if not self.check_area_permission(memoria):
             return Response({'error': 'No tienes permisos sobre esta área.'}, status=status.HTTP_403_FORBIDDEN)
             
        motivo = request.data.get('motivo') or request.data.get('nota') or 'Observaciones pendientes'
        memoria.motivo_rechazo = motivo
        memoria.estado = MemoriaCalculo.EstadoMemoria.BORRADOR
        memoria.save()

        try:
            from apps.notificaciones.services import notificar_rol, crear_notificacion
            user_name = request.user.get_full_name() or request.user.username
            elaborador_reg = memoria.participaciones.filter(tipo_participacion='ELABORADOR').first()
            if elaborador_reg and elaborador_reg.usuario.id != request.user.id:
                crear_notificacion(
                    usuario_destino=elaborador_reg.usuario,
                    usuario_origen=request.user,
                    titulo=f"Memoria Devuelta a Borrador: {memoria.codigo}",
                    mensaje=f"La memoria {memoria.codigo} fue devuelta a Borrador por {user_name} para correcciones. Motivo/Observación: \"{motivo}\"",
                    enlace=f"/memorias?id={memoria.id}"
                )
        except Exception as e:
            print("Error enviando notificacion:", e)

        return Response({
            'message': 'Memoria devuelta a estado Borrador para correcciones.',
            'memoria': MemoriaCalculoSerializer(memoria, context={'request': request}).data
        })

    @action(detail=True, methods=['get'], url_path='saldo-disponible')
    def saldo_disponible(self, request, pk=None):
        memoria = self.get_object()
        return Response({
            'monto_asignado': str(memoria.total_presupuestado),
            'monto_ejecutado': str(memoria.total_ejecutado),
            'monto_entrante': str(memoria.monto_entrante),
            'monto_saliente': str(memoria.monto_saliente),
            'disponible': str(memoria.saldo_disponible),
        }, status=status.HTTP_200_OK)


class DetallePresupuestoMemoriaViewSet(viewsets.ModelViewSet):
    queryset = DetallePresupuestoMemoria.objects.select_related('memoria__seccion__area', 'memoria__gestion', 'partida').all()
    serializer_class = DetallePresupuestoMemoriaSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        gestion_id = self.request.query_params.get('gestion')
        gestion_anio = self.request.query_params.get('anio')
        area_id = self.request.query_params.get('area')
        memoria_id = self.request.query_params.get('memoria')
        partida_id = self.request.query_params.get('partida')

        if gestion_id:
            qs = qs.filter(memoria__gestion_id=gestion_id)
        if gestion_anio:
            qs = qs.filter(memoria__gestion__anio=gestion_anio)
        if area_id:
            qs = qs.filter(memoria__seccion__area_id=area_id)
        if memoria_id:
            qs = qs.filter(memoria_id=memoria_id)
        if partida_id:
            qs = qs.filter(partida_id=partida_id)
        return qs


class TraspasoViewSet(viewsets.ModelViewSet):
    queryset = TraspasoPresupuestario.objects.select_related(
        'memoria_origen__seccion__area',
        'memoria_destino__seccion__area',
        'usuario_registro'
    ).all().order_by('-created_at')
    serializer_class = TraspasoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        memoria_id = self.request.query_params.get('memoria')
        area_id = self.request.query_params.get('area')
        gestion_id = self.request.query_params.get('gestion')
        search = self.request.query_params.get('search')

        if memoria_id:
            qs = qs.filter(Q(memoria_origen_id=memoria_id) | Q(memoria_destino_id=memoria_id))
        if area_id:
            qs = qs.filter(Q(memoria_origen__seccion__area_id=area_id) | Q(memoria_destino__seccion__area_id=area_id))
        if gestion_id:
            qs = qs.filter(memoria_origen__gestion_id=gestion_id)
        if search:
            qs = qs.filter(
                Q(motivo__icontains=search) |
                Q(memoria_origen__codigo__icontains=search) |
                Q(memoria_destino__codigo__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        with transaction.atomic():
            origen_id = serializer.validated_data['memoria_origen'].id
            destino_id = serializer.validated_data['memoria_destino'].id

            # Bloqueo select_for_update en memorias origen y destino
            memorias = list(MemoriaCalculo.objects.select_for_update().filter(id__in=[origen_id, destino_id]))
            origen = next((m for m in memorias if m.id == origen_id), None)
            destino = next((m for m in memorias if m.id == destino_id), None)

            if origen:
                monto = serializer.validated_data['monto']
                if origen.saldo_disponible < monto:
                    raise serializers.ValidationError({
                        'monto': [f"Saldo insuficiente en la memoria de origen tras bloqueo. Disponible: Bs. {origen.saldo_disponible}."]
                    })

            user = self.request.user if self.request.user and self.request.user.is_authenticated else None
            serializer.save(usuario_registro=user)

            if origen:
                recalcular_saldos_memoria(origen)
            if destino:
                recalcular_saldos_memoria(destino)

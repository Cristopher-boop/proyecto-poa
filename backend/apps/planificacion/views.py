from rest_framework import viewsets, permissions, filters, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea
from .serializers import (
    AccionMedianoPlazoSerializer,
    AccionCortoPlazoSerializer,
    OperacionSerializer,
    TareaSerializer
)


def get_user_role(user):
    if not user or not user.is_authenticated:
        return ''
    if user.is_superuser:
        return 'ADMINISTRADOR'
    rol = user.rol.nombre.upper() if user.rol else ''
    rol_clean = rol.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
    if 'ADMIN' in rol_clean:
        return 'ADMINISTRADOR'
    if 'PRESUPUEST' in rol_clean or 'APROBAD' in rol_clean:
        return 'PRESUPUESTOS'
    if 'PLANIFIC' in rol_clean:
        return 'PLANIFICACION'
    if 'TESORER' in rol_clean:
        return 'TESORERIA'
    if 'GERENT' in rol_clean:
        return 'GERENTE'
    if 'ELABORAD' in rol_clean:
        return 'ELABORADOR'
    if 'TRABAJAD' in rol_clean:
        return 'TRABAJADOR'
    return rol_clean


class AccionMedianoPlazoViewSet(viewsets.ModelViewSet):
    queryset = AccionMedianoPlazo.objects.select_related('programa').all()
    serializer_class = AccionMedianoPlazoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['programa', 'estado']
    search_fields = ['codigo', 'descripcion', 'programa__nombre']

    def get_queryset(self):
        qs = super().get_queryset()
        gestion = self.request.query_params.get('gestion') or self.request.query_params.get('gestion_id')
        anio = self.request.query_params.get('anio') or self.request.query_params.get('gestion_anio')
        target_anio = None
        if anio and str(anio).isdigit():
            target_anio = int(anio)
        elif gestion and str(gestion).isdigit():
            from apps.presupuestos.models import Gestion
            try:
                g = Gestion.objects.get(id=int(gestion))
                target_anio = g.anio
            except Gestion.DoesNotExist:
                pass
        elif gestion and not str(gestion).isdigit():
            try:
                target_anio = int(gestion)
            except ValueError:
                pass

        if target_anio:
            qs = qs.filter(periodo_inicio__lte=target_anio, periodo_fin__gte=target_anio)
        return qs

    def perform_create(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede crear Acciones a Mediano Plazo (PEI).']})
        serializer.save()

    def perform_update(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede editar Acciones a Mediano Plazo (PEI).']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION']:
            return Response({'error': 'Solo Planificación o Administrador puede cambiar el estado de la AMP.'}, status=status.HTTP_403_FORBIDDEN)
        amp = self.get_object()
        amp.estado = not amp.estado
        amp.save(update_fields=['estado'])
        return Response({'status': f'AMP {"activada" if amp.estado else "desactivada (baja lógica)"}', 'estado': amp.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede dar de baja AMPs.']})
        instance.estado = False
        instance.save(update_fields=['estado'])


class AccionCortoPlazoViewSet(viewsets.ModelViewSet):
    queryset = AccionCortoPlazo.objects.select_related('accion_mediano_plazo__programa', 'gestion').all()
    serializer_class = AccionCortoPlazoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion_mediano_plazo', 'gestion', 'estado', 'accion_mediano_plazo__programa']
    search_fields = ['codigo', 'descripcion', 'accion_mediano_plazo__codigo']

    def get_queryset(self):
        qs = super().get_queryset()
        gestion = self.request.query_params.get('gestion') or self.request.query_params.get('gestion_id')
        anio = self.request.query_params.get('anio') or self.request.query_params.get('gestion_anio')
        if gestion:
            if str(gestion).isdigit():
                qs = qs.filter(gestion_id=int(gestion))
            else:
                qs = qs.filter(gestion__anio=gestion)
        if anio and str(anio).isdigit():
            qs = qs.filter(gestion__anio=int(anio))
        return qs

    def perform_create(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede crear Acciones a Corto Plazo (POA).']})
        serializer.save()

    def perform_update(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede editar Acciones a Corto Plazo (POA).']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION']:
            return Response({'error': 'Solo Planificación o Administrador puede cambiar el estado de la ACP.'}, status=status.HTTP_403_FORBIDDEN)
        acp = self.get_object()
        acp.estado = not acp.estado
        acp.save(update_fields=['estado'])
        return Response({'status': f'ACP {"activada" if acp.estado else "desactivada (baja lógica)"}', 'estado': acp.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede dar de baja ACPs.']})
        instance.estado = False
        instance.save(update_fields=['estado'])


class OperacionViewSet(viewsets.ModelViewSet):
    queryset = Operacion.objects.select_related(
        'accion_corto_plazo__accion_mediano_plazo__programa',
        'accion_corto_plazo__gestion',
        'area__programa'
    ).prefetch_related('tareas').all()
    serializer_class = OperacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion_corto_plazo', 'area', 'es_contratacion', 'estado', 'accion_corto_plazo__gestion', 'area__programa']
    search_fields = ['codigo', 'descripcion', 'area__nombre', 'area__codigo', 'accion_corto_plazo__codigo']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        rol = get_user_role(user)

        # Roles globales ven todas las operaciones. Trabajadores, Elaboradores y Gerentes ven las de su área
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'TESORERIA']:
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(area_id=user.seccion.area_id)
            else:
                qs = qs.none()

        gestion = self.request.query_params.get('gestion') or self.request.query_params.get('gestion_id')
        anio = self.request.query_params.get('anio') or self.request.query_params.get('gestion_anio')
        if gestion:
            if str(gestion).isdigit():
                qs = qs.filter(accion_corto_plazo__gestion_id=int(gestion))
            else:
                qs = qs.filter(accion_corto_plazo__gestion__anio=gestion)
        if anio and str(anio).isdigit():
            qs = qs.filter(accion_corto_plazo__gestion__anio=int(anio))

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'GERENTE', 'ELABORADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para crear Operaciones.']})
        
        # Elaborador y Gerente sólo pueden crear operaciones para su propia área
        area = serializer.validated_data.get('area')
        if rol in ['GERENTE', 'ELABORADOR'] and user.seccion and area and area.id != user.seccion.area_id:
            raise serializers.ValidationError({'non_field_errors': ['No puedes crear operaciones para otra área.']})
            
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'GERENTE']:
            raise serializers.ValidationError({'non_field_errors': ['Los Elaboradores y Trabajadores no pueden modificar Operaciones.']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'GERENTE']:
            return Response({'error': 'Solo Gerentes o Planificación / Presupuestos / Administrador pueden modificar el estado de la Operación.'}, status=status.HTTP_403_FORBIDDEN)
        op = self.get_object()
        op.estado = not op.estado
        op.save(update_fields=['estado'])
        return Response({'status': f'Operación {"activada" if op.estado else "desactivada (baja lógica)"}', 'estado': op.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'GERENTE']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Gerentes o Planificación / Presupuestos / Administrador pueden dar de baja Operaciones.']})
        instance.estado = False
        instance.save(update_fields=['estado'])


class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.select_related('operacion').all()
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['operacion', 'estado']
    search_fields = ['codigo', 'descripcion']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        rol = get_user_role(user)

        # Roles globales ven todas las tareas. Trabajadores, Elaboradores y Gerentes sólo ven Tareas de su área
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'TESORERIA']:
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(operacion__area_id=user.seccion.area_id)
            else:
                qs = qs.none()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'GERENTE', 'ELABORADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para crear Tareas.']})
        
        operacion = serializer.validated_data.get('operacion')
        if rol in ['GERENTE', 'ELABORADOR'] and user.seccion and operacion and operacion.area_id != user.seccion.area_id:
            raise serializers.ValidationError({'non_field_errors': ['No puedes crear tareas para operaciones de otra área.']})

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'GERENTE']:
            raise serializers.ValidationError({'non_field_errors': ['Los Elaboradores y Trabajadores no pueden modificar Tareas.']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'GERENTE']:
            return Response({'error': 'Solo Gerentes o Planificación / Presupuestos / Administrador pueden cambiar el estado de la Tarea.'}, status=status.HTTP_403_FORBIDDEN)
        tarea = self.get_object()
        tarea.estado = not tarea.estado
        tarea.save(update_fields=['estado'])
        return Response({'status': f'Tarea {"activada" if tarea.estado else "desactivada (baja lógica)"}', 'estado': tarea.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'PRESUPUESTOS', 'ADMINISTRADOR', 'PLANIFICACION', 'GERENTE']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Gerentes o Planificación / Presupuestos / Administrador pueden dar de baja Tareas.']})
        instance.estado = False
        instance.save(update_fields=['estado'])

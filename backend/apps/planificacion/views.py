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
    if user.is_superuser:
        return 'APROBADOR'
    return user.rol.nombre.upper() if user.rol else ''


class AccionMedianoPlazoViewSet(viewsets.ModelViewSet):
    queryset = AccionMedianoPlazo.objects.select_related('programa').all()
    serializer_class = AccionMedianoPlazoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['programa', 'estado']
    search_fields = ['codigo', 'descripcion', 'programa__nombre']

    def perform_create(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede crear Acciones a Mediano Plazo (PEI).']})
        serializer.save()

    def perform_update(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede editar Acciones a Mediano Plazo (PEI).']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            return Response({'error': 'Solo el rol Aprobador / Administrador puede cambiar el estado de la AMP.'}, status=status.HTTP_403_FORBIDDEN)
        amp = self.get_object()
        amp.estado = not amp.estado
        amp.save(update_fields=['estado'])
        return Response({'status': f'AMP {"activada" if amp.estado else "desactivada (baja lógica)"}', 'estado': amp.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede dar de baja AMPs.']})
        instance.estado = False
        instance.save(update_fields=['estado'])


class AccionCortoPlazoViewSet(viewsets.ModelViewSet):
    queryset = AccionCortoPlazo.objects.select_related('accion_mediano_plazo', 'gestion').all()
    serializer_class = AccionCortoPlazoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion_mediano_plazo', 'gestion', 'estado']
    search_fields = ['codigo', 'descripcion']

    def perform_create(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede crear Acciones a Corto Plazo (POA).']})
        serializer.save()

    def perform_update(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede editar Acciones a Corto Plazo (POA).']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            return Response({'error': 'Solo el rol Aprobador / Administrador puede cambiar el estado de la ACP.'}, status=status.HTTP_403_FORBIDDEN)
        acp = self.get_object()
        acp.estado = not acp.estado
        acp.save(update_fields=['estado'])
        return Response({'status': f'ACP {"activada" if acp.estado else "desactivada (baja lógica)"}', 'estado': acp.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Solo el rol Aprobador / Administrador puede dar de baja ACPs.']})
        instance.estado = False
        instance.save(update_fields=['estado'])


class OperacionViewSet(viewsets.ModelViewSet):
    queryset = Operacion.objects.select_related('accion_corto_plazo', 'area').prefetch_related('tareas').all()
    serializer_class = OperacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['accion_corto_plazo', 'area', 'es_contratacion', 'estado']
    search_fields = ['codigo', 'descripcion', 'area__nombre']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        rol = get_user_role(user)

        # Trabajadores, Elaboradores y Gerentes ven las Operaciones de su área
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(area_id=user.seccion.area_id)
            else:
                qs = qs.none()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR', 'GERENTE', 'ELABORADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para crear Operaciones.']})
        
        # Elaborador y Gerente sólo pueden crear operaciones para su propia área
        area = serializer.validated_data.get('area')
        if rol in ['GERENTE', 'ELABORADOR'] and user.seccion and area and area.id != user.seccion.area_id:
            raise serializers.ValidationError({'non_field_errors': ['No puedes crear operaciones para otra área.']})
            
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR', 'GERENTE']:
            raise serializers.ValidationError({'non_field_errors': ['Los Elaboradores y Trabajadores no pueden modificar Operaciones.']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR', 'GERENTE']:
            return Response({'error': 'Solo Gerentes o Aprobadores pueden modificar el estado de la Operación.'}, status=status.HTTP_403_FORBIDDEN)
        op = self.get_object()
        op.estado = not op.estado
        op.save(update_fields=['estado'])
        return Response({'status': f'Operación {"activada" if op.estado else "desactivada (baja lógica)"}', 'estado': op.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR', 'GERENTE']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Gerentes o Aprobadores pueden dar de baja Operaciones.']})
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

        # Trabajadores, Elaboradores y Gerentes sólo ven Tareas de su área
        if rol not in ['APROBADOR', 'ADMINISTRADOR']:
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(operacion__area_id=user.seccion.area_id)
            else:
                qs = qs.none()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR', 'GERENTE', 'ELABORADOR']:
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para crear Tareas.']})
        
        operacion = serializer.validated_data.get('operacion')
        if rol in ['GERENTE', 'ELABORADOR'] and user.seccion and operacion and operacion.area_id != user.seccion.area_id:
            raise serializers.ValidationError({'non_field_errors': ['No puedes crear tareas para operaciones de otra área.']})

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR', 'GERENTE']:
            raise serializers.ValidationError({'non_field_errors': ['Los Elaboradores y Trabajadores no pueden modificar Tareas.']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR', 'GERENTE']:
            return Response({'error': 'Solo Gerentes o Aprobadores pueden cambiar el estado de la Tarea.'}, status=status.HTTP_403_FORBIDDEN)
        tarea = self.get_object()
        tarea.estado = not tarea.estado
        tarea.save(update_fields=['estado'])
        return Response({'status': f'Tarea {"activada" if tarea.estado else "desactivada (baja lógica)"}', 'estado': tarea.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['APROBADOR', 'ADMINISTRADOR', 'GERENTE']:
            raise serializers.ValidationError({'non_field_errors': ['Solo Gerentes o Aprobadores pueden dar de baja Tareas.']})
        instance.estado = False
        instance.save(update_fields=['estado'])

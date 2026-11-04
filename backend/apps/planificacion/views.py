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
    if 'PRESUPUEST' in rol_clean:
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
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION'] and not self.request.user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede crear Acciones a Mediano Plazo (PEI).']})
        serializer.save()

    def perform_update(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION'] and not self.request.user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede editar Acciones a Mediano Plazo (PEI).']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION'] and not request.user.is_superuser:
            return Response({'error': 'Solo Planificación o Administrador puede cambiar el estado de la AMP.'}, status=status.HTTP_403_FORBIDDEN)
        amp = self.get_object()
        amp.estado = not amp.estado
        amp.save(update_fields=['estado'])
        return Response({'status': f'AMP {"activada" if amp.estado else "desactivada (baja lógica)"}', 'estado': amp.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION'] and not self.request.user.is_superuser:
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
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION'] and not self.request.user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede crear Acciones a Corto Plazo (POA).']})
        serializer.save()

    def perform_update(self, serializer):
        rol = get_user_role(self.request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION'] and not self.request.user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Solo Planificación o Administrador puede editar Acciones a Corto Plazo (POA).']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION'] and not request.user.is_superuser:
            return Response({'error': 'Solo Planificación o Administrador puede cambiar el estado de la ACP.'}, status=status.HTTP_403_FORBIDDEN)
        acp = self.get_object()
        acp.estado = not acp.estado
        acp.save(update_fields=['estado'])
        return Response({'status': f'ACP {"activada" if acp.estado else "desactivada (baja lógica)"}', 'estado': acp.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION'] and not self.request.user.is_superuser:
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
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'PRESUPUESTOS', 'TESORERIA'] and not user.is_superuser:
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
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE', 'ELABORADOR'] and not user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para crear Operaciones.']})
        
        # Elaborador y Gerente sólo pueden crear operaciones para su propia área
        area = serializer.validated_data.get('area')
        if rol in ['GERENTE', 'ELABORADOR'] and not user.is_superuser and user.seccion and area and area.id != user.seccion.area_id:
            raise serializers.ValidationError({'non_field_errors': ['No puedes crear operaciones para otra área.']})
            
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE'] and not user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Los Elaboradores y Trabajadores no pueden modificar Operaciones.']})
        area = serializer.validated_data.get('area') or self.get_object().area
        if rol == 'GERENTE' and not user.is_superuser and user.seccion and area and area.id != user.seccion.area_id:
            raise serializers.ValidationError({'non_field_errors': ['No puedes modificar operaciones de otra área.']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE'] and not request.user.is_superuser:
            return Response({'error': 'Solo Gerentes o Planificación / Administrador pueden modificar el estado de la Operación.'}, status=status.HTTP_403_FORBIDDEN)
        op = self.get_object()
        if rol == 'GERENTE' and not request.user.is_superuser and request.user.seccion and op.area_id != request.user.seccion.area_id:
            return Response({'error': 'No puedes modificar operaciones de otra área.'}, status=status.HTTP_403_FORBIDDEN)
        op.estado = not op.estado
        op.save(update_fields=['estado'])
        return Response({'status': f'Operación {"activada" if op.estado else "desactivada (baja lógica)"}', 'estado': op.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE'] and not self.request.user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Solo Gerentes o Planificación / Administrador pueden dar de baja Operaciones.']})
        if rol == 'GERENTE' and not self.request.user.is_superuser and self.request.user.seccion and instance.area_id != self.request.user.seccion.area_id:
            raise serializers.ValidationError({'non_field_errors': ['No puedes dar de baja operaciones de otra área.']})
        instance.estado = False
        instance.save(update_fields=['estado'])

    @action(detail=False, methods=['post'], url_path='duplicar-gestion')
    def duplicar_gestion(self, request):
        """Duplica operaciones de una gestión base a una gestión destino para Gerencias o Planificación"""
        user = request.user
        rol = get_user_role(user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE'] and not user.is_superuser:
            return Response({'error': 'No tienes permisos para duplicar operaciones.'}, status=status.HTTP_403_FORBIDDEN)

        gestion_base_anio = request.data.get('gestion_base')
        gestion_destino_anio = request.data.get('gestion_destino')
        area_id = request.data.get('area_id')

        if not gestion_base_anio or not gestion_destino_anio:
            return Response({'error': 'Debe especificar gestión base y gestión destino.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.presupuestos.models import Gestion
        g_destino = None
        if str(gestion_destino_anio).isdigit():
            g_destino = Gestion.objects.filter(anio=int(gestion_destino_anio)).first() or Gestion.objects.filter(id=int(gestion_destino_anio)).first()

        if not g_destino:
            return Response({'error': f'La gestión de destino {gestion_destino_anio} no existe en el sistema.'}, status=status.HTTP_400_BAD_REQUEST)

        # Restricción para Gerente
        if rol == 'GERENTE' and not user.is_superuser:
            if user.seccion and user.seccion.area_id:
                area_id = user.seccion.area_id
            else:
                return Response({'error': 'El usuario no tiene un área asignada para duplicar operaciones.'}, status=status.HTTP_400_BAD_REQUEST)

        ops_base = Operacion.objects.filter(
            accion_corto_plazo__gestion__anio=int(gestion_base_anio) if str(gestion_base_anio).isdigit() else 2026,
            estado=True
        )
        if area_id and str(area_id).upper() != 'ALL':
            ops_base = ops_base.filter(area_id=area_id)

        if not ops_base.exists():
            return Response({'error': f'No se encontraron operaciones activas en la gestión {gestion_base_anio} para duplicar.'}, status=status.HTTP_400_BAD_REQUEST)

        creadas = []
        errores = []

        for op in ops_base:
            prog = op.area.programa
            acp_destino = AccionCortoPlazo.objects.filter(
                gestion=g_destino,
                accion_mediano_plazo__programa=prog,
                estado=True
            ).first()

            if not acp_destino:
                msg = f"Planificación debe crear primero la Acción a Corto Plazo (ACP) para la gestión {g_destino.anio} en el Programa {prog.codigo} ({prog.nombre}) antes de asignar operaciones al área {op.area.nombre}."
                if msg not in errores:
                    errores.append(msg)
                continue

            nuevo_codigo = op.codigo.replace(str(gestion_base_anio), str(g_destino.anio))
            if nuevo_codigo == op.codigo:
                nuevo_codigo = f"{op.codigo}-{g_destino.anio}"

            if Operacion.objects.filter(codigo=nuevo_codigo).exists():
                continue

            nueva_op = Operacion.objects.create(
                accion_corto_plazo=acp_destino,
                area=op.area,
                codigo=nuevo_codigo,
                descripcion=op.descripcion,
                es_contratacion=op.es_contratacion,
                estado=True
            )
            creadas.append(nueva_op)

        if not creadas and errores:
            return Response({'error': errores[0], 'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': f'Se duplicaron exitosamente {len(creadas)} operaciones a la Gestión {g_destino.anio}.',
            'creadas': len(creadas),
            'errores': errores
        }, status=status.HTTP_201_CREATED)


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
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'PRESUPUESTOS', 'TESORERIA'] and not user.is_superuser:
            if user.seccion and user.seccion.area_id:
                qs = qs.filter(operacion__area_id=user.seccion.area_id)
            else:
                qs = qs.none()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE', 'ELABORADOR'] and not user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Tu rol no tiene permiso para crear Tareas.']})
        
        operacion = serializer.validated_data.get('operacion')
        if rol in ['GERENTE', 'ELABORADOR'] and not user.is_superuser and user.seccion and operacion and operacion.area_id != user.seccion.area_id:
            raise serializers.ValidationError({'non_field_errors': ['No puedes crear tareas para operaciones de otra área.']})

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        rol = get_user_role(user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE'] and not user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Los Elaboradores y Trabajadores no pueden modificar Tareas.']})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        rol = get_user_role(request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE'] and not request.user.is_superuser:
            return Response({'error': 'Solo Gerentes o Planificación / Administrador pueden cambiar el estado de la Tarea.'}, status=status.HTTP_403_FORBIDDEN)
        tarea = self.get_object()
        tarea.estado = not tarea.estado
        tarea.save(update_fields=['estado'])
        return Response({'status': f'Tarea {"activada" if tarea.estado else "desactivada (baja lógica)"}', 'estado': tarea.estado})

    def perform_destroy(self, instance):
        rol = get_user_role(self.request.user)
        if rol not in ['ADMINISTRADOR', 'PLANIFICACION', 'GERENTE'] and not self.request.user.is_superuser:
            raise serializers.ValidationError({'non_field_errors': ['Solo Gerentes o Planificación / Administrador pueden dar de baja Tareas.']})
        instance.estado = False
        instance.save(update_fields=['estado'])

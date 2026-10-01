from rest_framework import generics, permissions, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import Usuario, Rol
from .serializers import UsuarioSerializer, RegistroUsuarioSerializer, LogEntrySerializer, RolSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        # Registrar LogEntry de inicio de sesión
        try:
            content_type = ContentType.objects.get_for_model(user)
            LogEntry.objects.create(
                user_id=user.id,
                content_type_id=content_type.id,
                object_id=str(user.id),
                object_repr=f"Usuario {user.get_full_name() or user.username}",
                action_flag=CHANGE,
                change_message="Inicio de Sesión (Login)"
            )
        except Exception as e:
            print("Error creando logentry de login:", e)

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    """Devuelve el perfil del usuario actualmente autenticado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


class RegistroUsuarioView(generics.CreateAPIView):
    """Permite el registro de nuevos usuarios."""
    queryset = Usuario.objects.all()
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []


class RolViewSet(viewsets.ReadOnlyModelViewSet):
    """Permite listar los roles disponibles."""
    queryset = Rol.objects.all().order_by('id')
    serializer_class = RolSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    pagination_class = None


from datetime import timedelta
from django.utils import timezone
from django.db.models import Q, Count, Sum
from apps.memorias.models import MemoriaCalculo, RegistroMemoriaUsuario, TraspasoPresupuestario
from apps.ejecucion.models import Gasto, CertificacionPOA
from apps.presupuestos.models import Gestion, PresupuestoArea


def check_admin_permission(user):
    return user.is_authenticated and (
        user.is_superuser or (user.rol and user.rol.nombre.upper() in ['ADMINISTRADOR', 'APROBADOR'])
    )


class LogEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """Permite ver los logs del sistema (solo para superadmin y administradores) con filtros avanzados."""
    serializer_class = LogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not check_admin_permission(user):
            return LogEntry.objects.none()

        qs = LogEntry.objects.select_related(
            'user', 'user__rol', 'user__seccion__area', 'content_type'
        ).all().order_by('-action_time')

        # Filtro de búsqueda textual
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(object_repr__icontains=search) |
                Q(change_message__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )

        # Filtro por usuario específico
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)

        # Filtro por flag de acción (1: Adición, 2: Cambio, 3: Eliminación)
        action_flag = self.request.query_params.get('action_flag')
        if action_flag:
            qs = qs.filter(action_flag=action_flag)

        # Filtro por logins
        only_logins = self.request.query_params.get('only_logins')
        if only_logins == 'true':
            qs = qs.filter(change_message__icontains='Inicio de Sesión')
        
        exclude_logins = self.request.query_params.get('exclude_logins')
        if exclude_logins == 'true':
            qs = qs.exclude(change_message__icontains='Inicio de Sesión')

        # Filtro por rango de fechas
        start_date = self.request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(action_time__date__gte=start_date)

        end_date = self.request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(action_time__date__lte=end_date)

        # Filtro por módulo temático
        modulo = self.request.query_params.get('modulo', '').upper().strip()
        if modulo:
            if modulo == 'AUTENTICACIÓN' or modulo == 'LOGIN':
                qs = qs.filter(change_message__icontains='Inicio de Sesión')
            elif modulo == 'MEMORIAS':
                qs = qs.filter(Q(object_repr__icontains='Memoria') | Q(content_type__model__icontains='memoria'))
            elif modulo == 'EJECUCIÓN':
                qs = qs.filter(Q(object_repr__icontains='Gasto') | Q(content_type__model__icontains='gasto'))
            elif modulo == 'MODIFICACIONES':
                qs = qs.filter(Q(object_repr__icontains='Traspaso') | Q(content_type__model__icontains='traspaso'))
            elif modulo == 'CERTIFICACIONES':
                qs = qs.filter(Q(object_repr__icontains='Certificaci') | Q(content_type__model__icontains='certificacion'))
            elif modulo == 'PRESUPUESTOS':
                qs = qs.filter(Q(object_repr__icontains='Techo') | Q(object_repr__icontains='Partida') | Q(content_type__model__icontains='presupuesto'))
            elif modulo == 'GESTIONES':
                qs = qs.filter(Q(object_repr__icontains='Gestión') | Q(content_type__model__icontains='gestion'))

        # Límite opcional para optimizar consultas rápidas
        limit = self.request.query_params.get('limit')
        if limit and limit.isdigit():
            return qs[:int(limit)]

        return qs


class UltimosIngresosView(APIView):
    """Devuelve la lista de usuarios con sus últimos inicios de sesión (last_login) para superadministradores."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not check_admin_permission(request.user):
            return Response({'error': 'No tienes permisos de superadministrador.'}, status=status.HTTP_403_FORBIDDEN)

        usuarios = Usuario.objects.select_related('rol', 'seccion__area').all().order_by('-last_login', 'username')
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)


class AuditoriaResumenView(APIView):
    """Proporciona indicadores macro, conteos por módulo y tendencias de los últimos 7 días."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not check_admin_permission(request.user):
            return Response({'error': 'No tienes permisos de superadministrador.'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        today = now.date()
        seven_days_ago = today - timedelta(days=6)

        total_logs = LogEntry.objects.count()
        logins_hoy = LogEntry.objects.filter(
            change_message__icontains='Inicio de Sesión', action_time__date=today
        ).count()
        acciones_hoy = LogEntry.objects.filter(action_time__date=today).count()
        
        modificaciones_criticas = LogEntry.objects.filter(
            Q(action_flag=3) |
            Q(change_message__icontains='Rechaz') |
            Q(change_message__icontains='Elimin') |
            Q(change_message__icontains='Cerrad')
        ).count()

        total_usuarios = Usuario.objects.count()
        usuarios_activos_total = Usuario.objects.filter(last_login__isnull=False).count()

        # Conteo por módulos
        total_memorias = LogEntry.objects.filter(Q(object_repr__icontains='Memoria')).count()
        total_gastos = Gasto.objects.count()
        total_traspasos = TraspasoPresupuestario.objects.count()
        total_certificaciones = CertificacionPOA.objects.count()
        total_logins = LogEntry.objects.filter(change_message__icontains='Inicio de Sesión').count()
        total_presupuestos = PresupuestoArea.objects.count()

        distribucion_modulos = {
            'MEMORIAS': total_memorias,
            'EJECUCIÓN': total_gastos,
            'MODIFICACIONES': total_traspasos,
            'CERTIFICACIONES': total_certificaciones,
            'AUTENTICACIÓN': total_logins,
            'PRESUPUESTOS': total_presupuestos,
        }

        # Conteo por tipos de acción
        conteo_creacion = LogEntry.objects.filter(action_flag=1).count()
        conteo_modificacion = LogEntry.objects.filter(action_flag=2).exclude(change_message__icontains='Inicio de Sesión').count()
        conteo_eliminacion = LogEntry.objects.filter(action_flag=3).count()

        distribucion_acciones = {
            'CREACIÓN': conteo_creacion,
            'MODIFICACIÓN': conteo_modificacion,
            'ELIMINACIÓN': conteo_eliminacion,
            'LOGIN': total_logins,
        }

        # Tendencia de los últimos 7 días
        tendencia_7_dias = []
        dias_es = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        for i in range(7):
            d = seven_days_ago + timedelta(days=i)
            c = LogEntry.objects.filter(action_time__date=d).count()
            dia_semana = dias_es[d.weekday()]
            tendencia_7_dias.append({
                'fecha': d.strftime('%Y-%m-%d'),
                'label': f"{dia_semana} {d.day}",
                'count': c
            })

        # Últimas 10 actividades registradas
        recientes = LogEntry.objects.select_related(
            'user', 'user__rol', 'user__seccion__area', 'content_type'
        ).order_by('-action_time')[:10]
        actividad_reciente = LogEntrySerializer(recientes, many=True).data

        return Response({
            'total_logs': total_logs,
            'logins_hoy': logins_hoy,
            'acciones_hoy': acciones_hoy,
            'modificaciones_criticas': modificaciones_criticas,
            'total_usuarios': total_usuarios,
            'usuarios_activos_total': usuarios_activos_total,
            'distribucion_modulos': distribucion_modulos,
            'distribucion_acciones': distribucion_acciones,
            'tendencia_7_dias': tendencia_7_dias,
            'actividad_reciente': actividad_reciente,
        })


class AuditoriaFlujoTrabajadoresView(APIView):
    """Calcula y devuelve el flujo de trabajo, responsabilidades y actividad operativa por cada trabajador."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not check_admin_permission(request.user):
            return Response({'error': 'No tienes permisos de superadministrador.'}, status=status.HTTP_403_FORBIDDEN)

        usuarios = Usuario.objects.select_related('rol', 'seccion__area').all().order_by('username')
        data = []

        for u in usuarios:
            full_name = u.get_full_name()
            nombre = full_name.strip() if full_name and full_name.strip() else u.username

            # Conteo de participaciones en memorias
            participaciones = RegistroMemoriaUsuario.objects.filter(usuario=u)
            memorias_elaboradas = participaciones.filter(tipo_participacion='ELABORADOR').count()
            memorias_revisadas = participaciones.filter(tipo_participacion='REVISOR').count()
            memorias_aprobadas = participaciones.filter(tipo_participacion='APROBADOR').count()

            # Gastos registrados
            gastos = Gasto.objects.filter(usuario_registro=u)
            gastos_count = gastos.count()
            monto_ejecutado = gastos.aggregate(total=Sum('monto_ejecutado'))['total'] or 0

            # Traspasos
            traspasos_count = TraspasoPresupuestario.objects.filter(usuario_registro=u).count()

            # Certificaciones
            cert_count = CertificacionPOA.objects.filter(creado_por=u).count()

            # Total de logs en LogEntry
            total_logs = LogEntry.objects.filter(user=u).count()

            # Último log
            ultimo_log = LogEntry.objects.filter(user=u).order_by('-action_time').first()
            ultima_actividad = None
            if ultimo_log:
                ultima_actividad = {
                    'action_time': ultimo_log.action_time,
                    'descripcion': ultimo_log.change_message or ultimo_log.object_repr,
                    'action_flag': ultimo_log.action_flag,
                }

            rol_str = "SUPERADMINISTRADOR" if u.is_superuser else (u.rol.nombre if u.rol else "USUARIO")
            area_str = u.seccion.area.nombre if u.seccion and u.seccion.area else "Dirección General"
            seccion_str = u.seccion.nombre if u.seccion else ""

            data.append({
                'id': u.id,
                'username': u.username,
                'nombre_completo': nombre,
                'email': u.email,
                'cargo': u.cargo or 'Sin cargo específico',
                'rol': rol_str,
                'area': area_str,
                'seccion': seccion_str,
                'estado': u.estado,
                'last_login': u.last_login,
                'date_joined': u.date_joined,
                'total_acciones': total_logs,
                'memorias_elaboradas': memorias_elaboradas,
                'memorias_revisadas': memorias_revisadas,
                'memorias_aprobadas': memorias_aprobadas,
                'gastos_registrados': gastos_count,
                'monto_total_ejecutado': float(monto_ejecutado),
                'traspasos_registrados': traspasos_count,
                'certificaciones_creadas': cert_count,
                'ultima_actividad': ultima_actividad,
            })

        return Response(data)


class AuditoriaTrabajadorDetalleView(APIView):
    """Devuelve el expediente de trazabilidad detallado de un trabajador individual."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if not check_admin_permission(request.user):
            return Response({'error': 'No tienes permisos de superadministrador.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            u = Usuario.objects.select_related('rol', 'seccion__area').get(pk=user_id)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Memorias asociadas
        participaciones = RegistroMemoriaUsuario.objects.filter(usuario=u).select_related('memoria', 'memoria__gestion', 'memoria__seccion__area')
        memorias_data = []
        for p in participaciones:
            m = p.memoria
            memorias_data.append({
                'id': m.id,
                'codigo': m.codigo,
                'rol_participacion': p.tipo_participacion,
                'rol_participacion_display': p.get_tipo_participacion_display(),
                'estado': m.estado,
                'estado_display': m.get_estado_display(),
                'gestion': m.gestion.anio if m.gestion else 0,
                'area': m.seccion.area.nombre if m.seccion and m.seccion.area else '',
                'total_presupuestado': float(m.total_presupuestado),
                'saldo_disponible': float(m.saldo_disponible),
                'fecha_creacion': m.created_at,
            })

        # Gastos registrados
        gastos = Gasto.objects.filter(usuario_registro=u).select_related('memoria').order_by('-fecha_gasto')[:30]
        gastos_data = []
        for g in gastos:
            gastos_data.append({
                'id': g.id,
                'monto_ejecutado': float(g.monto_ejecutado),
                'fecha_gasto': g.fecha_gasto,
                'comprobante_num': g.comprobante_num or 'S/N',
                'memoria_codigo': g.memoria.codigo if g.memoria else 'N/A',
                'observacion': g.observacion or '',
            })

        # Traspasos registrados
        traspasos = TraspasoPresupuestario.objects.filter(usuario_registro=u).select_related(
            'memoria_origen', 'memoria_destino'
        ).order_by('-created_at')[:30]
        traspasos_data = []
        for t in traspasos:
            traspasos_data.append({
                'id': t.id,
                'monto': float(t.monto),
                'memoria_origen': t.memoria_origen.codigo if t.memoria_origen else '',
                'memoria_destino': t.memoria_destino.codigo if t.memoria_destino else '',
                'motivo': t.motivo,
                'created_at': t.created_at,
            })

        # Certificaciones creadas
        certs = CertificacionPOA.objects.filter(creado_por=u).select_related('area').order_by('-fecha')[:30]
        certs_data = []
        for c in certs:
            certs_data.append({
                'id': c.id,
                'codigo': c.codigo_certificacion,
                'area': c.area.nombre if c.area else '',
                'monto_solicitado': float(c.monto_solicitado),
                'estado': c.estado,
                'fecha': c.fecha,
            })

        # Últimos logs individuales
        logs = LogEntry.objects.filter(user=u).order_by('-action_time')[:50]
        logs_data = LogEntrySerializer(logs, many=True).data

        full_name = u.get_full_name()
        nombre = full_name.strip() if full_name and full_name.strip() else u.username

        return Response({
            'usuario': {
                'id': u.id,
                'username': u.username,
                'nombre_completo': nombre,
                'email': u.email,
                'cargo': u.cargo or 'Sin cargo específico',
                'rol': "SUPERADMINISTRADOR" if u.is_superuser else (u.rol.nombre if u.rol else "USUARIO"),
                'area': u.seccion.area.nombre if u.seccion and u.seccion.area else "Dirección General",
                'seccion': u.seccion.nombre if u.seccion else "",
                'estado': u.estado,
                'last_login': u.last_login,
                'date_joined': u.date_joined,
            },
            'memorias': memorias_data,
            'gastos': gastos_data,
            'traspasos': traspasos_data,
            'certificaciones': certs_data,
            'logs': logs_data,
        })


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MeView,
    RegistroUsuarioView,
    RolViewSet,
    LogEntryViewSet,
    UltimosIngresosView,
    AuditoriaResumenView,
    AuditoriaFlujoTrabajadoresView,
    AuditoriaTrabajadorDetalleView,
)

router = DefaultRouter()
router.register(r'roles', RolViewSet, basename='roles')
router.register(r'logs', LogEntryViewSet, basename='logs')

urlpatterns = [
    path('auditoria/resumen/', AuditoriaResumenView.as_view(), name='auditoria-resumen'),
    path('auditoria/flujo-trabajadores/', AuditoriaFlujoTrabajadoresView.as_view(), name='auditoria-flujo-trabajadores'),
    path('auditoria/trabajadores/<int:user_id>/', AuditoriaTrabajadorDetalleView.as_view(), name='auditoria-trabajador-detalle'),
    path('', include(router.urls)),
    path('me/', MeView.as_view(), name='usuario-me'),
    path('register/', RegistroUsuarioView.as_view(), name='usuario-register'),
    path('ultimos-ingresos/', UltimosIngresosView.as_view(), name='ultimos-ingresos'),
]


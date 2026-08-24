from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeView, RegistroUsuarioView, RolViewSet, LogEntryViewSet, UltimosIngresosView

router = DefaultRouter()
router.register(r'roles', RolViewSet, basename='roles')
router.register(r'logs', LogEntryViewSet, basename='logs')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', MeView.as_view(), name='usuario-me'),
    path('register/', RegistroUsuarioView.as_view(), name='usuario-register'),
    path('ultimos-ingresos/', UltimosIngresosView.as_view(), name='ultimos-ingresos'),
]

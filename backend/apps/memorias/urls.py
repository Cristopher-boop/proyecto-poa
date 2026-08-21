from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemoriaCalculoViewSet, DetallePresupuestoMemoriaViewSet, TraspasoViewSet

router = DefaultRouter()
router.register(r'memorias-calculo', MemoriaCalculoViewSet, basename='memoria-calculo')
router.register(r'detalles-presupuesto', DetallePresupuestoMemoriaViewSet, basename='detalle-presupuesto')
router.register(r'traspasos', TraspasoViewSet, basename='traspaso')

urlpatterns = [
    path('', include(router.urls)),
]

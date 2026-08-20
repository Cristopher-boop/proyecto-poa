from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GestionViewSet, PartidaViewSet, PresupuestoAreaViewSet

router = DefaultRouter()
router.register(r'gestiones', GestionViewSet, basename='gestion')
router.register(r'partidas', PartidaViewSet, basename='partida')
router.register(r'techos-area', PresupuestoAreaViewSet, basename='presupuesto-area')

urlpatterns = [
    path('', include(router.urls)),
]

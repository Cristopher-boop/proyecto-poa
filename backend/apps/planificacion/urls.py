from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccionMedianoPlazoViewSet,
    AccionCortoPlazoViewSet,
    OperacionViewSet,
    TareaViewSet
)

router = DefaultRouter()
router.register(r'acciones-mediano-plazo', AccionMedianoPlazoViewSet, basename='acciones-mediano-plazo')
router.register(r'acciones-corto-plazo', AccionCortoPlazoViewSet, basename='acciones-corto-plazo')
router.register(r'operaciones', OperacionViewSet, basename='operaciones')
router.register(r'tareas', TareaViewSet, basename='tareas')

urlpatterns = [
    path('', include(router.urls)),
]

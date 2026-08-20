from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProgramaViewSet, AreaViewSet, SeccionViewSet

router = DefaultRouter()
router.register(r'programas', ProgramaViewSet, basename='programa')
router.register(r'areas', AreaViewSet, basename='area')
router.register(r'secciones', SeccionViewSet, basename='seccion')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GastoViewSet, CertificacionPOAViewSet

router = DefaultRouter()
router.register(r'gastos', GastoViewSet, basename='gasto')
router.register(r'certificaciones', CertificacionPOAViewSet, basename='certificacion')

urlpatterns = [
    path('', include(router.urls)),
]


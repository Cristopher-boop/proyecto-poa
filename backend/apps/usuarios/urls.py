from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeView, RegistroUsuarioView, LogEntryViewSet

router = DefaultRouter()
router.register(r'logs', LogEntryViewSet, basename='logs')

urlpatterns = [
    path('me/', MeView.as_view(), name='usuario-me'),
    path('register/', RegistroUsuarioView.as_view(), name='usuario-register'),
    path('', include(router.urls)),
]


from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth JWT
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Módulos
    path('api/v1/organizacional/', include('apps.organizacional.urls')),
    path('api/v1/usuarios/', include('apps.usuarios.urls')),
    path('api/v1/presupuestos/', include('apps.presupuestos.urls')),
    path('api/v1/memorias/', include('apps.memorias.urls')),
    path('api/v1/traspasos/', include('apps.traspasos.urls')),
]


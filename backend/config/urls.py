from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/organizacional/', include('apps.organizacional.urls')),
    path('api/v1/usuarios/', include('apps.usuarios.urls')),
    path('api/v1/presupuestos/', include('apps.presupuestos.urls')),
    path('api/v1/memorias/', include('apps.memorias.urls')),
    path('api/v1/traspasos/', include('apps.traspasos.urls')),
]

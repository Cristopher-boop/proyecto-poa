from django.contrib import admin
from .models import Programa, Area, Seccion

@admin.register(Programa)
class ProgramaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'estado')
    search_fields = ('codigo', 'nombre')

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'tipo', 'programa', 'estado')
    list_filter = ('tipo', 'estado', 'programa')
    search_fields = ('codigo', 'nombre')

@admin.register(Seccion)
class SeccionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'area', 'estado')
    list_filter = ('area__tipo', 'estado')
    search_fields = ('nombre', 'area__nombre')

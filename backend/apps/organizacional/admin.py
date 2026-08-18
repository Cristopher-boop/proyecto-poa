from django.contrib import admin
from .models import Programa, Area, Seccion, Rol

@admin.register(Programa)
class ProgramaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'estado', 'created_at']
    list_filter = ['estado']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'programa', 'tipo', 'estado', 'created_at']
    list_filter = ['estado', 'tipo', 'programa']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']

@admin.register(Seccion)
class SeccionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'area', 'estado', 'created_at']
    list_filter = ['estado', 'area']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'created_at']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']
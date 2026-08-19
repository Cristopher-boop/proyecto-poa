from django.contrib import admin
from .models import Gestion, Partida, PresupuestoArea

@admin.register(Gestion)
class GestionAdmin(admin.ModelAdmin):
    list_display = ('anio', 'estado', 'fecha_cierre')
    list_filter = ('estado',)

@admin.register(Partida)
class PartidaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'clase', 'estado')
    list_filter = ('clase', 'estado')
    search_fields = ('codigo', 'nombre')

@admin.register(PresupuestoArea)
class PresupuestoAreaAdmin(admin.ModelAdmin):
    list_display = ('gestion', 'area', 'monto_inicial', 'monto_actual', 'estado')
    list_filter = ('gestion', 'area', 'estado')

from django.contrib import admin
from .models import Gestion, Partida, PresupuestoArea, AsignacionPartida

@admin.register(Gestion)
class GestionAdmin(admin.ModelAdmin):
    list_display = ('anio', 'estado', 'fecha_aprobacion_ministerio')
    list_filter = ('estado',)

@admin.register(Partida)
class PartidaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'clase', 'estado')
    list_filter = ('clase', 'estado')
    search_fields = ('codigo', 'nombre')

@admin.register(PresupuestoArea)
class PresupuestoAreaAdmin(admin.ModelAdmin):
    list_display = ('gestion', 'area', 'techo_asignado', 'sobrante_gestion_anterior')
    list_filter = ('gestion', 'area')

@admin.register(AsignacionPartida)
class AsignacionPartidaAdmin(admin.ModelAdmin):
    list_display = ('partida', 'presupuesto_area', 'monto_inicial', 'monto_modificaciones', 'monto_vigente', 'monto_comprometido', 'monto_disponible')
    list_filter = ('presupuesto_area__gestion', 'presupuesto_area__area')
    search_fields = ('partida__codigo', 'partida__nombre')

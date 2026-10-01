from django.contrib import admin
from .models import (
    MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria,
    TraspasoPresupuestario, ModificacionPresupuestaria, DetalleModificacion
)

class DetallePresupuestoInline(admin.TabularInline):
    model = DetallePresupuestoMemoria
    extra = 1

class RegistroUsuarioInline(admin.TabularInline):
    model = RegistroMemoriaUsuario
    extra = 1

class DetalleModificacionInline(admin.TabularInline):
    model = DetalleModificacion
    extra = 1

@admin.register(MemoriaCalculo)
class MemoriaCalculoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'gestion', 'seccion', 'estado', 'fecha_aprobacion', 'created_at')
    list_filter = ('gestion', 'estado', 'seccion__area')
    search_fields = ('codigo', 'justificacion')
    inlines = [RegistroUsuarioInline, DetallePresupuestoInline]

@admin.register(DetallePresupuestoMemoria)
class DetallePresupuestoMemoriaAdmin(admin.ModelAdmin):
    list_display = ('memoria', 'partida', 'descripcion', 'cantidad', 'unidad_medida', 'precio_unitario', 'precio_total', 'estado_ejecucion')
    list_filter = ('estado_ejecucion', 'partida')
    search_fields = ('descripcion', 'memoria__codigo')

@admin.register(TraspasoPresupuestario)
class TraspasoPresupuestarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'memoria_origen', 'memoria_destino', 'monto', 'estado', 'usuario_registro', 'created_at')
    list_filter = ('estado', 'memoria_origen__seccion__area')
    search_fields = ('memoria_origen__codigo', 'memoria_destino__codigo', 'motivo')

@admin.register(ModificacionPresupuestaria)
class ModificacionPresupuestariaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'gestion', 'area', 'tipo', 'total_monto', 'estado', 'usuario_registro', 'fecha')
    list_filter = ('gestion', 'tipo', 'estado', 'area')
    search_fields = ('codigo', 'motivo', 'area__nombre')
    inlines = [DetalleModificacionInline]



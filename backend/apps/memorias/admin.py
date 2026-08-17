from django.contrib import admin
from .models import MemoriaCalculo, RegistroMemoriaUsuario, DetallePresupuestoMemoria

class DetallePresupuestoInline(admin.TabularInline):
    model = DetallePresupuestoMemoria
    extra = 1

class RegistroUsuarioInline(admin.TabularInline):
    model = RegistroMemoriaUsuario
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

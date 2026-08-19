from django.contrib import admin
from .models import Gasto


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    list_display = ('detalle_memoria', 'monto_ejecutado', 'fecha_gasto', 'comprobante_num', 'usuario_registro')
    list_filter = ('fecha_gasto', 'detalle_memoria__memoria__gestion')
    search_fields = ('comprobante_num', 'detalle_memoria__descripcion')

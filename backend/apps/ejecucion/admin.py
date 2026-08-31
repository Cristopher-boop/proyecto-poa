from django.contrib import admin
from .models import Gasto


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    list_display = ('memoria', 'monto_ejecutado', 'fecha_gasto', 'comprobante_num', 'usuario_registro')
    list_filter = ('fecha_gasto', 'memoria__gestion')
    search_fields = ('comprobante_num', 'memoria__codigo')

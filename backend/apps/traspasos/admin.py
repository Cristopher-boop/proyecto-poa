from django.contrib import admin
from .models import TraspasoPartida

@admin.register(TraspasoPartida)
class TraspasoPartidaAdmin(admin.ModelAdmin):
    list_display = ('monto', 'partida_origen', 'partida_destino', 'area', 'estado', 'usuario_solicitante', 'usuario_aprobador', 'created_at')
    list_filter = ('estado', 'gestion', 'area')
    search_fields = ('justificacion',)

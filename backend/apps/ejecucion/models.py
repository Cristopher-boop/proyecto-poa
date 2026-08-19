from django.db import models
from apps.core.models import TimeStampedModel
from apps.memorias.models import DetallePresupuestoMemoria
from apps.usuarios.models import Usuario


class Gasto(TimeStampedModel):
    monto_ejecutado = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto Ejecutado")
    fecha_gasto = models.DateField(verbose_name="Fecha del Gasto")
    comprobante_num = models.CharField(max_length=100, blank=True, null=True, verbose_name="N° de Comprobante")
    observacion = models.TextField(blank=True, null=True, verbose_name="Observación")
    detalle_memoria = models.ForeignKey(DetallePresupuestoMemoria, on_delete=models.CASCADE, related_name='gastos', verbose_name="Detalle de Memoria")
    usuario_registro = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='gastos_registrados', verbose_name="Registrado por")

    class Meta:
        verbose_name = "Gasto Ejecutado"
        verbose_name_plural = "Gastos Ejecutados"
        db_table = 'ejecucion_gasto'

    def __str__(self):
        return f"Gasto {self.monto_ejecutado} - {self.detalle_memoria.descripcion} ({self.fecha_gasto})"

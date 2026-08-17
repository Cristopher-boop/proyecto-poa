from django.db import models
from django.core.exceptions import ValidationError
from apps.core.models import TimeStampedModel
from apps.presupuestos.models import Gestion, AsignacionPartida
from apps.organizacional.models import Area
from apps.usuarios.models import Usuario

class TraspasoPartida(TimeStampedModel):
    class EstadoTraspaso(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente de Aprobación'
        APROBADO = 'APROBADO', 'Aprobado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'

    gestion = models.ForeignKey(Gestion, on_delete=models.CASCADE, related_name='traspasos', verbose_name="Gestión")
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='traspasos', verbose_name="Área")
    partida_origen = models.ForeignKey(AsignacionPartida, on_delete=models.CASCADE, related_name='traspasos_salida', verbose_name="Partida Origen")
    partida_destino = models.ForeignKey(AsignacionPartida, on_delete=models.CASCADE, related_name='traspasos_entrada', verbose_name="Partida Destino")
    monto = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Monto")
    justificacion = models.TextField(verbose_name="Justificación")
    usuario_solicitante = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='traspasos_solicitados', verbose_name="Solicitante")
    usuario_aprobador = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='traspasos_aprobados', verbose_name="Aprobador")
    estado = models.CharField(max_length=20, choices=EstadoTraspaso.choices, default=EstadoTraspaso.PENDIENTE, verbose_name="Estado")
    fecha_aprobacion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha Aprobación")

    class Meta:
        verbose_name = "Traspaso de Partida"
        verbose_name_plural = "Traspasos de Partidas"

    def clean(self):
        if self.partida_origen == self.partida_destino:
            raise ValidationError("La partida de origen y destino no pueden ser la misma.")
        if self.partida_origen.presupuesto_area.area != self.partida_destino.presupuesto_area.area:
            raise ValidationError("No está permitido traspasar presupuesto entre áreas/gerencias distintas.")

    def __str__(self):
        return f"Traspaso {self.monto} ({self.partida_origen} -> {self.partida_destino})"

from django.db import models
from apps.core.models import TimeStampedModel
from apps.usuarios.models import Usuario

class Notificacion(TimeStampedModel):
    class TipoNotificacion(models.TextChoices):
        REVISION_PENDIENTE = 'REVISION_PENDIENTE', 'Revisión Pendiente'
        APROBACION = 'APROBACION', 'Aprobado'
        RECHAZO = 'RECHAZO', 'Rechazado'
        ALERTA_PRESUPUESTO = 'ALERTA_PRESUPUESTO', 'Alerta de Presupuesto'
        SISTEMA = 'SISTEMA', 'Mensaje del Sistema'

    usuario_destino = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='notificaciones_recibidas',
        verbose_name="Usuario Destino"
    )
    usuario_origen = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notificaciones_enviadas',
        verbose_name="Usuario Origen"
    )
    titulo = models.CharField(max_length=150, verbose_name="Título")
    mensaje = models.TextField(verbose_name="Mensaje")
    tipo = models.CharField(
        max_length=30,
        choices=TipoNotificacion.choices,
        default=TipoNotificacion.REVISION_PENDIENTE,
        verbose_name="Tipo de Notificación"
    )
    enlace = models.CharField(max_length=255, null=True, blank=True, verbose_name="Enlace de Acción")
    leido = models.BooleanField(default=False, verbose_name="¿Leído?")
    fecha_lectura = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Lectura")

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ['-created_at']

    def __str__(self):
        return f"Notificación -> {self.usuario_destino.username}: {self.titulo}"

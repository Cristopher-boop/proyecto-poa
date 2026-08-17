from django.db import models
from decimal import Decimal
from apps.core.models import TimeStampedModel
from apps.presupuestos.models import Gestion, Partida
from apps.organizacional.models import Seccion
from apps.usuarios.models import Usuario

class MemoriaCalculo(TimeStampedModel):
    class EstadoMemoria(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        ENVIADO_REVISION = 'ENVIADO_REVISION', 'Enviado para Revisión'
        APROBADO = 'APROBADO', 'Aprobado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'
        EJECUTADO = 'EJECUTADO', 'Ejecutado'

    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código")
    gestion = models.ForeignKey(Gestion, on_delete=models.CASCADE, related_name='memorias_calculo', verbose_name="Gestión")
    seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='memorias_calculo', verbose_name="Sección")
    justificacion = models.TextField(verbose_name="Justificación")
    estado = models.CharField(max_length=20, choices=EstadoMemoria.choices, default=EstadoMemoria.BORRADOR, verbose_name="Estado")
    observacion_revision = models.TextField(blank=True, null=True, verbose_name="Observación Revisión")
    fecha_aprobacion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha Aprobación")

    class Meta:
        verbose_name = "Memoria de Cálculo"
        verbose_name_plural = "Memorias de Cálculo"

    def __str__(self):
        return f"{self.codigo} [{self.get_estado_display()}]"

class RegistroMemoriaUsuario(TimeStampedModel):
    class TipoParticipacion(models.TextChoices):
        ELABORADOR = 'ELABORADOR', 'Elaborador de la Memoria'
        EJECUTOR = 'EJECUTOR', 'Responsable de Ejecutar la Tarea'
        REVISOR_APROBADOR = 'REVISOR_APROBADOR', 'Revisor / Aprobador'

    memoria = models.ForeignKey(MemoriaCalculo, on_delete=models.CASCADE, related_name='participaciones', verbose_name="Memoria")
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='memorias_asociadas', verbose_name="Usuario")
    tipo_participacion = models.CharField(max_length=25, choices=TipoParticipacion.choices, verbose_name="Participación")

    class Meta:
        verbose_name = "Participante de Memoria"
        verbose_name_plural = "Participantes de Memorias"

    def __str__(self):
        return f"{self.usuario} ({self.tipo_participacion}) en {self.memoria.codigo}"

class DetallePresupuestoMemoria(TimeStampedModel):
    class EstadoGasto(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente de Gasto'
        EJECUTADO = 'EJECUTADO', 'Gasto Realizado / Ejecutado'
        NO_EJECUTADO = 'NO_EJECUTADO', 'No Ejecutado / Cancelado'

    memoria = models.ForeignKey(MemoriaCalculo, on_delete=models.CASCADE, related_name='detalles', verbose_name="Memoria")
    partida = models.ForeignKey(Partida, on_delete=models.CASCADE, related_name='detalles_memoria', verbose_name="Partida")
    descripcion = models.CharField(max_length=255, verbose_name="Descripción")
    unidad_medida = models.CharField(max_length=50, verbose_name="Unidad de Medida")
    cantidad = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Cantidad")
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Precio Unitario")
    estado_ejecucion = models.CharField(max_length=20, choices=EstadoGasto.choices, default=EstadoGasto.PENDIENTE, verbose_name="Estado Gasto")

    class Meta:
        verbose_name = "Detalle de Presupuesto en Memoria"
        verbose_name_plural = "Detalles de Presupuesto en Memorias"

    @property
    def precio_total(self):
        return (self.cantidad or Decimal('0.00')) * (self.precio_unitario or Decimal('0.00'))

    def __str__(self):
        return f"{self.descripcion} ({self.cantidad} {self.unidad_medida})"

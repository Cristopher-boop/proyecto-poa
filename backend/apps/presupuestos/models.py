from django.db import models
from decimal import Decimal
from apps.core.models import TimeStampedModel
from apps.organizacional.models import Area

class Gestion(TimeStampedModel):
    class EstadoGestion(models.TextChoices):
        FORMULACION = 'FORMULACION', 'En Formulación'
        CERRADO_FORMULACION = 'CERRADO_FORMULACION', 'Formulación Cerrada'
        EN_EJECUCION = 'EN_EJECUCION', 'En Ejecución'
        FINALIZADO = 'FINALIZADO', 'Finalizado'

    anio = models.PositiveIntegerField(unique=True, verbose_name="Año de Gestión")
    estado = models.CharField(max_length=25, choices=EstadoGestion.choices, default=EstadoGestion.FORMULACION, verbose_name="Estado")
    fecha_cierre = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Cierre de Formulación")

    class Meta:
        verbose_name = "Gestión"
        verbose_name_plural = "Gestiones"

    def __str__(self):
        return f"Gestión {self.anio} ({self.get_estado_display()})"

class Partida(TimeStampedModel):
    class ClasePartida(models.TextChoices):
        INGRESO = 'INGRESO', 'Ingreso'
        EGRESO = 'EGRESO', 'Egreso'

    codigo = models.CharField(max_length=20, verbose_name="Código")
    nombre = models.CharField(max_length=200, verbose_name="Nombre")
    clase = models.CharField(max_length=25, choices=ClasePartida.choices, default=ClasePartida.EGRESO, verbose_name="Clase")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    estado = models.BooleanField(default=True, verbose_name="Activa")
    
    class Meta:
        verbose_name = "Partida Presupuestaria"
        verbose_name_plural = "Partidas Presupuestarias"
        unique_together = ('codigo', 'clase')

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.get_clase_display()})"

class PresupuestoArea(TimeStampedModel):
    class EstadoPresupuesto(models.TextChoices):
        ABIERTO = 'ABIERTO', 'Abierto'
        CERRADO = 'CERRADO', 'Cerrado'

    gestion = models.ForeignKey(Gestion, on_delete=models.CASCADE, related_name='presupuestos_area', verbose_name="Gestión")
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='presupuestos', verbose_name="Área")
    monto_inicial = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), verbose_name="Monto Inicial")
    monto_actual = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), verbose_name="Monto Actual (Disponible)")
    estado = models.CharField(max_length=20, choices=EstadoPresupuesto.choices, default=EstadoPresupuesto.ABIERTO, verbose_name="Estado")

    class Meta:
        verbose_name = "Presupuesto de Área"
        verbose_name_plural = "Presupuestos de Áreas"
        unique_together = ('gestion', 'area')

    def __str__(self):
        return f"Presupuesto {self.gestion.anio} - {self.area.nombre}"

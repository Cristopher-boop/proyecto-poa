from django.db import models
from decimal import Decimal
from apps.core.models import TimeStampedModel
from apps.organizacional.models import Area

class Gestion(TimeStampedModel):
    class EstadoGestion(models.TextChoices):
        FORMULACION = 'FORMULACION', 'En Formulación'
        VIGENTE = 'VIGENTE', 'Vigente'
        CERRADA = 'CERRADA', 'Cerrada'

    anio = models.PositiveIntegerField(unique=True, verbose_name="Año de Gestión")
    estado = models.CharField(max_length=20, choices=EstadoGestion.choices, default=EstadoGestion.FORMULACION, verbose_name="Estado")
    fecha_aprobacion_ministerio = models.DateField(null=True, blank=True, verbose_name="Fecha Aprobación Ministerial")

    class Meta:
        verbose_name = "Gestión"
        verbose_name_plural = "Gestiones"

    def __str__(self):
        return f"Gestión {self.anio} ({self.get_estado_display()})"

class Partida(TimeStampedModel):
    class ClasePartida(models.TextChoices):
        GASTO_CORRIENTE = 'GASTO_CORRIENTE', 'Gasto Corriente'
        GASTO_CAPITAL = 'GASTO_CAPITAL', 'Gasto de Capital / Inversión'

    codigo = models.CharField(max_length=20, verbose_name="Código")
    nombre = models.CharField(max_length=200, verbose_name="Nombre")
    clase = models.CharField(max_length=25, choices=ClasePartida.choices, default=ClasePartida.GASTO_CORRIENTE, verbose_name="Clase")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    estado = models.BooleanField(default=True, verbose_name="Activa")

    class Meta:
        verbose_name = "Partida Presupuestaria"
        verbose_name_plural = "Partidas Presupuestarias"
        unique_together = ('codigo', 'clase')

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.get_clase_display()})"

class PresupuestoArea(TimeStampedModel):
    gestion = models.ForeignKey(Gestion, on_delete=models.CASCADE, related_name='presupuestos_area', verbose_name="Gestión")
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='presupuestos', verbose_name="Área")
    techo_asignado = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), verbose_name="Techo Asignado")
    sobrante_gestion_anterior = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), verbose_name="Sobrante Gestión Anterior")

    class Meta:
        verbose_name = "Presupuesto de Área"
        verbose_name_plural = "Presupuestos de Áreas"
        unique_together = ('gestion', 'area')

    def __str__(self):
        return f"Presupuesto {self.gestion.anio} - {self.area.nombre}"

class AsignacionPartida(TimeStampedModel):
    presupuesto_area = models.ForeignKey(PresupuestoArea, on_delete=models.CASCADE, related_name='asignaciones_partida', verbose_name="Presupuesto Área")
    partida = models.ForeignKey(Partida, on_delete=models.CASCADE, related_name='asignaciones', verbose_name="Partida")
    monto_inicial = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), verbose_name="Monto Inicial")
    monto_modificaciones = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), verbose_name="Modificaciones (+/-)")
    monto_vigente = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), verbose_name="Monto Vigente")
    monto_comprometido = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), verbose_name="Monto Comprometido")
    monto_disponible = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), verbose_name="Monto Disponible")

    class Meta:
        verbose_name = "Asignación de Partida"
        verbose_name_plural = "Asignaciones de Partidas"
        unique_together = ('presupuesto_area', 'partida')

    def save(self, *args, **kwargs):
        self.monto_vigente = self.monto_inicial + self.monto_modificaciones
        self.monto_disponible = self.monto_vigente - self.monto_comprometido
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.partida.codigo} ({self.presupuesto_area.area.nombre}) - Saldo: {self.monto_disponible}"

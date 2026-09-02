from django.db import models
from decimal import Decimal
from apps.core.models import TimeStampedModel
from apps.memorias.models import MemoriaCalculo
from apps.usuarios.models import Usuario
from apps.presupuestos.models import Gestion, Partida
from apps.organizacional.models import Area
from apps.planificacion.models import Operacion


class Gasto(TimeStampedModel):
    monto_ejecutado = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto Ejecutado")
    fecha_gasto = models.DateField(verbose_name="Fecha del Gasto")
    comprobante_num = models.CharField(max_length=100, blank=True, null=True, verbose_name="N° de Comprobante")
    observacion = models.TextField(blank=True, null=True, verbose_name="Observación")
    memoria = models.ForeignKey(MemoriaCalculo, on_delete=models.CASCADE, related_name='gastos', verbose_name="Memoria de Cálculo")
    usuario_registro = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='gastos_registrados', verbose_name="Registrado por")

    class Meta:
        verbose_name = "Gasto Ejecutado"
        verbose_name_plural = "Gastos Ejecutados"
        db_table = 'ejecucion_gasto'

    def __str__(self):
        return f"Gasto {self.monto_ejecutado} - {self.memoria.codigo} ({self.fecha_gasto})"


class CertificacionPOA(TimeStampedModel):
    class EstadoCertificacion(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador (Gerencia)'
        PENDIENTE_PLANIFICACION = 'PENDIENTE_PLANIFICACION', 'Enviado a Planificación'
        APROBADO = 'APROBADO', 'Aprobado por Planificación'
        OBSERVADO = 'OBSERVADO', 'Observado / Devuelto'
        ANULADO = 'ANULADO', 'Anulado'

    codigo_certificacion = models.CharField(max_length=100, verbose_name="Nº Certificación POA")
    numero_oficio_solicitud = models.CharField(max_length=100, verbose_name="Nº Oficio de Solicitud")
    gestion = models.ForeignKey(Gestion, on_delete=models.CASCADE, related_name='certificaciones_poa', verbose_name="Gestión")
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='certificaciones_poa', verbose_name="Unidad Solicitante / Área")
    fecha = models.DateField(verbose_name="Fecha de Emisión")
    version = models.CharField(max_length=50, default="Versión 1: 2026", verbose_name="Versión")
    
    # Soporte para una, dos o más operaciones asociadas
    operaciones = models.ManyToManyField(Operacion, blank=True, related_name='certificaciones_poa', verbose_name="Operaciones POA Asociadas")
    
    # Vínculos presupuestarios opcionales
    memoria = models.ForeignKey(MemoriaCalculo, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificaciones_poa', verbose_name="Memoria de Cálculo")
    partida = models.ForeignKey(Partida, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificaciones_poa', verbose_name="Partida Presupuestaria")
    partida_literal = models.CharField(max_length=255, blank=True, null=True, verbose_name="Partida Presupuestaria (Texto)")
    
    monto_solicitado = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'), verbose_name="Monto Solicitado")
    concepto_gasto = models.TextField(blank=True, null=True, verbose_name="Concepto / Objeto del Gasto")
    
    notas = models.TextField(
        blank=True,
        default="Notas: El presente documento da a conocer únicamente que la solicitud en mención se encuentra programada en alineación a la Acción de Mediano Plazo (PEE) y la Acción de Corto Plazo (POA) registrados en el Plan Operativo Anual. Los aspectos presupuestarios y de contratación corresponden al área solicitante y se encuentran en el marco de las atribuciones y competencias de la Gerencia de Asuntos Administrativos EPTAM y sus instancias correspondientes según el D.S. Nº 0181 y normativa vigente relacionada.",
        verbose_name="Notas Legales / Aclaratorias"
    )
    
    # Firmas
    solicitante_nombre = models.CharField(max_length=150, blank=True, default="", verbose_name="Solicitado por (Nombre)")
    solicitante_cargo = models.CharField(max_length=150, blank=True, default="", verbose_name="Solicitado por (Cargo)")
    elaborador_nombre = models.CharField(max_length=150, blank=True, default="", verbose_name="Elaborado por (Nombre)")
    elaborador_cargo = models.CharField(max_length=150, blank=True, default="", verbose_name="Elaborado por (Cargo)")
    
    observacion_planificacion = models.TextField(blank=True, null=True, verbose_name="Observación de Planificación")
    estado = models.CharField(max_length=30, choices=EstadoCertificacion.choices, default=EstadoCertificacion.BORRADOR, verbose_name="Estado")
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificaciones_creadas', verbose_name="Creado por")

    class Meta:
        verbose_name = "Certificación POA"
        verbose_name_plural = "Certificaciones POA"
        ordering = ['-fecha', '-created_at']

    def __str__(self):
        return f"{self.codigo_certificacion} - {self.area.nombre} ({self.fecha})"


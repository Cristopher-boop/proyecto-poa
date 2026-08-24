from django.db import models
from apps.core.models import TimeStampedModel
from apps.organizacional.models import Programa, Area
from apps.presupuestos.models import Gestion

class AccionMedianoPlazo(TimeStampedModel):
    """PEI: Objetivos Estratégicos Institucionales a Mediano Plazo (Quinquenal / 5 años) a nivel de Programa"""
    programa = models.ForeignKey(
        Programa,
        on_delete=models.CASCADE,
        related_name='acciones_mediano_plazo',
        verbose_name="Programa"
    )
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código AMP")
    descripcion = models.TextField(verbose_name="Descripción / Objetivo Estratégico PEI")
    periodo_inicio = models.PositiveIntegerField(default=2026, verbose_name="Año Inicio Quinquenio")
    periodo_fin = models.PositiveIntegerField(default=2030, verbose_name="Año Fin Quinquenio")
    estado = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Acción a Mediano Plazo (PEI)"
        verbose_name_plural = "Acciones a Mediano Plazo (PEI)"
        ordering = ['codigo']

    def __str__(self):
        return f"[{self.programa.codigo}] {self.codigo} - {self.descripcion[:50]}"


class AccionCortoPlazo(TimeStampedModel):
    """POA: Objetivos de Gestión Específicos a Corto Plazo (Anual / 1 año) a nivel de Programa"""
    accion_mediano_plazo = models.ForeignKey(
        AccionMedianoPlazo,
        on_delete=models.CASCADE,
        related_name='acciones_corto_plazo',
        verbose_name="Acción a Mediano Plazo (PEI)"
    )
    gestion = models.ForeignKey(
        Gestion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acciones_corto_plazo',
        verbose_name="Gestión POA"
    )
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código ACP")
    descripcion = models.TextField(verbose_name="Descripción / Objetivo de Gestión POA")
    estado = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Acción a Corto Plazo (POA)"
        verbose_name_plural = "Acciones a Corto Plazo (POA)"
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo} - {self.descripcion[:50]}"


class Operacion(TimeStampedModel):
    """Operaciones Específicas por Área / Gerencia / Unidad precargadas en la BD"""
    accion_corto_plazo = models.ForeignKey(
        AccionCortoPlazo,
        on_delete=models.CASCADE,
        related_name='operaciones',
        verbose_name="Acción a Corto Plazo (POA)"
    )
    area = models.ForeignKey(
        Area,
        on_delete=models.CASCADE,
        related_name='operaciones',
        verbose_name="Área / Gerencia / Unidad"
    )
    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código Operación")
    descripcion = models.TextField(verbose_name="Descripción de la Operación")
    es_contratacion = models.BooleanField(default=True, verbose_name="Aplica para Contrataciones/Compras")
    estado = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Operación"
        verbose_name_plural = "Operaciones"
        ordering = ['codigo']

    def __str__(self):
        return f"[{self.area.codigo}] {self.codigo} - {self.descripcion[:50]}"


class Tarea(TimeStampedModel):
    """Tareas detalladas (Desglose operativo para correlación con TAMEP)"""
    operacion = models.ForeignKey(
        Operacion,
        on_delete=models.CASCADE,
        related_name='tareas',
        verbose_name="Operación"
    )
    codigo = models.CharField(max_length=30, verbose_name="Código Tarea")
    descripcion = models.TextField(verbose_name="Descripción de Tarea / Detalle TAMEP")
    estado = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Tarea"
        verbose_name_plural = "Tareas"
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo} - {self.descripcion[:50]}"

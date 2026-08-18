from django.db import models
from apps.core.models import TimeStampedModel

class Programa(TimeStampedModel):
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código del Programa")
    nombre = models.CharField(max_length=200, verbose_name="Nombre del Programa")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    estado = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Programa"
        verbose_name_plural = "Programas"
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Area(TimeStampedModel):
    class TipoArea(models.TextChoices):
        GERENCIA = 'GERENCIA', 'Gerencia'
        UNIDAD = 'UNIDAD', 'Unidad'

    programa = models.ForeignKey(
        Programa, 
        on_delete=models.CASCADE, 
        related_name='areas', 
        verbose_name="Programa"
    )
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código del Área")
    nombre = models.CharField(max_length=150, verbose_name="Nombre del Área")
    tipo = models.CharField(
        max_length=15, 
        choices=TipoArea.choices, 
        default=TipoArea.GERENCIA, 
        verbose_name="Tipo de Área"
    )
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    estado = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Área / Gerencia / Unidad"
        verbose_name_plural = "Áreas / Gerencias / Unidades"
        ordering = ['codigo']

    def __str__(self):
        return f"[{self.tipo}] {self.nombre} ({self.codigo})"


class Seccion(TimeStampedModel):
    area = models.ForeignKey(
        Area, 
        on_delete=models.CASCADE, 
        related_name='secciones', 
        verbose_name="Área"
    )
    nombre = models.CharField(max_length=150, verbose_name="Nombre de la Sección")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    estado = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Sección"
        verbose_name_plural = "Secciones"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.area.nombre})"


class Rol(TimeStampedModel):
    nombre = models.CharField(max_length=100, verbose_name="Nombre del Rol")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre
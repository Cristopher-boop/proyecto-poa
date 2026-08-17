from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.organizacional.models import Seccion

class Rol(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Rol")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.nombre

class Usuario(AbstractUser):
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios', verbose_name="Rol")
    seccion = models.ForeignKey(Seccion, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios', verbose_name="Sección")
    cargo = models.CharField(max_length=150, blank=True, null=True, verbose_name="Cargo")
    estado = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.cargo or 'Sin cargo'})"

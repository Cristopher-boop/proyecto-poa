from django.db import models
from decimal import Decimal
from apps.core.models import TimeStampedModel
from apps.presupuestos.models import Gestion, Partida
from apps.organizacional.models import Seccion
from apps.usuarios.models import Usuario

class MemoriaCalculo(TimeStampedModel):
    class EstadoMemoria(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        PENDIENTE_GERENCIA = 'PENDIENTE_GERENCIA', 'Pendiente de Gerencia'
        APROBADO_GERENCIA = 'APROBADO_GERENCIA', 'Aprobado por Gerencia'
        APROBADO_FINANZAS = 'APROBADO_FINANZAS', 'Aprobado por Finanzas'
        RECHAZADO = 'RECHAZADO', 'Rechazado'

    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código")
    gestion = models.ForeignKey(Gestion, on_delete=models.CASCADE, related_name='memorias_calculo', verbose_name="Gestión")
    seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='memorias_calculo', verbose_name="Sección")
    justificacion = models.TextField(verbose_name="Justificación")
    estado = models.CharField(max_length=20, choices=EstadoMemoria.choices, default=EstadoMemoria.BORRADOR, verbose_name="Estado")
    fecha_aprobacion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha Aprobación")

    class Meta:
        verbose_name = "Memoria de Cálculo"
        verbose_name_plural = "Memorias de Cálculo"

    def obtener_saldo_calculado(self):
        from apps.ejecucion.models import Gasto
        from django.db.models import Sum

        detalles = self.detalles.all()
        monto_asignado = sum(
            ((d.cantidad or Decimal('0.00')) * (d.precio_unitario or Decimal('0.00')))
            for d in detalles
        )

        monto_ejecutado = Gasto.objects.filter(
            detalle_memoria__memoria=self
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

        monto_entrante = self.traspasos_entrada.filter(
            estado='APROBADO'
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

        monto_saliente = self.traspasos_salida.filter(
            estado='APROBADO'
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

        disponible = (monto_asignado + monto_entrante) - monto_saliente - monto_ejecutado

        return {
            'monto_asignado': str(monto_asignado),
            'monto_ejecutado': str(monto_ejecutado),
            'monto_entrante': str(monto_entrante),
            'monto_saliente': str(monto_saliente),
            'disponible': str(disponible)
        }

    def __str__(self):
        return f"{self.codigo} [{self.get_estado_display()}]"


class TraspasoPresupuestario(TimeStampedModel):
    class EstadoTraspaso(models.TextChoices):
        APROBADO = 'APROBADO', 'Aprobado'

    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto")
    motivo = models.TextField(verbose_name="Motivo")
    estado = models.CharField(
        max_length=20,
        choices=EstadoTraspaso.choices,
        default=EstadoTraspaso.APROBADO,
        verbose_name="Estado"
    )
    memoria_origen = models.ForeignKey(
        MemoriaCalculo,
        on_delete=models.CASCADE,
        related_name='traspasos_salida',
        verbose_name="Memoria Origen"
    )
    memoria_destino = models.ForeignKey(
        MemoriaCalculo,
        on_delete=models.CASCADE,
        related_name='traspasos_entrada',
        verbose_name="Memoria Destino"
    )
    usuario_registro = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='traspasos_registrados',
        verbose_name="Usuario Registro"
    )

    class Meta:
        verbose_name = "Traspaso Presupuestario"
        verbose_name_plural = "Traspasos Presupuestarios"

    def __str__(self):
        return f"Traspaso Bs. {self.monto} ({self.memoria_origen.codigo} -> {self.memoria_destino.codigo})"


class RegistroMemoriaUsuario(TimeStampedModel):
    class TipoParticipacion(models.TextChoices):
        ELABORADOR = 'ELABORADOR', 'Elaborador de la Memoria'
        REVISOR = 'REVISOR', 'Revisor'
        APROBADOR = 'APROBADOR', 'Aprobador'

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
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EJECUTADO_PARCIAL = 'EJECUTADO_PARCIAL', 'Ejecutado Parcialmente'
        COMPLETADO = 'COMPLETADO', 'Completado'

    memoria = models.ForeignKey(MemoriaCalculo, on_delete=models.CASCADE, related_name='detalles', verbose_name="Memoria")
    partida = models.ForeignKey(Partida, on_delete=models.CASCADE, related_name='detalles_memoria', verbose_name="Partida")
    descripcion = models.TextField(verbose_name="Descripción")
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

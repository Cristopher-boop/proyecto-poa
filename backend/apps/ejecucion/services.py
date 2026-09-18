from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import ValidationError

from .models import Gasto
from apps.memorias.models import MemoriaCalculo
from apps.memorias.utils import recalcular_saldos_memoria
from apps.presupuestos.models import PresupuestoArea, Gestion


def recalcular_estado_memoria_y_presupuesto(memoria):
    """
    Actualiza:
    1. Los saldos almacenados en MemoriaCalculo (presupuestado, ejecutado, traspasos, saldo disponible).
    2. El monto_actual del PresupuestoArea correspondiente.
    """
    area = memoria.seccion.area
    gestion = memoria.gestion

    # 1. Actualizar saldos almacenados de la memoria
    recalcular_saldos_memoria(memoria)

    # 2. Actualizar PresupuestoArea: Monto_Actual = Monto_Inicial - Gastos_Ejecutados
    presupuesto = PresupuestoArea.objects.filter(gestion=gestion, area=area).first()
    if presupuesto:
        total_gastos_area = Gasto.objects.filter(
            memoria__gestion=gestion,
            memoria__seccion__area=area
        ).aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

        presupuesto.monto_actual = max(Decimal('0.00'), presupuesto.monto_inicial - total_gastos_area)
        presupuesto.save(update_fields=['monto_actual'])


class GastoService:
    @staticmethod
    @transaction.atomic
    def registrar_gasto(data, usuario):
        memoria = data.get('memoria')
        if not memoria:
            raise ValidationError({'memoria': 'Debe especificar una memoria de cálculo válida.'})

        # Bloqueo select_for_update para evitar condiciones de carrera concurrentes
        memoria = MemoriaCalculo.objects.select_for_update().get(id=memoria.id)

        # 1. Validar estado de la gestión
        if memoria.gestion.estado == Gestion.EstadoGestion.FINALIZADO:
            raise ValidationError({'non_field_errors': [f'No se pueden registrar gastos en la Gestión {memoria.gestion.anio} porque está finalizada/cerrada.']})

        # 2. Validar que la memoria esté aprobada formalmente
        if memoria.estado != MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS:
            raise ValidationError({'memoria': [f'Solo se pueden ejecutar gastos sobre memorias con Aprobación Presupuestaria Final (APROBADO_FINANZAS). Estado actual: {memoria.get_estado_display()}.']})

        # 3. Validar monto contra saldo disponible real (contemplando traspasos)
        monto = Decimal(str(data.get('monto_ejecutado', 0)))
        if monto <= Decimal('0.00'):
            raise ValidationError({'monto_ejecutado': ['El monto ejecutado debe ser mayor a Bs. 0,00.']})

        if monto > memoria.saldo_disponible:
            raise ValidationError({'monto_ejecutado': [f'Saldo insuficiente. El monto solicitado (Bs. {monto:,.2f}) supera el saldo disponible actual de la memoria (Bs. {memoria.saldo_disponible:,.2f}).']})

        # 4. Crear gasto y recalcular
        gasto = Gasto.objects.create(
            monto_ejecutado=monto,
            fecha_gasto=data.get('fecha_gasto'),
            comprobante_num=data.get('comprobante_num'),
            observacion=data.get('observacion'),
            memoria=memoria,
            usuario_registro=usuario
        )

        recalcular_estado_memoria_y_presupuesto(memoria)
        return gasto

    @staticmethod
    @transaction.atomic
    def actualizar_gasto(gasto, data):
        nuevo_monto = Decimal(str(data.get('monto_ejecutado', gasto.monto_ejecutado)))
        memoria = data.get('memoria', gasto.memoria)
        memoria = MemoriaCalculo.objects.select_for_update().get(id=memoria.id)

        # Saldo disponible sumando el monto previo de este mismo gasto
        monto_anterior = gasto.monto_ejecutado if gasto.memoria_id == memoria.id else Decimal('0.00')
        saldo_maximo = memoria.saldo_disponible + monto_anterior

        if nuevo_monto <= Decimal('0.00'):
            raise ValidationError({'monto_ejecutado': ['El monto ejecutado debe ser mayor a Bs. 0,00.']})

        if nuevo_monto > saldo_maximo:
            raise ValidationError({'monto_ejecutado': [f'Saldo insuficiente. El monto (Bs. {nuevo_monto:,.2f}) excede el disponible restante (Bs. {saldo_maximo:,.2f}).']})

        for key, value in data.items():
            setattr(gasto, key, value)
        gasto.save()

        recalcular_estado_memoria_y_presupuesto(memoria)
        if gasto.memoria_id != memoria.id:
            recalcular_estado_memoria_y_presupuesto(gasto.memoria)

        return gasto

    @staticmethod
    @transaction.atomic
    def eliminar_gasto(gasto):
        memoria = gasto.memoria
        gasto.delete()
        recalcular_estado_memoria_y_presupuesto(memoria)

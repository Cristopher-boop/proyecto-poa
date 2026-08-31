from decimal import Decimal
from django.db.models import Sum

def recalcular_saldos_memoria(memoria):
    """
    Recalcula y persiste los campos almacenados de saldo en MemoriaCalculo
    y en cada uno de sus DetallePresupuestoMemoria.
    Debe llamarse dentro de transaction.atomic().
    """
    from apps.ejecucion.models import Gasto

    detalles = memoria.detalles.all()

    # 1. Recalcular presupuestado
    total_presupuestado_memoria = Decimal('0.0000')

    for d in detalles:
        total_item = d.total_programado or (
            (d.cantidad or Decimal('0.00'))
            * (d.precio_unitario or Decimal('0.00'))
            * (d.factor_calculo or Decimal('1.0000'))
        )
        # Los detalles ya no trackean gastos, solo la memoria
        d.total_ejecutado = Decimal('0.0000')
        d.saldo_disponible = Decimal('0.0000') # o se puede omitir actualizar
        d.save(update_fields=['total_ejecutado', 'saldo_disponible'])

        total_presupuestado_memoria += total_item

    # 2. Total ejecutado
    total_ejecutado_memoria = memoria.gastos.aggregate(total=Sum('monto_ejecutado'))['total'] or Decimal('0.00')

    # 3. Monto entrante = SUM(monto) de traspasos de entrada aprobados
    monto_entrante = memoria.traspasos_entrada.filter(
        estado='APROBADO'
    ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

    # 4. Monto saliente = SUM(monto) de traspasos de salida aprobados
    monto_saliente = memoria.traspasos_salida.filter(
        estado='APROBADO'
    ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

    # 5. Saldo disponible global de la memoria
    saldo_disponible_memoria = (total_presupuestado_memoria + monto_entrante) - monto_saliente - total_ejecutado_memoria

    # 6. Persistir en la MemoriaCalculo
    memoria.total_presupuestado = total_presupuestado_memoria
    memoria.total_ejecutado = total_ejecutado_memoria
    memoria.monto_entrante = monto_entrante
    memoria.monto_saliente = monto_saliente
    memoria.saldo_disponible = saldo_disponible_memoria
    memoria.save(update_fields=[
        'total_presupuestado',
        'total_ejecutado',
        'monto_entrante',
        'monto_saliente',
        'saldo_disponible',
    ])

    return {
        'total_presupuestado': str(total_presupuestado_memoria),
        'total_ejecutado': str(total_ejecutado_memoria),
        'monto_entrante': str(monto_entrante),
        'monto_saliente': str(monto_saliente),
        'saldo_disponible': str(saldo_disponible_memoria),
    }

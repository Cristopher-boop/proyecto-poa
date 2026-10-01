from django.test import TestCase
from decimal import Decimal
from apps.organizacional.models import Programa, Area, Seccion
from apps.presupuestos.models import Gestion, Partida
from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria, TraspasoPresupuestario
from apps.usuarios.models import Usuario

class MemoriasModelTests(TestCase):
    def setUp(self):
        self.programa = Programa.objects.create(
            codigo='PROG-03',
            nombre='Programa de Operaciones',
            estado=True
        )
        self.area = Area.objects.create(
            programa=self.programa,
            codigo='GC',
            nombre='Gerencia Comercial',
            tipo=Area.TipoArea.GERENCIA,
            estado=True
        )
        self.seccion = Seccion.objects.create(
            area=self.area,
            nombre='Ventas y Marketing',
            estado=True
        )
        self.gestion = Gestion.objects.create(
            anio=2026,
            estado=Gestion.EstadoGestion.FORMULACION
        )
        self.partida = Partida.objects.create(
            codigo='31110',
            nombre='Gastos de Oficina y Papelería',
            clase=Partida.ClasePartida.EGRESO,
            estado=True
        )
        self.memoria1 = MemoriaCalculo.objects.create(
            codigo='MC-GC-001',
            gestion=self.gestion,
            seccion=self.seccion,
            justificacion='Requerimientos anuales de papelería',
            estado=MemoriaCalculo.EstadoMemoria.BORRADOR,
            total_presupuestado=Decimal('5000.00'),
            saldo_disponible=Decimal('5000.00')
        )
        self.memoria2 = MemoriaCalculo.objects.create(
            codigo='MC-GC-002',
            gestion=self.gestion,
            seccion=self.seccion,
            justificacion='Servicios de publicidad y difusión',
            estado=MemoriaCalculo.EstadoMemoria.BORRADOR,
            total_presupuestado=Decimal('3000.00'),
            saldo_disponible=Decimal('3000.00')
        )

    def test_memoria_creation(self):
        self.assertEqual(self.memoria1.codigo, 'MC-GC-001')
        self.assertEqual(self.memoria1.estado, MemoriaCalculo.EstadoMemoria.BORRADOR)
        self.assertEqual(self.memoria1.saldo_disponible, Decimal('5000.00'))

    def test_detalle_presupuesto_calculation(self):
        detalle = DetallePresupuestoMemoria.objects.create(
            memoria=self.memoria1,
            partida=self.partida,
            descripcion='Hojas bond tamaño carta',
            unidad_medida='Paquete',
            cantidad=Decimal('10.00'),
            precio_unitario=Decimal('35.00'),
            factor_calculo=Decimal('1.0000')
        )
        # cantidad * precio_unitario = 10 * 35 = 350
        self.assertEqual(detalle.precio_total, Decimal('350.00'))

    def test_traspaso_presupuestario(self):
        traspaso = TraspasoPresupuestario.objects.create(
            memoria_origen=self.memoria1,
            memoria_destino=self.memoria2,
            monto=Decimal('1000.00'),
            motivo='Reasignación para campaña urgente'
        )
        self.assertEqual(traspaso.monto, Decimal('1000.00'))
        self.assertIn('MC-GC-001', str(traspaso))
        self.assertIn('MC-GC-002', str(traspaso))

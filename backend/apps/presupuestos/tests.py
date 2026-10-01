from django.test import TestCase
from decimal import Decimal
from django.db import IntegrityError
from apps.presupuestos.models import Gestion, Partida, PresupuestoArea
from apps.organizacional.models import Programa, Area

class PresupuestosModelTests(TestCase):
    def setUp(self):
        self.programa = Programa.objects.create(
            codigo='PROG-02',
            nombre='Gestión Operativa',
            estado=True
        )
        self.area = Area.objects.create(
            programa=self.programa,
            codigo='GO',
            nombre='Gerencia de Operaciones',
            tipo=Area.TipoArea.GERENCIA,
            estado=True
        )
        self.gestion = Gestion.objects.create(
            anio=2026,
            estado=Gestion.EstadoGestion.FORMULACION
        )
        self.partida = Partida.objects.create(
            codigo='25200',
            nombre='Estudios e Investigaciones',
            clase=Partida.ClasePartida.EGRESO,
            estado=True
        )

    def test_gestion_lifecycle(self):
        self.assertEqual(self.gestion.anio, 2026)
        self.assertEqual(self.gestion.estado, Gestion.EstadoGestion.FORMULACION)

        # Transition to CERRADO_FORMULACION
        self.gestion.estado = Gestion.EstadoGestion.CERRADO_FORMULACION
        self.gestion.save()
        self.assertEqual(self.gestion.estado, Gestion.EstadoGestion.CERRADO_FORMULACION)

        # Transition to EN_EJECUCION
        self.gestion.estado = Gestion.EstadoGestion.EN_EJECUCION
        self.gestion.save()
        self.assertEqual(self.gestion.estado, Gestion.EstadoGestion.EN_EJECUCION)

    def test_partida_creation_and_uniqueness(self):
        self.assertEqual(self.partida.codigo, '25200')
        self.assertEqual(self.partida.clase, Partida.ClasePartida.EGRESO)

        # Duplicate codigo + clase should raise IntegrityError
        with self.assertRaises(IntegrityError):
            Partida.objects.create(
                codigo='25200',
                nombre='Otra Partida Duplicada',
                clase=Partida.ClasePartida.EGRESO
            )

    def test_presupuesto_area(self):
        pa = PresupuestoArea.objects.create(
            gestion=self.gestion,
            area=self.area,
            monto_inicial=Decimal('100000.00'),
            monto_actual=Decimal('100000.00')
        )
        self.assertEqual(pa.monto_inicial, Decimal('100000.00'))
        self.assertEqual(pa.monto_actual, Decimal('100000.00'))
        self.assertIn('2026', str(pa))

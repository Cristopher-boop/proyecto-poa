from django.test import TestCase
from decimal import Decimal
from datetime import date
from apps.organizacional.models import Programa, Area, Seccion
from apps.presupuestos.models import Gestion, Partida
from apps.memorias.models import MemoriaCalculo
from apps.ejecucion.models import Gasto, CertificacionPOA
from apps.usuarios.models import Usuario

class EjecucionModelTests(TestCase):
    def setUp(self):
        self.user = Usuario.objects.create(
            username='operador1',
            email='operador@empresa.com',
            first_name='Juan',
            last_name='Perez'
        )
        self.programa = Programa.objects.create(
            codigo='PROG-04',
            nombre='Infraestructura y Mantenimiento',
            estado=True
        )
        self.area = Area.objects.create(
            programa=self.programa,
            codigo='GI',
            nombre='Gerencia de Infraestructura',
            tipo=Area.TipoArea.GERENCIA,
            estado=True
        )
        self.seccion = Seccion.objects.create(
            area=self.area,
            nombre='Obras Civiles',
            estado=True
        )
        self.gestion = Gestion.objects.create(
            anio=2026,
            estado=Gestion.EstadoGestion.EN_EJECUCION
        )
        self.partida = Partida.objects.create(
            codigo='24110',
            nombre='Mantenimiento y Reparación de Inmuebles',
            clase=Partida.ClasePartida.EGRESO,
            estado=True
        )
        self.memoria = MemoriaCalculo.objects.create(
            codigo='MC-GI-001',
            gestion=self.gestion,
            seccion=self.seccion,
            justificacion='Mantenimiento correctivo techos',
            estado=MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
            total_presupuestado=Decimal('25000.00'),
            saldo_disponible=Decimal('25000.00')
        )

    def test_gasto_creation(self):
        gasto = Gasto.objects.create(
            memoria=self.memoria,
            monto_ejecutado=Decimal('3500.00'),
            fecha_gasto=date(2026, 3, 15),
            comprobante_num='CMP-001-2026',
            observacion='Adquisición de pintura y sellador',
            usuario_registro=self.user
        )
        self.assertEqual(gasto.monto_ejecutado, Decimal('3500.00'))
        self.assertEqual(gasto.comprobante_num, 'CMP-001-2026')
        self.assertIn('3500.00', str(gasto))
        self.assertIn('MC-GI-001', str(gasto))

    def test_certificacion_poa_creation(self):
        cert = CertificacionPOA.objects.create(
            codigo_certificacion='POA-GI-2026-001',
            numero_oficio_solicitud='OF-GI-101/2026',
            gestion=self.gestion,
            area=self.area,
            fecha=date(2026, 4, 1),
            monto_solicitado=Decimal('12000.00'),
            concepto_gasto='Contratación de servicio de impermeabilización',
            estado=CertificacionPOA.EstadoCertificacion.BORRADOR,
            creado_por=self.user
        )
        self.assertEqual(cert.codigo_certificacion, 'POA-GI-2026-001')
        self.assertEqual(cert.monto_solicitado, Decimal('12000.00'))
        self.assertIn('POA-GI-2026-001', str(cert))

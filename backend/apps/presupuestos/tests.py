from django.test import TestCase
from decimal import Decimal
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

from apps.presupuestos.models import Gestion, Partida, PresupuestoArea
from apps.presupuestos.serializers import PresupuestoAreaSerializer
from apps.organizacional.models import Programa, Area, Seccion
from apps.usuarios.models import Usuario, Rol
from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria
from apps.ejecucion.models import Gasto

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


class PresupuestosApiAndPermissionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.programa = Programa.objects.create(
            codigo='PROG-01',
            nombre='Administración',
            estado=True
        )
        self.area_go = Area.objects.create(
            programa=self.programa,
            codigo='GO',
            nombre='Gerencia de Operaciones',
            tipo=Area.TipoArea.GERENCIA,
            estado=True
        )
        self.area_gc = Area.objects.create(
            programa=self.programa,
            codigo='GC',
            nombre='Gerencia Comercial',
            tipo=Area.TipoArea.GERENCIA,
            estado=True
        )
        self.seccion_go = Seccion.objects.create(
            area=self.area_go,
            nombre='Sección Operativa',
            estado=True
        )
        self.seccion_gc = Seccion.objects.create(
            area=self.area_gc,
            nombre='Sección Ventas',
            estado=True
        )

        self.gestion = Gestion.objects.create(
            anio=2026,
            estado=Gestion.EstadoGestion.EN_EJECUCION
        )

        self.pa_go = PresupuestoArea.objects.create(
            gestion=self.gestion,
            area=self.area_go,
            monto_inicial=Decimal('100000.00'),
            monto_actual=Decimal('80000.00')
        )
        self.pa_gc = PresupuestoArea.objects.create(
            gestion=self.gestion,
            area=self.area_gc,
            monto_inicial=Decimal('200000.00'),
            monto_actual=Decimal('150000.00')
        )

        # Memorias y gastos en GO
        self.mem_go = MemoriaCalculo.objects.create(
            codigo='MC-GO-001',
            gestion=self.gestion,
            seccion=self.seccion_go,
            justificacion='Operaciones anuales',
            estado=MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
            total_presupuestado=Decimal('50000.00')
        )
        # Roles
        self.rol_gerente = Rol.objects.create(nombre='GERENTE')
        self.rol_presupuestos = Rol.objects.create(nombre='PRESUPUESTOS')

        # Usuarios
        self.user_gerente_go = Usuario.objects.create_user(
            username='gerente_go',
            password='password123',
            rol=self.rol_gerente,
            seccion=self.seccion_go
        )
        self.user_presupuestos = Usuario.objects.create_user(
            username='lic_presupuestos',
            password='password123',
            rol=self.rol_presupuestos
        )

        Gasto.objects.create(
            usuario_registro=self.user_presupuestos,
            memoria=self.mem_go,
            monto_ejecutado=Decimal('12000.00'),
            fecha_gasto='2026-03-15',
            comprobante_num='COMP-001'
        )
        Gasto.objects.create(
            usuario_registro=self.user_presupuestos,
            memoria=self.mem_go,
            monto_ejecutado=Decimal('8000.00'),
            fecha_gasto='2026-05-20',
            comprobante_num='COMP-002'
        )



    def test_presupuesto_area_serializer_gastos_mensuales(self):
        """Verifica que PresupuestoAreaSerializer incluya desglose mensual y total ejecutado sin exponer MCs individuales"""
        context = {
            'gastos_map': {
                self.area_go.id: {
                    'total': Decimal('20000.00'),
                    'meses': {3: 12000.0, 5: 8000.0}
                }
            }
        }
        serializer = PresupuestoAreaSerializer(self.pa_go, context=context)
        data = serializer.data

        self.assertEqual(data['monto_ejecutado'], '20000.00')
        self.assertEqual(data['porcentaje_ejecucion'], 20.0)
        self.assertIn('gastos_mensuales', data)
        self.assertEqual(data['gastos_mensuales'][3], 12000.0)
        self.assertEqual(data['gastos_mensuales'][5], 8000.0)

    def test_detalle_area_permitido_para_propia_gerencia(self):
        """El gerente de GO puede consultar el desglose detallado (MCs, partidas) de su propia área"""
        self.client.force_authenticate(user=self.user_gerente_go)
        response = self.client.get(
            f'/api/v1/presupuestos/techos-area/detalle-area/?gestion={self.gestion.id}&area={self.area_go.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['area_codigo'], 'GO')

    def test_detalle_area_prohibido_para_otra_gerencia(self):
        """El gerente de GO tiene estrictamente prohibido ver el detalle de MCs y partidas de GC (otra gerencia)"""
        self.client.force_authenticate(user=self.user_gerente_go)
        response = self.client.get(
            f'/api/v1/presupuestos/techos-area/detalle-area/?gestion={self.gestion.id}&area={self.area_gc.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Acceso denegado', response.data['error'])

    def test_detalle_area_permitido_para_rol_global(self):
        """Presupuestos tiene rol global y sí puede consultar el desglose de cualquier gerencia"""
        self.client.force_authenticate(user=self.user_presupuestos)
        response = self.client.get(
            f'/api/v1/presupuestos/techos-area/detalle-area/?gestion={self.gestion.id}&area={self.area_gc.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['area_codigo'], 'GC')

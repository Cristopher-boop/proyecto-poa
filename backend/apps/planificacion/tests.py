from django.test import TestCase
from apps.organizacional.models import Programa, Area
from apps.presupuestos.models import Gestion
from apps.planificacion.models import AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea

class PlanificacionModelTests(TestCase):
    def setUp(self):
        self.programa = Programa.objects.create(
            codigo='PROG-05',
            nombre='Planificación Estratégica',
            estado=True
        )
        self.area = Area.objects.create(
            programa=self.programa,
            codigo='PL',
            nombre='Unidad de Planificación',
            tipo=Area.TipoArea.UNIDAD,
            estado=True
        )
        self.gestion = Gestion.objects.create(
            anio=2026,
            estado=Gestion.EstadoGestion.FORMULACION
        )

    def test_planificacion_chain(self):
        # 1. AMP (Quinquenal PEI)
        amp = AccionMedianoPlazo.objects.create(
            programa=self.programa,
            codigo='AMP-01',
            descripcion='Modernización integral de los procesos institucionales',
            periodo_inicio=2026,
            periodo_fin=2030,
            estado=True
        )
        self.assertEqual(amp.codigo, 'AMP-01')
        self.assertIn('AMP-01', str(amp))

        # 2. ACP (Anual POA)
        acp = AccionCortoPlazo.objects.create(
            accion_mediano_plazo=amp,
            gestion=self.gestion,
            codigo='ACP-01.01',
            descripcion='Implementar el sistema digital de gestión POA',
            estado=True
        )
        self.assertEqual(acp.codigo, 'ACP-01.01')
        self.assertEqual(acp.accion_mediano_plazo, amp)
        self.assertIn('ACP-01.01', str(acp))

        # 3. Operación
        op = Operacion.objects.create(
            accion_corto_plazo=acp,
            area=self.area,
            codigo='OP-PL-01',
            descripcion='Desarrollo y parametrización de módulos POA',
            es_contratacion=True,
            estado=True
        )
        self.assertEqual(op.codigo, 'OP-PL-01')
        self.assertEqual(op.area, self.area)
        self.assertIn('OP-PL-01', str(op))

        # 4. Tarea
        tarea = Tarea.objects.create(
            operacion=op,
            codigo='TAR-01',
            descripcion='Mapeo de requerimientos funcionales',
            estado=True
        )
        self.assertEqual(tarea.codigo, 'TAR-01')
        self.assertEqual(tarea.operacion, op)

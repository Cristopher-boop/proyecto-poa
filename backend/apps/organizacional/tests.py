from django.test import TestCase
from apps.organizacional.models import Programa, Area, Seccion

class OrganizacionalModelTests(TestCase):
    def setUp(self):
        self.programa = Programa.objects.create(
            codigo='PROG-01',
            nombre='Gestión Institucional Central',
            descripcion='Programa central de apoyo',
            estado=True
        )
        self.area = Area.objects.create(
            programa=self.programa,
            codigo='GAA',
            nombre='Gerencia de Asuntos Administrativos',
            tipo=Area.TipoArea.GERENCIA,
            estado=True
        )
        self.seccion = Seccion.objects.create(
            area=self.area,
            nombre='Recursos Humanos',
            estado=True
        )

    def test_programa_creation(self):
        self.assertIn('PROG-01', str(self.programa))
        self.assertTrue(self.programa.estado)

    def test_area_creation_and_hierarchy(self):
        self.assertIn('[GERENCIA]', str(self.area))
        self.assertIn('GAA', str(self.area))
        self.assertEqual(self.area.programa, self.programa)
        self.assertEqual(self.area.tipo, Area.TipoArea.GERENCIA)

    def test_seccion_creation(self):
        self.assertIn('RECURSOS HUMANOS', str(self.seccion).upper())
        self.assertEqual(self.seccion.area, self.area)

    def test_toggle_estado(self):
        self.area.estado = False
        self.area.save()
        self.assertFalse(self.area.estado)

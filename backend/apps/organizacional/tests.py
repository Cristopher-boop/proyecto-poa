from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.organizacional.models import Programa, Area, Seccion
from apps.organizacional.views import is_super_admin
from apps.usuarios.models import Usuario, Rol

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


class OrganizacionalPermisosTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Programa base
        self.programa = Programa.objects.create(
            codigo='PROG-10',
            nombre='Programa de Operaciones y Servicios',
            estado=True
        )
        # Área existente
        self.area = Area.objects.create(
            programa=self.programa,
            codigo='GO',
            nombre='Gerencia de Operaciones',
            tipo=Area.TipoArea.GERENCIA,
            estado=True
        )

        # Roles
        self.rol_admin, _ = Rol.objects.get_or_create(nombre='ADMINISTRADOR')
        self.rol_gerente, _ = Rol.objects.get_or_create(nombre='GERENTE')
        self.rol_elaborador, _ = Rol.objects.get_or_create(nombre='ELABORADOR')

        # Superadministrador
        self.superadmin = Usuario.objects.create_user(
            username='superadmin_test',
            password='password123',
            rol=self.rol_admin,
            is_superuser=True
        )

        # Gerente (no superadmin)
        self.gerente = Usuario.objects.create_user(
            username='gerente_test',
            password='password123',
            rol=self.rol_gerente,
            is_superuser=False
        )

        # Elaborador (no superadmin)
        self.elaborador = Usuario.objects.create_user(
            username='elaborador_test',
            password='password123',
            rol=self.rol_elaborador,
            is_superuser=False
        )

    def test_helper_is_super_admin(self):
        self.assertTrue(is_super_admin(self.superadmin))
        self.assertFalse(is_super_admin(self.gerente))
        self.assertFalse(is_super_admin(self.elaborador))
        self.assertFalse(is_super_admin(None))

    def test_usuario_comun_puede_ver_detalles_de_area(self):
        """Cualquier usuario autenticado puede ver detalles pero hasta ahí."""
        self.client.force_authenticate(user=self.gerente)
        response = self.client.get(f'/api/v1/organizacional/areas/{self.area.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['codigo'], 'GO')

    def test_no_superadmin_no_puede_crear_gerencia_o_unidad(self):
        """NADIE puede crear nuevas unidades o gerencias excepto la superadministración."""
        self.client.force_authenticate(user=self.gerente)
        payload = {
            'programa': self.programa.id,
            'codigo': 'NUEVA_UNIDAD',
            'nombre': 'Unidad de Prueba No Autorizada',
            'tipo': Area.TipoArea.UNIDAD,
        }
        response = self.client.post('/api/v1/organizacional/areas/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Superadministración', str(response.data))

    def test_superadmin_si_puede_crear_gerencia_o_unidad(self):
        """La superadministración sí tiene permisos para registrar gerencias/unidades."""
        self.client.force_authenticate(user=self.superadmin)
        payload = {
            'programa': self.programa.id,
            'codigo': 'U_SISTEMAS',
            'nombre': 'Unidad de Sistemas y TI',
            'tipo': Area.TipoArea.UNIDAD,
        }
        response = self.client.post('/api/v1/organizacional/areas/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['codigo'], 'U_SISTEMAS')

    def test_no_superadmin_no_puede_modificar_ni_desactivar_area(self):
        """Usuarios comunes no pueden editar ni dar de baja gerencias o unidades."""
        self.client.force_authenticate(user=self.elaborador)
        # Intentar modificar
        patch_res = self.client.patch(f'/api/v1/organizacional/areas/{self.area.id}/', {'nombre': 'Cambio Ilegal'})
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)

        # Intentar toggle
        toggle_res = self.client.post(f'/api/v1/organizacional/areas/{self.area.id}/toggle-estado/')
        self.assertEqual(toggle_res.status_code, status.HTTP_403_FORBIDDEN)

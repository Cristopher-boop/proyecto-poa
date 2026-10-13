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
            hoja_ruta='HR-1234/2026',
            es_contratacion=True,
            gestion=self.gestion,
            area=self.area,
            fecha=date(2026, 4, 1),
            monto_solicitado=Decimal('12000.00'),
            concepto_gasto='Contratación de servicio de impermeabilización',
            estado=CertificacionPOA.EstadoCertificacion.BORRADOR,
            creado_por=self.user
        )
        self.assertEqual(cert.codigo_certificacion, 'POA-GI-2026-001')
        self.assertEqual(cert.hoja_ruta, 'HR-1234/2026')
        self.assertTrue(cert.es_contratacion)
        self.assertEqual(cert.monto_solicitado, Decimal('12000.00'))
        self.assertIn('POA-GI-2026-001', str(cert))


class CertificacionPOAWorkflowTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        from apps.usuarios.models import Rol
        self.client = APIClient()

        self.rol_admin = Rol.objects.create(nombre='ADMINISTRADOR')
        self.rol_gerente = Rol.objects.create(nombre='GERENTE')
        self.rol_planif = Rol.objects.create(nombre='PLANIFICADOR')
        self.rol_presup = Rol.objects.create(nombre='APROBADOR')
        self.rol_elaborador = Rol.objects.create(nombre='ELABORADOR')

        self.programa = Programa.objects.create(codigo='P-01', nombre='Gestión Institucional')
        self.area = Area.objects.create(programa=self.programa, codigo='GI', nombre='Gerencia de Informática')
        self.seccion = Seccion.objects.create(area=self.area, nombre='Sistemas')

        self.admin_user = Usuario.objects.create(username='admin', rol=self.rol_admin, is_superuser=True)
        self.gerente_user = Usuario.objects.create(username='gerente', rol=self.rol_gerente, seccion=self.seccion)
        self.planif_user = Usuario.objects.create(username='planif', rol=self.rol_planif)
        self.presup_user = Usuario.objects.create(username='presup', rol=self.rol_presup)
        self.elaborador_user = Usuario.objects.create(username='elaborador', rol=self.rol_elaborador, seccion=self.seccion)

        self.gestion = Gestion.objects.create(anio=2026, estado=Gestion.EstadoGestion.EN_EJECUCION)
        self.partida = Partida.objects.create(codigo='25200', nombre='Estudios e Investigaciones')
        self.memoria = MemoriaCalculo.objects.create(
            codigo='MC-INF-001',
            gestion=self.gestion,
            seccion=self.seccion,
            justificacion='Auditoría de Sistemas',
            estado=MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
            total_presupuestado=Decimal('50000.00'),
            saldo_disponible=Decimal('50000.00')
        )

    def test_flujo_completo_contratacion(self):
        # 1. Gerente crea solicitud con Hoja de Ruta
        self.client.force_authenticate(user=self.gerente_user)
        payload = {
            'hoja_ruta': 'HR-INFO-2026-99',
            'es_contratacion': True,
            'gestion': self.gestion.id,
            'area': self.area.id,
            'fecha': '2026-04-10',
            'memoria': self.memoria.id,
            'monto_solicitado': '15000.00',
            'concepto_gasto': 'Consultoría de seguridad informática',
            'solicitante_nombre': 'Ing. Carlos Gerente',
            'solicitante_cargo': 'Gerente de Informática',
        }
        res = self.client.post('/api/v1/ejecucion/certificaciones/', payload)
        self.assertEqual(res.status_code, 201)
        cert_id = res.data['id']
        self.assertEqual(res.data['estado'], 'BORRADOR')
        self.assertEqual(res.data['hoja_ruta'], 'HR-INFO-2026-99')

        # 2. Gerente envía a revisión (contrataciones -> PENDIENTE_PLANIFICACION)
        res_env = self.client.post(f'/api/v1/ejecucion/certificaciones/{cert_id}/enviar-revision/')
        self.assertEqual(res_env.status_code, 200)
        self.assertEqual(res_env.data['estado'], 'PENDIENTE_PLANIFICACION')

        # 3. Planificador avala la certificación POA y la remite a Presupuestos
        self.client.force_authenticate(user=self.planif_user)
        res_cert = self.client.post(f'/api/v1/ejecucion/certificaciones/{cert_id}/certificar-planificacion/', {
            'codigo_certificacion': 'UPLANIF.EPTAM.CP. Nº 001/2026',
            'observacion': 'Alineado a las metas POA 2026'
        })
        self.assertEqual(res_cert.status_code, 200)
        self.assertEqual(res_cert.data['estado'], 'PENDIENTE_PRESUPUESTOS')

        # 4. Presupuestos da el okey financiero final
        self.client.force_authenticate(user=self.presup_user)
        res_aprob = self.client.post(f'/api/v1/ejecucion/certificaciones/{cert_id}/aprobar-presupuestos/', {
            'observacion': 'Disponibilidad presupuestaria confirmada'
        })
        self.assertEqual(res_aprob.status_code, 200)
        self.assertEqual(res_aprob.data['estado'], 'APROBADO')

    def test_flujo_con_correlativos_gerencia_y_global(self):
        # Solicitud de la gerencia con los 2 correlativos emitidos por Planificación
        self.client.force_authenticate(user=self.gerente_user)
        payload = {
            'hoja_ruta': 'HR-GI-2026-101',
            'gestion': self.gestion.id,
            'area': self.area.id,
            'fecha': '2026-04-10',
            'memoria': self.memoria.id,
            'monto_solicitado': '5000.00',
            'concepto_gasto': 'Adquisición de licencias de software',
            'solicitante_nombre': 'Ing. Carlos Gerente',
            'solicitante_cargo': 'Gerente de Informática',
        }
        res = self.client.post('/api/v1/ejecucion/certificaciones/', payload)
        self.assertEqual(res.status_code, 201)
        cert_id = res.data['id']

        res_env = self.client.post(f'/api/v1/ejecucion/certificaciones/{cert_id}/enviar-revision/')
        self.assertEqual(res_env.status_code, 200)
        self.assertEqual(res_env.data['estado'], 'PENDIENTE_PLANIFICACION')

        # Planificación emite con ambos códigos correlativos
        self.client.force_authenticate(user=self.planif_user)
        res_cert = self.client.post(f'/api/v1/ejecucion/certificaciones/{cert_id}/certificar-planificacion/', {
            'codigo_certificacion': 'UPLANIF.EPTAM.CP. Nº 005/2026',
            'numero_oficio_solicitud': 'GI.EPTAM. Stría Nº 005/26',
            'observacion': 'Alineado a las metas POA'
        })
        self.assertEqual(res_cert.status_code, 200)
        self.assertEqual(res_cert.data['estado'], 'PENDIENTE_PRESUPUESTOS')
        self.assertEqual(res_cert.data['codigo_certificacion'], 'UPLANIF.EPTAM.CP. Nº 005/2026')
        self.assertEqual(res_cert.data['numero_oficio_solicitud'], 'GI.EPTAM. STRÍA Nº 005/26')

    def test_elaborador_solo_lectura(self):
        # Elaborador no puede crear solicitudes de certificación
        self.client.force_authenticate(user=self.elaborador_user)
        payload = {
            'hoja_ruta': 'HR-ELAB-001',
            'es_contratacion': True,
            'gestion': self.gestion.id,
            'area': self.area.id,
            'fecha': '2026-04-10',
            'memoria': self.memoria.id,
            'monto_solicitado': '1000.00',
        }
        res = self.client.post('/api/v1/ejecucion/certificaciones/', payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn('solo lectura', str(res.data))

    def test_monto_mayor_a_2000_fuerza_contratacion(self):
        # Si monto > 2000, automáticamente es_contratacion es True incluso si se envía False
        self.client.force_authenticate(user=self.gerente_user)
        payload = {
            'hoja_ruta': 'HR-GT-2026-01',
            'es_contratacion': False,
            'gestion': self.gestion.id,
            'area': self.area.id,
            'fecha': '2026-04-10',
            'memoria': self.memoria.id,
            'monto_solicitado': '2500.00',
            'concepto_gasto': 'Gasto de adquisición mayor a 2000',
        }
        res = self.client.post('/api/v1/ejecucion/certificaciones/', payload)
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['es_contratacion'])

    def test_enviar_revision_monto_mayor_2000_pasa_a_planificacion(self):
        # Enviar revisión con monto > 2000 va a PENDIENTE_PLANIFICACION
        self.client.force_authenticate(user=self.gerente_user)
        cert = CertificacionPOA.objects.create(
            gestion=self.gestion,
            area=self.area,
            memoria=self.memoria,
            fecha=date(2026, 4, 10),
            hoja_ruta='HR-REV-01',
            monto_solicitado=Decimal('3000.00'),
            concepto_gasto='Compra de servidores',
            es_contratacion=False,  # Aun si estaba False
            estado=CertificacionPOA.EstadoCertificacion.BORRADOR,
            creado_por=self.gerente_user
        )
        res = self.client.post(f'/api/v1/ejecucion/certificaciones/{cert.id}/enviar-revision/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['estado'], 'PENDIENTE_PLANIFICACION')
        self.assertTrue(res.data['es_contratacion'])

    def test_enviar_revision_monto_menor_2000_sin_contratacion_pasa_a_presupuestos(self):
        # Enviar revisión con monto <= 2000 y es_contratacion=False va a PENDIENTE_PRESUPUESTOS
        self.client.force_authenticate(user=self.gerente_user)
        cert = CertificacionPOA.objects.create(
            gestion=self.gestion,
            area=self.area,
            memoria=self.memoria,
            fecha=date(2026, 4, 10),
            hoja_ruta='HR-REV-02',
            monto_solicitado=Decimal('1500.00'),
            concepto_gasto='Caja chica o gasto menor directo',
            es_contratacion=False,
            estado=CertificacionPOA.EstadoCertificacion.BORRADOR,
            creado_por=self.gerente_user
        )
        res = self.client.post(f'/api/v1/ejecucion/certificaciones/{cert.id}/enviar-revision/', {'es_contratacion': False})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['estado'], 'PENDIENTE_PRESUPUESTOS')
        self.assertFalse(res.data['es_contratacion'])


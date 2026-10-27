from django.test import TestCase
from decimal import Decimal
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.exceptions import ValidationError

from apps.organizacional.models import Programa, Area, Seccion
from apps.presupuestos.models import Gestion, Partida
from apps.planificacion.models import AccionMedianoPlazo, AccionCortoPlazo, Operacion
from apps.memorias.models import (
    MemoriaCalculo, DetallePresupuestoMemoria, TraspasoPresupuestario,
    ModificacionPresupuestaria, DetalleModificacion
)
from apps.memorias.serializers import (
    MemoriaCalculoSerializer, MemoriaCalculoListSerializer,
    ModificacionPresupuestariaSerializer
)
from apps.memorias.services import ModificacionPresupuestariaService
from apps.usuarios.models import Usuario, Rol


class MemoriasBaseTestCase(TestCase):
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
        self.area2 = Area.objects.create(
            programa=self.programa,
            codigo='GAF',
            nombre='Gerencia de Administración y Finanzas',
            tipo=Area.TipoArea.GERENCIA,
            estado=True
        )
        self.seccion = Seccion.objects.create(
            area=self.area,
            nombre='Ventas y Marketing',
            estado=True
        )
        self.seccion2 = Seccion.objects.create(
            area=self.area2,
            nombre='Contabilidad',
            estado=True
        )
        self.gestion = Gestion.objects.create(
            anio=2026,
            estado=Gestion.EstadoGestion.FORMULACION
        )
        self.partida1 = Partida.objects.create(
            codigo='31110',
            nombre='Gastos de Oficina y Papelería',
            clase=Partida.ClasePartida.EGRESO,
            estado=True
        )
        self.partida2 = Partida.objects.create(
            codigo='39500',
            nombre='Útiles de Escritorio',
            clase=Partida.ClasePartida.EGRESO,
            estado=True
        )

        # Planificación: AMP -> ACP -> Operacion
        self.amp = AccionMedianoPlazo.objects.create(
            programa=self.programa,
            codigo='AMP-01',
            descripcion='Modernización institucional'
        )
        self.acp = AccionCortoPlazo.objects.create(
            accion_mediano_plazo=self.amp,
            gestion=self.gestion,
            codigo='ACP-01',
            descripcion='Optimización de suministros'
        )
        self.operacion = Operacion.objects.create(
            accion_corto_plazo=self.acp,
            area=self.area,
            codigo='OP-GC-001',
            descripcion='Operación comercial principal'
        )

        # Roles
        self.rol_admin, _ = Rol.objects.get_or_create(nombre='ADMINISTRADOR')
        self.rol_gerente, _ = Rol.objects.get_or_create(nombre='GERENTE')
        self.rol_presupuestos, _ = Rol.objects.get_or_create(nombre='PRESUPUESTOS')
        self.rol_elaborador, _ = Rol.objects.get_or_create(nombre='ELABORADOR')

        # Usuarios
        self.user_admin = Usuario.objects.create_user(
            username='admin_test',
            password='password123',
            rol=self.rol_admin,
            is_superuser=True
        )
        self.user_gerente = Usuario.objects.create_user(
            username='gerente_gc',
            password='password123',
            rol=self.rol_gerente,
            seccion=self.seccion
        )
        self.user_presupuestos = Usuario.objects.create_user(
            username='lic_presupuestos',
            password='password123',
            rol=self.rol_presupuestos
        )
        self.user_elaborador = Usuario.objects.create_user(
            username='elab_gc',
            password='password123',
            rol=self.rol_elaborador,
            seccion=self.seccion
        )
        self.user_gerente2 = Usuario.objects.create_user(
            username='gerente_gaf',
            password='password123',
            rol=self.rol_gerente,
            seccion=self.seccion2
        )

        # Memorias de Cálculo
        self.memoria1 = MemoriaCalculo.objects.create(
            codigo='MC-GC-001',
            gestion=self.gestion,
            seccion=self.seccion,
            operacion=self.operacion,
            justificacion='Requerimientos anuales de papelería',
            estado=MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
            total_presupuestado=Decimal('5000.00'),
            saldo_disponible=Decimal('5000.00')
        )
        self.detalle1 = DetallePresupuestoMemoria.objects.create(
            memoria=self.memoria1,
            partida=self.partida1,
            descripcion='Hojas bond tamaño carta',
            unidad_medida='Paquete',
            cantidad=Decimal('100.00'),
            precio_unitario=Decimal('50.00'),
            factor_calculo=Decimal('1.0000')
        )

        self.memoria2 = MemoriaCalculo.objects.create(
            codigo='MC-GC-002',
            gestion=self.gestion,
            seccion=self.seccion,
            operacion=None,
            justificacion='Servicios de publicidad y difusión',
            estado=MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
            total_presupuestado=Decimal('3000.00'),
            saldo_disponible=Decimal('3000.00')
        )
        self.detalle2 = DetallePresupuestoMemoria.objects.create(
            memoria=self.memoria2,
            partida=self.partida2,
            descripcion='Material publicitario',
            unidad_medida='Unidad',
            cantidad=Decimal('30.00'),
            precio_unitario=Decimal('100.00'),
            factor_calculo=Decimal('1.0000')
        )

        self.memoria_otra_area = MemoriaCalculo.objects.create(
            codigo='MC-GAF-001',
            gestion=self.gestion,
            seccion=self.seccion2,
            justificacion='Gastos de contabilidad',
            estado=MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS,
            total_presupuestado=Decimal('4000.00'),
            saldo_disponible=Decimal('4000.00')
        )
        self.detalle_otra_area = DetallePresupuestoMemoria.objects.create(
            memoria=self.memoria_otra_area,
            partida=self.partida1,
            descripcion='Servicios operativos contables GAF',
            unidad_medida='Servicio',
            cantidad=Decimal('1.00'),
            precio_unitario=Decimal('4000.00'),
            factor_calculo=Decimal('1.0000')
        )


class MemoriasModelAndSerializerTests(MemoriasBaseTestCase):
    def test_memoria_creation(self):
        self.assertEqual(self.memoria1.codigo, 'MC-GC-001')
        self.assertEqual(self.memoria1.estado, MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS)
        self.assertEqual(self.memoria1.saldo_disponible, Decimal('5000.00'))

    def test_detalle_presupuesto_calculation(self):
        self.assertEqual(self.detalle1.precio_total, Decimal('5000.00'))

    def test_memoria_serializer_operacion_codigo(self):
        """Verifica que la serialización de MemoriaCalculo incluya operacion_codigo correctamente con y sin operacion"""
        # Con operación asignada
        data1 = MemoriaCalculoSerializer(self.memoria1).data
        self.assertEqual(data1['operacion_codigo'], 'OP-GC-001')

        data_list1 = MemoriaCalculoListSerializer(self.memoria1).data
        self.assertEqual(data_list1['operacion_codigo'], 'OP-GC-001')

        # Sin operación asignada
        data2 = MemoriaCalculoSerializer(self.memoria2).data
        self.assertIsNone(data2['operacion_codigo'])

        data_list2 = MemoriaCalculoListSerializer(self.memoria2).data
        self.assertIsNone(data_list2['operacion_codigo'])

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


class ModificacionPresupuestariaServiceTests(MemoriasBaseTestCase):
    def test_registrar_modificacion_exitoso(self):
        """Gerente registra una modificación presupuestaria compensada (origen == destino)"""
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Ajuste de presupuesto para adquisición de suministros prioritarios',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '1500.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '1500.00'}]
        }
        mod = ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)
        self.assertIsNotNone(mod.id)
        self.assertEqual(mod.estado, ModificacionPresupuestaria.EstadoModificacion.PENDIENTE_PRESUPUESTOS)
        self.assertEqual(mod.total_monto, Decimal('1500.00'))
        self.assertEqual(mod.detalles.count(), 2)
        # Los saldos no se descuentan hasta la aprobación final
        self.memoria1.refresh_from_db()
        self.assertEqual(self.memoria1.saldo_disponible, Decimal('5000.00'))

    def test_registrar_modificacion_descompensada_falla(self):
        """Falla si salidas != entradas"""
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Descompensada',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '1000.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '800.00'}]
        }
        with self.assertRaises(ValidationError):
            ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)

    def test_registrar_modificacion_rol_no_autorizado_falla(self):
        """Elaborador no puede solicitar modificaciones (solo Gerente o Admin)"""
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Intento no autorizado',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '500.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '500.00'}]
        }
        with self.assertRaises(ValidationError):
            ModificacionPresupuestariaService.registrar_modificacion(data, self.user_elaborador)

    def test_registrar_modificacion_inter_area_falla(self):
        """No permite traspasos entre diferentes áreas (estrictamente intra-área)"""
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Intento entre distintas áreas',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '500.00'}],
            'destinos': [{'memoria_id': self.memoria_otra_area.id, 'monto': '500.00'}]
        }
        with self.assertRaises(ValidationError):
            ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)

    def test_registrar_modificacion_saldo_insuficiente_falla(self):
        """Falla si el monto solicitado excede el saldo disponible"""
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Saldo insuficiente',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '99999.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '99999.00'}]
        }
        with self.assertRaises(ValidationError):
            ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)

    def test_aprobar_modificacion_por_presupuestos(self):
        """Presupuestos aprueba la modificación: se actualizan montos entrantes, salientes y saldos disponibles"""
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Ajuste presupuestario aprobado',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '1200.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '1200.00'}]
        }
        mod = ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)
        mod_aprobada = ModificacionPresupuestariaService.aprobar_modificacion(
            modificacion=mod,
            usuario=self.user_presupuestos,
            observacion='Revisado y conforme con techos'
        )
        self.assertEqual(mod_aprobada.estado, ModificacionPresupuestaria.EstadoModificacion.APROBADO)
        self.assertEqual(mod_aprobada.aprobado_por, self.user_presupuestos)

        self.memoria1.refresh_from_db()
        self.memoria2.refresh_from_db()
        # Memoria 1 (cedente): 5000 - 1200 = 3800
        self.assertEqual(self.memoria1.monto_saliente, Decimal('1200.00'))
        self.assertEqual(self.memoria1.saldo_disponible, Decimal('3800.00'))
        # Memoria 2 (receptora): 3000 + 1200 = 4200
        self.assertEqual(self.memoria2.monto_entrante, Decimal('1200.00'))
        self.assertEqual(self.memoria2.saldo_disponible, Decimal('4200.00'))

    def test_aprobar_lote_por_presupuestos(self):
        """Presupuestos aprueba un lote de modificaciones de golpe"""
        data1 = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Modificación 1',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '500.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '500.00'}]
        }
        data2 = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Modificación 2',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '300.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '300.00'}]
        }
        mod1 = ModificacionPresupuestariaService.registrar_modificacion(data1, self.user_gerente)
        mod2 = ModificacionPresupuestariaService.registrar_modificacion(data2, self.user_gerente)

        resultado = ModificacionPresupuestariaService.aprobar_lote(
            modificacion_ids=[mod1.id, mod2.id],
            usuario=self.user_presupuestos
        )
        self.assertEqual(resultado['aprobadas_count'], 2)
        mod1.refresh_from_db()
        mod2.refresh_from_db()
        self.assertEqual(mod1.estado, ModificacionPresupuestaria.EstadoModificacion.APROBADO)
        self.assertEqual(mod2.estado, ModificacionPresupuestaria.EstadoModificacion.APROBADO)

    def test_rechazar_modificacion(self):
        """Presupuestos rechaza una modificación con motivo obligatorio"""
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Modificación a ser rechazada',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '400.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '400.00'}]
        }
        mod = ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)
        mod_rechazada = ModificacionPresupuestariaService.rechazar_modificacion(
            modificacion=mod,
            usuario=self.user_presupuestos,
            motivo='No procede por cierre de partida'
        )
        self.assertEqual(mod_rechazada.estado, ModificacionPresupuestaria.EstadoModificacion.RECHAZADO)
        self.assertEqual(mod_rechazada.motivo_rechazo, 'NO PROCEDE POR CIERRE DE PARTIDA')

    def test_traspaso_inter_areas_flujo_completo(self):
        """
        Flujo extraordinario Inter-Gerencias:
        1. Gerencia Comercial (GC) solicita Bs. 2,000 a GAF por fuerza mayor.
        2. Queda en PENDIENTE_GERENCIA_CEDENTE.
        3. Gerente de GAF acepta la petición -> PENDIENTE_PRESUPUESTOS.
        4. Presupuestos aprueba -> Se descuenta de GAF y se acredita a GC.
        """
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'area_cedente_id': self.area2.id,
            'tipo': ModificacionPresupuestaria.TipoModificacion.TRASPASO_INTER_AREA,
            'motivo': 'Petición extraordinaria por fuerza mayor a GAF para refuerzo comercial',
            'origenes': [{'memoria_id': self.memoria_otra_area.id, 'monto': '2000.00'}],
            'destinos': [{'memoria_id': self.memoria1.id, 'monto': '2000.00'}]
        }
        mod = ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)
        self.assertEqual(mod.tipo, ModificacionPresupuestaria.TipoModificacion.TRASPASO_INTER_AREA)
        self.assertEqual(mod.estado, ModificacionPresupuestaria.EstadoModificacion.PENDIENTE_GERENCIA_CEDENTE)
        self.assertEqual(mod.area_cedente_id, self.area2.id)

        # Gerente de GAF acepta la cesión de fondos
        mod_aceptada = ModificacionPresupuestariaService.aceptar_gerencia_cedente(
            modificacion=mod,
            usuario=self.user_gerente2,
            nota='Aceptamos ceder Bs. 2,000 por motivos de fuerza mayor'
        )
        self.assertEqual(mod_aceptada.estado, ModificacionPresupuestaria.EstadoModificacion.PENDIENTE_PRESUPUESTOS)
        self.assertEqual(mod_aceptada.aceptado_por_gerencia, self.user_gerente2)
        self.assertIsNotNone(mod_aceptada.fecha_aceptacion_gerencia)

        # Presupuestos aprueba definitivamente
        mod_final = ModificacionPresupuestariaService.aprobar_modificacion(
            modificacion=mod_aceptada,
            usuario=self.user_presupuestos,
            observacion='Visto Bueno Presupuestos Otorgado'
        )
        self.assertEqual(mod_final.estado, ModificacionPresupuestaria.EstadoModificacion.APROBADO)

        # Verificar saldos actualizados
        self.memoria_otra_area.refresh_from_db()
        self.memoria1.refresh_from_db()
        self.assertEqual(self.memoria_otra_area.monto_saliente, Decimal('2000.00'))
        self.assertEqual(self.memoria_otra_area.saldo_disponible, Decimal('2000.00'))
        self.assertEqual(self.memoria1.monto_entrante, Decimal('2000.00'))
        self.assertEqual(self.memoria1.saldo_disponible, Decimal('7000.00'))

    def test_traspaso_inter_areas_rechazado_por_gerente_cedente(self):
        """
        Gerente Cedente rechaza la solicitud de traspaso inter-gerencias
        """
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'area_cedente_id': self.area2.id,
            'tipo': ModificacionPresupuestaria.TipoModificacion.TRASPASO_INTER_AREA,
            'motivo': 'Petición a rechazar',
            'origenes': [{'memoria_id': self.memoria_otra_area.id, 'monto': '1000.00'}],
            'destinos': [{'memoria_id': self.memoria1.id, 'monto': '1000.00'}]
        }
        mod = ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)
        mod_rech = ModificacionPresupuestariaService.rechazar_gerencia_cedente(
            modificacion=mod,
            usuario=self.user_gerente2,
            motivo='No disponemos de margen presupuestario para ceder'
        )
        self.assertEqual(mod_rech.estado, ModificacionPresupuestaria.EstadoModificacion.RECHAZADO)
        self.assertIn('NO DISPONEMOS DE MARGEN', mod_rech.motivo_rechazo.upper())

        self.memoria_otra_area.refresh_from_db()
        self.assertEqual(self.memoria_otra_area.saldo_disponible, Decimal('4000.00'))

    def test_traspaso_con_creacion_nueva_partida_en_ejecucion(self):
        """
        Creación de nueva partida en ejecución sin desglose inicial de ítems:
        Al aprobar Presupuestos, se crea la MemoriaCalculo con creada_en_ejecucion=True
        y recibe el saldo correspondiente.
        """
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'tipo': ModificacionPresupuestaria.TipoModificacion.TRASPASO_INTRA_AREA,
            'motivo': 'Habilitación de partida no formulada para soporte operativo',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '1500.00'}],
            'destinos': [{
                'es_nueva_partida': True,
                'partida_id': self.partida2.id,
                'operacion_id': self.operacion.id,
                'monto': '1500.00'
            }]
        }
        mod = ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)
        self.assertEqual(mod.estado, ModificacionPresupuestaria.EstadoModificacion.PENDIENTE_PRESUPUESTOS)

        # Detalle destino no tiene memoria al inicio
        det_destino = mod.detalles.filter(tipo_movimiento=DetalleModificacion.TipoMovimiento.INCREMENTO).first()
        self.assertTrue(det_destino.es_nueva_partida)
        self.assertIsNone(det_destino.memoria)

        # Presupuestos aprueba la modificación
        ModificacionPresupuestariaService.aprobar_modificacion(mod, self.user_presupuestos)

        det_destino.refresh_from_db()
        self.assertIsNotNone(det_destino.memoria)
        nueva_memoria = det_destino.memoria
        self.assertTrue(nueva_memoria.creada_en_ejecucion)
        self.assertEqual(nueva_memoria.estado, MemoriaCalculo.EstadoMemoria.APROBADO_FINANZAS)
        self.assertEqual(nueva_memoria.total_presupuestado, Decimal('0.00'))
        self.assertEqual(nueva_memoria.monto_entrante, Decimal('1500.00'))
        self.assertEqual(nueva_memoria.saldo_disponible, Decimal('1500.00'))

        self.memoria1.refresh_from_db()
        self.assertEqual(self.memoria1.saldo_disponible, Decimal('3500.00'))


class ModificacionPresupuestariaApiTests(APITestCase, MemoriasBaseTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_get_modificaciones_endpoint_select_related(self):
        """
        Verifica que GET /api/v1/memorias/modificaciones/?gestion=X responda 200 OK
        sin FieldError por 'operacion' en select_related.
        """
        # Registrar una modificación
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Prueba API select_related',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '700.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '700.00'}]
        }
        ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)

        # Autenticar como presupuestos
        self.client.force_authenticate(user=self.user_presupuestos)
        response = self.client.get(f'/api/v1/memorias/modificaciones/?gestion={self.gestion.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['area_codigo'], 'GC')
        self.assertEqual(results[0]['area_nombre'], 'GERENCIA COMERCIAL')
        self.assertEqual(len(results[0]['origenes']), 1)
        self.assertEqual(len(results[0]['destinos']), 1)

    def test_busqueda_modificaciones(self):
        """Verifica que el parámetro de búsqueda ?search=... filtre sin errores de campo"""
        data = {
            'gestion_id': self.gestion.id,
            'area_id': self.area.id,
            'motivo': 'Equipamiento especial de oficina',
            'origenes': [{'memoria_id': self.memoria1.id, 'monto': '200.00'}],
            'destinos': [{'memoria_id': self.memoria2.id, 'monto': '200.00'}]
        }
        ModificacionPresupuestariaService.registrar_modificacion(data, self.user_gerente)

        self.client.force_authenticate(user=self.user_admin)
        response = self.client.get('/api/v1/memorias/modificaciones/?search=Equipamiento')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        response_none = self.client.get('/api/v1/memorias/modificaciones/?search=INEXISTENTE1234')
        self.assertEqual(response_none.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_none.data), 0)

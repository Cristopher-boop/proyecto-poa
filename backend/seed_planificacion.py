import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.organizacional.models import Programa, Area
from apps.presupuestos.models import Gestion
from apps.planificacion.models import AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea

def sembrar_planificacion():
    print("[*] Sembrando datos de Planificacion Estrategica oficiales por Programa (PEI / POA)...")

    gestion_2026 = Gestion.objects.filter(anio=2026).first() or Gestion.objects.first()

    def get_prog(codigo_prefix):
        return Programa.objects.filter(codigo__icontains=codigo_prefix).first()

    def get_area_by_name(name_keyword):
        return Area.objects.filter(nombre__icontains=name_keyword).first()

    p1 = get_prog('P-1') or Programa.objects.first()
    p2 = get_prog('P-2') or p1
    p410 = get_prog('410') or p1
    p210 = get_prog('210') or p1

    # =========================================================================
    # PROGRAMA 1: GESTIÓN INSTITUCIONAL Y TRANSPARENCIA
    # =========================================================================
    if p1:
        amp_p1, _ = AccionMedianoPlazo.objects.get_or_create(
            codigo='AMP-P1-01',
            defaults={
                'programa': p1,
                'descripcion': 'Fortalecer la gestión institucional mediante la mejora continua de los procesos, la modernización tecnológica, y el fortalecimiento de la transparencia institucional a nivel nacional en el año 2027.',
                'periodo_inicio': 2026,
                'periodo_fin': 2030,
                'estado': True
            }
        )

        # ACPs por Área en P1
        area_planif = get_area_by_name('Planificac') or get_area_by_name('Unidad')
        area_ciac = get_area_by_name('CIAC')
        area_audit = get_area_by_name('Auditor')
        area_transp = get_area_by_name('Transparencia')
        area_inf = get_area_by_name('Informatica')
        area_odeco = get_area_by_name('ODECO')
        area_jur = get_area_by_name('Juridica')

        # 1.1 Planificación
        acp_planif, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P1-PLA',
            defaults={
                'accion_mediano_plazo': amp_p1,
                'gestion': gestion_2026,
                'descripcion': 'GESTIONAR Y COORDINAR LA PLANIFICACION Y EL DESARROLLO ORGANIZACIONAL DE LA EPTAM, EN EL MARCO DEL SOA Y EL SPO',
                'estado': True
            }
        )

        # 1.2 CIAC
        acp_ciac, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P1-CIAC',
            defaults={
                'accion_mediano_plazo': amp_p1,
                'gestion': gestion_2026,
                'descripcion': 'PLANIFICAR, ORGANIZAR, DESARROLLAR, EJECUTAR Y EVALUAR PROGRAMAS DE FORMACIÓN, CAPACITACIÓN, ENTRENAMIENTO Y ACTUALIZACIÓN DIRIGIDOS A ALUMNOS INTERESADOS EN EL CAMPO DE LA AVIACIÓN Y AL PERSONAL AERONÁUTICO, ASI AMPLIAR Y MATENER LAS COMPETENCIAS TÉCNICAS Y PROFESIONALES CONFORME A LA NORMATIVA AERONÁUTICA NACIONAL E INTERNACIONAL, CONTRIBUYENDO AL DESARROLLO SEGURO, EFICIENTE Y SOSTENIBLE DEL SISTEMA DE AVIACIÓN CIVIL.',
                'estado': True
            }
        )

        # 1.3 Auditoría Interna
        acp_audit, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P1-AUD',
            defaults={
                'accion_mediano_plazo': amp_p1,
                'gestion': gestion_2026,
                'descripcion': 'EJECUTAR EL CONTROL INTERNO POSTERIOR, MEDIANTE LA REALIZACIÓN DE TRABAJOS DE AUDITORIA DE MANDATO LEGAL Y OTROS PROGRAMADOS EN BASE A LA EVALUACIÓN DE RIESGOS DE LA EMPRESA PUBLICA TRANSPORTE AÉREO MILITAR; ASIMISMO, AQUELLAS INSTRUIDAS POR LAS INSTANCIAS COMPETENTES, LAS CUALES PERMITIRÁN EL LOGRO DE LOS OBJETIVOS DE LA EMPRESA.',
                'estado': True
            }
        )

        # 1.4 Transparencia
        acp_transp, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P1-TRA',
            defaults={
                'accion_mediano_plazo': amp_p1,
                'gestion': gestion_2026,
                'descripcion': 'PROMOVER UNA GESTIÓN EMPRESARIAL PÚBLICA ADMINISTRATIVA TRANSPARENTE RESPECTO A LOS PROCESOS Y ACTIVIDADES REALIZADAS POR LA EPTAM.',
                'estado': True
            }
        )

        # 1.5 Gerencia de Informática
        acp_inf, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P1-INF',
            defaults={
                'accion_mediano_plazo': amp_p1,
                'gestion': gestion_2026,
                'descripcion': 'BRINDAR SOPORTE TÉCNICO (MANTENIMIENTO, PREVENTIVO Y CORRECTIVO AL PARQUE INFORMATICO) DE EPTAM',
                'estado': True
            }
        )

        if area_inf:
            ops_inf = [
                ('OP-INF-01', 'RENOVACIÓN DEL SERVICIO DE HOSTING'),
                ('OP-INF-02', 'DESARROLLAR EL SISTEMA DE ACTIVOS FIJOS'),
                ('OP-INF-03', 'RENOVACIÓN DEL SERVICIO DE DOMINIO DE EPTAM'),
                ('OP-INF-04', 'DESARROLLAR EL SISTEMA DE CONTROL DE ASISTENCIA'),
                ('OP-INF-05', 'DESARROLLAR EL SISTEMA DE SMS'),
                ('OP-INF-06', 'IMPLEMENTAR LA HERRAMIENTA MOODLE PARA EL CIAC'),
            ]
            for op_cod, op_desc in ops_inf:
                op_obj, _ = Operacion.objects.get_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_inf,
                        'area': area_inf,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )
                Tarea.objects.get_or_create(
                    codigo=f"TAR-{op_cod}",
                    defaults={'operacion': op_obj, 'descripcion': f"Ejecución de {op_desc} segun POA TAMEP", 'estado': True}
                )

        # 1.6 ODECO
        acp_odeco, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P1-ODE',
            defaults={
                'accion_mediano_plazo': amp_p1,
                'gestion': gestion_2026,
                'descripcion': 'DESARROLLAR, ADMINISTRAR, CONTROLAR Y SUPERVISAR LA GESTIÓN DE RECLAMACIONES DIRECTAS Y ADMINISTRATIVAS, COMO TAMBIÉN, LOS PROYECTOS DE GESTIÓN DE CALIDAD EN EL SERVICIO PARA LA MEJORA CONTINUA; EN CUMPLIMIENTO A LAS DISPOSICIONES EMITIDAS POR LAS AUTORIDADES COMPETENTES.',
                'estado': True
            }
        )

        # 1.7 Jurídica
        acp_jur, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P1-JUR',
            defaults={
                'accion_mediano_plazo': amp_p1,
                'gestion': gestion_2026,
                'descripcion': 'GESTIÓN DE PROCESOS JUDICIALES, TRÁMITES ADMINISTRATIVOS Y DEFENSAS DE LA EPTAM',
                'estado': True
            }
        )

        if area_jur:
            ops_jur = [
                ('OP-JUR-01', 'INTERPONER DEMANDAS, DEFENSA, REALIZAR EL SEGUIMIENTO A PROCESOS LABORALES, COACTIVOS, PENALES, CIVILES Y CONTENCIOSOS.'),
                ('OP-JUR-02', 'RESPONDER A TRÁMITES ADMINISTRATIVOS INTERNOS O EXTERNOS, DIRECTORIO, ASÍ COMO DE LA FAB Y MINISTERIOS DEL ÁREA'),
                ('OP-JUR-03', 'SEGUIMIENTO Y DEFENSA DE PROCESOS DE EJECUCION COACTIVA INICIADOS POR LA ATT, COORDINACIÓN DE PAGOS DE PROCESOSOS EJECUTORIADOS Y ACCIONES DE REPETICION.'),
            ]
            for op_cod, op_desc in ops_jur:
                Operacion.objects.get_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_jur,
                        'area': area_jur,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )

    # =========================================================================
    # PROGRAMA 2: GESTIÓN FINANCIERA Y ADMINISTRATIVA
    # =========================================================================
    if p2:
        amp_p2, _ = AccionMedianoPlazo.objects.get_or_create(
            codigo='AMP-P2-01',
            defaults={
                'programa': p2,
                'descripcion': 'Fortalecer la gestión financiera de la Empresa Pública Transporte Aéreo Militar mediante la administración eficiente de los recursos, contribuyendo a la sostenibilidad y al desarrollo empresarial en la gestión 2027',
                'periodo_inicio': 2026,
                'periodo_fin': 2030,
                'estado': True
            }
        )

        area_adm = get_area_by_name('Administrativ') or get_area_by_name('Asuntos')

        acp_adm, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P2-ADM',
            defaults={
                'accion_mediano_plazo': amp_p2,
                'gestion': gestion_2026,
                'descripcion': 'EFICIENCIA EN LA ADMINISTRACIÓN DE RECURSOS HUMANOS, FINANCIEROS Y MATERIALES',
                'estado': True
            }
        )

        if area_adm:
            ops_adm = [
                ('OP-ADM-01', 'Gestionar las diferentes actividades de la Jefatura Administrativa a traves de sus diferentes Secciones en el marco de las normas vigentes.'),
                ('OP-ADM-02', 'Gestionar el manejo de los recursos percibidos a traves de las diferentes secciones dependientes de la Jefatura Financiera'),
                ('OP-ADM-03', 'Hacer cumplir lo establecido en el Reglamento Especifico del Sistema de Administracion de Personal (RESAP) y Reglamento Interno de Personal (RIP)'),
            ]
            for op_cod, op_desc in ops_adm:
                Operacion.objects.get_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_adm,
                        'area': area_adm,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )

    # =========================================================================
    # PROGRAMA 410: COMERCIALIZACIÓN Y VENTAS
    # =========================================================================
    if p410:
        amp_p410, _ = AccionMedianoPlazo.objects.get_or_create(
            codigo='AMP-P410-01',
            defaults={
                'programa': p410,
                'descripcion': 'Incrementar la participación en el mercado de transporte aéreo de pasajeros, carga y correo, mediante la implementación de estrategias comerciales, a nivel nacional en el año 2027',
                'periodo_inicio': 2026,
                'periodo_fin': 2030,
                'estado': True
            }
        )

        area_com = get_area_by_name('Comercial')
        area_reg = get_area_by_name('Regional') or get_area_by_name('Sucursal')

        acp_com, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P410-COM',
            defaults={
                'accion_mediano_plazo': amp_p410,
                'gestion': gestion_2026,
                'descripcion': 'DESARROLLO DE ESTRATEGIAS DE VENTA Y EXPANSION DE MERCADO AERONAUTICO',
                'estado': True
            }
        )

        if area_com:
            ops_com = [
                ('OP-COM-01', 'Planificar y desarrollar estrategias para la venta de boletos aereos mediante el sitema GDS'),
                ('OP-COM-02', 'Planificar estrategias para captar usuarios que requieran vuelos no regulares (charter).'),
                ('OP-COM-03', 'Fortalecer la comercializacion de transporte de carga, encomienda y correo'),
            ]
            for op_cod, op_desc in ops_com:
                Operacion.objects.get_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_com,
                        'area': area_com,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )

        if area_reg:
            Operacion.objects.get_or_create(
                codigo='OP-REG-01',
                defaults={
                    'accion_corto_plazo': acp_com,
                    'area': area_reg,
                    'descripcion': 'Gestionar la comercialización de los servicios de transporte aéreo en las Gerencias Regionales y puntos de atención a nivel nacional, mediante la venta y emisión de pasajes, la atención al pasajero, el despacho de aeronaves y el descargo de las operaciones aéreas, según corresponda, a través del GDS y conforme a normativa vigente.',
                    'es_contratacion': True,
                    'estado': True
                }
            )

    # =========================================================================
    # PROGRAMA 210: OPERACIONES AERONÁUTICAS Y SEGURIDAD (SMS)
    # =========================================================================
    if p210:
        amp_p210, _ = AccionMedianoPlazo.objects.get_or_create(
            codigo='AMP-P210-01',
            defaults={
                'programa': p210,
                'descripcion': 'Gestionar la prestación segura, eficiente y continua de las operaciones aeronáuticas mediante la gestión integral de la flota aérea, la aeronavegabilidad continua y el cumplimiento de los estándares de seguridad operacional a nivel nacional en la gestión 2027',
                'periodo_inicio': 2026,
                'periodo_fin': 2030,
                'estado': True
            }
        )

        area_ops = get_area_by_name('Operaciones') or get_area_by_name('Aeronavegabilidad')
        area_sms = get_area_by_name('SMS') or get_area_by_name('Seguridad')

        acp_aero, _ = AccionCortoPlazo.objects.get_or_create(
            codigo='ACP-P210-AERO',
            defaults={
                'accion_mediano_plazo': amp_p210,
                'gestion': gestion_2026,
                'descripcion': 'MANTENIMIENTO DE CERTIFICACIONES DE OPERADOR AÉREO Y AERONAVEGABILIDAD CONTINUA',
                'estado': True
            }
        )

        if area_ops:
            ops_aero = [
                ('OP-OPE-01', 'MANTENER VIGENTE EL CERTIFICADO DE OPERADOR AÉREO DE VUELOS REGULARES Y NO REGULARES TRANSPORTANDO PASAJEROS, CORREO Y CARGA NACIONAL E INTERNACIONAL, PARA CONTRIBUIR A LOS OBJETIVOS EMPRESARIALES DE LA EPTAM.'),
                ('OP-OPE-02', 'MANTENER VIGENTE EL CERTIFICADO DE AERONAVEGABILIDAD CONTINUA DE LA AERONAVE AVRO RJ70 MATRICULA CP3106, ANTE LA DIRECCIÓN GENERAL DE AERONÁUTICA CIVIL DGAC, DANDO CUMPLIMIENTO AL PM (PROGRAMA DE MANTENIMIENTO) Y AL MCM (MANUAL DE CONTROL DE MANTENIMIENTO).'),
            ]
            for op_cod, op_desc in ops_aero:
                Operacion.objects.get_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_aero,
                        'area': area_ops,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )

        if area_sms:
            ops_sms = [
                ('OP-SMS-01', 'DISMINUIR LA OCURRENCIA DE INCIDENTES Y EVENTOS MEDIANTE UNA GESTIÓN DE RIESGOS BASADA EN ENFOQUES REACTIVOS, PROACTIVOS Y PREDICTIVOS.'),
                ('OP-SMS-02', 'FORTALECER EL SISTEMA DE NOTIFICACIONES DE SEGURIDAD OPERACIONAL ASEGURANDO EL PROCESAMIENTO INTEGRAL DE LA INFORMACIÓN Y LA RETROALIMENTACIÓN OPORTUNA PARA UNA IDENTIFICACIÓN TEMPRANA DE PELIGROS.'),
                ('OP-SMS-03', 'FOMENTAR UNA CULTURA DE SEGURIDAD Y COMPETENCIA TÉCNICA MEDIANTE PROGRAMAS DE CAPACITACIÓN CONTINUA, DIFUSIÓN DE LA POLÍTICA Y FORTALECIMIENTO DE UNA CULTURA JUSTA.'),
            ]
            for op_cod, op_desc in ops_sms:
                Operacion.objects.get_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_aero,
                        'area': area_sms,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )

    print("[+] Sembrado oficial de Planificacion por Programa completado exitosamente.")

if __name__ == '__main__':
    sembrar_planificacion()

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.organizacional.models import Programa, Area
from apps.presupuestos.models import Gestion
from apps.planificacion.models import AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea

def sembrar_planificacion():
    print("[*] Sembrando datos de Planificacion Estrategica oficiales por Programa (PEI / POA)...")

    gestiones = list(Gestion.objects.all())
    if not gestiones:
        g2027, _ = Gestion.objects.get_or_create(anio=2027, defaults={'estado': Gestion.EstadoGestion.FORMULACION})
        gestiones = [g2027]

    def get_prog(codigo_str):
        return Programa.objects.filter(codigo=codigo_str).first() or Programa.objects.filter(codigo__icontains=codigo_str).first()

    def get_area_by_sigla_or_name(sigla, name_keyword):
        area = Area.objects.filter(codigo__iendswith=f"-{sigla}").first()
        if not area:
            area = Area.objects.filter(nombre__icontains=name_keyword).first()
        return area

    p1 = get_prog('1')
    p2 = get_prog('2')
    p410 = get_prog('410')
    p210 = get_prog('210')

    # =========================================================================
    # PROGRAMA 1: ADMINISTRACIÓN CENTRAL / GESTIÓN INSTITUCIONAL
    # =========================================================================
    desc_p1 = "Fortalecer la gestión institucional mediante la mejora continua de los procesos, la modernización tecnológica, y el fortalecimiento de la transparencia institucional a nivel nacional en el año 2027."
    if p1:
        amp_p1, _ = AccionMedianoPlazo.objects.update_or_create(
            codigo='AMP-P1-01',
            defaults={
                'programa': p1,
                'descripcion': desc_p1,
                'periodo_inicio': 2026,
                'periodo_fin': 2030,
                'estado': True
            }
        )

        for g in gestiones:
            acp_p1, _ = AccionCortoPlazo.objects.update_or_create(
                codigo=f'ACP-P1-01' if len(gestiones) == 1 else f'ACP-P1-{g.anio}',
                defaults={
                    'accion_mediano_plazo': amp_p1,
                    'gestion': g,
                    'descripcion': desc_p1,
                    'estado': True
                }
            )

        # Usar la ACP de la gestión más reciente para enlazar operaciones
        acp_active = AccionCortoPlazo.objects.filter(accion_mediano_plazo=amp_p1).order_by('-gestion__anio').first()

        # --- 1.1 Unidad de Planificación (PL) ---
        area_pl = get_area_by_sigla_or_name('PL', 'Planificaci')
        if area_pl:
            op_pl, _ = Operacion.objects.update_or_create(
                codigo='OP-PL-01',
                defaults={
                    'accion_corto_plazo': acp_active,
                    'area': area_pl,
                    'descripcion': 'Gestionar y coordinar la planificacion y el desarrollo organizacional de la EPTAM, en el marco del SOA y el SPO',
                    'es_contratacion': True,
                    'estado': True
                }
            )
            tareas_pl = [
                'Formular 1 documento del Plan Operativo Anual (POA) 2028 de la EPTAM.',
                'Realizar 12 oficios de seguimiento mensual del POA 2027 de la EPTAM.',
                'Elaborar 1 informe de seguimiento y evaluacion del POA 2026',
                'Atender 220 solicitudes y requerimientos de las Gerencias en materia de planificación y desarrollo organizacional en el marco de la normativa vigente',
                'Realizar 1 formulario de seguimiento y evaluacion al PEE'
            ]
            for idx, t_desc in enumerate(tareas_pl, 1):
                Tarea.objects.update_or_create(
                    codigo=f'TAR-PL-01-{idx:02d}',
                    defaults={'operacion': op_pl, 'descripcion': t_desc, 'estado': True}
                )

        # --- 1.2 Unidad de Auditoría Interna (AI) ---
        area_ai = get_area_by_sigla_or_name('AI', 'Auditoria')
        if area_ai:
            op_ai, _ = Operacion.objects.update_or_create(
                codigo='OP-AI-01',
                defaults={
                    'accion_corto_plazo': acp_active,
                    'area': area_ai,
                    'descripcion': 'Ejecutar el control interno posterior, mediante la realización de trabajos de auditoria de mandato legal y otros programados en base a la evaluación de riesgos de la Empresa Publica Transporte Aéreo Militar; asimismo, aquellas instruidas por las instancias competentes, las cuales permitirán el logro de los objetivos de la empresa.',
                    'es_contratacion': True,
                    'estado': True
                }
            )
            tareas_ai = [
                'Examen de Confiabilidad de Registros Contables y Estados Financieros al 31 de diciembre de 2026',
                'Relevamiento de Información sobre el Cumplimiento de la labor del Comité del Seguimiento de Control Interno de la EPTAM, establecida en las Resoluciones CGE/112/2022 y CGE/114/2022.',
                'Auditoria de Cumplimiento',
                'Actividades de planificación general y específica, y evaluacion de registros para el Examen de Confiabilidad de Registros Contables y Estados Financieros al 31/12/2027',
                'Otras Actividades no Programadas'
            ]
            for idx, t_desc in enumerate(tareas_ai, 1):
                Tarea.objects.update_or_create(
                    codigo=f'TAR-AI-01-{idx:02d}',
                    defaults={'operacion': op_ai, 'descripcion': t_desc, 'estado': True}
                )

        # --- 1.3 Unidad de Transparencia (UT) ---
        area_ut = get_area_by_sigla_or_name('UT', 'Transparencia')
        if area_ut:
            op_ut, _ = Operacion.objects.update_or_create(
                codigo='OP-UT-01',
                defaults={
                    'accion_corto_plazo': acp_active,
                    'area': area_ut,
                    'descripcion': 'Gestionar y fortalecer la implementación de políticas y acciones de transparencia, acceso a la información pública, rendición pública de cuentas, prevención y lucha contra la corrupción en la EPTAM, en el marco de la normativa vigente.',
                    'es_contratacion': True,
                    'estado': True
                }
            )
            tareas_ut = [
                'Organizar y ejecutar la Rendición Pública de Cuentas Final 2026 e Inicial 2027. (4)',
                'Atender, realizar seguimiento y emitir (12) informes sobre las denuncias por presuntos hechos de corrupción y faltas a la ética pública.',
                'Efectuar Programas de Capacitación Induccion a los servidores públicos de la EPTAM, en el marco de la prevención y lucha contra la corrupción y emitir (4) Informes.',
                'Realizar el seguimiento al cumplimiento de las acciones y emitir (4) informes sobre la ética pública y prevención de la corrupción.',
                'Efectuar controles de supervisión a gerencias a nivel nacional de la - EPTAM y emitir (3) Informes, a efectos de verificar el correcto desarrollo de las actividades Operativas.'
            ]
            for idx, t_desc in enumerate(tareas_ut, 1):
                Tarea.objects.update_or_create(
                    codigo=f'TAR-UT-01-{idx:02d}',
                    defaults={'operacion': op_ut, 'descripcion': t_desc, 'estado': True}
                )

        # --- 1.4 Unidad Jurídica (AJ) ---
        area_aj = get_area_by_sigla_or_name('AJ', 'Juridica')
        if area_aj:
            ops_aj = [
                ('OP-AJ-01', 'Interponer demandas de defensa y realizar el seguimiento a procesos laborales, coactivos, penales, civiles y contenciosos.',
                 ['Elaboración de memoriales, notas, coordinación de audiencias y requerimeintos fiscales.']),
                ('OP-AJ-02', 'Responder a trámites administrativos internos o externos, Directorio, así como de la FAB y Ministerios del Área',
                 ['Realizar análisis e interpretación jurídica, a las solicitudes internas, externas y de Directorio']),
                ('OP-AJ-03', 'Seguimiento y defensa de procesos de ejecucion coactiva iniciados por la ATT, coordinación de pagos de procesosos ejecutoriados Y Acciones de repeticion.',
                 ['Seguimiento a los procesos en movimiento, y en apelación en estrados judiciales. Y emitir los informes legales y demas actos administrativos para la acciones de repeticion.']),
                ('OP-AJ-04', 'Suscribir convenios y/o contratos de acuerdo al giro empresarial y comercial de EPTAM',
                 ['Analizar y elaborar, contratos administrativos, comerciales y convenios empresariales de EPTAM.'])
            ]
            for op_cod, op_desc, t_list in ops_aj:
                op_obj, _ = Operacion.objects.update_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_active,
                        'area': area_aj,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )
                for idx, t_desc in enumerate(t_list, 1):
                    Tarea.objects.update_or_create(
                        codigo=f'TAR-{op_cod}-{idx:02d}',
                        defaults={'operacion': op_obj, 'descripcion': t_desc, 'estado': True}
                    )

        # --- 1.5 CIAC ---
        area_ciac = get_area_by_sigla_or_name('CIAC', 'CIAC')
        if area_ciac:
            op_ciac, _ = Operacion.objects.update_or_create(
                codigo='OP-CIAC-01',
                defaults={
                    'accion_corto_plazo': acp_active,
                    'area': area_ciac,
                    'descripcion': 'Planificar, organizar, desarrollar, ejecutar y evaluar programas de formación, capacitación, entrenamiento y actualización dirigidos a alumnos interesados en el campo de la aviación y al personal aeronáutico, asi ampliar y matener las competencias técnicas y profesionales conforme a la normativa aeronáutica nacional e internacional, contribuyendo al desarrollo seguro, eficiente y sostenible del sistema de aviación civil.',
                    'es_contratacion': True,
                    'estado': True
                }
            )
            tareas_ciac = [
                'Coordinar con las diferentes áreas de EPTAM para planificar y estructurar los cursos según los requerimientos operativos.',
                'Diseñar y actualizar los planes de estudio, manuales y material didáctico conforme a la normativa aeronáutica nacional (RAB) e internacional (OACI).',
                'Desarrollar y ejecutar las actividades de capacitación teórica y práctica (presencial, virtual y/o simuladores de vuelo).',
                'Gestionar la emisión de certificados, diplomas y licencias en coordinación con la autoridad aeronáutica civil DGAC.'
            ]
            for idx, t_desc in enumerate(tareas_ciac, 1):
                Tarea.objects.update_or_create(
                    codigo=f'TAR-CIAC-01-{idx:02d}',
                    defaults={'operacion': op_ciac, 'descripcion': t_desc, 'estado': True}
                )

        # --- 1.6 ODECO ---
        area_od = get_area_by_sigla_or_name('OD', 'ODECO')
        if area_od:
            op_od, _ = Operacion.objects.update_or_create(
                codigo='OP-OD-01',
                defaults={
                    'accion_corto_plazo': acp_active,
                    'area': area_od,
                    'descripcion': 'Desarrollar, administrar, controlar y supervisar la Gestión de Reclamaciones Directas y Administrativas, como también, los Proyectos de Gestión de Calidad en el Servicio para la mejora continua; en cumplimiento a las disposiciones emitidas por las autoridades competentes.',
                    'es_contratacion': True,
                    'estado': True
                }
            )
            tareas_od = [
                'Gestionar y realizar el seguimiento continuo a las reclamaciones directas recepcionadas de los usuarios, en el marco de la normativa vigente de la ATT.',
                'Supervisar y gestionar las reclamaciones administrativas interpuestas por los usuarios ante la ATT, coordinando las acciones correspondientes.',
                'Desarrollar, implementar y monitorear proyectos de gestión de calidad orientados a la mejora continua del servicio.'
            ]
            for idx, t_desc in enumerate(tareas_od, 1):
                Tarea.objects.update_or_create(
                    codigo=f'TAR-OD-01-{idx:02d}',
                    defaults={'operacion': op_od, 'descripcion': t_desc, 'estado': True}
                )

        # --- 1.7 Gerencia de Informática (IF) ---
        area_if = get_area_by_sigla_or_name('IF', 'Informatica')
        if area_if:
            ops_if = [
                ('OP-IF-01', 'Brindar soporte técnico (Mantenimiento, preventivo ycorrectivo al parque informatico) de EPTAM',
                 ['Efectuar mantenimiento preventivo al parque informático de la EPTAM (Central y Regionales)',
                  'Atender solicitudes de soporte técnico y mantenimiento correctivo a requerimiento de las diferentes unidades']),
                ('OP-IF-02', 'Renovación del servicio de HOSTING',
                 ['Gestionar la contratación y renovación oportuna del servicio de hosting institucional']),
                ('OP-IF-03', 'Renovación del servicio de DOMINIO de tamep.bo',
                 ['Gestionar la renovación y administración del dominio oficial tamep.bo']),
                ('OP-IF-04', 'Desarrollar el Sistema de Activos Fijos',
                 ['Desarrollar, implementar y capacitar en el Sistema de Control de Activos Fijos de la EPTAM']),
                ('OP-IF-05', 'Desarrollar el Sistema de Control de Asistencia',
                 ['Desarrollar y desplegar el Sistema Biométrico/Web de Control de Asistencia Institucional']),
                ('OP-IF-06', 'Desarrollar el Sistema de SMS',
                 ['Desarrollar e implementar el Sistema de Gestión de Seguridad Operacional (SMS)']),
                ('OP-IF-07', 'Implementar la herramienta Moodle para el CIAC',
                 ['Efectuar las tareas de instalación, maquetación estructural, configuración de servidores y roles en Moodle para el CIAC'])
            ]
            for op_cod, op_desc, t_list in ops_if:
                op_obj, _ = Operacion.objects.update_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_active,
                        'area': area_if,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )
                for idx, t_desc in enumerate(t_list, 1):
                    Tarea.objects.update_or_create(
                        codigo=f'TAR-{op_cod}-{idx:02d}',
                        defaults={'operacion': op_obj, 'descripcion': t_desc, 'estado': True}
                    )

    # =========================================================================
    # PROGRAMA 2: GESTIÓN FINANCIERA Y ADMINISTRATIVA
    # =========================================================================
    desc_p2 = "Fortalecer la gestión financiera de la Empresa Pública Transporte Aéreo Militar mediante la administración eficiente de los recursos, contribuyendo a la sostenibilidad y al desarrollo empresarial en la gestión 2027"
    if p2:
        amp_p2, _ = AccionMedianoPlazo.objects.update_or_create(
            codigo='AMP-P2-01',
            defaults={
                'programa': p2,
                'descripcion': desc_p2,
                'periodo_inicio': 2026,
                'periodo_fin': 2030,
                'estado': True
            }
        )

        for g in gestiones:
            acp_p2, _ = AccionCortoPlazo.objects.update_or_create(
                codigo=f'ACP-P2-01' if len(gestiones) == 1 else f'ACP-P2-{g.anio}',
                defaults={
                    'accion_mediano_plazo': amp_p2,
                    'gestion': g,
                    'descripcion': desc_p2,
                    'estado': True
                }
            )

        acp_active_p2 = AccionCortoPlazo.objects.filter(accion_mediano_plazo=amp_p2).order_by('-gestion__anio').first()

        area_gaa = get_area_by_sigla_or_name('GAA', 'Administrativ')
        if area_gaa:
            ops_gaa = [
                ('OP-GAA-01', 'Gestionar las diferentes actividades de la jefatura administrativa a través de sus secciones en el marco de las normas vigentes',
                 ['Supervisar la administración de bienes, servicios generales, contrataciones y almacenes de la EPTAM']),
                ('OP-GAA-02', 'Gestionar el manejo de los recursos a través de las diferentes secciones dependientes de la jefatura financiera',
                 ['Gestionar la formulación presupuestaria, tesorería, contabilidad y control financiero de la empresa']),
                ('OP-GAA-03', 'Hacer cumplir lo establecido en los reglamentos específicos de las diferentes secciones de la gerencia de asuntos administrativos',
                 ['Aplicar y verificar el cumplimiento del RESAP, RIP, SABS y reglamentos internos administrativos'])
            ]
            for op_cod, op_desc, t_list in ops_gaa:
                op_obj, _ = Operacion.objects.update_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_active_p2,
                        'area': area_gaa,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )
                for idx, t_desc in enumerate(t_list, 1):
                    Tarea.objects.update_or_create(
                        codigo=f'TAR-{op_cod}-{idx:02d}',
                        defaults={'operacion': op_obj, 'descripcion': t_desc, 'estado': True}
                    )

    # =========================================================================
    # PROGRAMA 410: COMERCIALIZACIÓN Y SERVICIOS DE TRANSPORTE AÉREO
    # =========================================================================
    desc_p410 = "Incrementar la participación en el mercado de transporte aéreo de pasajeros, carga y correo, mediante la implementación de estrategias comerciales, a nivel nacional en el año 2027"
    if p410:
        amp_p410, _ = AccionMedianoPlazo.objects.update_or_create(
            codigo='AMP-P410-01',
            defaults={
                'programa': p410,
                'descripcion': desc_p410,
                'periodo_inicio': 2026,
                'periodo_fin': 2030,
                'estado': True
            }
        )

        for g in gestiones:
            acp_p410, _ = AccionCortoPlazo.objects.update_or_create(
                codigo=f'ACP-P410-01' if len(gestiones) == 1 else f'ACP-P410-{g.anio}',
                defaults={
                    'accion_mediano_plazo': amp_p410,
                    'gestion': g,
                    'descripcion': desc_p410,
                    'estado': True
                }
            )

        acp_active_p410 = AccionCortoPlazo.objects.filter(accion_mediano_plazo=amp_p410).order_by('-gestion__anio').first()

        # --- Gerencia Comercial (GC) ---
        area_gc = get_area_by_sigla_or_name('GC', 'Comercial')
        if area_gc:
            ops_gc = [
                ('OP-GC-01', 'Planificar y desarrollar estrategias para la venta de boletos aereos mediante el sitema GDS',
                 ['Analizar, supervisar y optimizar las ventas, demanda e ingresos provenientes de los canales indirectos y externos, mediante el diseño e implementación de estrategias comerciales orientadas a incrementar las ventas directas y fortalecer la fidelización de los usuarios.']),
                ('OP-GC-02', 'Planificar estrategias para captar usuarios que requieran vuelos no regulares (charter).',
                 ['Identificar y contactar empresas e instituciones con potencial demanda de vuelos charter.']),
                ('OP-GC-03', 'Fortalecer la comercializacion de transporte de carga, encomienda y correo',
                 ['Identificar y captar nuevos clientes mediante acciones de promoción y comercialización de los servicios, realizando el seguimiento del volumen de ventas e ingresos generados y proponiendo acciones de mejora para optimizar los resultados comerciales.'])
            ]
            for op_cod, op_desc, t_list in ops_gc:
                op_obj, _ = Operacion.objects.update_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_active_p410,
                        'area': area_gc,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )
                for idx, t_desc in enumerate(t_list, 1):
                    Tarea.objects.update_or_create(
                        codigo=f'TAR-{op_cod}-{idx:02d}',
                        defaults={'operacion': op_obj, 'descripcion': t_desc, 'estado': True}
                    )

        # --- Regionales y Agencias (EA, LP, CB, SC, CIJ, GYA, RIB, TDD) ---
        regionales_info = [
            ('EA', 'El Alto', 'Gerencia Regional El Alto'),
            ('LP', 'La Paz', 'Sucursal La Paz (Agencia Montes)'),
            ('CB', 'Cochabamba', 'Gerencia Regional Cochabamba'),
            ('SC', 'Santa Cruz', 'Gerencia Regional Santa Cruz'),
            ('CIJ', 'Cobija', 'Gerencia Regional Cobija'),
            ('GYA', 'Guayaramerín', 'Agencia Guayaramerín'),
            ('RIB', 'Riberalta', 'Agencia Riberalta'),
            ('TDD', 'Trinidad', 'Agencia Trinidad'),
        ]
        tareas_regionales_base = [
            'Realizar la venta y emisión de pasajes aéreos, la atención al pasajero, elaborar la documentación de descargo de las ventas en el punto de atención, mediante el Sistema de Distribución Global (GDS), conforme a la normativa y procedimientos vigentes.',
            'Coordinación de Operaciones de vuelo (llegada y salida de vuelos comerciales y vuelos no regulares - charter)',
            'Coordinación con NAABOL y demás autoridades aeroportuarias',
            'Reporte por ventas de pasajes, exceso de equipajes, servicios especiales, y carga',
            'DUAS: Derecho Uso de Aeropuerto / Tasas de Aeropuerto',
            'Descargos de Combustible de Aviación',
            'Informes Administrativos: Pedidos de Material de escritorio, de limpieza, informes para consultores en linea.',
            'Descargos ODECO (Devoluciones, demoras y cancelaciones)',
            'Gestión y despacho integral de aeronaves en plataforma y atención al cliente'
        ]

        for reg_sigla, reg_ciudad, reg_nombre in regionales_info:
            area_reg = get_area_by_sigla_or_name(reg_sigla, reg_ciudad)
            if area_reg:
                op_reg, _ = Operacion.objects.update_or_create(
                    codigo=f'OP-{reg_sigla}-01',
                    defaults={
                        'accion_corto_plazo': acp_active_p410,
                        'area': area_reg,
                        'descripcion': f'Gestionar la comercialización de los servicios de transporte aéreo en {reg_nombre} y puntos de atención, mediante la venta y emisión de pasajes, la atención al pasajero, el despacho de aeronaves y el descargo de las operaciones aéreas, según corresponda, a través del GDS y conforme a normativa vigente.',
                        'es_contratacion': True,
                        'estado': True
                    }
                )
                for idx, t_desc in enumerate(tareas_regionales_base, 1):
                    Tarea.objects.update_or_create(
                        codigo=f'TAR-{reg_sigla}-01-{idx:02d}',
                        defaults={'operacion': op_reg, 'descripcion': t_desc, 'estado': True}
                    )

    # =========================================================================
    # PROGRAMA 210: OPERACIONES AERONÁUTICAS Y SEGURIDAD OPERACIONAL
    # =========================================================================
    desc_p210 = "Gestionar la prestación segura, eficiente y continua de las operaciones aeronáuticas mediante la gestión integral de la flota aérea, la aeronavegabilidad continua y el cumplimiento de los estándares de seguridad operacional a nivel nacional en la gestión 2027"
    if p210:
        amp_p210, _ = AccionMedianoPlazo.objects.update_or_create(
            codigo='AMP-P210-01',
            defaults={
                'programa': p210,
                'descripcion': desc_p210,
                'periodo_inicio': 2026,
                'periodo_fin': 2030,
                'estado': True
            }
        )

        for g in gestiones:
            acp_p210, _ = AccionCortoPlazo.objects.update_or_create(
                codigo=f'ACP-P210-01' if len(gestiones) == 1 else f'ACP-P210-{g.anio}',
                defaults={
                    'accion_mediano_plazo': amp_p210,
                    'gestion': g,
                    'descripcion': desc_p210,
                    'estado': True
                }
            )

        acp_active_p210 = AccionCortoPlazo.objects.filter(accion_mediano_plazo=amp_p210).order_by('-gestion__anio').first()

        # --- SMS / Calidad ---
        area_sms = get_area_by_sigla_or_name('SMS', 'SMS') or get_area_by_sigla_or_name('SMS', 'Seguridad')
        if area_sms:
            ops_sms = [
                ('OP-SMS-01', 'Disminuir la ocurrencia de incidentes y eventos mediante una gestión de riesgos basada en enfoques reactivos, proactivos y predictivos.',
                 ['Monitorear mensualmente los SPI, analizar tendencias y eventos, y presentar informes de seguridad al Comité SMS.',
                  'Actualizar matriz de riesgos, dar seguimiento a acciones correctivas y verificar eficacia de mitigaciones implementadas.',
                  'Elaboración del Plan de Vigilancia a la Seguridad Operacional a Nivel Nacional, considerando las Estaciones aprobadas por la DGAC']),
                ('OP-SMS-02', 'Fortalecer el sistema de notificaciones de seguridad operacional asegurando el procesamiento integral de la información y la retroalimentación oportuna para una identificación temprana de peligros.',
                 ['Promover la cultura de reporte, difundir medios de notificación y sensibilizar al personal operativo.',
                  'Analizar reportes, investigar eventos cuando corresponda, emitir retroalimentación y realizar seguimiento.']),
                ('OP-SMS-03', 'Fomentar una cultura de seguridad y competencia técnica mediante programas de capacitación continua, difusión de la política y fortalecimiento de una Cultura Justa.',
                 ['Ejecutar capacitaciones SMS, capacitación en Cultura Justa y evaluar conocimientos adquiridos.',
                  'Emitir boletines, difundir lecciones aprendidas, realizar campañas de sensibilización y reuniones de seguridad.']),
                ('OP-SMS-04', 'Alcanzar un Sistema de Seguridad Operacional que ofrezca un Nivel Aceptable de Seguridad Operacional en la empresa, logrando una implementación operativa y eficaz del SMS.',
                 ['Realizar reuniones del Comité SMS, revisar indicadores SPI/SPT, ejecutar revisión gerencial del SMS y aprobar plan de mejora.',
                  'Ejecutar autoevaluaciones, implementar acciones de mejora y cerrar brechas identificadas.'])
            ]
            for op_cod, op_desc, t_list in ops_sms:
                op_obj, _ = Operacion.objects.update_or_create(
                    codigo=op_cod,
                    defaults={
                        'accion_corto_plazo': acp_active_p210,
                        'area': area_sms,
                        'descripcion': op_desc,
                        'es_contratacion': True,
                        'estado': True
                    }
                )
                for idx, t_desc in enumerate(t_list, 1):
                    Tarea.objects.update_or_create(
                        codigo=f'TAR-{op_cod}-{idx:02d}',
                        defaults={'operacion': op_obj, 'descripcion': t_desc, 'estado': True}
                    )

        # --- Gerencia de Operaciones (GO) ---
        area_go = get_area_by_sigla_or_name('GO', 'Operaciones')
        if area_go:
            op_go, _ = Operacion.objects.update_or_create(
                codigo='OP-GO-01',
                defaults={
                    'accion_corto_plazo': acp_active_p210,
                    'area': area_go,
                    'descripcion': 'Mantener vigente el Certificado de Operador Aéreo (COA) para la operación de vuelos regulares y no regulares de transporte de pasajeros, carga y correo a nivel nacional e internacional.',
                    'es_contratacion': True,
                    'estado': True
                }
            )
            tareas_go = [
                'Gestionar los desplazamientos del personal operativo para inspecciones, auditorías, supervisiones y coordinación con la DGAC dentro del país.',
                'Gestionar viajes del personal de pilotos para capacitación (realizar simulador de vuelo), reuniones técnicas o certificaciones internacionales relacionadas con la operación aérea orientada al cumplimiento de la reglamentacion aeronautica vigente, para mantener vigente el AOC.',
                'Cubrir viáticos del personal que realiza actividad aérea, inspecciones operativas, auditorías y supervisión de bases operacionales nacionales.',
                'Gestionar viáticos del personal que participe en entrenamientos en el exterior (realizar simulador de vuelo) certificaciones o reuniones técnicas internacionales vinculadas con la operación aérea.',
                'Gestionar el traslado del personal operativo hacia aeropuertos, bases y lugares donde se desarrollen actividades relacionadas con nuestras operaciones aereas, garantizando la continuidad de nuestros itinerarios, cumpliendo con los requisitos de tiempos y cantidad de personal para cada operacion, exigido por la Autoridad Aéronautica para mantener vigente el AOC.',
                'Adquirir uniformes, chalecos o prendas institucionales necesarias para el personal operativo en los aeropuertos en donde esta operando la EPTAM.',
                'Dotar al personal operativo con uniformes reglamentarios conforme a la normativa institucional y aeronáutica.',
                'Proveer calzado de seguridad o reglamentario para el personal que desarrolla actividades operacionales en plataforma de aeropuertos en donde esta operando la EPTAM.',
                'Adquirir productos para limpieza de la aeronave, desinfección e insumos farmaceuticos para el equipamiento de los botiquines de las oficinas de aeropuertos.',
                'Adquirir señalización, protectores, recipientes y materiales plásticos utilizados en las áreas operacionales.',
                'Dotar de materiales de limpieza para mantener condiciones adecuadas en las instalaciones operativas de cada aeropuerto y de la aeronave.',
                'Adquirir materiales diversos necesarios como paraguas, sillas de ruedas, que permitan cumplir con los requisitos de facilitacion aeropuertuaria exigida por la Autoridad Aeronautica y la ATT.',
                'Adquirir equipos informáticos para la gestión operativa, planificación de vuelos y administración documental de todas nuestras operaciones aereas.',
                'Dotar al personal con equipos de comunicación que permitan la comunicación y coordinación segura, buscando eficiencia de las operaciones aéreas, requisito de seguridad exigido por la Autoridad Aéronautica, para preservar la vigencia del AOC.',
                'Gestionar la adquisición o renovación de licencias de software aeronáutico, bases de datos, suscripciones aeronauticas, suscripciones de comunicación satelital y publicaciones técnicas, que permitan garantizar los estandares de navegacion, gestion de la informacion y comunicacion con la aeronave desde tierra, requisitos exigidos por la Autoridad Aeronautica.',
                'Contratar personal de consultores especializados para que las operaciones aereas se realicen con los niveles de seguridad operacional aceptables, cumpliendo procedimientos y requisitos ante la autoridad aeronautica necesarios para mantener vigente el AOC.',
                'Programar y ejecutar la capacitación continua del personal de operaciones conforme a la normativa DGAC y manuales aprobados.',
                'Gestionar la contratación y renovación de seguros requeridos para la tripulación que garanticen la covertura de las operaciones aéreas y el cumplimiento normativo.',
                'Gestionar el abastecimiento de combustible y lubricantes para las aeronaves de la EPTAM, vehículos y equipos de apoyo en tierra que garanticen la continuidad de las operaciones aereas y garanticen la vigencia del AOC.',
                'Realizar el mantenimiento de equipos de apoyo en tierra utilizados en las operaciones aéreas.',
                'Elaborar e imprimir manuales operacionales, listas de verificación, Formularios relacionados al despacho, Formularios de la gestion de la informacion de la aeronave, credenciales y documentación requerida por la Autoridad Aeronautica, que permiten realizar las operaciones aereas enmarcados en los lineamientos de AOC.',
                'Cubrir gastos operativos extraordinarios necesarios para mantener la continuidad operacional y el cumplimiento de los requisitos del AOC.',
                'Proveer alimentación al personal durante operativos, inspecciones, auditorías o jornadas prolongadas de trabajo operacional.'
            ]
            for idx, t_desc in enumerate(tareas_go, 1):
                Tarea.objects.update_or_create(
                    codigo=f'TAR-GO-01-{idx:02d}',
                    defaults={'operacion': op_go, 'descripcion': t_desc, 'estado': True}
                )

        # --- Gerencia de Aeronavegabilidad (AE) ---
        area_ae = get_area_by_sigla_or_name('AE', 'Aeronavegabilidad')
        if area_ae:
            op_ae, _ = Operacion.objects.update_or_create(
                codigo='OP-AE-01',
                defaults={
                    'accion_corto_plazo': acp_active_p210,
                    'area': area_ae,
                    'descripcion': 'Mantener vigente el certificado de aeronavegabilidad continua de la aeronave AVRO RJ70 MATRICULA CP3106, ante la Dirección General de Aeronáutica Civil DGAC, dando cumplimiento al PM (Programa de Mantenimiento) y al MCM (Manual de Control de Mantenimiento).',
                    'es_contratacion': True,
                    'estado': True
                }
            )
            tareas_ae = [
                'Inspection "Daily Check"',
                'Inspection "Weekly Check"',
                'Inspection "28 Days Check"',
                'Inspection "500 FC Check" (Inspección por 500 ciclos)',
                'Inspection "A" Check (Inspección por 625 ciclos)'
            ]
            for idx, t_desc in enumerate(tareas_ae, 1):
                Tarea.objects.update_or_create(
                    codigo=f'TAR-AE-01-{idx:02d}',
                    defaults={'operacion': op_ae, 'descripcion': t_desc, 'estado': True}
                )

    print("[+] Sembrado oficial de Planificacion por Programa completado exitosamente.")

if __name__ == '__main__':
    sembrar_planificacion()


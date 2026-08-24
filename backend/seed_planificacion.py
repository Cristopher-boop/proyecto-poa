import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.organizacional.models import Programa, Area
from apps.presupuestos.models import Gestion
from apps.planificacion.models import AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea

def sembrar_planificacion():
    print("[*] Sembrando datos iniciales de Planificacion Estrategica (PEI / POA)...")

    gestion_2026 = Gestion.objects.filter(anio=2026).first() or Gestion.objects.first()
    programa_p1 = Programa.objects.filter(codigo__icontains='P-1').first() or Programa.objects.first()
    programa_p2 = Programa.objects.filter(codigo__icontains='P-2').first() or Programa.objects.first()

    if not programa_p1:
        print("[!] No se encontro ningun programa en BD. Ejecute primero seed_organizacional.")
        return

    # 1. Acciones a Mediano Plazo (PEI - Quinquenio 2026-2030) a nivel de Programa
    amp_1, _ = AccionMedianoPlazo.objects.get_or_create(
        codigo='AMP-01',
        defaults={
            'programa': programa_p1,
            'descripcion': 'Transformacion Digital, Modernizacion Tecno-Institucional y Automatizacion de Procesos TAMEP.',
            'periodo_inicio': 2026,
            'periodo_fin': 2030,
            'estado': True
        }
    )

    amp_2, _ = AccionMedianoPlazo.objects.get_or_create(
        codigo='AMP-02',
        defaults={
            'programa': programa_p2 or programa_p1,
            'descripcion': 'Optimizacion de la Infraestructura Operativa y Seguridad Logistica Institucional.',
            'periodo_inicio': 2026,
            'periodo_fin': 2030,
            'estado': True
        }
    )

    print("  [+] Acciones a Mediano Plazo (PEI) sembradas.")

    # 2. Acciones a Corto Plazo (POA 2026) a nivel de Programa
    acp_1, _ = AccionCortoPlazo.objects.get_or_create(
        codigo='ACP-01.1',
        defaults={
            'accion_mediano_plazo': amp_1,
            'gestion': gestion_2026,
            'descripcion': 'Desarrollo, implementacion e integracion del Sistema Integrado POA-TAMEP para la ejecucion 2026.',
            'estado': True
        }
    )

    acp_2, _ = AccionCortoPlazo.objects.get_or_create(
        codigo='ACP-02.1',
        defaults={
            'accion_mediano_plazo': amp_2,
            'gestion': gestion_2026,
            'descripcion': 'Mantenimiento preventivo, renovacion de licencias y equipamiento informatico de la red nacional.',
            'estado': True
        }
    )

    print("  [+] Acciones a Corto Plazo (POA) sembradas.")

    # 3. Operaciones por Area / Gerencia / Unidad
    area_inf = Area.objects.filter(nombre__icontains='Informatica').first() or Area.objects.first()
    area_adm = Area.objects.filter(nombre__icontains='Administrativ').first() or Area.objects.last()

    op_1, _ = Operacion.objects.get_or_create(
        codigo='OP-INF-01',
        defaults={
            'accion_corto_plazo': acp_1,
            'area': area_inf,
            'descripcion': 'Adquisicion e implementacion de licencias de software, servidores y modulos de desarrollo.',
            'es_contratacion': True,
            'estado': True
        }
    )

    op_2, _ = Operacion.objects.get_or_create(
        codigo='OP-INF-02',
        defaults={
            'accion_corto_plazo': acp_2,
            'area': area_inf,
            'descripcion': 'Mantenimiento de infraestructura tecnologica, insumos de computacion e impresoras.',
            'es_contratacion': True,
            'estado': True
        }
    )

    if area_adm:
        op_3, _ = Operacion.objects.get_or_create(
            codigo='OP-ADM-01',
            defaults={
                'accion_corto_plazo': acp_1,
                'area': area_adm,
                'descripcion': 'Adquisicion de insumos de oficina y soporte administrativo para la gestion operativa.',
                'es_contratacion': True,
                'estado': True
            }
        )

    print("  [+] Operaciones por Area sembradas.")

    # 4. Tareas (Desglose de correlacion TAMEP)
    Tarea.objects.get_or_create(
        codigo='TAR-INF-01.1',
        defaults={
            'operacion': op_1,
            'descripcion': 'Licenciamiento de motores de base de datos y herramientas de desarrollo para la plataforma POA.'
        }
    )

    Tarea.objects.get_or_create(
        codigo='TAR-INF-02.1',
        defaults={
            'operacion': op_2,
            'descripcion': 'Adquisicion de impresoras laser multifuncionales y toners para unidades de gestion.'
        }
    )

    print("  [+] Tareas de correlacion TAMEP sembradas.")
    print("\n[+] Sembrado de Planificacion Estrategica finalizado con exito.")

if __name__ == '__main__':
    sembrar_planificacion()

import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.organizacional.models import Programa, Area, Seccion
from apps.presupuestos.models import Gestion, Partida, PresupuestoArea
from apps.usuarios.models import Usuario, Rol
from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria, RegistroMemoriaUsuario
from apps.ejecucion.models import Gasto

def sembrar_datos():
    print("[*] Sembrando datos base (Programas, Areas, Secciones, Gestiones)...")

    # 1. Programa
    prg, _ = Programa.objects.get_or_create(
        codigo='PRG-01',
        defaults={
            'nombre': 'Gestion Institucional y Operativa',
            'descripcion': 'Programa matriz de funcionamiento y administracion institucional'
        }
    )

    # 2. Areas y Secciones
    areas_data = [
        {
            'codigo': 'INF',
            'nombre': 'Gerencia de Tecnologias de la Informacion',
            'tipo': Area.TipoArea.GERENCIA,
            'secciones': ['Desarrollo de Sistemas', 'Infraestructura y Telecomunicaciones']
        },
        {
            'codigo': 'ADM',
            'nombre': 'Gerencia Administrativa y Financiera',
            'tipo': Area.TipoArea.GERENCIA,
            'secciones': ['Contabilidad y Presupuestos', 'Adquisiciones y Servicios Generales']
        },
        {
            'codigo': 'COM',
            'nombre': 'Gerencia Comercial',
            'tipo': Area.TipoArea.GERENCIA,
            'secciones': ['Ventas y Mercadeo']
        },
        {
            'codigo': 'PLAN',
            'nombre': 'Unidad de Planificacion Estrategica',
            'tipo': Area.TipoArea.UNIDAD,
            'secciones': ['Planificacion Operativa y POA']
        }
    ]

    secciones_map = {}
    for ad in areas_data:
        area_obj, _ = Area.objects.get_or_create(
            codigo=ad['codigo'],
            defaults={
                'programa': prg,
                'nombre': ad['nombre'],
                'tipo': ad['tipo'],
                'descripcion': f'Area institucional {ad["nombre"]}'
            }
        )
        for sec_name in ad['secciones']:
            sec_obj, _ = Seccion.objects.get_or_create(
                area=area_obj,
                nombre=sec_name,
                defaults={'descripcion': f'Seccion {sec_name}'}
            )
            secciones_map[sec_name] = sec_obj

    # 3. Gestiones
    g2026, _ = Gestion.objects.get_or_create(
        anio=2026,
        defaults={'estado': Gestion.EstadoGestion.EN_EJECUCION}
    )
    g2027, _ = Gestion.objects.get_or_create(
        anio=2027,
        defaults={'estado': Gestion.EstadoGestion.FORMULACION}
    )

    print("[+] Estructura organizacional y gestiones sembradas correctamente.")

if __name__ == '__main__':
    sembrar_datos()

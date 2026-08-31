import os
import django
from pathlib import Path
from django.db import connection
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario


# Archivos fuente versionados fuera de la carpeta del proyecto, entregados por
# Planificación. Se pueden reemplazar mediante variables de entorno sin tocar
# el código del reinicio.
PROJECT_DIR = Path(__file__).resolve().parent
SOURCE_DIR = PROJECT_DIR.parent if (PROJECT_DIR.parent / '27.7 consolidado general 2027 (1).xlsx').is_file() else PROJECT_DIR.parent.parent
CONSOLIDADO_2027 = Path(os.getenv(
    'POA_2027_CONSOLIDADO',
    SOURCE_DIR / '27.7 consolidado general 2027 (1).xlsx'
))
OPERACIONES_2027 = Path(os.getenv(
    'POA_2027_OPERACIONES',
    SOURCE_DIR / 'OPERACION-PRESUPUESTO 2027 (2).xlsx'
))
AREAS_2027 = (
    'PL', 'UT', 'AI', 'AJ', 'CIAC', 'OD', 'IF', 'GAA', 'GC', 'GO',
    'AE', 'SMS', 'EA', 'LP', 'CB', 'SC', 'CIJ', 'GYA', 'RIB', 'TDD',
)
# Estas áreas no tienen correlación completa (operación/mes) en el Excel de
# requerimientos. Sus importes se restauran desde el consolidado autorizado.
AREAS_PRIORIDAD_CONSOLIDADO = {
    'GAA', 'AE', 'EA', 'LP', 'CB', 'SC', 'CIJ', 'GYA', 'RIB', 'TDD',
}


def reset():
    print("=" * 60)
    print(" REINICIO BASE DE DATOS - POA GESTIÓN 2027")
    print("=" * 60)

    # ────────────────────────────────────────────────────────────
    # PASO 1: Eliminar TODAS las tablas (DROP TABLE)
    # ────────────────────────────────────────────────────────────
    print("\n[1/5] Eliminando todas las tablas existentes...")
    with connection.cursor() as cursor:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        db_tables = connection.introspection.table_names()
        for table in db_tables:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS `{table}`;")
                print(f"  [DROP] '{table}'")
            except Exception as e:
                print(f"  [!] Error al eliminar '{table}': {e}")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("  [OK] Todas las tablas eliminadas.")

    # ────────────────────────────────────────────────────────────
    # PASO 2: Recrear el esquema aplicando todas las migraciones
    # ────────────────────────────────────────────────────────────
    print("\n[2/5] Recreando esquema desde cero (migrate)...")
    try:
        call_command('migrate', '--run-syncdb', verbosity=1)
        print("  [OK] Migraciones aplicadas. Esquema recreado con IDs desde 1.")
    except Exception as e:
        print(f"  [!] Error al migrar: {e}")
        return

    # ────────────────────────────────────────────────────────────
    # PASO 3: Crear usuario administrador por defecto
    # ────────────────────────────────────────────────────────────
    print("\n[3/5] Creando usuario superadministrador por defecto...")
    try:
        admin = Usuario.objects.create_superuser(
            username='admin',
            email='admin@poa.com',
            password='admin',
            first_name='Super',
            last_name='Administrador'
        )
        print(f"  [OK] Usuario '{admin.username}' creado (Contrasena: 'admin').")
    except Exception as e:
        print(f"  [!] Error al crear superusuario: {e}")

    # ────────────────────────────────────────────────────────────
    # PASO 4: Datos oficiales POA 2027 únicamente
    # ────────────────────────────────────────────────────────────
    print("\n[4/5] Cargando datos semilla oficiales...")

    print("  [*] Catalogo de partidas presupuestarias (INGRESO / EGRESO)...")
    try:
        call_command('import_partidas')
        print("  [OK] Partidas importadas.")
    except Exception as e:
        print(f"  [!] Error en import_partidas: {e}")

    if not CONSOLIDADO_2027.is_file() or not OPERACIONES_2027.is_file():
        print("  [!] No se encontraron los Excel oficiales POA 2027.")
        print(f"      Consolidado: {CONSOLIDADO_2027}")
        print(f"      Operaciones: {OPERACIONES_2027}")
        print("      La base fue recreada, pero la carga POA no puede continuar.")
        return

    print("  [*] Estructura, planificación, memorias y presupuestos POA 2027...")
    try:
        for area in AREAS_2027:
            print(f"      - Importando área {area}...")
            call_command(
                'importar_poa_2027',
                area=area,
                consolidado=str(CONSOLIDADO_2027),
                operaciones=str(OPERACIONES_2027),
                prioridad_consolidado=area in AREAS_PRIORIDAD_CONSOLIDADO,
                apply=True,
            )
        print("  [OK] 20 áreas y 254 memorias POA 2027 cargadas.")
    except Exception as e:
        print(f"  [!] Error al importar POA 2027: {e}")
        return

    print("  [*] Consolidando justificaciones múltiples desde el Excel...")
    try:
        call_command(
            'actualizar_justificaciones_poa_2027',
            areas=list(AREAS_2027),
            consolidado=str(CONSOLIDADO_2027),
            apply=True,
        )
        print("  [OK] Justificaciones actualizadas.")
    except Exception as e:
        print(f"  [!] Error al actualizar justificaciones: {e}")
        return

    print("  [*] Usuarios de prueba por Rol (SoyAprobador, SoyGerenteI, SoyElaboradorI, SoyTrabajadorI)...")
    try:
        from seed_test_users import sembrar_usuarios_prueba
        sembrar_usuarios_prueba()
        print("  [OK] Usuarios de prueba sembrados.")
    except Exception as e:
        print(f"  [!] Error en seed_test_users: {e}")

    # ────────────────────────────────────────────────────────────
    # RESUMEN FINAL
    # ────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("[5/5] RESUMEN - Base de datos reiniciada exitosamente")
    print("=" * 60)
    try:
        from apps.organizacional.models import Area, Seccion, Programa
        from apps.presupuestos.models import Partida
        from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria

        print(f"  Programas    : {Programa.objects.count()}")
        print(f"  Areas        : {Area.objects.count()}")
        print(f"  Secciones    : {Seccion.objects.count()}")
        print(f"  Partidas     : {Partida.objects.count()} "
              f"(INGRESO: {Partida.objects.filter(clase='INGRESO').count()}, "
              f"EGRESO: {Partida.objects.filter(clase='EGRESO').count()})")
        print(f"  Memorias     : {MemoriaCalculo.objects.count()}")
        print(f"  Detalles     : {DetallePresupuestoMemoria.objects.count()}")
        print(f"  Usuarios     : {Usuario.objects.count()}")
    except Exception as e:
        print(f"  [!] No se pudo generar el resumen: {e}")

    print("\n  Credenciales de acceso:")
    print("    Usuario   : admin")
    print("    Contrasena: admin")
    print("=" * 60)


if __name__ == '__main__':
    reset()

import os
import django
from django.db import connection
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario


def reset():
    print("=" * 60)
    print(" REINICIO COMPLETO DE BASE DE DATOS - PROYECTO POA")
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
    # PASO 4: Semillas de datos oficiales
    # ────────────────────────────────────────────────────────────
    print("\n[4/5] Cargando datos semilla oficiales...")

    print("  [*] Estructura organizacional (programas, areas, secciones)...")
    try:
        call_command('seed_organizacional')
        print("  [OK] Datos organizacionales cargados.")
    except Exception as e:
        print(f"  [!] Error en seed_organizacional: {e}")

    print("  [*] Catalogo de partidas presupuestarias (INGRESO / EGRESO)...")
    try:
        call_command('import_partidas')
        print("  [OK] Partidas importadas.")
    except Exception as e:
        print(f"  [!] Error en import_partidas: {e}")

    print("  [*] Memorias de calculo oficiales desde Excel TAMEP...")
    try:
        call_command('seed_memorias')
        print("  [OK] Memorias de calculo cargadas.")
    except Exception as e:
        print(f"  [!] Error en seed_memorias: {e}")

    print("  [*] Recalculando y poblando saldos de memorias y detalles...")
    try:
        call_command('recalcular_saldos')
        print("  [OK] Saldos calculados y guardados.")
    except Exception as e:
        print(f"  [!] Error en recalcular_saldos: {e}")

    print("  [*] Planificacion Estrategica (PEI / POA por Programa)...")
    try:
        from seed_planificacion import sembrar_planificacion
        sembrar_planificacion()
        print("  [OK] Planificacion sembrada.")
    except Exception as e:
        print(f"  [!] Error en seed_planificacion: {e}")

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

import os
import sys
import django
from django.db import connection
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario

def reset():
    print("[*] Iniciando el reinicio completo de la base de datos...")
    
    # 1. Obtener todas las tablas de la base de datos
    with connection.cursor() as cursor:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        # Obtener nombres de las tablas
        db_tables = connection.introspection.table_names()
        
        print("[*] Vaciando todas las tablas (TRUNCATE) para reiniciar los contadores ID a 1...")
        for table in db_tables:
            # Evitar tocar tablas internas de migraciones si se quiere conservar el historial de esquema,
            # pero dado que queremos vaciar TODO e iniciar de 0, truncamos todo excepto django_migrations
            if table == 'django_migrations':
                continue
            try:
                cursor.execute(f"TRUNCATE TABLE `{table}`;")
                print(f"  [-] Tabla '{table}' vaciada con éxito.")
            except Exception as e:
                print(f"  [!] Error al vaciar '{table}': {e}")
                
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        
    print("\n[+] Base de datos vaciada con éxito (IDs reiniciados a 1).")

    # 2. Re-crear usuario Administrador por defecto
    print("\n[*] Creando usuario superadministrador por defecto...")
    try:
        admin = Usuario.objects.create_superuser(
            username='admin',
            email='admin@poa.com',
            password='admin',
            first_name='Super',
            last_name='Administrador'
        )
        print(f"  [+] Usuario '{admin.username}' creado exitosamente (Contraseña: 'admin').")
    except Exception as e:
        print(f"  [!] Error al crear superusuario: {e}")

    # 3. Correr seeders de datos iniciales
    print("\n[*] Cargando datos organizacionales oficiales...")
    try:
        call_command('seed_organizacional')
    except Exception as e:
        print(f"  [!] Error al cargar datos organizacionales: {e}")

    print("\n[*] Importando catálogo oficial de partidas presupuestarias...")
    try:
        call_command('import_partidas')
    except Exception as e:
        print(f"  [!] Error al importar partidas: {e}")

    print("\n[*] Poblando base de datos con memorias y presupuestos oficiales (seed_memorias)...")
    try:
        call_command('seed_memorias')
    except Exception as e:
        print(f"  [!] Error al poblar memorias: {e}")

    print("\n[SUCCESS] ¡Base de datos reiniciada de 0 exitosamente!")
    print("  - Usuario: admin")
    print("  - Contrasena: admin")

if __name__ == '__main__':
    reset()

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario, Rol

def sembrar_usuario_admin():
    print("🌱 Verificando y poblando usuario administrador por defecto...")
    
    # 1. Crear o recuperar el Rol Administrador
    rol_admin, creado_rol = Rol.objects.get_or_create(
        nombre='Administrador',
        defaults={'descripcion': 'Acceso total y administración del sistema POA'}
    )
    if creado_rol:
        print("  ✅ Rol 'Administrador' creado.")

    # 2. Crear o recuperar el Superusuario admin / admin
    if not Usuario.objects.filter(username='admin').exists():
        Usuario.objects.create_superuser(
            username='admin',
            email='admin@poa.local',
            password='admin',
            first_name='Administrador',
            last_name='General',
            rol=rol_admin,
            cargo='Administrador del Sistema'
        )
        print("  ✅ Superusuario 'admin' con contraseña 'admin' creado exitosamente.")
    else:
        print("  ℹ️ El usuario 'admin' ya existía en tu base de datos.")

    print("\n🎉 ¡Listo! Ya puedes ingresar a http://127.0.0.1:8000/admin/ con 'admin' / 'admin'.")

if __name__ == '__main__':
    sembrar_usuario_admin()

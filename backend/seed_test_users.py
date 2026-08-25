import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario, Rol
from apps.organizacional.models import Seccion

def sembrar_usuarios_prueba():
    print("[*] Sembrando usuarios de prueba para roles y areas...")

    # 1. Asegurar la existencia de los roles
    roles_def = [
        ('Aprobador', 'Acceso general y aprobacion institucional presupuestaria'),
        ('Planificación', 'Aprobador de Planificacion, SPO y verificacion de Operaciones/POA'),
        ('Gerente', 'Gestion y aprobacion a nivel de Area/Gerencia'),
        ('Elaborador', 'Formulacion de memorias de calculo de su Area'),
        ('Trabajador', 'Solo lectura de presupuestos y memorias de su Area'),
        ('Administrador', 'Acceso total y administracion'),
    ]

    roles_map = {}
    for r_nombre, r_desc in roles_def:
        rol_obj, _ = Rol.objects.get_or_create(
            nombre=r_nombre,
            defaults={'descripcion': r_desc}
        )
        roles_map[r_nombre] = rol_obj

    # 2. Buscar Secciones de Informatica, Planificacion y Administrativos
    sec_inf = Seccion.objects.filter(nombre__icontains='Informatica').first()
    sec_pla = Seccion.objects.filter(nombre__icontains='Planificac').first() or sec_inf
    sec_adm = Seccion.objects.filter(nombre__icontains='Administrativ').first() or Seccion.objects.first()

    # 3. Definir usuarios de prueba solicitados
    test_users = [
        {
            'username': 'SoyElaboradorI',
            'password': '12345678',
            'first_name': 'Elaborador',
            'last_name': 'Informatica',
            'email': 'elaborador_inf@poa.local',
            'rol': roles_map.get('Elaborador'),
            'seccion': sec_inf,
            'cargo': 'Elaborador de Informatica',
        },
        {
            'username': 'SoyTrabajadorI',
            'password': '12345678',
            'first_name': 'Trabajador',
            'last_name': 'Informatica',
            'email': 'trabajador_inf@poa.local',
            'rol': roles_map.get('Trabajador'),
            'seccion': sec_inf,
            'cargo': 'Trabajador de Informatica',
        },
        {
            'username': 'SoyGerenteI',
            'password': '12345678',
            'first_name': 'Gerente',
            'last_name': 'Informatica',
            'email': 'gerente_inf@poa.local',
            'rol': roles_map.get('Gerente'),
            'seccion': sec_inf,
            'cargo': 'Gerente de Informatica',
        },
        {
            'username': 'SoyPlanificador',
            'password': '12345678',
            'first_name': 'Planificador',
            'last_name': 'Institucional',
            'email': 'planificador@poa.local',
            'rol': roles_map.get('Planificación'),
            'seccion': sec_pla,
            'cargo': 'Aprobador de Planificación SPO',
        },
        {
            'username': 'SoyAprobador',
            'password': '12345678',
            'first_name': 'Aprobador',
            'last_name': 'Presupuestos',
            'email': 'aprobador@poa.local',
            'rol': roles_map.get('Aprobador'),
            'seccion': sec_adm,
            'cargo': 'Aprobador Presupuestario Final',
        },
    ]

    for udata in test_users:
        raw_password = udata.pop('password')
        username = udata['username']
        user, created = Usuario.objects.get_or_create(
            username=username,
            defaults=udata
        )
        # Asegurar contrasenia y datos actualizados
        user.set_password(raw_password)
        for key, val in udata.items():
            setattr(user, key, val)
        user.save()
        status_msg = "creado" if created else "actualizado"
        print(f"  [+] Usuario '{username}' ({user.rol.nombre if user.rol else 'Sin Rol'}) {status_msg} con contrasenia '12345678'.")

    print("\n[+] Poblado de usuarios de prueba completado exitosamente.")

if __name__ == '__main__':
    sembrar_usuarios_prueba()

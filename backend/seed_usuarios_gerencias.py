"""
Script para poblar y actualizar perfiles de usuario institucionales para TODAS las gerencias del POA.
Contraseña unificada para todos los usuarios: 1234.
"""
import os
import sys
import django

# Configurar encoding para consola Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario, Rol
from apps.organizacional.models import Area, Seccion

PASSWORD_DEFAULT = '1234'

def ejecutar_seed():
    print("=" * 80)
    print("  POBLADO DE PERFILES DE USUARIO INSTITUCIONALES - SISTEMA POA")
    print(f"  Contraseña unificada para todos: '{PASSWORD_DEFAULT}'")
    print("=" * 80)

    # 1. Asegurar la existencia de los Roles institucionales
    roles_config = [
        ('ADMINISTRADOR', 'Acceso total y administración del sistema'),
        ('PRESUPUESTOS', 'Responsable de Presupuestos y techos institucionales POA (Lic. Acha)'),
        ('PLANIFICACIÓN', 'Aprobador de Planificación, SPO y verificación de Operaciones/POA'),
        ('TESORERÍA', 'Control de desembolsos y pagos institucionales'),
        ('GERENTE', 'Aprobación y gestión presupuestaria a nivel de Gerencia/Área'),
        ('ELABORADOR', 'Formulación de memorias de cálculo y requerimientos del Área'),
        ('TRABAJADOR', 'Consulta y seguimiento operativo del Área'),
    ]

    # Si existía el rol APROBADOR antiguo, renombrarlo o unificarlo a PRESUPUESTOS
    r_antiguo = Rol.objects.filter(nombre='APROBADOR').first()
    r_nuevo = Rol.objects.filter(nombre='PRESUPUESTOS').first()
    if r_antiguo and not r_nuevo:
        r_antiguo.nombre = 'PRESUPUESTOS'
        r_antiguo.descripcion = 'RESPONSABLE DE PRESUPUESTOS Y TECHOS INSTITUCIONALES POA (LIC. ACHA)'
        r_antiguo.save()
    elif r_antiguo and r_nuevo:
        Usuario.objects.filter(rol=r_antiguo).update(rol=r_nuevo)
        r_antiguo.delete()

    roles_map = {}
    for r_nom, r_desc in roles_config:
        rol_obj, _ = Rol.objects.get_or_create(
            nombre=r_nom.upper(),
            defaults={'descripcion': r_desc.upper()}
        )
        roles_map[r_nom.upper()] = rol_obj

    # Eliminar usuario 'aprobador' obsoleto
    Usuario.objects.filter(username='aprobador').delete()

    print("\n[+] Roles institucionales listos:")
    for r_nom, r_obj in roles_map.items():
        print(f"    - {r_nom} (ID: {r_obj.id})")

    # 2. Usuarios Globales / Superusuarios (sin área obligatoria)
    super_usuarios = [
        {
            'username': 'admin',
            'rol': roles_map['ADMINISTRADOR'],
            'cargo': 'Superadministrador del Sistema',
            'first_name': 'Administrador',
            'last_name': 'General',
            'email': 'admin@eptam.bo',
            'is_superuser': True,
            'is_staff': True,
            'seccion': None,
        },
        {
            'username': 'presupuestos',
            'rol': roles_map['PRESUPUESTOS'],
            'cargo': 'Responsable de Presupuestos (Lic. Acha)',
            'first_name': 'Lic. Acha',
            'last_name': 'Presupuestos',
            'email': 'presupuestos@eptam.bo',
            'is_superuser': False,
            'is_staff': True,
            'seccion': None,
        },
        {
            'username': 'planificacion',
            'rol': roles_map['PLANIFICACIÓN'],
            'cargo': 'Jefe de Planificación Institucional',
            'first_name': 'Planificación',
            'last_name': 'SPO',
            'email': 'planificacion@eptam.bo',
            'is_superuser': False,
            'is_staff': True,
            'seccion': None,
        },
        {
            'username': 'tesoreria',
            'rol': roles_map['TESORERÍA'],
            'cargo': 'Responsable de Tesorería',
            'first_name': 'Lic. Zaida',
            'last_name': 'Tesorería',
            'email': 'tesoreria@eptam.bo',
            'is_superuser': False,
            'is_staff': True,
            'seccion': None,
        },
    ]

    print("\n[+] Configurando usuarios globales/superusuarios...")
    for udata in super_usuarios:
        u_name = udata['username'].lower()
        user = Usuario.objects.filter(username=u_name).first()
        if not user:
            user = Usuario(username=u_name)

        user.rol = udata['rol']
        user.cargo = udata['cargo']
        user.first_name = udata['first_name']
        user.last_name = udata['last_name']
        user.email = udata['email']
        user.is_superuser = udata['is_superuser']
        user.is_staff = udata['is_staff']
        user.seccion = udata['seccion']
        user.estado = True
        user.set_password(PASSWORD_DEFAULT)
        user.save()
        print(f"    [OK] {u_name.ljust(15)} | Rol: {user.rol.nombre.ljust(15)} | Clave: {PASSWORD_DEFAULT}")

    # 3. Usuarios de TODAS las Gerencias (20 Áreas)
    areas = Area.objects.all().order_by('id')
    print(f"\n[+] Configurando perfiles para las {areas.count()} gerencias/unidades...")
    print("-" * 80)
    print(f"{'ÁREA':<35} | {'SIGLA':<6} | {'ELABORADOR':<12} | {'GERENTE':<12} | {'TRABAJADOR':<12}")
    print("-" * 80)

    total_creados_areas = 0

    for area in areas:
        # Extraer sigla característica (ej. P-2-GAA -> GAA, P-410-CIJ -> CIJ)
        sigla = area.codigo.split('-')[-1].upper()
        sigla_lower = sigla.lower()

        # Obtener o asegurar sección
        seccion = area.secciones.first()
        if not seccion:
            seccion = Seccion.objects.create(
                area=area,
                nombre=f"Sección Operativa - {area.nombre}",
                descripcion=f"Sección general de {area.nombre}",
                estado=True
            )

        roles_por_area = [
            (
                f"elab_{sigla_lower}",
                roles_map['ELABORADOR'],
                f"Elaborador POA - {area.nombre}",
                "Elaborador",
                sigla,
                f"elab.{sigla_lower}@eptam.bo"
            ),
            (
                f"ger_{sigla_lower}",
                roles_map['GERENTE'],
                f"Gerente / Responsable - {area.nombre}",
                "Gerente",
                sigla,
                f"ger.{sigla_lower}@eptam.bo"
            ),
            (
                f"trab_{sigla_lower}",
                roles_map['TRABAJADOR'],
                f"Personal Operativo - {area.nombre}",
                "Trabajador",
                sigla,
                f"trab.{sigla_lower}@eptam.bo"
            ),
        ]

        row_users = {}
        for u_name, rol_obj, cargo_desc, f_name, l_name, email_val in roles_por_area:
            user = Usuario.objects.filter(username=u_name).first()
            if not user:
                user = Usuario(username=u_name)

            user.rol = rol_obj
            user.seccion = seccion
            user.cargo = cargo_desc
            user.first_name = f_name
            user.last_name = l_name
            user.email = email_val
            user.is_superuser = False
            user.is_staff = False
            user.estado = True
            user.set_password(PASSWORD_DEFAULT)
            user.save()
            row_users[rol_obj.nombre] = u_name
            total_creados_areas += 1

        nombre_recortado = (area.nombre[:33] + '..') if len(area.nombre) > 35 else area.nombre
        print(
            f"{nombre_recortado:<35} | {sigla:<6} | {row_users['ELABORADOR']:<12} | {row_users['GERENTE']:<12} | {row_users['TRABAJADOR']:<12}"
        )

    # 4. Actualizar contraseñas de usuarios legacy a 1234
    legacy_usernames = ['soyelaboradori', 'soytrabajadori', 'soygerentei', 'soyplanificador', 'soyaprobador', 'soytesoreria']
    for leg_user in legacy_usernames:
        u = Usuario.objects.filter(username=leg_user).first()
        if u:
            u.set_password(PASSWORD_DEFAULT)
            u.save()

    print("-" * 80)
    print(f"\n[OK] Proceso completado exitosamente:")
    print(f"    - {len(super_usuarios)} Usuarios globales (admin, presupuestos, planificacion, tesoreria)")
    print(f"    - {total_creados_areas} Perfiles de Gerencias ({areas.count()} áreas × 3 roles: Elaborador, Gerente, Trabajador)")
    print(f"    - Contraseña para TODOS los perfiles: '{PASSWORD_DEFAULT}'")
    print("=" * 80)

if __name__ == '__main__':
    ejecutar_seed()

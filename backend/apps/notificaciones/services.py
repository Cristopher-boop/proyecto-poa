from django.utils import timezone
from django.db.models import Q
from .models import Notificacion
from apps.usuarios.models import Usuario

def crear_notificacion(usuario_destino, titulo, mensaje, tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE, enlace=None, usuario_origen=None):
    """
    Función utilitaria para emitir notificaciones individuales.
    """
    if not usuario_destino:
        return None
    return Notificacion.objects.create(
        usuario_destino=usuario_destino,
        usuario_origen=usuario_origen,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        enlace=enlace
    )

def notificar_rol(rol_nombre, titulo, mensaje, tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE, enlace=None, usuario_origen=None):
    """
    Notifica a todos los usuarios con un rol específico.
    Tolera mayúsculas/minúsculas, acentos (Planificación / Planificacion) y roles administrativos.
    """
    norm_name = rol_nombre.upper().strip()
    clean_name = norm_name.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
    
    filtro_rol = Q(rol__nombre__iexact=rol_nombre) | Q(rol__nombre__iexact=clean_name)
    
    if 'PLANIFIC' in clean_name:
        filtro_rol = filtro_rol | Q(rol__nombre__icontains='planific')
    elif 'APROBAD' in clean_name:
        filtro_rol = filtro_rol | Q(rol__nombre__icontains='aprob') | Q(rol__nombre__icontains='admin') | Q(is_superuser=True)
    elif 'GERENT' in clean_name:
        filtro_rol = filtro_rol | Q(rol__nombre__icontains='geren')
    elif 'ELABORAD' in clean_name:
        filtro_rol = filtro_rol | Q(rol__nombre__icontains='elaborad')

    usuarios = Usuario.objects.filter(filtro_rol, is_active=True).distinct()
    notifs = []
    for u in usuarios:
        if usuario_origen and u.id == usuario_origen.id:
            continue
        notifs.append(Notificacion(
            usuario_destino=u,
            usuario_origen=usuario_origen,
            titulo=titulo,
            mensaje=mensaje,
            tipo=tipo,
            enlace=enlace
        ))
    if notifs:
        Notificacion.objects.bulk_create(notifs)
    return len(notifs)

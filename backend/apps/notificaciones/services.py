from django.utils import timezone
from .models import Notificacion
from apps.usuarios.models import Usuario

def crear_notificacion(usuario_destino, titulo, mensaje, tipo=Notificacion.TipoNotificacion.REVISION_PENDIENTE, enlace=None, usuario_origen=None):
    """
    Función utilitaria para emitir notificaciones individuales.
    """
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
    Notifica a todos los usuarios con un rol específico (ej. 'Gerente', 'Planificación', 'Aprobador').
    """
    usuarios = Usuario.objects.filter(rol__nombre__iexact=rol_nombre, is_active=True)
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

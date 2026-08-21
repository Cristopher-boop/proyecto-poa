import inspect
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.contrib.contenttypes.models import ContentType
from apps.memorias.models import MemoriaCalculo
from django.contrib.auth import get_user_model

Usuario = get_user_model()

def get_current_user():
    for frame_record in inspect.stack():
        if frame_record[3] == 'get_response':
            request = frame_record[0].f_locals.get('request')
            if request and hasattr(request, 'user'):
                return request.user
    return None

@receiver(post_save, sender=MemoriaCalculo)
def log_memoria_save(sender, instance, created, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated:
        user = Usuario.objects.filter(is_superuser=True).first()
        
    if not user:
        return

    LogEntry.objects.log_action(
        user_id=user.id,
        content_type_id=ContentType.objects.get_for_model(instance).pk,
        object_id=instance.pk,
        object_repr=str(instance),
        action_flag=ADDITION if created else CHANGE,
        change_message=f"Memoria de cálculo {'creada' if created else 'modificada'}: {instance.codigo}"
    )

@receiver(post_delete, sender=MemoriaCalculo)
def log_memoria_delete(sender, instance, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated:
        user = Usuario.objects.filter(is_superuser=True).first()

    if not user:
        return

    LogEntry.objects.log_action(
        user_id=user.id,
        content_type_id=ContentType.objects.get_for_model(instance).pk,
        object_id=instance.pk,
        object_repr=str(instance),
        action_flag=DELETION,
        change_message=f"Memoria de cálculo eliminada: {instance.codigo}"
    )

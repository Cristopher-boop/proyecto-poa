from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.contrib.contenttypes.models import ContentType
from apps.memorias.models import MemoriaCalculo

def get_system_user_id():
    from apps.usuarios.models import Usuario
    user = Usuario.objects.filter(is_superuser=True).first()
    return user.id if user else 1

@receiver(post_save, sender=MemoriaCalculo)
def log_memoria_save(sender, instance, created, **kwargs):
    action_flag = ADDITION if created else CHANGE
    message = 'Creado' if created else f'Actualizado (Estado: {instance.get_estado_display()})'
    
    # Intenta obtener el usuario que modificó (difícil sin request en signals, usamos 1)
    # Lo ideal sería usar middleware o registrar en la vista, pero para simplicidad usamos un signal general.
    user_id = get_system_user_id()
        
    LogEntry.objects.create(
        user_id=user_id,
        content_type_id=ContentType.objects.get_for_model(instance).id,
        object_id=instance.id,
        object_repr=f"Memoria {instance.codigo}",
        action_flag=action_flag,
        change_message=message
    )

@receiver(post_delete, sender=MemoriaCalculo)
def log_memoria_delete(sender, instance, **kwargs):
    user_id = get_system_user_id()
    LogEntry.objects.create(
        user_id=user_id,
        content_type_id=ContentType.objects.get_for_model(instance).id,
        object_id=instance.id,
        object_repr=f"Memoria {instance.codigo}",
        action_flag=DELETION,
        change_message="Eliminado"
    )

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from django.contrib.contenttypes.models import ContentType

def get_system_user_id():
    from apps.usuarios.models import Usuario
    user = Usuario.objects.filter(is_superuser=True).first() or Usuario.objects.first()
    return user.id if user else None


# --- MEMORIAS DE CÁLCULO ---
@receiver(post_save, sender='memorias.MemoriaCalculo')
def log_memoria_save(sender, instance, created, **kwargs):
    try:
        user_id = get_system_user_id()
        if hasattr(instance, 'participaciones'):
            part = instance.participaciones.filter(tipo_participacion='ELABORADOR').first()
            if part and part.usuario_id:
                user_id = part.usuario_id

        if not user_id:
            return

        action_flag = ADDITION if created else CHANGE
        message = f"Memoria {instance.codigo} creada (Estado: {instance.get_estado_display()})" if created else f"Memoria {instance.codigo} actualizada (Estado: {instance.get_estado_display()})"

        LogEntry.objects.create(
            user_id=user_id,
            content_type_id=ContentType.objects.get_for_model(instance).id,
            object_id=str(instance.id),
            object_repr=f"Memoria {instance.codigo}",
            action_flag=action_flag,
            change_message=message
        )
    except Exception as e:
        print("Error en log_memoria_save:", e)

@receiver(post_delete, sender='memorias.MemoriaCalculo')
def log_memoria_delete(sender, instance, **kwargs):
    try:
        user_id = get_system_user_id()
        if not user_id:
            return

        LogEntry.objects.create(
            user_id=user_id,
            content_type_id=ContentType.objects.get_for_model(instance).id,
            object_id=str(instance.id),
            object_repr=f"Memoria {instance.codigo}",
            action_flag=DELETION,
            change_message=f"Memoria {instance.codigo} eliminada del sistema"
        )
    except Exception as e:
        print("Error en log_memoria_delete:", e)


# --- GASTOS EJECUTADOS ---
@receiver(post_save, sender='ejecucion.Gasto')
def log_gasto_save(sender, instance, created, **kwargs):
    try:
        user_id = instance.usuario_registro_id or get_system_user_id()
        if not user_id:
            return

        action_flag = ADDITION if created else CHANGE
        comp = f" | Comp. N° {instance.comprobante_num}" if instance.comprobante_num else ""
        mem_code = instance.memoria.codigo if instance.memoria else "Sin Memoria"
        message = f"Registro de Gasto: Bs. {instance.monto_ejecutado:,.2f} en {mem_code}{comp}" if created else f"Gasto modificado: Bs. {instance.monto_ejecutado:,.2f} en {mem_code}"

        LogEntry.objects.create(
            user_id=user_id,
            content_type_id=ContentType.objects.get_for_model(instance).id,
            object_id=str(instance.id),
            object_repr=f"Gasto Bs. {instance.monto_ejecutado} ({mem_code})",
            action_flag=action_flag,
            change_message=message
        )
    except Exception as e:
        print("Error en log_gasto_save:", e)

@receiver(post_delete, sender='ejecucion.Gasto')
def log_gasto_delete(sender, instance, **kwargs):
    try:
        user_id = instance.usuario_registro_id or get_system_user_id()
        if not user_id:
            return

        mem_code = instance.memoria.codigo if instance.memoria else "Sin Memoria"
        LogEntry.objects.create(
            user_id=user_id,
            content_type_id=ContentType.objects.get_for_model(instance).id,
            object_id=str(instance.id),
            object_repr=f"Gasto Bs. {instance.monto_ejecutado} ({mem_code})",
            action_flag=DELETION,
            change_message=f"Gasto de Bs. {instance.monto_ejecutado} revertido/eliminado de {mem_code}"
        )
    except Exception as e:
        print("Error en log_gasto_delete:", e)


# --- TRASPASOS PRESUPUESTARIOS ---
@receiver(post_save, sender='memorias.TraspasoPresupuestario')
def log_traspaso_save(sender, instance, created, **kwargs):
    try:
        user_id = instance.usuario_registro_id or get_system_user_id()
        if not user_id:
            return

        action_flag = ADDITION if created else CHANGE
        origen = instance.memoria_origen.codigo if instance.memoria_origen else "?"
        destino = instance.memoria_destino.codigo if instance.memoria_destino else "?"

        LogEntry.objects.create(
            user_id=user_id,
            content_type_id=ContentType.objects.get_for_model(instance).id,
            object_id=str(instance.id),
            object_repr=f"Traspaso Bs. {instance.monto} ({origen} -> {destino})",
            action_flag=action_flag,
            change_message=f"Traspaso Presupuestario registrado: Bs. {instance.monto:,.2f} ({origen} hacia {destino}). Motivo: {instance.motivo[:120]}"
        )
    except Exception as e:
        print("Error en log_traspaso_save:", e)


# --- CERTIFICACIONES POA ---
@receiver(post_save, sender='ejecucion.CertificacionPOA')
def log_certificacion_save(sender, instance, created, **kwargs):
    try:
        user_id = instance.creado_por_id or get_system_user_id()
        if not user_id:
            return

        action_flag = ADDITION if created else CHANGE
        area_nom = instance.area.nombre if instance.area else "Área Institucional"

        LogEntry.objects.create(
            user_id=user_id,
            content_type_id=ContentType.objects.get_for_model(instance).id,
            object_id=str(instance.id),
            object_repr=f"Certificación {instance.codigo_certificacion}",
            action_flag=action_flag,
            change_message=f"Certificación POA {instance.codigo_certificacion} ({area_nom}) - Estado: {instance.get_estado_display()}"
        )
    except Exception as e:
        print("Error en log_certificacion_save:", e)


# --- GESTIONES FISCALES ---
@receiver(post_save, sender='presupuestos.Gestion')
def log_gestion_save(sender, instance, created, **kwargs):
    try:
        user_id = get_system_user_id()
        if not user_id:
            return

        action_flag = ADDITION if created else CHANGE
        LogEntry.objects.create(
            user_id=user_id,
            content_type_id=ContentType.objects.get_for_model(instance).id,
            object_id=str(instance.id),
            object_repr=f"Gestión Fiscal {instance.anio}",
            action_flag=action_flag,
            change_message=f"Gestión {instance.anio}: Cambio a estado '{instance.get_estado_display()}'"
        )
    except Exception as e:
        print("Error en log_gestion_save:", e)


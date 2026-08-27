from django.core.management.base import BaseCommand
from apps.usuarios.models import Rol, Usuario
from apps.organizacional.models import Programa, Area, Seccion
from apps.planificacion.models import AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea
from apps.presupuestos.models import Gestion, Partida, PresupuestoArea
from apps.memorias.models import MemoriaCalculo, TraspasoPresupuestario, RegistroMemoriaUsuario, DetallePresupuestoMemoria
from apps.notificaciones.models import Notificacion
from apps.ejecucion.models import Gasto

class Command(BaseCommand):
    help = 'Convierte todos los textos de la base de datos a MAYUSCULAS (salvo username, email y passwords)'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando conversion de la base de datos a MAYUSCULAS...')

        # 1. Roles
        count = 0
        for r in Rol.objects.all():
            r.save()
            count += 1
        self.stdout.write(f'  [OK] Roles actualizados: {count}')

        # 2. Usuarios
        count = 0
        for u in Usuario.objects.all():
            u.save()
            count += 1
        self.stdout.write(f'  [OK] Usuarios actualizados: {count}')

        # 3. Organizacional: Programa, Area, Seccion
        count = 0
        for p in Programa.objects.all():
            p.save()
            count += 1
        for a in Area.objects.all():
            a.save()
            count += 1
        for s in Seccion.objects.all():
            s.save()
            count += 1
        self.stdout.write(f'  [OK] Estructura Organizacional actualizada: {count}')

        # 4. Planificación: AMP, ACP, Operacion, Tarea
        count = 0
        for amp in AccionMedianoPlazo.objects.all():
            amp.save()
            count += 1
        for acp in AccionCortoPlazo.objects.all():
            acp.save()
            count += 1
        for op in Operacion.objects.all():
            op.save()
            count += 1
        for t in Tarea.objects.all():
            t.save()
            count += 1
        self.stdout.write(f'  [OK] Planificacion (PEI/POA) actualizada: {count}')

        # 5. Presupuestos: Gestion, Partida, PresupuestoArea
        count = 0
        for g in Gestion.objects.all():
            g.save()
            count += 1
        for p in Partida.objects.all():
            p.save()
            count += 1
        for pa in PresupuestoArea.objects.all():
            pa.save()
            count += 1
        self.stdout.write(f'  [OK] Catalogo Presupuestario actualizado: {count}')

        # 6. Memorias: MemoriaCalculo, DetallePresupuestoMemoria, Traspasos, RegistroMemoriaUsuario
        count = 0
        for m in MemoriaCalculo.objects.all():
            m.save()
            count += 1
        for d in DetallePresupuestoMemoria.objects.all():
            d.save()
            count += 1
        for tr in TraspasoPresupuestario.objects.all():
            tr.save()
            count += 1
        for reg in RegistroMemoriaUsuario.objects.all():
            reg.save()
            count += 1
        self.stdout.write(f'  [OK] Memorias de Calculo actualizadas: {count}')

        # 7. Notificaciones
        count = 0
        for n in Notificacion.objects.all():
            n.save()
            count += 1
        self.stdout.write(f'  [OK] Notificaciones actualizadas: {count}')

        # 8. Ejecución (Gastos)
        count = 0
        for g in Gasto.objects.all():
            g.save()
            count += 1
        self.stdout.write(f'  [OK] Gastos de Ejecucion actualizados: {count}')

        self.stdout.write('Conversion completa! Todos los registros ahora estan en MAYUSCULAS.')

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.memorias.models import MemoriaCalculo
from apps.memorias.utils import recalcular_saldos_memoria

class Command(BaseCommand):
    help = 'Recalcula los saldos almacenados de todas las Memorias de Cálculo'

    def handle(self, *args, **options):
        memorias = MemoriaCalculo.objects.all()
        total = memorias.count()
        self.stdout.write(f"Recalculando saldos de {total} memorias...")

        with transaction.atomic():
            for i, memoria in enumerate(memorias, 1):
                recalcular_saldos_memoria(memoria)
                if i % 50 == 0:
                    self.stdout.write(f"  {i}/{total} procesadas...")

        self.stdout.write(self.style.SUCCESS(f"OK: {total} memorias recalculadas exitosamente."))

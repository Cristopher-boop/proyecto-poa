from django.core.management.base import BaseCommand
from seed_usuarios_gerencias import ejecutar_seed

class Command(BaseCommand):
    help = 'Puebla y actualiza perfiles de usuario institucionales para TODAS las gerencias con clave 1234.'

    def handle(self, *args, **options):
        ejecutar_seed()
        self.stdout.write(self.style.SUCCESS('Poblado de usuarios de gerencias finalizado con éxito.'))

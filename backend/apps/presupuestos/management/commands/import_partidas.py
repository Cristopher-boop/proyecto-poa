import csv
from pathlib import Path

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.presupuestos.models import Partida

CLASE_MAP = {
    'ingreso': Partida.ClasePartida.INGRESO,
    'egreso': Partida.ClasePartida.EGRESO,
    'gasto_corriente': Partida.ClasePartida.EGRESO,
    'gasto_capital': Partida.ClasePartida.EGRESO,
}


class Command(BaseCommand):
    help = "Importa/actualiza Partidas Presupuestarias desde un CSV (delimitador ';')."

    def add_arguments(self, parser):
        default_path = Path(apps.get_app_config('presupuestos').path) / 'data' / 'partidas_presupuestarias.csv'
        parser.add_argument(
            'csv_path',
            type=str,
            nargs='?',
            default=str(default_path),
            help="Ruta al archivo CSV (por defecto: apps/presupuestos/data/partidas_presupuestarias.csv)",
        )

    def handle(self, *args, **options):
        path = Path(options['csv_path'])
        if not path.exists():
            raise CommandError(f"No se encontró el archivo: {path}")

        # Dedup por (codigo, clase): se prioriza la fila con descripción no vacía
        registros = {}
        omitidos = 0

        with open(path, encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f, delimiter=';')

            columnas_requeridas = {'partida', 'nombre', 'descripsion', 'clase'}
            if not columnas_requeridas.issubset(set(reader.fieldnames or [])):
                raise CommandError(
                    f"El CSV debe tener las columnas {columnas_requeridas}. "
                    f"Encontradas: {reader.fieldnames}"
                )

            for numero_fila, row in enumerate(reader, start=2):  # 2 = primera fila de datos (1 es cabecera)
                codigo = (row.get('partida') or '').strip()
                clase_csv = (row.get('clase') or '').strip().lower()
                nombre = (row.get('nombre') or '').strip()
                descripcion = (row.get('descripsion') or '').strip()

                if not codigo or not nombre:
                    self.stderr.write(self.style.WARNING(
                        f"Fila {numero_fila}: código o nombre vacío, se omite."
                    ))
                    omitidos += 1
                    continue

                clase = CLASE_MAP.get(clase_csv)
                if clase is None:
                    self.stderr.write(self.style.WARNING(
                        f"Fila {numero_fila}: clase desconocida '{clase_csv}' en código {codigo}, se omite."
                    ))
                    omitidos += 1
                    continue

                key = (codigo, clase)
                existente = registros.get(key)

                # Si ya existe un registro para esta clave, nos quedamos con el que
                # tenga descripción no vacía (o el primero, si ninguno la tiene).
                if existente is None:
                    registros[key] = {'nombre': nombre, 'descripcion': descripcion, 'clase': clase}
                elif not existente['descripcion'] and descripcion:
                    registros[key] = {'nombre': nombre, 'descripcion': descripcion, 'clase': clase}

        creados = 0
        actualizados = 0

        with transaction.atomic():
            for (codigo, clase), data in registros.items():
                obj, created = Partida.objects.update_or_create(
                    codigo=codigo,
                    clase=clase,
                    defaults={
                        'nombre': data['nombre'],
                        'descripcion': data['descripcion'] or None,
                    },
                )
                if created:
                    creados += 1
                else:
                    actualizados += 1

        self.stdout.write(self.style.SUCCESS(
            f"Importación completa desde {path}\n"
            f"  Creados:      {creados}\n"
            f"  Actualizados: {actualizados}\n"
            f"  Omitidos:     {omitidos}\n"
            f"  Total únicos: {len(registros)}"
        ))
"""Actualiza justificaciones de memorias 2027 desde las filas del consolidado."""

import json
import re
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.memorias.management.commands.importar_poa_2027 import AREAS, Command as ImportCommand
from apps.memorias.models import MemoriaCalculo


class Command(BaseCommand):
    help = 'Compone la justificación numerada de memorias con varios renglones desde el consolidado POA 2027.'

    def add_arguments(self, parser):
        parser.add_argument('--areas', nargs='+', required=True, choices=sorted(AREAS))
        parser.add_argument('--consolidado', required=True)
        parser.add_argument('--apply', action='store_true', help='Sin esta opción solo genera el reporte de cambios propuestos.')
        parser.add_argument('--report', help='Ruta opcional del reporte JSON.')

    def handle(self, *args, **options):
        source = Path(options['consolidado']).expanduser().resolve()
        if not source.is_file():
            raise CommandError(f'No se encontró el archivo: {source}')

        reader = ImportCommand()
        changes, skipped = [], []
        for area in options['areas']:
            for memory_data in reader._read_memories(source, area):
                # Las memorias de un solo renglón se dejan sin tocar, por
                # indicación del usuario. Para varias filas se incluyen solo
                # justificaciones existentes, respetando el orden del Excel.
                if len(memory_data['items']) < 2:
                    skipped.append({'hoja': memory_data['hoja'], 'motivo': 'Un solo renglón'})
                    continue
                texts = [item['justificacion'].strip() for item in memory_data['items'] if item['justificacion'].strip()]
                if len(texts) < 2:
                    skipped.append({'hoja': memory_data['hoja'], 'motivo': 'Menos de dos justificaciones en el Excel'})
                    continue
                sheet_code = re.sub(r'\s+', '', memory_data['hoja'])
                code = f"MEM-2027-{sheet_code}"
                try:
                    memory = MemoriaCalculo.objects.get(codigo=code, gestion__anio=2027)
                except MemoriaCalculo.DoesNotExist as exc:
                    raise CommandError(f'No existe en la base de datos: {code}') from exc
                proposed = '\n\n'.join(f'{number}- {value}' for number, value in enumerate(texts, start=1))
                if memory.justificacion == proposed:
                    skipped.append({'hoja': memory_data['hoja'], 'motivo': 'Ya actualizada'})
                    continue
                changes.append({'area': area, 'hoja': memory_data['hoja'], 'codigo': code, 'justificaciones': len(texts), 'anterior': memory.justificacion, 'nueva': proposed})

        report = {'areas': options['areas'], 'actualizadas': len(changes) if options['apply'] else 0, 'propuestas': len(changes), 'omitidas': len(skipped), 'cambios': changes, 'omitidas_detalle': skipped}
        if options['apply']:
            with transaction.atomic():
                for change in changes:
                    MemoriaCalculo.objects.filter(codigo=change['codigo'], gestion__anio=2027).update(justificacion=change['nueva'])
            self.stdout.write(self.style.SUCCESS(f"Actualizadas {len(changes)} memorias."))
        else:
            self.stdout.write(self.style.WARNING(f"Simulación: {len(changes)} cambios propuestos; no se escribió nada."))

        for change in changes:
            self.stdout.write(f"  {change['hoja']}: {change['justificaciones']} justificaciones")
        if options.get('report'):
            path = Path(options['report']).expanduser().resolve()
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
            self.stdout.write(f'Reporte guardado en: {path}')

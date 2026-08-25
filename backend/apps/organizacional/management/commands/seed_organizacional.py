import uuid
from django.core.management.base import BaseCommand
from apps.organizacional.models import Programa, Area, Seccion

class Command(BaseCommand):
    help = 'Puebla la base de datos con los Programas, Áreas y Secciones iniciales'

    def handle(self, *args, **kwargs):
        data = {
            "1": {
                "nombre": "Programa 1",
                "areas": [
                    "Unidad Planificación",
                    "Unidad Transparencia",
                    "Unidad Auditoria Int",
                    "Unidad de Juridica",
                    "CIAC",
                    "ODECO",
                    "Gerencia de Informatica"
                ]
            },
            "2": {
                "nombre": "Programa 2",
                "areas": [
                    "Gerencia de Asuntos Administrativos",
                ]
            },
            "410": {
                "nombre": "Programa 410",
                "areas": [
                    "Gerencia Comercial",
                    "Sucursal La Paz (Agencia Montes)",
                    "Gerencia Regional Santa Cruz",
                    "Gerencia Regional Cochabamba",
                    "Gerencia Regional Cobija",
                    "Gerencia Regional El Alto"
                ]
            },
            "210": {
                "nombre": "Programa 210",
                "areas": [
                    "Gerencia de Operaciones",
                    "Gerencia de Aereonavegabilidad",
                    "Gerencia de SMS (AVSEC)"
                ]
            }
        }

        self.stdout.write(self.style.WARNING("Iniciando carga de datos organizacionales..."))

        for cod_programa, prog_data in data.items():
            # Crear o actualizar el Programa
            programa, created = Programa.objects.get_or_create(
                codigo=cod_programa,
                defaults={'nombre': prog_data['nombre']}
            )
            
            status_prog = "Creado" if created else "Ya existía"
            self.stdout.write(self.style.SUCCESS(f"[*] {status_prog}: {programa}"))

            for area_nombre in prog_data['areas']:
                # Determinar si es GERENCIA o UNIDAD
                tipo_area = Area.TipoArea.GERENCIA if "Gerencia" in area_nombre else Area.TipoArea.UNIDAD
                
                # Crear un código único simple basado en el nombre para el Área
                area_codigo = f"P-{cod_programa}-{area_nombre[:4].upper()}-{uuid.uuid4().hex[:4].upper()}"

                # Buscar si el área ya existe (por nombre dentro de este programa)
                area = Area.objects.filter(programa=programa, nombre=area_nombre).first()
                if not area:
                    area = Area.objects.create(
                        programa=programa,
                        codigo=area_codigo,
                        nombre=area_nombre,
                        tipo=tipo_area
                    )
                    self.stdout.write(f"    - Creada Área: {area.nombre} ({area.tipo})")
                else:
                    self.stdout.write(f"    - Ya existía Área: {area.nombre}")

                # Crear su Sección correspondiente
                seccion, sec_created = Seccion.objects.get_or_create(
                    area=area,
                    nombre=area.nombre, # Misma nombre que el área según indicación
                )
                if sec_created:
                    self.stdout.write(f"      -> Creada Sección: {seccion.nombre}")

        self.stdout.write(self.style.SUCCESS("\n¡Carga de datos organizacionales completada exitosamente!"))

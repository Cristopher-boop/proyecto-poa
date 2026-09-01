from django.core.management.base import BaseCommand
from apps.organizacional.models import Programa, Area, Seccion

class Command(BaseCommand):
    help = 'Puebla la base de datos con los Programas, Áreas y Secciones oficiales'

    def handle(self, *args, **kwargs):
        data = {
            "1": {
                "nombre": "Programa 1 - Administración Central",
                "areas": [
                    ("PL", "Unidad de Planificación", Area.TipoArea.UNIDAD),
                    ("UT", "Unidad de Transparencia", Area.TipoArea.UNIDAD),
                    ("AI", "Unidad de Auditoría Interna", Area.TipoArea.UNIDAD),
                    ("AJ", "Unidad Jurídica", Area.TipoArea.UNIDAD),
                    ("CIAC", "CIAC", Area.TipoArea.UNIDAD),
                    ("OD", "ODECO", Area.TipoArea.UNIDAD),
                    ("IF", "Gerencia de Informática", Area.TipoArea.GERENCIA),
                ]
            },
            "2": {
                "nombre": "Programa 2 - Gestión Financiera",
                "areas": [
                    ("GAA", "Gerencia de Asuntos Administrativos", Area.TipoArea.GERENCIA),
                ]
            },
            "410": {
                "nombre": "Programa 410 - Servicios de Transporte Aéreo",
                "areas": [
                    ("GC", "Gerencia Comercial", Area.TipoArea.GERENCIA),
                    ("EA", "Gerencia Regional El Alto", Area.TipoArea.GERENCIA),
                    ("LP", "Sucursal La Paz (Agencia Montes)", Area.TipoArea.UNIDAD),
                    ("CB", "Gerencia Regional Cochabamba", Area.TipoArea.GERENCIA),
                    ("SC", "Gerencia Regional Santa Cruz", Area.TipoArea.GERENCIA),
                    ("CIJ", "Gerencia Regional Cobija", Area.TipoArea.GERENCIA),
                    ("GYA", "Agencia Guayaramerín", Area.TipoArea.UNIDAD),
                    ("RIB", "Agencia Riberalta", Area.TipoArea.UNIDAD),
                    ("TDD", "Agencia Trinidad", Area.TipoArea.UNIDAD),
                ]
            },
            "210": {
                "nombre": "Programa 210 - Operaciones Flota EPTAM",
                "areas": [
                    ("GO", "Gerencia de Operaciones", Area.TipoArea.GERENCIA),
                    ("AE", "Gerencia de Aeronavegabilidad", Area.TipoArea.GERENCIA),
                    ("SMS", "Gerencia de SMS (AVSEC)", Area.TipoArea.GERENCIA),
                ]
            }
        }

        self.stdout.write(self.style.WARNING("Iniciando carga de datos organizacionales..."))

        for cod_programa, prog_data in data.items():
            programa, created = Programa.objects.get_or_create(
                codigo=cod_programa,
                defaults={'nombre': prog_data['nombre']}
            )
            status_prog = "Creado" if created else "Ya existía"
            self.stdout.write(self.style.SUCCESS(f"[*] {status_prog}: {programa}"))

            for area_sigla, area_nombre, tipo_area in prog_data['areas']:
                area_codigo = f"P-{cod_programa}-{area_sigla}"

                area = Area.objects.filter(programa=programa, nombre=area_nombre).first()
                if not area:
                    area = Area.objects.filter(codigo=area_codigo).first()

                if not area:
                    area = Area.objects.create(
                        programa=programa,
                        codigo=area_codigo,
                        nombre=area_nombre,
                        tipo=tipo_area
                    )
                    self.stdout.write(f"    - Creada Área: [{area.codigo}] {area.nombre} ({area.tipo})")
                else:
                    area.codigo = area_codigo
                    area.nombre = area_nombre
                    area.tipo = tipo_area
                    area.save()
                    self.stdout.write(f"    - Actualizada Área: [{area.codigo}] {area.nombre}")

                seccion, sec_created = Seccion.objects.get_or_create(
                    area=area,
                    nombre=area.nombre,
                )
                if sec_created:
                    self.stdout.write(f"      -> Creada Sección: {seccion.nombre}")

        self.stdout.write(self.style.SUCCESS("\n¡Carga de datos organizacionales completada exitosamente!"))

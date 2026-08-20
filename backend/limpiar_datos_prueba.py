import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.memorias.models import MemoriaCalculo, DetallePresupuestoMemoria, RegistroMemoriaUsuario
from apps.ejecucion.models import Gasto
from apps.presupuestos.models import PresupuestoArea

def limpiar_datos():
    print("[*] Limpiando datos de prueba...")
    
    # 1. Eliminar gastos ejecutados de prueba
    gastos_count = Gasto.objects.count()
    Gasto.objects.all().delete()
    print(f"  [-] {gastos_count} gastos eliminados.")

    # 2. Eliminar detalles y participaciones de memorias
    detalles_count = DetallePresupuestoMemoria.objects.count()
    DetallePresupuestoMemoria.objects.all().delete()
    
    participaciones_count = RegistroMemoriaUsuario.objects.count()
    RegistroMemoriaUsuario.objects.all().delete()

    # 3. Eliminar memorias de calculo
    memorias_count = MemoriaCalculo.objects.count()
    MemoriaCalculo.objects.all().delete()
    print(f"  [-] {memorias_count} memorias de calculo eliminadas.")

    # 4. Eliminar techos de prueba de presupuesto
    techos_count = PresupuestoArea.objects.count()
    PresupuestoArea.objects.all().delete()
    print(f"  [-] {techos_count} techos de presupuesto de area eliminados.")

    print("\n[+] Base de datos limpia: Partidas presupuestarias, Estructura Organizacional y Usuarios preservados.")

if __name__ == '__main__':
    limpiar_datos()

"""
Wrapper de compatibilidad: ejecuta el sembrado completo de usuarios institucionales de gerencias y roles globales.
"""
from seed_usuarios_gerencias import ejecutar_seed

def sembrar_usuarios_prueba():
    ejecutar_seed()

if __name__ == '__main__':
    sembrar_usuarios_prueba()

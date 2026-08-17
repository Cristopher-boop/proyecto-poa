from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)

@admin.register(Usuario)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'seccion', 'cargo', 'estado')
    list_filter = ('rol', 'estado', 'seccion__area')
    fieldsets = UserAdmin.fieldsets + (
        ('Datos Institucionales POA', {'fields': ('rol', 'seccion', 'cargo', 'estado')}),
    )

# Generated for Tesorería and Gasto automation

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ejecucion', '0010_certificacionpoa_categoria_programatica_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='certificacionpoa',
            name='desembolsado_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='certificaciones_desembolsadas', to=settings.AUTH_USER_MODEL, verbose_name='Desembolsado por (Tesorería)'),
        ),
        migrations.AddField(
            model_name='certificacionpoa',
            name='fecha_desembolso',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Fecha de Desembolso / Pago'),
        ),
        migrations.AddField(
            model_name='certificacionpoa',
            name='comprobante_pago',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='Nº Comprobante de Pago / Transacción'),
        ),
        migrations.AddField(
            model_name='gasto',
            name='certificacion',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='gastos', to='ejecucion.certificacionpoa', verbose_name='Certificación POA Origen'),
        ),
        migrations.AlterField(
            model_name='certificacionpoa',
            name='estado',
            field=models.CharField(choices=[('BORRADOR', 'Borrador (Solicitud)'), ('PENDIENTE_PLANIFICACION', 'En Revisión (Planificación)'), ('PENDIENTE_PRESUPUESTOS', 'En Revisión (Presupuestos)'), ('PENDIENTE_TESORERIA', 'En Tesorería (Por Desembolsar)'), ('APROBADO', 'Aprobado y Pagado'), ('OBSERVADO', 'Observado / Devuelto'), ('RECHAZADO', 'Rechazado'), ('ANULADO', 'Cancelado / Anulado')], default='BORRADOR', max_length=30, verbose_name='Estado'),
        ),
    ]

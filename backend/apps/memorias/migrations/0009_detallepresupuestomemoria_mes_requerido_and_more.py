# Generated manually for the POA 2027 import.

from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('memorias', '0008_memoriacalculo_es_contratacion'),
    ]

    operations = [
        migrations.AddField(
            model_name='detallepresupuestomemoria',
            name='mes_requerido',
            field=models.CharField(blank=True, default='', help_text='Periodo de requerimiento registrado en la determinación de requerimientos POA.', max_length=120, verbose_name='Mes requerido'),
        ),
        migrations.AddField(
            model_name='detallepresupuestomemoria',
            name='fuente_excel',
            field=models.CharField(blank=True, default='', help_text='Hoja del consolidado desde la cual se importó el detalle.', max_length=120, verbose_name='Hoja fuente Excel'),
        ),
        migrations.AddField(
            model_name='detallepresupuestomemoria',
            name='factor_calculo',
            field=models.DecimalField(decimal_places=4, default=Decimal('1.0000'), help_text='Multiplicador necesario para reflejar el total de la fila de origen (por ejemplo, 12 meses).', max_digits=10, verbose_name='Factor de cálculo'),
        ),
    ]

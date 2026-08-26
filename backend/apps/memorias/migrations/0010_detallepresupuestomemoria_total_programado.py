from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('memorias', '0009_detallepresupuestomemoria_mes_requerido_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='detallepresupuestomemoria',
            name='total_programado',
            field=models.DecimalField(decimal_places=4, default=Decimal('0.0000'), help_text='Importe exacto de la fila del Excel fuente.', max_digits=14, verbose_name='Total programado'),
        ),
    ]

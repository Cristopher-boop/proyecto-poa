from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('presupuestos', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='partida',
            name='clase',
            field=models.CharField(
                choices=[
                    ('GASTO_CORRIENTE', 'Gasto Corriente'),
                    ('GASTO_CAPITAL', 'Gasto de Capital / Inversión'),
                    ('INGRESO', 'Ingreso'),
                    ('GASTO', 'Gasto (sin clasificar)'),
                ],
                default='GASTO_CORRIENTE',
                max_length=25,
                verbose_name='Clase',
            ),
        ),
    ]
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('planificacion', '0002_tarea_estado'),
        ('presupuestos', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='accioncortoplazo',
            name='codigo',
            field=models.CharField(max_length=20, verbose_name='Código ACP'),
        ),
        migrations.AlterUniqueTogether(
            name='accioncortoplazo',
            unique_together={('codigo', 'gestion')},
        ),
    ]

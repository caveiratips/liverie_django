from django.db import migrations, models


def seed_default_statuses(apps, schema_editor):
    OrderStatus = apps.get_model('shop', 'OrderStatus')
    defaults = [
        ("pending", "Pendente", 10),
        ("paid", "Pago", 20),
        ("separation", "Em separação", 30),
        ("shipped", "Enviado", 40),
        ("delivered", "Entregue", 50),
    ]
    for key, label, sort in defaults:
        OrderStatus.objects.update_or_create(key=key, defaults={"label": label, "sort_order": sort, "is_active": True})


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0008_order_orderitem'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.SlugField(max_length=24, unique=True)),
                ('label', models.CharField(max_length=60)),
                ('sort_order', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['sort_order', 'label'],
            },
        ),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(default='pending', max_length=40),
        ),
        migrations.RunPython(seed_default_statuses, migrations.RunPython.noop),
    ]
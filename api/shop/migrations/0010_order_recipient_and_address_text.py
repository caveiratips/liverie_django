from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0009_orderstatus_and_order_status_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='recipient_name',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.AddField(
            model_name='order',
            name='shipping_address_text',
            field=models.TextField(blank=True, default=''),
        ),
    ]
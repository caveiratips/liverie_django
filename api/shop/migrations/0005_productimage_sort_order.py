from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0004_product_free_shipping'),
    ]

    operations = [
        migrations.AddField(
            model_name='productimage',
            name='sort_order',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name='productimage',
            options={'ordering': ['sort_order', '-created_at']},
        ),
    ]
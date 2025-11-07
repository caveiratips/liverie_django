from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0010_order_recipient_and_address_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="available_colors",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="product",
            name="available_sizes",
            field=models.TextField(blank=True, default=""),
        ),
    ]
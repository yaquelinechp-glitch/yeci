from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("prm", "0025_opportunity_currency_opportunity_custom_currency_and_more"),
    ]

    operations = [
        migrations.RenameField(model_name="product", old_name="price", new_name="price_usd"),
        migrations.RemoveField(model_name="product", name="currency"),
        migrations.AddField(
            model_name="product",
            name="price_eur",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="product",
            name="price_chf",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="product",
            name="price_otro",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AlterField(
            model_name="product",
            name="custom_currency",
            field=models.CharField(blank=True, default="", help_text="Nombre de la moneda para price_otro", max_length=20),
        ),
    ]

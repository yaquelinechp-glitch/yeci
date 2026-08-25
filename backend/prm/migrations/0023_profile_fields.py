import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("prm", "0022_product_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="partner",
            name="avatar",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="partner",
            name="first_name",
            field=models.CharField(default="", max_length=200),
        ),
        migrations.AddField(
            model_name="partner",
            name="last_name",
            field=models.CharField(default="", max_length=200),
        ),
        migrations.AddField(
            model_name="partner",
            name="username",
            field=models.CharField(default="", max_length=100),
        ),
        migrations.AddField(
            model_name="partneruser",
            name="avatar",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="partneruser",
            name="first_name",
            field=models.CharField(default="", max_length=200),
        ),
        migrations.AddField(
            model_name="partneruser",
            name="last_name",
            field=models.CharField(default="", max_length=200),
        ),
        migrations.AddField(
            model_name="partneruser",
            name="username",
            field=models.CharField(default="", max_length=100),
        ),
    ]

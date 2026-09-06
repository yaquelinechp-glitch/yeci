from django.db import migrations


def seed_iniciado(apps, schema_editor):
    PartnerType = apps.get_model("prm", "PartnerType")
    PartnerType.objects.update_or_create(
        key="iniciado",
        defaults={
            "label": "Iniciado",
            "default_commission_rate": 0.0,
            "is_active": True,
            "sort_order": 4,
        },
    )


def unseed_iniciado(apps, schema_editor):
    PartnerType = apps.get_model("prm", "PartnerType")
    PartnerType.objects.filter(key="iniciado").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("prm", "0037_seed_partner_types"),
    ]

    operations = [
        migrations.RunPython(seed_iniciado, unseed_iniciado),
    ]
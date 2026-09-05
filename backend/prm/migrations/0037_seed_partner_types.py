from django.db import migrations

DEFAULT_TYPES = [
    ("distribuidor", "Distribuidor", 15.0, 1),
    ("agente", "Agente", 10.0, 2),
    ("referidor", "Referidor", 5.0, 3),
]


def seed_types(apps, schema_editor):
    PartnerType = apps.get_model("prm", "PartnerType")
    for key, label, rate, order in DEFAULT_TYPES:
        PartnerType.objects.update_or_create(
            key=key,
            defaults={
                "label": label,
                "default_commission_rate": rate,
                "is_active": True,
                "sort_order": order,
            },
        )


def unseed_types(apps, schema_editor):
    PartnerType = apps.get_model("prm", "PartnerType")
    PartnerType.objects.filter(key__in=[t[0] for t in DEFAULT_TYPES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("prm", "0036_partnertype_alter_partner_partner_type"),
    ]

    operations = [
        migrations.RunPython(seed_types, unseed_types),
    ]
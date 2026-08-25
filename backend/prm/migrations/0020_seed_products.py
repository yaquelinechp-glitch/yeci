from django.db import migrations


DEFAULT_PRODUCTS = [
    {
        "key": "dpa",
        "category": "SAP SuccessFactors",
        "sort_order": 1,
        "name": {"en": "Digitale Personalakte (DPA)", "es": "Expediente Digital (DPA)", "de": "Digitale Personalakte (DPA)"},
        "description": {"en": "Electronic personnel file", "es": "Expediente digital del empleado", "de": "Elektronische Personalakte"},
    },
    {
        "key": "hr_doc_box",
        "category": "SAP SuccessFactors",
        "sort_order": 2,
        "name": {"en": "HR Document Box", "es": "Bandeja de documentos HR", "de": "HR-Dokumentenbox"},
        "description": {"en": "Secure storage of HR documents", "es": "Almacenamiento seguro de documentos HR", "de": "Sichere Ablage von HR-Dokumenten"},
    },
    {
        "key": "scan_services",
        "category": "Services",
        "sort_order": 3,
        "name": {"en": "Scan Services", "es": "Servicios de Scan", "de": "Scan-Services"},
        "description": {"en": "Digitization of existing paper files", "es": "Digitalización de expedientes en papel", "de": "Digitalisierung bestehender Papierakten"},
    },
    {
        "key": "insights",
        "category": "Analytics",
        "sort_order": 4,
        "name": {"en": "aconso Insights", "es": "aconso Insights", "de": "aconso Insights"},
        "description": {"en": "Analytics and reporting", "es": "Analítica y reporting", "de": "Analysen und Reporting"},
    },
]


def seed(apps, schema_editor):
    Product = apps.get_model("prm", "Product")
    for p in DEFAULT_PRODUCTS:
        Product.objects.get_or_create(key=p["key"], defaults=p)


def unseed(apps, schema_editor):
    Product = apps.get_model("prm", "Product")
    Product.objects.filter(key__in=[p["key"] for p in DEFAULT_PRODUCTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("prm", "0019_product"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
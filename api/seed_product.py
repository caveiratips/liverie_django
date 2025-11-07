import os
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")

import django

django.setup()

from shop.models import Category, Product


def ensure_sample_product():
    cat, _ = Category.objects.get_or_create(
        slug="moda-intima",
        defaults={"name": "Moda Íntima"},
    )

    prod_slug = "calcinha-tanga-basica-101000"
    p, created = Product.objects.get_or_create(
        slug=prod_slug,
        defaults={
            "title": "Calcinha Tanga Básica",
            "description": "Conforto no dia a dia com acabamento suave.",
            "category": cat,
            "price": Decimal("29.90"),
            "compare_at_price": Decimal("39.90"),
            "cost_price": Decimal("12.50"),
            "sku": "CTB-101000",
            "brand": "Liverie",
            "stock_quantity": 100,
            "track_inventory": True,
            "weight": Decimal("0.10"),
            "width": Decimal("10.0"),
            "height": Decimal("2.0"),
            "length": Decimal("10.0"),
            "taxable": True,
            "tags": "lingerie, tanga",
            "available_colors": "Preto, Branco, Rosa",
            "available_sizes": "P, M, G",
            "seo_title": "Calcinha Tanga Básica",
            "seo_description": "Calcinha tanga confortável em cores e tamanhos variados.",
            "is_featured": True,
            "free_shipping": False,
            "is_active": True,
        },
    )

    print(f"Product slug='{prod_slug}' id={p.id} created={created}")


if __name__ == "__main__":
    ensure_sample_product()
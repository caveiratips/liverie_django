from rest_framework import serializers
from decimal import Decimal, InvalidOperation
from .models import Category, Product, ProductImage, SiteSetting, CustomerProfile, CustomerAddress


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    images = serializers.SerializerMethodField()
    available_for_sale = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "category",
            "category_id",
            "price",
            "compare_at_price",
            "cost_price",
            "sku",
            "barcode",
            "gtin",
            "mpn",
            "brand",
            "stock_quantity",
            "track_inventory",
            "weight",
            "width",
            "height",
            "length",
            "taxable",
            "tags",
            "seo_title",
            "seo_description",
            "is_featured",
            "free_shipping",
            "is_active",
            "created_at",
            "updated_at",
            "images",
            "available_for_sale",
        ]

    # Helpers
    def _validate_decimal_non_negative(self, value, field_label):
        if value is None:
            return value
        try:
            # Garantir conversão segura
            if not isinstance(value, Decimal):
                value = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            raise serializers.ValidationError(f"{field_label} deve ser um número válido.")
        if value < Decimal("0"):
            raise serializers.ValidationError(f"{field_label} deve ser maior ou igual a 0.")
        return value

    # Field-level validators
    def validate_price(self, value):
        return self._validate_decimal_non_negative(value, "Preço")

    def validate_cost_price(self, value):
        return self._validate_decimal_non_negative(value, "Custo")

    def validate_compare_at_price(self, value):
        return self._validate_decimal_non_negative(value, "Preço comparativo")

    def validate_weight(self, value):
        return self._validate_decimal_non_negative(value, "Peso")

    def validate_width(self, value):
        return self._validate_decimal_non_negative(value, "Largura")

    def validate_height(self, value):
        return self._validate_decimal_non_negative(value, "Altura")

    def validate_length(self, value):
        return self._validate_decimal_non_negative(value, "Comprimento")

    def validate_stock_quantity(self, value):
        if value is None:
            return 0
        try:
            ivalue = int(value)
        except (TypeError, ValueError):
            raise serializers.ValidationError("Estoque deve ser um inteiro.")
        if ivalue < 0:
            raise serializers.ValidationError("Estoque deve ser maior ou igual a 0.")
        return ivalue

    def validate(self, attrs):
        # Título obrigatório
        title = attrs.get("title")
        if not title or not str(title).strip():
            raise serializers.ValidationError({"title": "Título é obrigatório."})

        # Categoria obrigatória
        if not attrs.get("category"):
            raise serializers.ValidationError({"category_id": "Categoria é obrigatória."})

        # Coerência entre preços (opcional, mas comum): compare_at >= price
        price = attrs.get("price")
        compare = attrs.get("compare_at_price")
        if price is not None and compare is not None:
            try:
                if compare < price:
                    raise serializers.ValidationError({
                        "compare_at_price": "Preço comparativo deve ser maior ou igual ao preço atual."
                    })
            except TypeError:
                # Já será coberto por validadores de tipo
                pass
        return attrs

    def get_images(self, obj):
        return [
            {
                "id": img.id,
                "url": img.image.url if img.image else None,
                "alt_text": img.alt_text,
                "is_primary": img.is_primary,
            }
            for img in obj.images.all()
        ]

    def get_available_for_sale(self, obj):
        if not obj.is_active:
            return False
        if obj.track_inventory:
            return (obj.stock_quantity or 0) > 0
        return True


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "product", "image", "alt_text", "is_primary", "sort_order", "created_at"]


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ["id", "site_name", "primary_color", "currency", "updated_at"]


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = [
            "telefone",
            "cpf",
            "cep",
            "endereco",
            "numero",
            "complemento",
            "bairro",
            "cidade",
            "estado",
        ]


class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = [
            "id",
            "label",
            "cep",
            "endereco",
            "numero",
            "complemento",
            "bairro",
            "cidade",
            "estado",
            "is_default_delivery",
            "created_at",
        ]
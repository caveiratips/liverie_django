from rest_framework import serializers
from decimal import Decimal, InvalidOperation
from .models import Category, Product, ProductImage, SiteSetting, CustomerProfile, CustomerAddress, Order, OrderItem, OrderStatus


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


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True, required=False
    )
    # Permitir URLs relativas ou strings simples sem validar esquema
    image_url = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_id",
            "title",
            "image_url",
            "unit_price",
            "quantity",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    delivery_address_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomerAddress.objects.all(), source="delivery_address", write_only=True, required=False
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "total",
            "payment_method",
            "shipping_method",
            "delivery_address_id",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = ["order_number", "created_at", "updated_at", "total", "status"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        # Usar 'user' passado por perform_create ou cair no request
        user = validated_data.pop("user", None) or self.context["request"].user
        order = Order.objects.create(user=user, **validated_data)
        total = 0
        for it in items_data:
            qty = int(it.get("quantity", 1) or 1)
            price = it.get("unit_price")
            # Garantir Decimal coerente para salvar e calcular
            try:
                price_dec = Decimal(str(price))
            except (InvalidOperation, TypeError, ValueError):
                price_dec = Decimal("0")
            oi_data = {**it, "unit_price": price_dec}
            OrderItem.objects.create(order=order, **oi_data)
            total += qty * float(price_dec)
        # Persistir total
        order.total = total
        order.save(update_fields=["total"])
        return order


class AdminOrderSerializer(serializers.ModelSerializer):
    # No admin, itens são somente leitura e status é livre (sem choices)
    items = OrderItemSerializer(many=True, read_only=True)
    status = serializers.CharField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    customer_profile = serializers.SerializerMethodField()
    delivery_address = CustomerAddressSerializer(read_only=True)
    delivery_address_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomerAddress.objects.all(), source="delivery_address", write_only=True, required=False
    )
    customer_addresses = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "total",
            "payment_method",
            "shipping_method",
            "recipient_name",
            "shipping_address_text",
            "delivery_address",
            "delivery_address_id",
            "created_at",
            "updated_at",
            "items",
            "customer_name",
            "customer_email",
            "user_id",
            "customer_profile",
            "customer_addresses",
        ]
        read_only_fields = ["order_number", "created_at", "updated_at", "total"]

    def get_customer_name(self, obj):
        user = getattr(obj, "user", None)
        if not user:
            return ""
        first = getattr(user, "first_name", "") or ""
        last = getattr(user, "last_name", "") or ""
        full = (f"{first} {last}").strip()
        return full or getattr(user, "username", None) or getattr(user, "email", "")

    def get_customer_email(self, obj):
        user = getattr(obj, "user", None)
        if not user:
            return ""
        return getattr(user, "email", "")

    def get_user_id(self, obj):
        user = getattr(obj, "user", None)
        return getattr(user, "id", None)

    def get_customer_addresses(self, obj):
        user = getattr(obj, "user", None)
        if not user:
            return []
        addrs = CustomerAddress.objects.filter(user=user).order_by('-is_default_delivery', '-created_at')
        return CustomerAddressSerializer(addrs, many=True).data

    def get_customer_profile(self, obj):
        user = getattr(obj, "user", None)
        if not user:
            return None
        profile = CustomerProfile.objects.filter(user=user).first()
        data = CustomerProfileSerializer(profile).data if profile else None
        # Enriquecer com username e nome completo
        first = getattr(user, "first_name", "") or ""
        last = getattr(user, "last_name", "") or ""
        full_name = (f"{first} {last}").strip() or getattr(user, "username", None)
        return {
            "id": getattr(user, "id", None),
            "username": getattr(user, "username", None),
            "email": getattr(user, "email", None),
            "name": full_name,
            "profile": data,
        }


class AdminCustomerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    profile = CustomerProfileSerializer(required=False)

    def to_representation(self, instance):
        from django.contrib.auth import get_user_model
        user = instance
        profile = CustomerProfile.objects.filter(user=user).first()
        return {
            "id": getattr(user, "id", None),
            "username": getattr(user, "username", None),
            "email": getattr(user, "email", None),
            "first_name": getattr(user, "first_name", ""),
            "last_name": getattr(user, "last_name", ""),
            "profile": CustomerProfileSerializer(profile).data if profile else None,
        }

    def update(self, instance, validated_data):
        # Atualiza dados básicos do usuário
        email = validated_data.get("email")
        first_name = validated_data.get("first_name")
        last_name = validated_data.get("last_name")
        if email is not None:
            instance.email = email
        if first_name is not None:
            instance.first_name = first_name
        if last_name is not None:
            instance.last_name = last_name
        instance.save()

        # Atualiza perfil
        profile_data = validated_data.get("profile")
        if profile_data is not None:
            profile, _created = CustomerProfile.objects.get_or_create(user=instance)
            for field in [
                "telefone", "cpf", "cep", "endereco", "numero",
                "complemento", "bairro", "cidade", "estado",
            ]:
                val = profile_data.get(field)
                if val is not None:
                    setattr(profile, field, val)
            profile.save()

        return instance


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = ["id", "key", "label", "sort_order", "is_active"]
from django.contrib import admin
from .models import Category, Product, CustomerProfile, CustomerAddress, Order, OrderItem, Coupon


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "sort_order", "created_at")
    search_fields = ("name", "slug")
    list_filter = ("parent",)
    list_editable = ("sort_order",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "price", "is_active", "created_at")
    list_filter = ("category", "is_active")
    search_fields = ("title", "slug", "description")


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "cidade", "estado", "cep")
    search_fields = ("user__username", "cidade", "bairro", "cep")

@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "label", "cidade", "estado", "cep", "is_default_delivery")
    list_filter = ("estado", "is_default_delivery")
    search_fields = ("user__username", "cidade", "bairro", "cep", "endereco")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "total", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("order_number", "user__username", "user__email")
    readonly_fields = ("order_number", "created_at", "updated_at")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "title", "quantity", "unit_price")
    search_fields = ("title", "order__order_number")


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "value", "used_count", "max_uses", "expires_at", "active")
    list_filter = ("discount_type", "active")
    search_fields = ("code", "description")

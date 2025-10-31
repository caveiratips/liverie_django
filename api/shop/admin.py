from django.contrib import admin
from .models import Category, Product, CustomerProfile, CustomerAddress


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")


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

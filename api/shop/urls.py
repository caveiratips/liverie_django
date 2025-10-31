from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    CategoryViewSet,
    ProductViewSet,
    ProductImageViewSet,
    SiteSettingView,
    AddressListCreateView,
    AddressDetailView,
)

router = DefaultRouter()
router.register(r'admin/categories', CategoryViewSet, basename='admin-categories')
router.register(r'admin/products', ProductViewSet, basename='admin-products')
router.register(r'admin/product-images', ProductImageViewSet, basename='admin-product-images')

urlpatterns = [
    # Públicos
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    # Endereços do cliente (autenticado)
    path('addresses/', AddressListCreateView.as_view(), name='address-list-create'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
    # Admin
    path('', include(router.urls)),
    path('admin/site-setting/', SiteSettingView.as_view(), name='site-setting'),
]
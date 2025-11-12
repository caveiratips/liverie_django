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
    OrderListCreateView,
    OrderViewSet,
    OrderStatusViewSet,
    AdminCustomerView,
    AdminCustomerListView,
    AdminOrderByNumberView,
    AdminBannerUploadView,
)

router = DefaultRouter()
router.register(r'admin/categories', CategoryViewSet, basename='admin-categories')
router.register(r'admin/products', ProductViewSet, basename='admin-products')
router.register(r'admin/product-images', ProductImageViewSet, basename='admin-product-images')
router.register(r'admin/orders', OrderViewSet, basename='admin-orders')
router.register(r'admin/order-statuses', OrderStatusViewSet, basename='admin-order-statuses')

urlpatterns = [
    # Públicos
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    # Endereços do cliente (autenticado)
    path('addresses/', AddressListCreateView.as_view(), name='address-list-create'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
    # Pedidos do cliente (autenticado)
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('admin/customers/', AdminCustomerListView.as_view(), name='admin-customer-list'),
    path('admin/customers/<int:pk>/', AdminCustomerView.as_view(), name='admin-customer-detail'),
    path('admin/orders/by-number/<slug:order_number>/', AdminOrderByNumberView.as_view(), name='admin-order-by-number'),
    # Admin
    path('', include(router.urls)),
    path('admin/site-setting/', SiteSettingView.as_view(), name='site-setting'),
    path('admin/upload-banner/', AdminBannerUploadView.as_view(), name='admin-upload-banner'),
]
from rest_framework import generics, viewsets, status
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.files.storage import default_storage
import uuid
import os
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Category, Product, ProductImage, SiteSetting, CustomerProfile, CustomerAddress, Order, OrderStatus, Coupon
from django.utils.dateparse import parse_date
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductImageSerializer,
    SiteSettingSerializer,
    CustomerProfileSerializer,
    CustomerAddressSerializer,
    OrderSerializer,
    AdminOrderSerializer,
    OrderStatusSerializer,
    AdminCustomerSerializer,
    CouponSerializer,
)
from .permissions import IsStaffOrReadOnly


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductListView(generics.ListAPIView):
    queryset = (
        Product.objects.select_related("category")
        .filter(is_active=True)
        .filter(Q(track_inventory=False) | Q(stock_quantity__gt=0))
    )
    serializer_class = ProductSerializer


class ProductDetailView(generics.RetrieveAPIView):
    lookup_field = "slug"
    queryset = (
        Product.objects.select_related("category")
        .filter(is_active=True)
    )
    serializer_class = ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    permission_classes = [IsStaffOrReadOnly]


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.select_related("product").all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsStaffOrReadOnly]
    # Accept multipart for uploads and JSON for partial updates (PATCH)
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class AdminBannerUploadView(APIView):
    permission_classes = [IsStaffOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file') or request.data.get('file')
        if not file_obj:
            return Response({"detail": "Arquivo de imagem é obrigatório (campo 'file')."}, status=status.HTTP_400_BAD_REQUEST)
        # Gera nome estável com UUID preservando extensão
        name, ext = os.path.splitext(getattr(file_obj, 'name', 'banner'))
        ext = ext or '.jpg'
        filename = f"banners/{uuid.uuid4().hex}{ext}"
        saved_path = default_storage.save(filename, file_obj)
        # default_storage.url fornece URL pública (ex.: /media/...)
        url = default_storage.url(saved_path)
        return Response({"url": url}, status=status.HTTP_201_CREATED)


class SiteSettingView(generics.RetrieveUpdateAPIView):
    serializer_class = SiteSettingSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_object(self):
        obj = SiteSetting.objects.first()
        if obj is None:
            obj = SiteSetting.objects.create()
        return obj


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data or {}
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("senha", "")).strip()
        nome = str(data.get("nome", "")).strip()

        if not email or not password or not nome:
            return Response({"detail": "Campos obrigatórios: nome, email, senha."}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        # Verifica duplicidade por username ou email
        if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
            return Response({"detail": "Email já cadastrado."}, status=status.HTTP_400_BAD_REQUEST)

        # Separa primeiro e último nome simples
        parts = [p for p in nome.split(" ") if p]
        first_name = parts[0] if parts else nome
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

        user = User(username=email, email=email, first_name=first_name, last_name=last_name, is_active=True)
        user.set_password(password)
        user.save()

        # Cria perfil com dados básicos de endereço, se enviados
        try:
            CustomerProfile.objects.create(
                user=user,
                telefone=str(data.get("telefone", "")).strip(),
                cpf=str(data.get("cpf", "")).strip(),
                data_nascimento=parse_date(str(data.get("data_nascimento", "")).strip()) if data.get("data_nascimento") else None,
                cep=str(data.get("cep", "")).strip(),
                endereco=str(data.get("endereco", "")).strip(),
                numero=str(data.get("numero", "")).strip(),
                complemento=str(data.get("complemento", "")).strip(),
                bairro=str(data.get("bairro", "")).strip(),
                cidade=str(data.get("cidade", "")).strip(),
                estado=str(data.get("estado", "")).strip().upper(),
            )
        except Exception:
            # Caso falhe, cadastro de usuário segue; perfil pode ser preenchido depois
            pass
        
        return Response({"ok": True}, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user or user.is_anonymous:
            return Response({"detail": "Não autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
        first = getattr(user, "first_name", "") or ""
        last = getattr(user, "last_name", "") or ""
        full_name = (f"{first} {last}").strip() or getattr(user, "username", None) or getattr(user, "email", None)
        email = getattr(user, "email", None)
        profile = CustomerProfile.objects.filter(user=user).first()
        profile_data = CustomerProfileSerializer(profile).data if profile else None
        addresses = CustomerAddress.objects.filter(user=user).order_by('-is_default_delivery', '-created_at')
        addresses_data = CustomerAddressSerializer(addresses, many=True).data
        default_addr = addresses.filter(is_default_delivery=True).first()
        default_addr_id = default_addr.id if default_addr else None
        return Response({"name": full_name, "email": email, "profile": profile_data, "addresses": addresses_data, "default_delivery_address_id": default_addr_id})

    def patch(self, request):
        user = request.user
        if not user or user.is_anonymous:
            return Response({"detail": "Não autenticado"}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data or {}

        # Atualiza nome completo
        nome = str(data.get("name", "")).strip()
        if nome:
            parts = [p for p in nome.split(" ") if p]
            user.first_name = parts[0] if parts else nome
            user.last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

        # Atualiza email/username se fornecido
        new_email = str(data.get("email", "")).strip().lower()
        if new_email and new_email != (user.email or "").lower():
            User = get_user_model()
            if User.objects.filter(Q(email=new_email) | Q(username=new_email)).exclude(id=user.id).exists():
                return Response({"detail": "Email já cadastrado."}, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
            user.username = new_email
        user.save()

        # Atualiza perfil
        profile = CustomerProfile.objects.filter(user=user).first()
        if not profile:
            profile = CustomerProfile.objects.create(user=user)
        prof_data = data.get("profile") or {}
        # Normaliza UF
        if isinstance(prof_data.get("estado"), str):
            prof_data["estado"] = prof_data["estado"].upper()
        # Converte data_nascimento se vier como string ISO (será validado pelo serializer)
        serializer = CustomerProfileSerializer(profile, data=prof_data, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return self.get(request)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data or {}
        current_password = str(data.get("current_password", ""))
        new_password = str(data.get("new_password", ""))
        confirm_password = str(data.get("confirm_password", ""))
        if not current_password or not new_password:
            return Response({"detail": "Informe a senha atual e a nova senha."}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({"detail": "Nova senha e confirmação não coincidem."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(current_password):
            return Response({"detail": "Senha atual incorreta."}, status=status.HTTP_400_BAD_REQUEST)
        # Validação básica de tamanho; validadores adicionais do Django podem ser aplicados via AUTH_PASSWORD_VALIDATORS
        if len(new_password) < 6:
            return Response({"detail": "A nova senha deve ter pelo menos 6 caracteres."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({"ok": True})


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        addr = serializer.save(user=self.request.user)
        if addr.is_default_delivery:
            CustomerAddress.objects.filter(user=self.request.user).exclude(id=addr.id).update(is_default_delivery=False)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerAddressSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return CustomerAddress.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        addr = serializer.save()
        if addr.is_default_delivery:
            CustomerAddress.objects.filter(user=self.request.user).exclude(id=addr.id).update(is_default_delivery=False)


class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at').prefetch_related('items')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = AdminOrderSerializer
    permission_classes = [IsStaffOrReadOnly]


class AdminOrderByNumberView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = AdminOrderSerializer
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = 'order_number'


class OrderStatusViewSet(viewsets.ModelViewSet):
    queryset = OrderStatus.objects.all().order_by('sort_order', 'label')
    serializer_class = OrderStatusSerializer
    permission_classes = [IsStaffOrReadOnly]


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by('-created_at')
    serializer_class = CouponSerializer
    permission_classes = [IsStaffOrReadOnly]


class ApplyCouponView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = str(request.data.get('code', '')).strip()
        subtotal_raw = request.data.get('subtotal')
        try:
            from decimal import Decimal
            subtotal = Decimal(str(subtotal_raw or 0))
        except Exception:
            subtotal = Decimal('0')

        c = Coupon.objects.filter(code=code).first()
        if not c:
            return Response({'error': 'Cupom inválido'}, status=status.HTTP_404_NOT_FOUND)
        if not c.is_valid():
            return Response({'error': 'Cupom expirado ou inativo'}, status=status.HTTP_400_BAD_REQUEST)
        if c.min_order_total:
            try:
                from decimal import Decimal
                min_total = Decimal(str(c.min_order_total))
            except Exception:
                min_total = Decimal('0')
            if subtotal < min_total:
                return Response({'error': 'Subtotal abaixo do mínimo do cupom'}, status=status.HTTP_400_BAD_REQUEST)

        # calcula desconto
        from decimal import Decimal
        if c.discount_type == 'percent':
            discount = (subtotal * Decimal(str(c.value))) / Decimal('100')
        else:
            discount = Decimal(str(c.value))
        if discount > subtotal:
            discount = subtotal

        return Response({
            'code': c.code,
            'discount_amount': float(discount),
            'discount_type': c.discount_type,
            'value': float(c.value),
            'expires_at': c.expires_at.isoformat() if c.expires_at else None,
        })


class AdminCustomerView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsStaffOrReadOnly]
    serializer_class = AdminCustomerSerializer

    def get_object(self):
        User = get_user_model()
        pk = self.kwargs.get('pk')
        user = User.objects.filter(pk=pk).first()
        return user


class AdminCustomerListView(generics.ListAPIView):
    permission_classes = [IsStaffOrReadOnly]
    serializer_class = AdminCustomerSerializer

    def get_queryset(self):
        User = get_user_model()
        q = self.request.query_params.get('q')
        qs = User.objects.all().order_by('id')
        # Exibir apenas clientes (não staff)
        qs = qs.filter(is_staff=False)
        if q:
            qs = qs.filter(
                Q(username__icontains=q) |
                Q(email__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q)
            )
        return qs

from rest_framework import generics, viewsets, status
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Category, Product, ProductImage, SiteSetting, CustomerProfile, CustomerAddress
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductImageSerializer,
    SiteSettingSerializer,
    CustomerProfileSerializer,
    CustomerAddressSerializer,
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
        profile = CustomerProfile.objects.filter(user=user).first()
        profile_data = CustomerProfileSerializer(profile).data if profile else None
        addresses = CustomerAddress.objects.filter(user=user).order_by('-is_default_delivery', '-created_at')
        addresses_data = CustomerAddressSerializer(addresses, many=True).data
        default_addr = addresses.filter(is_default_delivery=True).first()
        default_addr_id = default_addr.id if default_addr else None
        return Response({"name": full_name, "profile": profile_data, "addresses": addresses_data, "default_delivery_address_id": default_addr_id})


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

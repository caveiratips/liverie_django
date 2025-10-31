from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    is_active = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sku = models.CharField(max_length=64, blank=True, default='')
    barcode = models.CharField(max_length=64, blank=True, default='')
    gtin = models.CharField(max_length=64, blank=True, default='')
    mpn = models.CharField(max_length=64, blank=True, default='')
    brand = models.CharField(max_length=120, blank=True, default='')
    stock_quantity = models.IntegerField(default=0)
    track_inventory = models.BooleanField(default=True)
    weight = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    width = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    height = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    length = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    taxable = models.BooleanField(default=True)
    tags = models.TextField(blank=True, default='')  # comma-separated
    seo_title = models.CharField(max_length=180, blank=True, default='')
    seo_description = models.CharField(max_length=300, blank=True, default='')
    is_featured = models.BooleanField(default=False)
    free_shipping = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=160, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return f"Imagem de {self.product.title}"


class SiteSetting(models.Model):
    site_name = models.CharField(max_length=160, default='Minha Loja')
    primary_color = models.CharField(max_length=7, default='#c9dac7')
    currency = models.CharField(max_length=8, default='BRL')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return 'Configurações do Site'


class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    telefone = models.CharField(max_length=20, blank=True, default='')
    cpf = models.CharField(max_length=14, blank=True, default='')
    cep = models.CharField(max_length=9, blank=True, default='')
    endereco = models.CharField(max_length=180, blank=True, default='')
    numero = models.CharField(max_length=10, blank=True, default='')
    complemento = models.CharField(max_length=120, blank=True, default='')
    bairro = models.CharField(max_length=120, blank=True, default='')
    cidade = models.CharField(max_length=120, blank=True, default='')
    estado = models.CharField(max_length=2, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return getattr(self.user, 'username', 'Perfil')


class CustomerAddress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=120, blank=True, default='')
    cep = models.CharField(max_length=9)
    endereco = models.CharField(max_length=180)
    numero = models.CharField(max_length=10)
    complemento = models.CharField(max_length=120, blank=True, default='')
    bairro = models.CharField(max_length=120)
    cidade = models.CharField(max_length=120)
    estado = models.CharField(max_length=2)
    is_default_delivery = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default_delivery', '-created_at']

    def __str__(self):
        base = self.label or self.endereco
        return f"{base} ({self.cidade}-{self.estado})"

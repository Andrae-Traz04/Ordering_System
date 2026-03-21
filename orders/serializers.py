from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from .models import UserProfile, Customer, Product, Order, OrderItem, StatusHistory, Review


# ─────────────────────────────────────────────
#  AUTH SERIALIZERS
# ─────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'role']

    def get_role(self, obj):
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return 'customer'


class RegisterSerializer(serializers.Serializer):
    username         = serializers.CharField(max_length=150)
    email            = serializers.EmailField()
    first_name       = serializers.CharField(max_length=150)
    last_name        = serializers.CharField(max_length=150)
    password         = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True)
    role             = serializers.ChoiceField(choices=['customer', 'owner', 'admin'])

    def validate_username(self, value):
        normalized = value.strip()
        if User.objects.filter(username__iexact=normalized).exists():
            raise serializers.ValidationError("Username already taken.")
        return normalized

    def validate_first_name(self, value):
        return value.strip()

    def validate_last_name(self, value):
        return value.strip()

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Email already registered.")
        return normalized

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': ['Passwords do not match.']
            })
        return attrs

    def create(self, validated_data):
        role       = validated_data.pop('role')
        validated_data.pop('confirm_password', None)
        first_name = validated_data.get('first_name', '')
        last_name  = validated_data.get('last_name', '')

        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            first_name=first_name,
            last_name=last_name,
        )
        UserProfile.objects.create(user=user, role=role)

        # Auto-create Customer record for customer role
        if role == 'customer':
            Customer.objects.get_or_create(
                email=user.email,
                defaults={
                    'name':  f"{first_name} {last_name}".strip() or user.username,
                    'phone': '',
                    'user':  user,
                }
            )

        return user


# ─────────────────────────────────────────────
#  PRODUCT SERIALIZER
# ─────────────────────────────────────────────

class ProductSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'description', 'price', 'category',
            'emoji', 'badge', 'is_active', 'created_by_username', 'created_at',
        ]

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = ['name', 'description', 'price', 'category', 'emoji', 'badge', 'is_active']


# ─────────────────────────────────────────────
#  CUSTOMER SERIALIZER
# ─────────────────────────────────────────────

class CustomerSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()

    class Meta:
        model  = Customer
        fields = ['id', 'name', 'email', 'phone', 'created_at', 'order_count']

    def get_order_count(self, obj):
        return obj.orders.count()


# ─────────────────────────────────────────────
#  ORDER ITEM SERIALIZER
# ─────────────────────────────────────────────

class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model  = OrderItem
        fields = ['id', 'product_name', 'quantity', 'unit_price', 'subtotal']


# ─────────────────────────────────────────────
#  STATUS HISTORY SERIALIZER
# ─────────────────────────────────────────────

class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by_username = serializers.SerializerMethodField()

    class Meta:
        model  = StatusHistory
        fields = [
            'id', 'from_status', 'to_status',
            'changed_by_username', 'changed_at', 'note',
        ]

    def get_changed_by_username(self, obj):
        return obj.changed_by.username if obj.changed_by else None


# ─────────────────────────────────────────────
#  REVIEW SERIALIZER
# ─────────────────────────────────────────────

class ReviewSerializer(serializers.ModelSerializer):
    customer_username = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = ['id', 'rating', 'comment', 'customer_username', 'created_at']

    def get_customer_username(self, obj):
        return obj.customer.username if obj.customer else None

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


# ─────────────────────────────────────────────
#  ORDER SERIALIZER  (read)
# ─────────────────────────────────────────────

class OrderSerializer(serializers.ModelSerializer):
    items          = OrderItemSerializer(many=True, read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    review         = ReviewSerializer(read_only=True)

    customer_name  = serializers.CharField(source='customer.name',  read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)

    created_by_id       = serializers.IntegerField(source='created_by.id',       read_only=True)
    created_by_username = serializers.CharField(source='created_by.username',     read_only=True)

    item_count = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'order_number', 'status', 'notes', 'total_amount',
            'created_at', 'updated_at',
            'customer_name', 'customer_email', 'customer_phone',
            'created_by_id', 'created_by_username',
            'item_count', 'items', 'status_history', 'review',
        ]

    def get_item_count(self, obj):
        return obj.items.count()


# ─────────────────────────────────────────────
#  ORDER CREATE SERIALIZER  (write)
# ─────────────────────────────────────────────

class OrderItemInputSerializer(serializers.Serializer):
    product_id   = serializers.IntegerField(required=False, allow_null=True)
    product_name = serializers.CharField(max_length=200)
    quantity     = serializers.IntegerField(min_value=1)
    unit_price   = serializers.DecimalField(max_digits=10, decimal_places=2)


class OrderCreateSerializer(serializers.Serializer):
    customer_name  = serializers.CharField(max_length=200)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    notes          = serializers.CharField(required=False, allow_blank=True)
    items          = OrderItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        for item in value:
            if float(item.get('unit_price', 0)) < 0:
                raise serializers.ValidationError("Unit price cannot be negative.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')

        # Get or create Customer — NO user in defaults to avoid UNIQUE constraint
        customer, _ = Customer.objects.get_or_create(
            email=validated_data['customer_email'],
            defaults={
                'name':  validated_data['customer_name'],
                'phone': validated_data.get('customer_phone', ''),
            }
        )

        order = Order.objects.create(
            customer=customer,
            created_by=request.user if request else None,
            notes=validated_data.get('notes', ''),
        )

        total = 0
        for item_data in validated_data['items']:
            product = None
            if item_data.get('product_id'):
                try:
                    product = Product.objects.get(pk=item_data['product_id'])
                except Product.DoesNotExist:
                    pass

            item = OrderItem.objects.create(
                order=order,
                product=product,
                product_name=item_data['product_name'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
            )
            total += item.subtotal

        order.total_amount = total
        order.save()

        StatusHistory.objects.create(
            order=order,
            from_status=None,
            to_status='pending',
            changed_by=request.user if request else None,
            note='Order placed',
        )

        return order


# ─────────────────────────────────────────────
#  STATUS UPDATE SERIALIZER
# ─────────────────────────────────────────────

class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['pending', 'processing', 'shipped', 'completed']
    )
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        order = self.context.get('order')
        if order and not order.can_transition_to(data['status']):
            raise serializers.ValidationError(
                f"Cannot transition from '{order.status}' to '{data['status']}'. "
                f"Valid next status: {Order.VALID_TRANSITIONS.get(order.status, [])}"
            )
        return data


# ─────────────────────────────────────────────
#  EXPORTS
# ─────────────────────────────────────────────

__all__ = [
    'RegisterSerializer',
    'UserSerializer',
    'ProductSerializer',
    'ProductCreateSerializer',
    'CustomerSerializer',
    'OrderItemSerializer',
    'StatusHistorySerializer',
    'ReviewSerializer',
    'OrderSerializer',
    'OrderCreateSerializer',
    'StatusUpdateSerializer',
]
from rest_framework import serializers
from .models import Customer, Order, OrderItem, StatusHistory


class CustomerSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'created_at', 'order_count']

    def get_order_count(self, obj):
        return obj.orders.count()


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'quantity', 'unit_price', 'subtotal']


class StatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusHistory
        fields = ['id', 'from_status', 'to_status', 'changed_at', 'note']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_name',
            'customer_email', 'customer_phone', 'status', 'notes',
            'total_amount', 'created_at', 'updated_at',
            'items', 'status_history', 'item_count',
        ]
        read_only_fields = [
            'order_number', 'total_amount', 'created_at', 'updated_at'
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_name = serializers.CharField(write_only=True)
    customer_email = serializers.EmailField(write_only=True)
    customer_phone = serializers.CharField(
        write_only=True, required=False, allow_blank=True, default=''
    )

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_email',
            'customer_phone', 'notes', 'total_amount', 'status',
            'created_at', 'items',
        ]
        read_only_fields = [
            'id', 'order_number', 'total_amount', 'status', 'created_at'
        ]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("At least one item is required.")
        for item in items:
            if item['quantity'] < 1:
                raise serializers.ValidationError("Quantity must be at least 1.")
            if item['unit_price'] < 0:
                raise serializers.ValidationError("Unit price cannot be negative.")
        return items

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        customer_name = validated_data.pop('customer_name')
        customer_email = validated_data.pop('customer_email')
        customer_phone = validated_data.pop('customer_phone', '')

        customer, _ = Customer.objects.get_or_create(
            email=customer_email,
            defaults={'name': customer_name, 'phone': customer_phone},
        )

        order = Order.objects.create(customer=customer, **validated_data)

        total = 0
        for item_data in items_data:
            item = OrderItem.objects.create(order=order, **item_data)
            total += item.subtotal

        order.total_amount = total
        order.save()

        StatusHistory.objects.create(
            order=order,
            from_status=None,
            to_status='pending',
            note='Order created',
        )

        return order


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['pending', 'processing', 'shipped', 'completed']
    )
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        order = self.context['order']
        new_status = data['status']

        if not order.can_transition_to(new_status):
            valid = Order.VALID_TRANSITIONS.get(order.status, [])
            raise serializers.ValidationError(
                f"Cannot transition from '{order.status}' to '{new_status}'. "
                f"Valid next status: {valid if valid else 'none — order is already completed'}."
            )
        return data
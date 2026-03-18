from django.contrib import admin
from .models import Customer, Order, OrderItem, StatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class StatusHistoryInline(admin.TabularInline):
    model = StatusHistory
    extra = 0
    readonly_fields = ['from_status', 'to_status', 'changed_at', 'note']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'status', 'total_amount', 'created_at']
    list_filter = ['status']
    search_fields = ['order_number', 'customer__name']
    inlines = [OrderItemInline, StatusHistoryInline]


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'created_at']
    search_fields = ['name', 'email']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'order', 'quantity', 'unit_price']


@admin.register(StatusHistory)
class StatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['order', 'from_status', 'to_status', 'changed_at']
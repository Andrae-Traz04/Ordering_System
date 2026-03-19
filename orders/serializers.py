<<<<<<< HEAD
"""Backward-compatible serializer exports.
=======
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from .models import UserProfile, Customer, Order, OrderItem, StatusHistory, Review
>>>>>>> 3aae3f42e430126718dcc0e972d6b711c4334e07

This file keeps existing imports working while implementation is split into
focused serializer modules.
"""

from .serializers_auth import RegisterSerializer, UserSerializer
from .serializers_engagement import ReviewSerializer
from .serializers_orders import (
    CustomerSerializer,
    OrderCreateSerializer,
    OrderItemSerializer,
    OrderSerializer,
    StatusHistorySerializer,
    StatusUpdateSerializer,
)

__all__ = [
    "RegisterSerializer",
    "UserSerializer",
    "CustomerSerializer",
    "OrderItemSerializer",
    "StatusHistorySerializer",
    "ReviewSerializer",
    "OrderSerializer",
    "OrderCreateSerializer",
    "StatusUpdateSerializer",
]
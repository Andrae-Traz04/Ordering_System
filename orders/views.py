"""Backward-compatible view exports.

This file keeps existing imports working while implementation is split into
focused modules for easier maintenance.
"""

from .views_auth import LoginView, LogoutView, MeView, RegisterView
from .views_engagement import NotificationView, ReviewView
from .views_orders import (
    CustomerListView,
    OrderDetailView,
    OrderListCreateView,
    OrderStatusUpdateView,
    OrderSummaryView,
    UserListView,
)

__all__ = [
    "RegisterView",
    "LoginView",
    "LogoutView",
    "MeView",
    "OrderListCreateView",
    "OrderSummaryView",
    "OrderDetailView",
    "OrderStatusUpdateView",
    "ReviewView",
    "CustomerListView",
    "UserListView",
    "NotificationView",
]
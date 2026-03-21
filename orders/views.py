from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import render
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Customer, Order, OrderItem, StatusHistory, Review, UserProfile, Product
from .serializers import (
    RegisterSerializer,
    CustomerSerializer,
    ProductSerializer,
    ProductCreateSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    StatusUpdateSerializer,
    ReviewSerializer,
)


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────

def get_role(user):
    try:
        return user.profile.role
    except UserProfile.DoesNotExist:
        return 'customer'

def is_owner_or_admin(user):
    return get_role(user) in ['owner', 'admin']

def is_admin(user):
    return get_role(user) == 'admin'

def is_owner(user):
    return get_role(user) == 'owner'


# ─────────────────────────────────────────────
#  ADMIN PANEL
# ─────────────────────────────────────────────

def admin_panel(request):
    return render(request, 'docs.html')


# ─────────────────────────────────────────────
#  AUTH VIEWS
# ─────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user  = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user':  {'id': user.id, 'username': user.username, 'role': get_role(user)},
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user':  {'id': user.id, 'username': user.username, 'role': get_role(user)},
        })


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'detail': 'Logged out successfully.'})


class MeView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id':       request.user.id,
            'username': request.user.username,
            'role':     get_role(request.user),
        })


# ─────────────────────────────────────────────
#  PRODUCT VIEWS
# ─────────────────────────────────────────────

class ProductListCreateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        if is_owner_or_admin(request.user):
            products = Product.objects.all().order_by('-created_at')
        else:
            products = Product.objects.filter(is_active=True).order_by('-created_at')

        category = request.query_params.get('category', '')
        if category:
            products = products.filter(category=category)

        return Response({'products': ProductSerializer(products, many=True).data})

    def post(self, request):
        if not is_owner_or_admin(request.user):
            return Response({'detail': 'Only owners and admins can create products.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductCreateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save(created_by=request.user)
            return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get_product(self, pk):
        try:    return Product.objects.get(pk=pk)
        except: return None

    def get(self, request, pk):
        p = self.get_product(pk)
        if not p: return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(p).data)

    def patch(self, request, pk):
        if not is_owner_or_admin(request.user):
            return Response({'detail': 'Only owners and admins can edit products.'}, status=status.HTTP_403_FORBIDDEN)
        p = self.get_product(pk)
        if not p: return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductCreateSerializer(p, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProductSerializer(p).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not is_owner_or_admin(request.user):
            return Response({'detail': 'Only owners and admins can delete products.'}, status=status.HTTP_403_FORBIDDEN)
        p = self.get_product(pk)
        if not p: return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        p.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────
#  ORDER VIEWS
# ─────────────────────────────────────────────

class OrderListCreateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        if role == 'customer':
            orders = Order.objects.filter(created_by=request.user).order_by('-created_at')
        else:
            orders = Order.objects.all().order_by('-created_at')

        search = request.query_params.get('search', '')
        status_filter = request.query_params.get('status', '')

        if search:
            orders = (
                orders.filter(order_number__icontains=search) |
                orders.filter(customer__name__icontains=search) |
                orders.filter(customer__email__icontains=search)
            )
        if status_filter:
            orders = orders.filter(status=status_filter)

        return Response({'orders': OrderSerializer(orders.distinct(), many=True).data})

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get_order(self, pk, user):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return None
        if get_role(user) == 'customer' and order.created_by != user:
            return None
        return order

    def get(self, request, pk):
        order = self.get_order(pk, request.user)
        if not order: return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)

    def patch(self, request, pk):
        order = self.get_order(pk, request.user)
        if not order: return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        order.notes = request.data.get('notes', order.notes)
        order.save()
        return Response(OrderSerializer(order).data)

    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({'detail': 'Only admins can delete orders.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            Order.objects.get(pk=pk).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Order.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


class OrderStatusUpdateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request, pk):
        if not is_owner_or_admin(request.user):
            return Response({'detail': 'Only owners or admins can update order status.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StatusUpdateSerializer(data=request.data, context={'order': order})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_status = order.status
        new_status = serializer.validated_data['status']
        note       = serializer.validated_data.get('note', '')
        order.status = new_status
        order.save()

        StatusHistory.objects.create(
            order=order, from_status=old_status, to_status=new_status,
            changed_by=request.user, note=note,
        )
        return Response(OrderSerializer(order).data)


class OrderSummaryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        orders = Order.objects.filter(created_by=request.user) if role == 'customer' else Order.objects.all()
        return Response({
            'total_orders':      orders.count(),
            'total_revenue':     float(sum(o.total_amount for o in orders)),
            'completed_revenue': float(sum(o.total_amount for o in orders.filter(status='completed'))),
            'by_status': {
                'pending':    orders.filter(status='pending').count(),
                'processing': orders.filter(status='processing').count(),
                'shipped':    orders.filter(status='shipped').count(),
                'completed':  orders.filter(status='completed').count(),
            },
        })


# ─────────────────────────────────────────────
#  CUSTOMER & USER VIEWS
# ─────────────────────────────────────────────

class CustomerListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        if not is_owner_or_admin(request.user):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        customers = Customer.objects.all().order_by('-created_at')
        return Response({'customers': CustomerSerializer(customers, many=True).data})


class UserListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'detail': 'Only admins can view users.'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all().order_by('id')
        return Response({
            'users': [
                {
                    'id':         u.id,
                    'username':   u.username,
                    'email':      u.email,
                    'first_name': u.first_name,
                    'last_name':  u.last_name,
                    'role':       get_role(u),
                    'date_joined': u.date_joined,
                }
                for u in users
            ]
        })


class UserRoleUpdateView(APIView):
    """Admin-only: change a user's role."""
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def patch(self, request, pk):
        if not is_admin(request.user):
            return Response({'detail': 'Only admins can change user roles.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent admin from changing their own role
        if user == request.user:
            return Response({'detail': 'You cannot change your own role.'}, status=status.HTTP_400_BAD_REQUEST)

        new_role = request.data.get('role')
        if new_role not in ['customer', 'owner', 'admin']:
            return Response({'detail': 'Invalid role. Must be customer, owner, or admin.'}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = new_role
        profile.save()

        return Response({
            'id':       user.id,
            'username': user.username,
            'role':     new_role,
            'detail':   f"Role updated to {new_role}.",
        })


# ─────────────────────────────────────────────
#  REVIEW VIEW
# ─────────────────────────────────────────────

class ReviewView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request, pk):
        if get_role(request.user) != 'customer':
            return Response({'detail': 'Only customers can leave reviews.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            order = Order.objects.get(pk=pk, created_by=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != 'completed':
            return Response({'detail': 'You can only review completed orders.'}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(order, 'review'):
            return Response({'detail': 'You have already reviewed this order.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            Review.objects.create(
                order=order, customer=request.user,
                rating=serializer.validated_data['rating'],
                comment=serializer.validated_data.get('comment', ''),
            )
            return Response(ReviewSerializer(order.review).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  NOTIFICATION VIEW
# ─────────────────────────────────────────────

class NotificationView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        notifications = []

        if role in ['owner', 'admin']:
            for order in Order.objects.filter(status='pending').order_by('-created_at')[:10]:
                notifications.append({
                    'id': f'new-order-{order.id}', 'type': 'new_order',
                    'message': f'New order {order.order_number} from {order.customer.name}',
                    'order_id': order.id, 'created_at': order.created_at,
                })

        if role == 'customer':
            for h in StatusHistory.objects.filter(order__created_by=request.user).order_by('-changed_at')[:10]:
                notifications.append({
                    'id': f'status-{h.id}', 'type': 'status_update',
                    'message': f'Order {h.order.order_number} updated to {h.to_status}',
                    'order_id': h.order.id, 'created_at': h.changed_at,
                })

        return Response({'notifications': notifications})
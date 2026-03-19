from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta
from .models import UserProfile, Customer, Order, StatusHistory, Review
from .serializers import (
    RegisterSerializer, UserSerializer, CustomerSerializer,
    OrderSerializer, OrderCreateSerializer, StatusUpdateSerializer,
    ReviewSerializer,
)


def get_role(user):
    try:
        return user.profile.role
    except Exception:
        return None


# ── Auth Views ────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data,
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            user = authenticate(username=username, password=password)
            if not user:
                return Response(
                    {'error': 'Invalid username or password.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully.'})


class MeView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ── Order Views ───────────────────────────────────────────────────────────────

class OrderListCreateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        orders = Order.objects.select_related('customer').prefetch_related(
            'items', 'status_history', 'review'
        )

        if role == 'customer':
            orders = orders.filter(created_by=request.user)

        status_filter = request.query_params.get('status')
        if status_filter:
            orders = orders.filter(status=status_filter)

        search = request.query_params.get('search')
        if search:
            orders = orders.filter(
                Q(order_number__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(customer__email__icontains=search)
            )

        orders = orders.order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response({'orders': serializer.data, 'count': orders.count()})

    def post(self, request):
        serializer = OrderCreateSerializer(
            data=request.data, context={'user': request.user}
        )
        if serializer.is_valid():
            order = serializer.save()
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        role = get_role(user)
        qs = Order.objects.select_related('customer').prefetch_related(
            'items', 'status_history', 'review'
        )
        if role == 'customer':
            qs = qs.filter(created_by=user)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        order = self.get_object(pk, request.user)
        return Response(OrderSerializer(order).data)

    def patch(self, request, pk):
        order = self.get_object(pk, request.user)
        if 'notes' in request.data:
            order.notes = request.data['notes']
            order.save()
        return Response(OrderSerializer(order).data)

    def delete(self, request, pk):
        role = get_role(request.user)
        if role != 'admin':
            return Response(
                {'error': 'Only admins can delete orders.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        order = self.get_object(pk, request.user)
        order_number = order.order_number
        order.delete()
        return Response(
            {'message': f'Order {order_number} deleted.'},
            status=status.HTTP_204_NO_CONTENT,
        )


class OrderStatusUpdateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        role = get_role(request.user)
        if role == 'customer':
            return Response(
                {'error': 'Customers cannot update order status.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk)
        serializer = StatusUpdateSerializer(
            data=request.data, context={'order': order}
        )

        if serializer.is_valid():
            old_status = order.status
            new_status = serializer.validated_data['status']
            note = serializer.validated_data.get('note', '')

            order.status = new_status
            order.save()

            StatusHistory.objects.create(
                order=order,
                from_status=old_status,
                to_status=new_status,
                changed_by=request.user,
                note=note,
            )
            return Response(OrderSerializer(order).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderSummaryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        orders = Order.objects.all()

        if role == 'customer':
            orders = orders.filter(created_by=request.user)

        summary = {
            'total_orders': orders.count(),
            'by_status': {
                'pending':    orders.filter(status='pending').count(),
                'processing': orders.filter(status='processing').count(),
                'shipped':    orders.filter(status='shipped').count(),
                'completed':  orders.filter(status='completed').count(),
            },
            'total_revenue': float(
                orders.aggregate(t=Sum('total_amount'))['t'] or 0
            ),
            'completed_revenue': float(
                orders.filter(status='completed').aggregate(
                    t=Sum('total_amount')
                )['t'] or 0
            ),
        }
        return Response(summary)


class CustomerListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        if role == 'customer':
            return Response(
                {'error': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        customers = Customer.objects.prefetch_related('orders').order_by('-created_at')
        serializer = CustomerSerializer(customers, many=True)
        return Response({'customers': serializer.data, 'count': customers.count()})


class UserListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        if role != 'admin':
            return Response(
                {'error': 'Only admins can view users.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response({'users': serializer.data})


# ── Review View ───────────────────────────────────────────────────────────────

class ReviewView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)

        if order.created_by != request.user:
            return Response(
                {'error': 'You can only review your own orders.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.status != 'completed':
            return Response(
                {'error': 'You can only review completed orders.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(order, 'review'):
            return Response(
                {'error': 'You have already reviewed this order.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(order=order, customer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Notification View ─────────────────────────────────────────────────────────

class NotificationView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_role(request.user)
        notifications = []

        if role in ['owner', 'admin']:
            # New pending orders in last 24 hours
            recent = timezone.now() - timedelta(hours=24)
            new_orders = Order.objects.filter(
                status='pending',
                created_at__gte=recent
            ).order_by('-created_at')

            for o in new_orders:
                notifications.append({
                    'id': f"order-{o.id}",
                    'type': 'new_order',
                    'message': f"New order {o.order_number} from {o.customer.name}",
                    'order_id': o.id,
                    'created_at': o.created_at,
                })

        elif role == 'customer':
            # Completed orders for this customer
            completed = Order.objects.filter(
                created_by=request.user,
                status='completed',
            ).order_by('-updated_at')[:10]

            for o in completed:
                notifications.append({
                    'id': f"completed-{o.id}",
                    'type': 'order_completed',
                    'message': f"Your order {o.order_number} has been completed! Please leave a review.",
                    'order_id': o.id,
                    'created_at': o.updated_at,
                })

        return Response({'notifications': notifications, 'count': len(notifications)})
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from .models import UserProfile, Customer, Order, StatusHistory
from .serializers import (
    RegisterSerializer, UserSerializer, CustomerSerializer,
    OrderSerializer, OrderCreateSerializer, StatusUpdateSerializer,
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
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
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
            'items', 'status_history'
        )

        # Customers only see their own orders
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
            'items', 'status_history'
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
        users = UserSerializer(
            __import__('django.contrib.auth.models', fromlist=['User']).User.objects.all(),
            many=True
        )
        return Response({'users': users.data})
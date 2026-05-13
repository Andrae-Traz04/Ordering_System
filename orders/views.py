from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import render
from django.conf import settings
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Author, Customer, Order, OrderItem, StatusHistory, Review, UserProfile, Product
from .serializers import (
    AuthorSerializer,
    RegisterSerializer,
    UserSerializer,
    CustomerSerializer,
    ProductSerializer,
    ProductCreateSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    StatusUpdateSerializer,
    ReviewSerializer,
)
from .email_utils import send_activation_email, send_password_reset_email


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
#  PERMISSION CLASSES
# ─────────────────────────────────────────────

class IsAdmin(BasePermission):
    """Allow access only to admin users."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and is_admin(request.user)


class IsOwnerOrAdmin(BasePermission):
    """Allow access only to owners or admins."""
    message = "Owner or admin access required."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and is_owner_or_admin(request.user)


class IsOwnerOrReadOnly(BasePermission):
    """Allow owners to edit their own objects; others can view only."""
    message = "You can only edit your own objects."

    def has_object_permission(self, request, view, obj):
        # Allow GET, HEAD, OPTIONS for anyone
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        # Only allow edits by owner or admins
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user or is_owner_or_admin(request.user)
        return False


class IsObjectOwnerOrAdmin(BasePermission):
    """Allow access only to object owner or admins."""
    message = "You can only access your own objects."

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user or is_admin(request.user)
        if hasattr(obj, 'user'):
            return obj.user == request.user or is_admin(request.user)
        return False


class IsOwner(BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


# ─────────────────────────────────────────────
#  ADMIN PANEL
# ─────────────────────────────────────────────

def admin_panel(request):
    return render(request, 'docs.html')


# ─────────────────────────────────────────────
#  AUTHOR VIEWS
# ─────────────────────────────────────────────

class AuthorListCreateView(APIView):
    """List and create authors for authenticated users."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all authors for the authenticated user."""
        authors = Author.objects.filter(user=request.user).order_by('-created_at')
        serializer = AuthorSerializer(authors, many=True)
        return Response({'authors': serializer.data})

    def post(self, request):
        """Create a new author, automatically linking to the authenticated user."""
        serializer = AuthorSerializer(data=request.data)
        if serializer.is_valid():
            # Automatically set the user to the authenticated user
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AuthorDetailView(APIView):
    """Retrieve, update, or delete a specific author."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def get_author(self, pk, user):
        """Helper method to get author by ID and ensure user owns it."""
        try:
            author = Author.objects.get(pk=pk)
            # Check if user owns this author
            if author.user != user:
                return None
            return author
        except Author.DoesNotExist:
            return None

    def get(self, request, pk):
        """Retrieve a specific author."""
        author = self.get_author(pk, request.user)
        if not author:
            return Response(
                {'detail': 'Author not found or you do not have permission to view it.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = AuthorSerializer(author)
        return Response(serializer.data)

    def patch(self, request, pk):
        """Update a specific author."""
        author = self.get_author(pk, request.user)
        if not author:
            return Response(
                {'detail': 'Author not found or you do not have permission to update it.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = AuthorSerializer(author, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete a specific author."""
        author = self.get_author(pk, request.user)
        if not author:
            return Response(
                {'detail': 'Author not found or you do not have permission to delete it.'},
                status=status.HTTP_404_NOT_FOUND
            )
        author.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────
#  AUTH VIEWS
# ─────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user  = serializer.save()
            
            # Send activation email
            success, activation_url = send_activation_email(user)
            
            user_serializer = UserSerializer(user, context={'request': request})
            response_data = {
                'user': user_serializer.data,
                'message': 'Registration successful! Please check your email to activate your account.',
                'detail': 'Activation link sent to your email. It will expire in 24 hours.',
            }
            
            # DEV FALLBACK: If email is blocked by firewall/ISP, give link directly to frontend
            if not success and settings.DEBUG:
                response_data['dev_activation_url'] = activation_url
                response_data['detail'] = 'Email timed out. Used DEV fallback activation link.'
                
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ActivateEmailView(APIView):
    """Verify email activation token and activate user account."""
    permission_classes = [AllowAny]

    def activate_user(self, user_id, token):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None, Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Verify token
        if not default_token_generator.check_token(user, token):
            return None, Response({'error': 'Activation link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        # Activate user
        if user.is_active:
            return user, Response({'message': 'Account is already activated.'}, status=status.HTTP_200_OK)

        user.is_active = True
        user.save()

        return user, Response({
            'message': '✓ Your account has been activated successfully!',
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'detail': 'You can now log in to your account.',
        }, status=status.HTTP_200_OK)

    def post(self, request, user_id, token):
        """Activate via POST (API call)."""
        _, resp = self.activate_user(user_id, token)
        return resp

    def get(self, request, user_id, token):
        """Activate via GET (clicked link from browser). Returns HTML redirect or JSON."""
        user, resp = self.activate_user(user_id, token)
        # If frontend is available, redirect to login page or show frontend route
        frontend = getattr(settings, 'FRONTEND_URL', None)
        if user and frontend:
            # Redirect to frontend login with success message (query param)
            redirect_url = f"{frontend}/login?activated=1"
            from django.shortcuts import redirect
            return redirect(redirect_url)
        return resp


class ResendActivationEmailView(APIView):
    """Resend activation email if user hasn't activated yet."""
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Resend activation email.
        POST /api/v1/auth/resend-activation/
        Body: { "email": "user@example.com" }
        """
        email = request.data.get('email', '').strip()
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # For security, don't reveal if email exists
            return Response(
                {'message': 'If this email is registered, a new activation link has been sent.'},
                status=status.HTTP_200_OK
            )

        if user.is_active:
            return Response(
                {'message': 'This account is already activated. You can log in directly.'},
                status=status.HTTP_200_OK
            )

        # Send activation email
        success, activation_url = send_activation_email(user)

        response_data = {
            'message': 'Activation email has been resent.',
            'detail': 'Please check your email for the activation link. It will expire in 24 hours.',
            'email': user.email,
        }
        if not success and settings.DEBUG:
            response_data['dev_activation_url'] = activation_url
            response_data['detail'] = 'Email timed out. Used DEV fallback activation link.'

        return Response(response_data, status=status.HTTP_200_OK)


class RequestPasswordResetView(APIView):
    """Request password reset email."""
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Request password reset.
        POST /api/v1/auth/request-reset/
        Body: { "email": "user@example.com" }
        """
        email = request.data.get('email', '').strip()
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # For security, don't reveal if email exists
            return Response(
                {'message': 'If this email is registered, a password reset link has been sent.'},
                status=status.HTTP_200_OK
            )

        # Send password reset email
        success, reset_url = send_password_reset_email(user)

        response_data = {
            'message': 'Password reset email has been sent.',
            'detail': 'Check your email for the reset link. It will expire in 24 hours.',
            'email': user.email,
        }
        if not success and settings.DEBUG:
            response_data['dev_reset_url'] = reset_url
            response_data['detail'] = 'Email timed out. Used DEV fallback reset link.'

        return Response(response_data, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """Reset password with token."""
    permission_classes = [AllowAny]

    def post(self, request, user_id, token):
        """
        Reset password with token.
        POST /api/v1/auth/reset-password/<user_id>/<token>/
        Body: { "new_password": "newpass123", "confirm_password": "newpass123" }
        """
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify token
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Reset link is invalid or has expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()

        if not new_password or not confirm_password:
            return Response(
                {'error': 'Both password fields are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        return Response({
            'message': '✓ Your password has been reset successfully!',
            'detail': 'You can now log in with your new password.',
            'username': user.username,
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
     permission_classes = [AllowAny]

     def post(self, request):
         email    = request.data.get('email', '').strip()
         password = request.data.get('password', '')

         if not email or not password:
             return Response(
                 {'error': 'Email and password are required.'},
                 status=status.HTTP_400_BAD_REQUEST
             )

         try:
             user_obj = User.objects.get(email__iexact=email)
         except User.DoesNotExist:
             return Response(
                 {'error': 'Invalid email or password.'},
                 status=status.HTTP_401_UNAUTHORIZED
             )

         # Check if account is activated
         if not user_obj.is_active:
             return Response(
                 {'error': 'Account not activated. Check your email for the activation link, or contact support.'},
                 status=status.HTTP_403_FORBIDDEN
             )

         user = authenticate(username=user_obj.username, password=password)
         if not user:
             return Response(
                 {'error': 'Invalid email or password.'},
                 status=status.HTTP_401_UNAUTHORIZED
             )

         refresh = RefreshToken.for_user(user)
         user_serializer = UserSerializer(user, context={'request': request})
         return Response({
             'access': str(refresh.access_token),
             'refresh': str(refresh),
             'user': user_serializer.data,
         })


class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return Response({'detail': 'Logged out successfully.'})


class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        user_serializer = UserSerializer(request.user, context={'request': request})
        return Response(user_serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  PRODUCT VIEWS
# ─────────────────────────────────────────────

class ProductListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        """Get products - owners/admins see all, customers see only active."""
        if is_owner_or_admin(request.user):
            products = Product.objects.all().order_by('-created_at')
        else:
            products = Product.objects.filter(is_active=True).order_by('-created_at')

        category = request.query_params.get('category', '')
        if category:
            products = products.filter(category=category)

        return Response({'products': ProductSerializer(products, many=True).data})

    def post(self, request):
        """Create product - owners and admins only."""
        if not is_owner_or_admin(request.user):
            return Response(
                {'detail': 'Only owners and admins can create products.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = ProductCreateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save(created_by=request.user)
            return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get_product(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        """Retrieve a product - admins/owners see all, customers see only active."""
        p = self.get_product(pk)
        if not p:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Customers can only view active products
        if not is_owner_or_admin(request.user) and not p.is_active:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(ProductSerializer(p).data)

    def patch(self, request, pk):
        """Update product - owners and admins only."""
        if not is_owner_or_admin(request.user):
            return Response(
                {'detail': 'Only owners and admins can edit products.'},
                status=status.HTTP_403_FORBIDDEN
            )
        p = self.get_product(pk)
        if not p:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductCreateSerializer(p, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProductSerializer(p).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete product - admins only."""
        if not is_admin(request.user):
            return Response(
                {'detail': 'Only admins can delete products.'},
                status=status.HTTP_403_FORBIDDEN
            )
        p = self.get_product(pk)
        if not p:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        p.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────
#  ORDER VIEWS
# ─────────────────────────────────────────────

class OrderListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
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
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get_order(self, pk, user):
        """Get order if user has permission to access it."""
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return None
        
        # Customers can only access their own orders
        if get_role(user) == 'customer' and order.created_by != user:
            return None
        
        return order

    def get(self, request, pk):
        """Retrieve an order."""
        order = self.get_order(pk, request.user)
        if not order:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)

    def patch(self, request, pk):
        """Update order notes - customer can update own order, owners/admins can update any."""
        order = self.get_order(pk, request.user)
        if not order:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only customers updating their own orders can update notes
        if get_role(request.user) == 'customer':
            order.notes = request.data.get('notes', order.notes)
            order.save()
        elif is_owner_or_admin(request.user):
            # Admins/owners can update more fields
            order.notes = request.data.get('notes', order.notes)
            order.save()
        
        return Response(OrderSerializer(order).data)

    def delete(self, request, pk):
        """Delete order - admins only."""
        if not is_admin(request.user):
            return Response(
                {'detail': 'Only admins can delete orders.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            Order.objects.get(pk=pk).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Order.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


class OrderStatusUpdateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request, pk):
        """Update order status - owners and admins only."""
        if not is_owner_or_admin(request.user):
            return Response(
                {'detail': 'Only owners or admins can update order status.'},
                status=status.HTTP_403_FORBIDDEN
            )
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


class OrderCancelView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request, pk):
        if get_role(request.user) != 'customer':
            return Response(
                {'detail': 'Only customers can cancel orders.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            order = Order.objects.get(pk=pk, created_by=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != 'pending':
            return Response(
                {'detail': 'Only pending orders can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status   = order.status
        order.status = 'cancelled'
        order.save()

        StatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status='cancelled',
            changed_by=request.user,
            note=request.data.get('note', 'Cancelled by customer'),
        )

        return Response(OrderSerializer(order).data)


class OrderSummaryView(APIView):
    authentication_classes = [JWTAuthentication]
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
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        if not is_owner_or_admin(request.user):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        customers = Customer.objects.all().order_by('-created_at')
        return Response({'customers': CustomerSerializer(customers, many=True).data})


class UserListView(APIView):
    authentication_classes = [JWTAuthentication]
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
    authentication_classes = [JWTAuthentication]
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
    """Customer-only: create reviews for completed orders."""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request, pk):
        """Create a review for a completed order - customers only."""
        if get_role(request.user) != 'customer':
            return Response(
                {'detail': 'Only customers can leave reviews.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            order = Order.objects.get(pk=pk, created_by=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != 'completed':
            return Response(
                {'detail': 'You can only review completed orders.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if hasattr(order, 'review'):
            return Response(
                {'detail': 'You have already reviewed this order.'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
    """Get notifications based on user role."""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        """
        Get notifications:
        - Owners/Admins: see new pending orders
        - Customers: see their order status updates
        """
        role = get_role(request.user)
        notifications = []

        if role in ['owner', 'admin']:
            # Show pending orders to owners/admins
            for order in Order.objects.filter(status='pending').order_by('-created_at')[:10]:
                notifications.append({
                    'id': f'new-order-{order.id}',
                    'type': 'new_order',
                    'message': f'New order {order.order_number} from {order.customer.name}',
                    'order_id': order.id,
                    'created_at': order.created_at,
                })

        if role == 'customer':
            # Show order status updates to customers
            for h in StatusHistory.objects.filter(order__created_by=request.user).order_by('-changed_at')[:10]:
                notifications.append({
                    'id': f'status-{h.id}',
                    'type': 'status_update',
                    'message': f'Order {h.order.order_number} updated to {h.to_status}',
                    'order_id': h.order.id,
                    'created_at': h.changed_at,
                })

        return Response({'notifications': notifications})
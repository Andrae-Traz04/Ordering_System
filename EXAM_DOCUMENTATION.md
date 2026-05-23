# Ordering System - Exam Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Backend Documentation](#backend-documentation)
3. [Frontend Documentation](#frontend-documentation)
4. [Mobile Responsiveness](#mobile-responsiveness)
5. [Database Models](#database-models)
6. [Authentication & Authorization](#authentication--authorization)
7. [Workflow State Machine](#workflow-state-machine)
8. [Backend Commands](#backend-commands)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Mobile App Documentation](#mobile-app-documentation)

---

## System Architecture

```
Ordering_System/
├── config/                    # Django project settings
│   ├── settings.py           # Main configuration
│   ├── urls.py               # Root URL routing
│   └── wsgi.py               # WSGI entry point
├── orders/                    # Main Django app
│   ├── models.py             # Database models
│   ├── views.py              # API views
│   ├── serializers.py        # DRF serializers
│   ├── urls.py               # API routes
│   ├── admin.py              # Django admin
│   ├── permissions.py        # Custom permissions
│   └── migrations/           # Database migrations
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── api/              # API client (axios)
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth)
│   │   ├── pages/            # Route pages
│   │   └── App.jsx           # Main App component
│   └── vite.config.js
├── scripts/                   # Utility scripts
└── manage.py                 # Django management script
```

---

## Backend Documentation

### Tech Stack
- **Python 3.10+**
- **Django 6.0**
- **Django REST Framework (DRF)**
- **SQLite** (database)
- **JWT Authentication** (SimpleJWT)
- **Token Blacklist** for logout

### Key Files

#### `config/settings.py`
- Database configuration (SQLite)
- Installed apps including DRF, SimpleJWT, CORS headers
- Email backend configuration (Gmail SMTP)
- REST framework default settings

#### `orders/models.py`
Core models:
- `UserProfile` - Extends User with role (user/admin/owner)
- `Customer` - Customer profile for ordering
- `Product` - Items for sale
- `Order` - Order with status workflow
- `OrderItem` - Line items in orders
- `StatusHistory` - Audit trail for status changes
- `Review` - Customer reviews for completed orders
- `OwnerApplication` - Application for owner role

#### `orders/views.py`
- `RegisterView` - User registration with email activation
- `LoginView` - JWT token authentication
- `ProductListCreateView` - CRUD for products
- `OrderListCreateView` - Order management
- `OrderStatusUpdateView` - Status workflow transitions
- `UserListView` - Admin user management
- `OwnerApplication*View` - Owner applications

#### `orders/serializers.py`
- `RegisterSerializer` - User creation with profile
- `ProductSerializer` - Product read/write serialization
- `OrderSerializer` - Order with items and history
- `OrderCreateSerializer` - Order creation with items

---

## Frontend Documentation

### Tech Stack
- **React 18**
- **Vite** (build tool)
- **React Router DOM** (routing)
- **Axios** (API client)
- **Plain CSS** (styling)

### Key Components

#### `src/api/ordersApi.js`
```javascript
// Base API instance with JWT interceptor
const API = axios.create({ baseURL: '/api' })

// Auto-attach token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-redirect on 401
API.interceptors.response.use(..., (err) => {
  if (err.response?.status === 401) window.location.href = '/login'
})
```

#### `src/context/AuthContext.jsx`
- Global authentication state
- Token management
- Role-based access control
- Session persistence

#### `src/App.jsx`
- React Router setup
- Role-based dashboard routing
- Responsive layout selection

#### `src/components/Layout.jsx` & `MobileLayout.jsx`
- Desktop sidebar + topbar layout
- Mobile-friendly bottom navigation

### Pages Structure
- `Login.jsx` - Authentication
- `Register.jsx` - User registration
- `Dashboard.jsx` - Role-based dashboard router
- `AdminDashboard.jsx` - Admin analytics & management
- `OwnerDashboard.jsx` - Product & order management
- `CustomerDashboard.jsx` - Shop & order history
- `Orders.jsx` - Order listing
- `CreateOrder.jsx` - Order creation
- `OrderDetail.jsx` - Single order view

---

## Mobile Responsiveness

The application uses responsive design:

```javascript
// App.jsx - Responsive Layout Detection
const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768)
  checkMobile()
  window.addEventListener('resize', checkMobile)
  return () => window.removeEventListener('resize', checkMobile)
}, [])
```

- **Mobile** (`< 768px`): Bottom navigation, stacked layout
- **Desktop** (`≥ 768px`): Sidebar navigation, split view

---

## Database Models

### UserProfile
```python
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),      # Regular customer
        ('admin', 'Admin'),    # System administrator
    ]
    user = OneToOneField(User)
    role = CharField(max_length=20, choices=ROLE_CHOICES)
    profile_image = ImageField()
    address = CharField(max_length=255)
    age = PositiveIntegerField()
    birthday = DateField()
```

### Product
```python
class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Electronics', 'Electronics'),
        ('Beauty', 'Beauty'),
        ('Fitness', 'Fitness'),
        ('Gifts', 'Gifts'),
        ('Kitchen', 'Kitchen'),
        ('Others', 'Others'),
    ]
    name = CharField(max_length=200)
    description = TextField()
    price = DecimalField(max_digits=10, decimal_places=2)
    category = CharField(max_length=50, choices=CATEGORY_CHOICES)
    emoji = CharField(max_length=10, default='📦')
    badge = CharField(max_length=50)  # e.g., "New", "Best Seller"
    is_active = BooleanField(default=True)
    created_by = ForeignKey(User)
```

### Order
```python
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    order_number = CharField(unique=True)  # Auto-generated: ORD-XXXXXX
    customer = ForeignKey(Customer)
    created_by = ForeignKey(User)
    status = CharField(choices=STATUS_CHOICES)
    notes = TextField()
    total_amount = DecimalField()
```

---

## Authentication & Authorization

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| **User** | Browse products, place orders, view own orders, leave reviews |
| **Owner** | All user permissions + manage products, update order status |
| **Admin** | Full access - users, roles, all orders, analytics |

### JWT Authentication Flow
1. POST `/api/auth/login/` with email/password
2. Receive access + refresh tokens
3. Store tokens in localStorage
4. Attach `Authorization: Bearer <token>` to requests
5. Token auto-refreshes via SimpleJWT

### Permission Classes (views.py)
```python
def get_role(user):
    return user.profile.role

def is_admin(user):
    return get_role(user) == 'admin'

def is_staff(user):
    return get_role(user) in ['admin', 'owner']
```

---

## Workflow State Machine

### Order Status Progression
```
Pending → Processing → Shipped → Completed
                    ↘
                     → Cancelled (from Pending only)
```

### Valid Transitions (Order model)
```python
VALID_TRANSITIONS = {
    'pending':    ['processing', 'cancelled'],
    'processing': ['shipped'],
    'shipped':    ['completed'],
    'completed':  [],
    'cancelled':  [],
}
```

### Status Update Enforcement
```python
def can_transition_to(self, new_status):
    return new_status in self.VALID_TRANSITIONS.get(self.status, [])
```

---

## Backend Commands

### Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows Git Bash)
source .venv/Scripts/activate

# Activate (Windows CMD)
.venv\Scripts\activate

# Activate (Mac/Linux)
source .venv/bin/activate
```

### Django Management Commands
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Run on specific port
python manage.py runserver 8080

# Django shell for testing
python manage.py shell

# Create migrations after model changes
python manage.py makemigrations

# Show migration status
python manage.py showmigrations
```

### Database Operations
```bash
# Reset database (delete SQLite file)
rm db.sqlite3

# Re-run migrations
python manage.py migrate

# Flush all data (keep tables)
python manage.py flush

# Inspect database
python manage.py dbshell
```

### Testing & Debugging
```bash
# Run tests
python manage.py test

# Check for issues
python manage.py check

# Collect static files
python manage.py collectstatic
```

### Utility Scripts (in /scripts/)
```bash
# List users
python scripts/list_users.py

# Set user password
python scripts/set_password.py

# Set user role
python scripts/set_role.py

# Activate users
python scripts/activate_users.py
```

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register/` | Public | Register new user |
| POST | `/api/auth/login/` | Public | Login, get JWT tokens |
| POST | `/api/auth/logout/` | Auth | Logout and blacklist token |
| GET | `/api/auth/me/` | Auth | Get current user info |
| POST | `/api/auth/activate/<id>/<token>/` | Public | Activate account |
| POST | `/api/auth/resend-activation/` | Public | Resend activation email |
| POST | `/api/auth/request-reset/` | Public | Request password reset |
| POST | `/api/auth/reset-password/<id>/<token>/` | Public | Reset password |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products/` | Auth | List products (active only for users) |
| POST | `/api/products/` | Owner, Admin | Create product |
| GET | `/api/products/<id>/` | Auth | Get product details |
| PATCH | `/api/products/<id>/` | Owner, Admin | Update product |
| DELETE | `/api/products/<id>/` | Admin | Delete product |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/orders/` | Auth | List orders (own only for users) |
| POST | `/api/orders/` | User, Owner | Create order |
| GET | `/api/orders/<id>/` | Auth | Get order details |
| PATCH | `/api/orders/<id>/` | Auth | Update order notes |
| DELETE | `/api/orders/<id>/` | Admin | Delete order |
| POST | `/api/orders/<id>/status/` | Owner, Admin | Update status |
| POST | `/api/orders/<id>/review/` | User | Add review |
| POST | `/api/orders/<id>/cancel/` | User | Cancel pending order |
| GET | `/api/orders/summary/` | Auth | Order stats |

### Users & Customers
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users/` | Admin | List all users |
| PATCH | `/api/users/<id>/role/` | Admin | Change user role |
| GET | `/api/customers/` | Owner, Admin | List customers |

### Owner Applications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/owner-applications/` | Auth | List applications |
| POST | `/api/owner-applications/create/` | Auth | Submit application |
| GET | `/api/owner-applications/<id>/` | Auth | Get application |
| POST | `/api/owner-applications/<id>/review/` | Admin | Review application |

---

## Quick Reference for Exams

### Run the System
```bash
# Terminal 1 - Backend
source .venv/Scripts/activate
python manage.py migrate
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### URLs
- Frontend: http://localhost:5173
- Backend API: http://127.0.0.1:8000/api/
- Django Admin: http://127.0.0.1:8000/admin/

### Key Concepts to Remember
1. **JWT tokens** - Access + Refresh token pattern
2. **Role-based access** - user, owner, admin
3. **Order workflow** - Strict state transitions
4. **Email activation** - New users must activate via email
5. **Status history** - All status changes are logged

---

## Mobile App Documentation

### Tech Stack
- **React Native** (Expo)
- **TypeScript**
- **React Navigation** (Native Stack)
- **Axios** (API client)
- **Expo Secure Store** (token storage)

### Mobile Project Structure
```
mobile/
├── src/
│   ├── api/
│   │   └── client.ts          # API client with SecureStore
│   ├── context/
│   │   └── AuthContext.tsx    # Auth state management
│   ├── screens/
│   │   ├── LoginScreen.tsx    # Login page
│   │   ├── OwnerDashboardScreen.tsx
│   │   └── CustomerDashboardScreen.tsx
│   ├── theme/
│   │   └── design.ts          # Theme constants
│   └── types/
│       └── index.ts           # TypeScript types
├── App.tsx                     # Main app with navigation
├── app.json                    # Expo configuration
└── package.json
```

### Mobile API Client (client.ts)
```typescript
// Platform-aware token storage
const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('access_token')
  }
  return await SecureStore.getItemAsync('access_token')
}

// API instance with JWT interceptor
export const api = axios.create({
  baseURL: resolveApiBaseUrl(),  // Auto-detect backend URL
  timeout: 15000,
})

// Request interceptor - attach token
api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### Authentication Flow (Mobile)
```typescript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('access_token')
        : await SecureStore.getItemAsync('access_token')
      if (token) {
        const res = await fetchMe()
        setUser(normalizeUserPayload(res.data))
      }
    }
    loadUser()
  }, [])

  const login = async (token, refreshToken, userData) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('access_token', token)
      localStorage.setItem('refresh_token', refreshToken)
    } else {
      await SecureStore.setItemAsync('access_token', token)
      await SecureStore.setItemAsync('refresh_token', refreshToken)
    }
    setUser(userData)
  }
}
```

### Mobile App Navigation (App.tsx)
```typescript
function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) return <ActivityIndicator />

  if (!user) {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    )
  }

  return (
    <Stack.Navigator>
      {user.role === 'owner' || user.role === 'admin'
        ? <Stack.Screen name="Dashboard" component={OwnerDashboardScreen} />
        : <Stack.Screen name="Dashboard" component={CustomerDashboardScreen} />
      }
    </Stack.Navigator>
  )
}
```

### Mobile Dashboard Example (OwnerDashboardScreen.tsx)
```typescript
// Workflow constants
const WORKFLOW = ['pending', 'processing', 'shipped', 'completed']
const NEXT_STATUS: Record<string, string | null> = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'completed',
  completed: null,
}

// Order item with status advance button
const handleAdvance = async (orderId: number, currentStatus: string) => {
  const nextStatus = NEXT_STATUS[currentStatus]
  if (!nextStatus) return
  await updateStatus(orderId, nextStatus, `Advanced to ${nextStatus}`)
  await loadData()
}
```

### TypeScript Types (types/index.ts)
```typescript
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'customer' | 'owner' | 'admin'
  profile_image?: string
}

export interface Order {
  id: number
  customer_name: string
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  total: number
  created_at: string
}

export interface Summary {
  total_orders: number
  total_revenue: number
  pending_orders: number
}
```

### Theme Constants (theme/design.ts)
```typescript
export const colors = {
  bgTop: '#EDE9FE',
  bgBottom: '#DDD6FE',
  panel: '#FFFFFF',
  panelSoft: '#FAFAFF',
  panelDark: '#F3EEFF',
  textPrimary: '#2D1F6E',
  accent: '#9B6DFF',
}

export const radii = { sm: 10, md: 16, lg: 18, xl: 24, pill: 20 }
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 }
export const typeScale = { caption: 12, body: 15, title: 24, hero: 34 }
```

### Mobile Commands
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android device/emulator
npm run android

# Run on iOS simulator
npm run ios

# Run in web browser
npm run web
```

### Mobile Environment Setup
```bash
# Install Expo CLI globally
npm install -g expo-cli

# Install dependencies for mobile
cd mobile
npm install

# Set API URL (create .env file)
echo "EXPO_PUBLIC_API_URL=http://your-backend-ip:8000" > .env
```

### Mobile vs Web Differences
| Feature | Web (React) | Mobile (React Native) |
|---------|-------------|----------------------|
| Storage | localStorage | SecureStore (native) / localStorage (web) |
| Navigation | React Router DOM | React Navigation |
| Styling | CSS | StyleSheet API |
| API URL | Fixed `/api` | Auto-detected from Expo constants |

---

## Backend Commands (Comprehensive)

### Development Commands
```bash
# Virtual Environment
python -m venv .venv
source .venv/Scripts/activate  # Windows Git Bash
# .venv\Scripts\activate        # Windows CMD

# Install/Run
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Create admin
python manage.py createsuperuser

# Database reset
rm db.sqlite3
python manage.py migrate
```

### Testing Commands
```bash
# Run tests
python manage.py test

# Django shell
python manage.py shell

# Check for issues
python manage.py check --deploy

# Static files
python manage.py collectstatic
```

### Production Commands
```bash
# Disable debug mode
set DEBUG=False

# Run with production server
python manage.py runserver 0.0.0.0:8000

# Collect static for production
python manage.py collectstatic --noinput
```
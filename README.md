# Order Processing Workflow System

A full-stack web application that manages orders through a strict workflow state machine.
Built with Django REST Framework (backend) and React + Vite (frontend).

---

## Tech Stack

### Backend
- Python 3.10+
- Django 6
- Django REST Framework
- SQLite (database)
- Token Authentication

### Frontend
- React 18
- Vite
- React Router DOM
- Axios
- Plain CSS (no UI library)

---

## Project Structure

```
ordering system/
├── config/                        # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── orders/                        # Main Django app
│   ├── migrations/
│   ├── templates/
│   │   └── api/
│   │       └── docs.html          # Custom HTML admin panel
│   ├── admin.py
│   ├── models.py                  # Database models
│   ├── serializers.py             # DRF serializers
│   ├── views.py                   # API views
│   └── urls.py                    # API routes
├── frontend/                      # React + Vite app
│   ├── src/
│   │   ├── api/
│   │   │   └── ordersApi.js       # All API calls (axios)
│   │   ├── components/
│   │   │   ├── IconLibrary.jsx    # Reusable SVG icon system
│   │   │   ├── Layout.jsx         # Sidebar + topbar
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── StatusBadge.jsx    # Status color badge
│   │   │   └── Stepper.jsx        # Workflow stepper UI
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx      # Routes to role-specific dashboard
│   │   │   ├── AdminDashboard.jsx # Admin — analytics, users, orders, customers
│   │   │   ├── OwnerDashboard.jsx # Owner — orders + product management
│   │   │   ├── CustomerDashboard.jsx # Customer — shop + my orders
│   │   │   ├── Orders.jsx
│   │   │   ├── CreateOrder.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── Customers.jsx
│   │   │   └── Users.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── manage.py
├── requirements.txt
└── README.md
```

---

## Setup Instructions

### Requirements
Make sure you have these installed before starting:
- Python 3.10 or higher → https://www.python.org/downloads/
- Node.js 18 or higher → https://nodejs.org/
- Git → https://git-scm.com/

---

### Step 1 — Clone the repository
```bash
git clone https://github.com/coderist1/Ordering_System.git
cd Ordering_System
```

---

### Step 2 — Create and activate virtual environment
```bash
python -m venv .venv
```

**Windows (Git Bash or PowerShell):**
```bash
source .venv/Scripts/activate
```

**Windows (Command Prompt):**
```bash
.venv\Scripts\activate
```

**Mac / Linux:**
```bash
source .venv/bin/activate
```

You should see `(.venv)` at the start of your terminal line.

---

### Step 3 — Install backend dependencies
```bash
pip install -r requirements.txt
```

---

### Step 4 — Run database migrations
```bash
python manage.py migrate
```

You should see a list of `OK` messages.

---

### Step 5 — Start the Django backend server
```bash
python manage.py runserver
```

Backend runs at → `http://127.0.0.1:8000`

---

### Step 6 — Install frontend dependencies

Open a **new terminal**:
```bash
cd frontend
npm install
```

---

### Step 7 — Start the frontend development server
```bash
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

### Email activation setup
The activation email is sent through Django's email backend. By default the project uses the console backend for local development, so no real email is delivered until SMTP is configured.

To send activation emails to Gmail, set these environment variables before starting Django:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail-address@gmail.com
EMAIL_HOST_PASSWORD=your-google-app-password
DEFAULT_FROM_EMAIL=your-gmail-address@gmail.com
```

Use a Google App Password, not your normal Gmail password.

---

## Accessing the Application

| URL | Description |
|-----|-------------|
| http://localhost:5173 | React frontend |
| http://127.0.0.1:8000/api/ | Backend API root |
| http://127.0.0.1:8000/api/panel/ | Custom HTML admin panel |
| http://127.0.0.1:8000/admin/ | Django admin panel |

> Both servers must be running at the same time.

---

## User Roles

| Role | What you can do |
|------|----------------|
| **Customer** | Browse products, add to cart, place orders, view own orders, leave reviews on completed orders |
| **Owner** | Add/edit/delete products, view all orders, advance order status |
| **Admin** | Full access — view analytics, manage users and their roles, view all orders, delete orders, view all customers |

> **Note:** Admin cannot create orders. Admin manages the system.

---

## How the Workflow Works

Orders follow a strict one-way status progression:

```
Pending → Processing → Shipped → Completed
```

- You **cannot skip steps** — going from Pending directly to Shipped will be rejected.
- You **cannot go backwards** — once Completed it stays Completed.
- Only **Owner** and **Admin** can advance order status.
- Only **Admin** can delete orders.
- **Customers** can only see and manage their own orders.

---

## Role Dashboards

### Customer Dashboard
- **Shop tab** — browse products listed by the owner, add to cart, adjust quantity
- **My Orders tab** — view all placed orders and their current status
- Cart drawer with live total and place order button

### Owner Dashboard
- **Orders tab** — view all customer orders, filter by status, advance order status
- **My Products tab** — add, edit, and delete products from a modal form

### Admin Dashboard
- **Overview tab** — system-wide stats, user role breakdown, order status breakdown
- **Orders tab** — view and delete any order in the system
- **Users tab** — view all registered users, change any user's role
- **Customers tab** — view all customer records

---

## API Endpoints

All protected endpoints require:
```
Authorization: Token <your-token>
```

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register/ | Public | Register a new user |
| POST | /api/auth/login/ | Public | Login and receive token |
| POST | /api/auth/logout/ | Authenticated | Logout and delete token |
| GET  | /api/auth/me/ | Authenticated | Get current user info |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET    | /api/products/ | Authenticated | List products (customers see active only) |
| POST   | /api/products/ | Owner, Admin | Create a new product |
| GET    | /api/products/{id}/ | Authenticated | Get product details |
| PATCH  | /api/products/{id}/ | Owner, Admin | Update a product |
| DELETE | /api/products/{id}/ | Owner, Admin | Delete a product |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET    | /api/orders/ | Authenticated | List orders (customers see own only) |
| POST   | /api/orders/ | Customer, Owner | Create a new order |
| GET    | /api/orders/{id}/ | Authenticated | Get order details |
| PATCH  | /api/orders/{id}/ | Authenticated | Update order notes |
| DELETE | /api/orders/{id}/ | Admin only | Delete an order |
| POST   | /api/orders/{id}/status/ | Owner, Admin | Advance order status |
| GET    | /api/orders/summary/ | Authenticated | Get order count and revenue stats |
| POST   | /api/orders/{id}/review/ | Customer | Leave a review on completed order |

### Customers & Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET   | /api/customers/ | Owner, Admin | List all customers |
| GET   | /api/users/ | Admin only | List all registered users |
| PATCH | /api/users/{id}/role/ | Admin only | Change a user's role |
| GET   | /api/notifications/ | Authenticated | Get notifications |

---

## Testing with Multiple Users

Each browser window shares the same localStorage. Use separate windows per user:

| User | Browser |
|------|---------|
| Admin | Chrome (normal window) |
| Owner | Chrome Incognito — `Ctrl+Shift+N` |
| Customer | Firefox or Edge |

---

## Django Admin Panel

To access the Django admin you need a superuser:
```bash
python manage.py createsuperuser
```

Then go to → http://127.0.0.1:8000/admin/

---

## Common Issues

**`(.venv)` not showing / pip not found**
Activate the virtual environment first (Step 2).

**`ModuleNotFoundError` on runserver**
Run `pip install -r requirements.txt` inside the activated virtual environment.

**CORS error in browser console**
Make sure `corsheaders` is in `INSTALLED_APPS` and `CorsMiddleware` is at the top of `MIDDLEWARE` in `config/settings.py`.

**`npm: command not found`**
Download Node.js from https://nodejs.org/

**Frontend shows blank page**
Both servers must be running — Django on 8000 AND Vite on 5173.

**Login says invalid credentials**
Register first at http://localhost:5173/register

**`TemplateDoesNotExist: docs.html`**
Make sure `docs.html` is placed in `orders/templates/api/` and `views.py` uses:
```python
return render(request, 'api/docs.html')
```

---

## Two Terminals Required

**Terminal 1 — Django Backend:**
```bash
source .venv/Scripts/activate
python manage.py runserver
```

**Terminal 2 — React Frontend:**
```bash
cd frontend
npm run dev
```
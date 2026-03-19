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
├── config/                      # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── orders/                      # Main Django app
│   ├── migrations/
│   ├── templates/
│   │   └── api/
│   │       └── docs.html        # Custom HTML admin panel
│   ├── admin.py
│   ├── models.py                # Database models
│   ├── serializers.py           # DRF serializers
│   ├── views.py                 # API views
│   └── urls.py                  # API routes
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── api/
│   │   │   └── ordersApi.js     # All API calls (axios)
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Sidebar + topbar
│   │   │   ├── NotificationBell.jsx # Notification dropdown
│   │   │   ├── StatusBadge.jsx      # Status color badge
│   │   │   └── Stepper.jsx          # Workflow stepper UI
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
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
git clone <your-repo-url>
cd "ordering system"
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

Open a new terminal:
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

## Accessing the Application

| URL | Description |
|-----|-------------|
| http://localhost:5173 | React frontend |
| http://127.0.0.1:8000/api/ | Backend API root |
| http://127.0.0.1:8000/api/panel/ | Custom HTML admin panel |
| http://127.0.0.1:8000/admin/ | Django admin panel |

> **Note:** Both servers must be running at the same time — Django on port 8000 and Vite on port 5173.

---

## Creating Your Account

1. Go to http://localhost:5173/register
2. Enter a username and password (min. 6 characters)
3. Select your role:

| Role | What you can do |
|------|----------------|
| **Customer** | Create orders, view only your own orders, leave reviews on completed orders |
| **Owner** | View all orders, advance order status |
| **Admin** | Full access — view all orders, advance status, delete orders, view all users |

4. Click **Sign Up** — you will be redirected to the dashboard automatically.

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

## API Endpoints

All protected endpoints require a token in the request header:
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

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET    | /api/orders/ | Authenticated | List orders (customers see own only) |
| POST   | /api/orders/ | Authenticated | Create a new order |
| GET    | /api/orders/{id}/ | Authenticated | Get order details |
| PATCH  | /api/orders/{id}/ | Authenticated | Update order notes |
| DELETE | /api/orders/{id}/ | Admin only | Delete an order |
| POST   | /api/orders/{id}/status/ | Owner, Admin | Advance order status |
| GET    | /api/orders/summary/ | Authenticated | Get order count and revenue stats |
| POST   | /api/orders/{id}/review/ | Customer | Leave a review on completed order |

### Customers & Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/customers/ | Owner, Admin | List all customers |
| GET | /api/users/ | Admin only | List all registered users |
| GET | /api/notifications/ | Authenticated | Get notifications |

---

## Django Admin Panel

To access the Django admin you need a superuser account:
```bash
python manage.py createsuperuser
```

Then go to http://127.0.0.1:8000/admin/

---

## Testing with Multiple Users

Since each browser window shares the same localStorage, use separate windows per user:

| User | Browser |
|------|---------|
| Admin | Chrome (normal window) |
| Owner | Chrome Incognito (Ctrl+Shift+N) |
| Customer | Firefox or Edge |

---

## Common Issues

**`(.venv)` not showing / pip not found**
Make sure you activated the virtual environment first (Step 2).

**`ModuleNotFoundError` on runserver**
Run `pip install -r requirements.txt` again inside the activated virtual environment.

**CORS error in browser console**
Make sure `corsheaders` is in `INSTALLED_APPS` and `CorsMiddleware` is at the top of `MIDDLEWARE` in `config/settings.py`.

**`npm: command not found`**
Node.js is not installed. Download it from https://nodejs.org/

**Frontend shows blank page**
Make sure both servers are running — Django on 8000 AND Vite on 5173.

**Login says invalid credentials**
Register an account first at http://localhost:5173/register

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
```got

okay kayo
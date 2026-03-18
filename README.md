# Order Processing Workflow System

A full-stack order management system with workflow state machine.

## Tech Stack
- **Backend:** Django 6, Django REST Framework, SQLite
- **Frontend:** React 18, Vite, Axios, React Router DOM

## Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd "ordering system"
```

### 2. Create and activate virtual environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

### 3. Install backend dependencies
```bash
pip install -r requirements.txt
```

### 4. Run migrations
```bash
python manage.py migrate
```

### 5. Start Django server
```bash
python manage.py runserver
```

### 6. Install and start frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

## Access
- **Frontend:** http://localhost:5173
- **API:** http://127.0.0.1:8000/api/
- **Admin:** http://127.0.0.1:8000/admin/

## Getting Started
Register an account at http://localhost:5173/register and choose your role:
- **Customer** — Place orders and track your own orders
- **Owner** — View all orders and advance order status
- **Admin** — Full access including user management and delete orders

## Workflow Rules
- Pending → Processing → Shipped → Completed
- Skipping steps is prevented by backend validation

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register/ | Register new user |
| POST | /api/auth/login/ | Login |
| POST | /api/auth/logout/ | Logout |
| GET | /api/orders/ | List orders |
| POST | /api/orders/ | Create order |
| GET | /api/orders/{id}/ | Order detail |
| PATCH | /api/orders/{id}/ | Update notes |
| DELETE | /api/orders/{id}/ | Delete order (admin only) |
| POST | /api/orders/{id}/status/ | Update status |
| GET | /api/orders/summary/ | Order summary |
| GET | /api/customers/ | List customers |
| GET | /api/users/ | List users (admin only) |
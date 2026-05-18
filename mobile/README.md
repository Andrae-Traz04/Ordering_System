# Mobile App (Expo)

React Native mobile app connected to the Django API.

## Setup

```bash
cd mobile
npm install
```

## Run with Expo Go

1. Start the Django backend: `python manage.py runserver`
2. In the mobile directory, run: `npm start`
3. Scan the QR code with Expo Go (iOS/Android)

## API Configuration

The app connects to `http://10.0.2.2:8000/api` by default (Android emulator).

For iOS simulator, update `mobile/src/api/client.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000/api'  // iOS simulator
// const API_BASE_URL = 'http://10.0.2.2:8000/api'  // Android emulator
```

For physical device, use your computer's IP address.

## Features

- JWT Authentication
- Dashboard with order summary
- Order listing
- Product browsing
- Profile management

## Project Structure

```
mobile/src/
├── api/client.ts     # API client with all endpoints
├── context/AuthContext.tsx  # Authentication context
├── screens/
│   ├── LoginScreen.tsx
│   └── DashboardScreen.tsx
└── types/index.ts    # TypeScript types
```
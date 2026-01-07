# API Reference

**Base URL**

- **Production**: `https://busapp.hafizhfadh.id`
- **Development**: `http://localhost:3000`

---

## 1. Authentication

### Register

`POST /auth/register`

Register a new user account.

**Request Body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "081234567890",
  "nim": "12345678"
}
```

**Response (200 OK)**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user": {
    "id": "uuid-user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "nim": "12345678",
    "role": "USER"
  }
}
```

### Login

`POST /auth/login`

Login with email and password.

**Request Body**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK)**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user": {
    "id": "uuid-user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

### Get Current User Profile

`GET /auth/me`

Get profile of the currently logged-in user.
**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**

```json
{
  "id": "uuid-user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 2. Public Data

### List Terminals

`GET /terminals`

Get a list of all bus terminals, stations, and pools. Useful for "Origin" and "Destination" dropdowns.

**Response (200 OK)**

```json
[
  {
    "id": "uuid-terminal-1",
    "code": "JKT-PG",
    "name": "Terminal Pulo Gebang",
    "city": "Jakarta",
    "type": "TERMINAL"
  },
  {
    "id": "uuid-terminal-2",
    "code": "BDG-LW",
    "name": "Terminal Leuwipanjang",
    "city": "Bandung",
    "type": "TERMINAL"
  }
]
```

### Search Trips

`GET /public/trips`

Search for available trips.

**Query Parameters**

- `origin`: City name (e.g., "Jakarta")
- `destination`: City name (e.g., "Bandung")
- `date`: Date in YYYY-MM-DD format (e.g., "2024-01-20")

**Response (200 OK)**

```json
[
  {
    "id": "uuid-trip-id",
    "departureTime": "2024-01-20T08:00:00Z",
    "arrivalTime": "2024-01-20T12:00:00Z",
    "price": 150000,
    "bus": {
      "name": "Bus Executive 01",
      "type": "EXECUTIVE",
      "totalSeat": 40
    },
    "route": {
      "origin": "Jakarta",
      "destination": "Bandung",
      "distanceKm": 150
    }
  }
]
```

### Get Trip Detail

`GET /public/trips/:id`

Get detailed information about a trip, including seat availability.

**Response (200 OK)**

```json
{
  "id": "uuid-trip-id",
  "departureTime": "2024-01-20T08:00:00Z",
  "arrivalTime": "2024-01-20T12:00:00Z",
  "price": 150000,
  "seats": [
    {
      "id": "uuid-seat-1",
      "seatCode": "A1",
      "isBooked": false
    },
    {
      "id": "uuid-seat-2",
      "seatCode": "A2",
      "isBooked": true
    }
  ]
}
```

---

## 3. Booking

### Create Booking

`POST /booking`

Create a new booking for selected seats.
**Headers**: `Authorization: Bearer <token>`

**Request Body**

```json
{
  "tripId": "uuid-trip-id",
  "seatCodes": ["A1", "A2"]
}
```

**Response (201 Created)**
_Updated: Returns flat structure with ID at root._

```json
{
  "id": "uuid-booking-id",
  "userId": "uuid-user-id",
  "tripId": "uuid-trip-id",
  "status": "PENDING",
  "totalPrice": 300000,
  "expiresAt": "2024-01-20T09:15:00.000Z",
  "createdAt": "2024-01-20T09:00:00.000Z",
  "message": "Booking created. Please proceed to payment."
}
```

### Get My Bookings

`GET /booking/me`

Get a list of the current user's bookings.
**Headers**: `Authorization: Bearer <token>`

**Query Parameters**

- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 20)
- `status`: **(Optional)** Filter by status: `PENDING`, `CONFIRMED` (Paid), `CANCELLED`, `EXPIRED`.

**Response (200 OK)**

```json
{
  "page": 1,
  "perPage": 20,
  "total": 5,
  "data": [
    {
      "id": "uuid-booking-id",
      "status": "CONFIRMED",
      "totalPrice": 150000,
      "trip": {
        "departureTime": "...",
        "bus": { "name": "..." },
        "route": { "origin": "...", "destination": "..." }
      },
      "payment": {
        "status": "PAID",
        "amount": 150000
      }
    }
  ]
}
```

### Get Booking Detail

`GET /booking/:id`

Get full details of a specific booking.
**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**

```json
{
  "id": "uuid-booking-id",
  "status": "PENDING",
  "totalPrice": 300000,
  "user": { ... },
  "trip": { ... },
  "seats": [
    { "seatCode": "A1" },
    { "seatCode": "A2" }
  ],
  "payment": { ... }
}
```

### Change Seats

`PUT /booking/:id/seat`

Change seats for an existing booking.
**Constraints:**

- Must be the same Trip.
- Must select the same number of seats (1-to-1 swap).
- New seats must be available.
  **Headers**: `Authorization: Bearer <token>`

**Request Body**

```json
{
  "newSeatCodes": ["A3", "A4"]
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Seats changed successfully."
}
```

### Cancel Booking

`POST /booking/:id/cancel`

Cancel a booking. Only allowed if status is `PENDING`.
**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**

```json
{
  "success": true
}
```

---

## 4. Payment (Midtrans)

### Initiate Payment (Snap)

`POST /payment/create`

Generate a Snap Token and Redirect URL to start payment.
**Headers**: `Authorization: Bearer <token>`

**Request Body**

```json
{
  "bookingId": "uuid-booking-id"
}
```

**Response (200 OK)**

```json
{
  "payment": {
    "token": "snap-token-string",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v3/redirection/..."
  }
}
```

### Handling Payment Errors

If the API returns an error structure like this, display `error` message to user:

```json
{
  "error": "Failed to initiate payment: Access Denied"
}
```

---

## 5. Admin Management (Role: ADMIN)

These endpoints require distinct `ADMIN` privileges.

### Terminals (Admin)

- `POST /terminals` - Create new terminal
  ```json
  {
    "code": "JKT",
    "name": "Jakarta Terminal",
    "city": "Jakarta",
    "type": "TERMINAL"
  }
  ```

### Buses

- `GET /admin/buses` - List all buses
- `POST /admin/buses` - Add new bus
- `PUT /admin/buses/:id` - Update bus
- `DELETE /admin/buses/:id` - Delete bus

### Routes

- `GET /admin/routes` - List all routes
- `POST /admin/routes` - Add new route
- `PUT /admin/routes/:id` - Update route
- `DELETE /admin/routes/:id` - Delete route

### Trips

- `GET /admin/trips` - List all scheduled trips
- `POST /admin/trips` - Create a trip schedule
- `DELETE /admin/trips/:id` - Cancel/Delete a trip

### Users

- `GET /admin/users` - List all registered users
- `PUT /admin/users/:id/role` - Update user role (Promote to ADMIN / Demote to USER)

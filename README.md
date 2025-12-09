# 🚌 Bus Booking System API

Backend API untuk sistem pemesanan tiket bus dengan admin dashboard, dibangun menggunakan **Hono.js**, **Prisma ORM**, dan **PostgreSQL**.

## 📋 Fitur

### Backend API:
- 🔐 **Autentikasi & Otorisasi**: JWT-based authentication dengan role-based access control (ADMIN/USER)
- 🚌 **Manajemen Bus**: CRUD operations untuk data bus
- 🛣️ **Manajemen Route**: Kelola rute perjalanan bus
- 🚍 **Manajemen Trip**: Jadwal perjalanan dengan auto-generate seats
- 💺 **Seat Management**: Sistem kursi dengan kode unik (A1, A2, B1, dll)
- 📋 **Booking System**: Pemesanan tiket dengan status tracking
- 💳 **Payment Integration**: Integrasi dengan Midtrans payment gateway
- 📊 **Revenue Analytics**: Dashboard statistik dan revenue by route/bus

### Admin Frontend:
- ✨ Modern UI dengan React + TypeScript + Vite
- 🎨 Toast notifications untuk user feedback
- ⚡ Real-time error handling dan loading states
- 📊 Dashboard dengan booking statistics
- 🔄 CRUD operations untuk semua entities

## 🛠️ Tech Stack

**Backend:**
- **Framework**: Hono.js (Fast, lightweight web framework)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (jose library)
- **Validation**: Zod
- **Payment**: Midtrans

**Frontend:**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Charts**: Chart.js (optional)

## 📦 Prerequisites

Sebelum memulai, pastikan sudah terinstall:

- **Node.js** >= 18.x
- **npm** atau **yarn**
- **PostgreSQL** >= 14.x
- **Git**

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend-bus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root directory:

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda:

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/bussapp

# JWT Secret (generate dengan: openssl rand -base64 32)
JWT_PRIVATE_KEY=your_jwt_secret_key_here

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

# Server
PORT=3000
```

### 4. Setup Database

#### a. Buat Database PostgreSQL

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE bussapp;

# Exit
\q
```

#### b. Jalankan Prisma Migrations

```bash
npx prisma migrate dev
```

Jika ada collation version mismatch di PostgreSQL, jalankan:

```bash
psql -U postgres -d template1 -c "ALTER DATABASE template1 REFRESH COLLATION VERSION;"
```

#### c. Seed Database (Optional)

Populate database dengan sample data (admin user, buses, routes, trips):

```bash
npx prisma db seed
```

**Default Admin Credentials:**
- Email: `admin@test.com`
- Password: `password123`

**Sample Data yang di-generate:**
- 3 Users (1 admin, 2 regular users)
- 2 Buses (Bus Eksekutif A, Bus Ekonomi B)
- 2 Routes (Jakarta-Bandung, Bandung-Yogyakarta)
- 2 Trips dengan auto-generated seats

### 5. Start Development Server

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

API Documentation (Swagger UI): **http://localhost:3000/docs**

## 🎨 Admin Frontend Setup

Admin dashboard berada di folder `admin-frontend/`.

### 1. Install Dependencies

```bash
cd admin-frontend
npm install
```

### 2. Environment Configuration

File `.env` sudah di-setup dengan default values:

```env
# Kosongkan untuk development (menggunakan Vite proxy)
VITE_API_BASE_URL=
```

Vite akan otomatis proxy requests ke backend (`localhost:3000`).

### 3. Start Frontend Dev Server

```bash
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173** (atau port lain yang ditampilkan)

### 4. Login ke Admin Dashboard

1. Buka **http://localhost:5173**
2. Login dengan credentials:
   - Email: `admin@test.com`
   - Password: `password123`
3. Explore semua fitur!

## 📁 Struktur Project

```
backend-bus/
├── src/
│   ├── app.ts                 # Main application setup
│   ├── index.ts              # Entry point
│   ├── config/
│   │   └── database.ts       # Prisma client instance
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   └── rbac.middleware.ts  # Role-based access control
│   ├── modules/
│   │   ├── admin/            # Admin endpoints (CRUD)
│   │   ├── auth/             # Authentication (login, register)
│   │   ├── booking/          # Booking management
│   │   ├── payment/          # Payment processing
│   │   └── public/           # Public endpoints (routes, trips)
│   └── utils/
│       └── jwt.ts            # JWT utilities
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts              # Database seeder
│   └── migrations/          # Migration files
├── admin-frontend/          # React admin dashboard
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client & utilities
│   │   └── App.tsx         # Main app component
│   └── vite.config.ts      # Vite configuration
└── README.md               # This file
```

## 🔗 API Endpoints

### Public Endpoints

```
GET    /public/routes          # List semua routes
GET    /public/routes/:id      # Detail route
GET    /public/trips           # List trips (with filters)
GET    /public/trips/:id       # Detail trip + available seats
```

### Authentication

```
POST   /auth/register          # Register user baru
POST   /auth/login             # Login & dapatkan JWT token
```

### Admin Endpoints (Require ADMIN role)

**Users:**
```
POST   /admin/users            # Create user
GET    /admin/users            # List users
POST   /admin/users/:id/promote # Change user role
```

**Buses:**
```
POST   /admin/buses            # Create bus
GET    /admin/buses            # List buses
PUT    /admin/buses/:id        # Update bus
DELETE /admin/buses/:id        # Delete bus
```

**Routes:**
```
POST   /admin/routes           # Create route
GET    /admin/routes           # List routes
PUT    /admin/routes/:id       # Update route
DELETE /admin/routes/:id       # Delete route
```

**Trips:**
```
POST   /admin/trips            # Create trip (+ auto-generate seats)
GET    /admin/trips            # List trips
PUT    /admin/trips/:id        # Update trip
DELETE /admin/trips/:id        # Delete trip
```

**Bookings & Analytics:**
```
GET    /admin/bookings         # List bookings (with pagination & filters)
GET    /admin/bookings/stats   # Booking statistics
GET    /admin/revenue/daily    # Daily revenue
GET    /admin/revenue/monthly  # Monthly revenue
GET    /admin/revenue/route    # Revenue by route
GET    /admin/revenue/bus      # Revenue by bus
```

### User Endpoints (Require authentication)

```
POST   /bookings               # Create booking
GET    /bookings/me            # User's bookings
GET    /bookings/:id           # Booking detail
DELETE /bookings/:id           # Cancel booking
POST   /payments/create        # Create payment
POST   /payments/notification  # Midtrans webhook
```

## 🧪 Testing

### Test API dengan curl

```bash
# Login sebagai admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# Response akan memberikan token:
# {"token":"eyJhbGc...","user":{...}}

# Gunakan token untuk akses protected endpoints:
curl http://localhost:3000/admin/buses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test dengan Admin Frontend

1. Start backend: `npm run dev`
2. Start frontend: `cd admin-frontend && npm run dev`
3. Login & test semua fitur CRUD

## 🗄️ Database Schema

### Core Models:

- **User**: Users dengan role (ADMIN/USER)
- **Bus**: Data bus (nama, plate, jumlah seat)
- **Route**: Rute perjalanan (origin, destination, distance)
- **Trip**: Jadwal perjalanan (bus, route, waktu, harga)
- **Seat**: Kursi untuk setiap trip (generated otomatis)
- **Booking**: Pemesanan tiket oleh user
- **BookingSeat**: Many-to-many relationship booking dan seats
- **Payment**: Data pembayaran melalui Midtrans

### ERD (Simplified):

```
User ─────< Booking ────> BookingSeat >──── Seat
                │                             │
                │                             │
                └──> Payment                  │
                                              │
Bus ─────< Trip >───── Route                 │
         │                                    │
         └────────────────────────────────────┘
```

Lihat detail schema di `prisma/schema.prisma`

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server dengan hot reload

# Build
npm run build           # Compile TypeScript ke JavaScript

# Production
npm start               # Run production build

# Database
npx prisma migrate dev  # Create & apply migrations
npx prisma db seed      # Seed database dengan sample data
npx prisma studio       # Open Prisma Studio (database GUI)
npx prisma generate     # Generate Prisma Client

# Admin Frontend
cd admin-frontend
npm run dev             # Start Vite dev server
npm run build           # Build for production
```

## 🐛 Troubleshooting

### PostgreSQL Collation Version Mismatch

Jika muncul error saat migration:

```
ERROR: template database "template1" has a collation version mismatch
```

Solusi:

```bash
psql -U postgres -d template1 -c "ALTER DATABASE template1 REFRESH COLLATION VERSION;"
```

### Prisma Client Not Generated

Jika error `Cannot find module '@prisma/client'`:

```bash
npx prisma generate
```

### Port 3000 Already in Use

Edit `.env` dan ganti `PORT`:

```env
PORT=3001
```

Jangan lupa update Vite proxy di `admin-frontend/vite.config.ts` jika ganti port.

### Admin Frontend API Calls Gagal

1. Pastikan backend running di `localhost:3000`
2. Cek browser console untuk error messages
3. Pastikan Vite proxy configuration benar di `admin-frontend/vite.config.ts`

### Database Connection Error

1. Pastikan PostgreSQL running:
   ```bash
   sudo systemctl status postgresql
   ```
2. Cek credentials di `.env`
3. Test connection:
   ```bash
   psql -h localhost -U postgres -d bussapp
   ```

## 🔒 Security Notes

⚠️ **PENTING untuk Production:**

1. **JWT Secret**: Generate strong secret key:
   ```bash
   openssl rand -base64 32
   ```

2. **Database Password**: Gunakan password yang kuat

3. **Environment Variables**: Jangan commit `.env` file!

4. **CORS**: Configure CORS di `src/app.ts` sesuai domain frontend

5. **Rate Limiting**: Tambahkan rate limiting untuk production

6. **HTTPS**: Selalu gunakan HTTPS di production

## 📄 License

[Specify your license here]

## 👥 Contributors

[Add contributors here]

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

Jika ada pertanyaan atau issues, silakan buat issue di GitHub repository.

---

**Happy Coding! 🚀**

# 🚀 Quick Start Guide

Setup project dalam 5 menit!

## 📋 Prerequisites Checklist

- [ ] Node.js >= 18.x installed
- [ ] PostgreSQL >= 14.x installed & running
- [ ] Git installed

## ⚡ Setup Steps

### 1️⃣ Clone & Install

```bash
git clone <repository-url>
cd backend-bus
npm install
```

### 2️⃣ Database Setup

```bash
# Buat database
psql -U postgres -c "CREATE DATABASE bussapp;"

# Copy & edit environment variables
cp .env.example .env
# Edit .env dengan PostgreSQL credentials Anda
```

### 3️⃣ Run Migrations & Seed

```bash
# Apply database schema
npx prisma migrate dev

# Seed dengan sample data (optional)
npx prisma db seed
```

### 4️⃣ Start Backend

```bash
npm run dev
```

✅ Backend running di: **http://localhost:3000**

### 5️⃣ Start Admin Frontend

```bash
# Terminal baru
cd admin-frontend
npm install
npm run dev
```

✅ Frontend running di: **http://localhost:5173**

## 🔐 Default Login

- **Email**: `admin@test.com`
- **Password**: `password123`

## 🎯 What's Next?

1. Login ke admin dashboard di http://localhost:5173
2. Explore fitur CRUD (Buses, Routes, Trips, Bookings)
3. Test API di http://localhost:3000/docs
4. Cek database dengan: `npx prisma studio`

## ⚠️ Troubleshooting

**PostgreSQL collation error?**
```bash
psql -U postgres -d template1 -c "ALTER DATABASE template1 REFRESH COLLATION VERSION;"
```

**Port 3000 sudah dipakai?**
Edit `.env`: `PORT=3001`

**Admin frontend tidak bisa connect?**
Pastikan backend running di port 3000

## 📚 Full Documentation

Lihat [README.md](./README.md) untuk dokumentasi lengkap.

---

**Setup selesai! Happy coding! 🎉**

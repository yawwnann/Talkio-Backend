# Speech Delay Detection Backend

Backend API untuk Sistem Deteksi Speech Delay pada anak, dibangun dengan Express.js dan PostgreSQL.

## 🚀 Fitur Utama

- ✅ **Autentikasi & Otorisasi** - JWT dengan role-based access (Admin, Terapis, Orang Tua)
- ✅ **Manajemen Data Anak** - CRUD data anak dengan validasi lengkap
- ✅ **Diagnosis & Prediksi ML** - Integrasi Machine Learning untuk deteksi risiko speech delay
- ✅ **Booking Terapi** - Sistem booking sesi terapi dengan pembayaran Midtrans
- ✅ **Progress Tracking** - Upload foto/video perkembangan anak
- ✅ **Game Logs** - Tracking progress permainan edukatif anak
- ✅ **Laporan PDF** - Generate laporan perkembangan pasien
- ✅ **Payment Gateway** - Integrasi Midtrans untuk pembayaran

## 📋 Requirements

- Node.js >= 16
- TiDB MySQL atau MySQL 8.0+
- Python ML Service (opsional, untuk prediksi ML)

## 🛠️ Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup TiDB MySQL Database

#### Opsi A: TiDB Cloud (Recommended)

1. **Daftar di** [tidbcloud.com](https://tidbcloud.com)
2. **Create Cluster:**
   - Klik "Create Cluster"
   - Pilih **Serverless** (Free tier)
   - Pilih region terdekat
   - Klik "Create"

3. **Dapatkan Connection String:**
   - Buka cluster yang sudah dibuat
   - Klik **"Connect"**
   - Pilih **"General"** tab
   - Copy connection string yang terlihat seperti:
     ```
     mysql://[USER]:[PASSWORD]@[HOST].aws.tidbcloud.com:4000/[DATABASE]
     ```

4. **Update `.env`:**
   ```env
   DATABASE_URL=mysql://[USER]:[PASSWORD]@[HOST].aws.tidbcloud.com:4000/[DATABASE]
   ```

#### Opsi B: Local MySQL

1. **Install MySQL 8.0+:**
   - Download: https://dev.mysql.com/downloads/mysql/

2. **Create Database:**
   ```sql
   CREATE DATABASE speech_delay_db;
   ```

3. **Update `.env`:**
   ```env
   DATABASE_URL=mysql://root:yourpassword@localhost:3306/speech_delay_db
   ```

### 4. Setup Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (akan create tables di Supabase)
npx prisma migrate dev --name initial_schema

# (Optional) Seed database dengan dummy users
npm run prisma:seed
```

### 5. Jalankan Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with verbose output
npm run test:verbose
```

## 📚 API Documentation

### Authentication

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrasi user baru | ❌ |
| POST | `/api/auth/login` | Login & dapat JWT token | ❌ |
| GET | `/api/users/profile` | Get profil user | ✅ |

### Children (Orang Tua)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/children` | Tambah data anak | ✅ PARENT |
| GET | `/api/children` | List semua anak | ✅ PARENT |
| GET | `/api/children/:id` | Detail anak | ✅ |

### Diagnosis

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/diagnosis/check` | Mulai diagnosis & prediksi | ✅ PARENT |
| GET | `/api/diagnosis/history/:childId` | Riwayat diagnosis | ✅ |

### Machine Learning Predictions

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/v1/predict/speech-delay` | Prediksi speech delay | ✅ |
| POST | `/api/v1/predict/voice-analysis` | Analisis suara | ✅ |
| GET | `/api/v1/predict/health` | Cek status ML service | ❌ |

### Therapy & Payment

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/therapy/booking` | Booking sesi terapi | ✅ PARENT |
| GET | `/api/therapy/history` | Riwayat terapi | ✅ PARENT |
| POST | `/api/payment/webhook` | Midtrans webhook | ❌ |
| GET | `/api/payment/status/:sessionId` | Cek status pembayaran | ✅ |

### Progress & Games

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/progress/upload` | Upload foto/video | ✅ PARENT |
| POST | `/api/game/log` | Log hasil permainan | ✅ PARENT |
| GET | `/api/game/history/:childId` | Riwayat permainan | ✅ |

### Audio Upload

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/v1/audio/upload` | Upload & analisis audio | ✅ |
| POST | `/api/v1/audio/store` | Simpan audio saja | ✅ |

### Therapist

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/therapist/patients` | List pasien | ✅ THERAPIST |
| GET | `/api/therapist/patient/:id` | Detail pasien | ✅ THERAPIST |
| PATCH | `/api/therapist/evaluate` | Input evaluasi | ✅ THERAPIST |
| GET | `/api/therapist/report/:id` | Generate PDF laporan | ✅ THERAPIST |

### Admin

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/admin/dashboard` | Dashboard stats | ✅ ADMIN |
| GET | `/api/admin/users` | List semua users | ✅ ADMIN |
| PUT | `/api/admin/users/:id` | Block/unblock/delete user | ✅ ADMIN |
| POST | `/api/admin/education` | Tambah konten edukasi | ✅ ADMIN |

## 🔐 Autentikasi

Semua endpoint yang memerlukan autentikasi memerlukan header Authorization:

```
Authorization: Bearer <JWT_TOKEN>
```

## 🤖 ML Integration

Backend terhubung ke Python ML Service untuk prediksi speech delay. Konfigurasi endpoint ML service di `.env`:

```env
ML_SERVICE_URL=http://localhost:5000
```

### Contoh Request ke ML Service

```json
POST /api/v1/predict/speech-delay
{
  "child_id": "uuid-here",
  "features": [1, 0, 1, 1, 0, 1]
}
```

### Contoh Response

```json
{
  "status": "success",
  "message": "Prediction completed",
  "data": {
    "child_id": "uuid-here",
    "risk_level": "HIGH",
    "score": 0.85,
    "confidence": 0.92,
    "recommendation": "Segera jadwalkan konsultasi dengan terapis bicara.",
    "model_version": "v1.0.0",
    "next_step": "/api/therapy/booking"
  }
}
```

## 💳 Payment Integration

Menggunakan Midtrans untuk pembayaran sesi terapi.

### Setup Midtrans

1. Daftar di [Midtrans](https://midtrans.com)
2. Dapatkan Server Key dan Client Key dari dashboard
3. Set di `.env`:

```env
MIDTRANS_SERVER_KEY="your-server-key"
MIDTRANS_CLIENT_KEY="your-client-key"
MIDTRANS_IS_PRODUCTION=false
```

### Payment Flow

1. Orang tua booking therapy → dapat payment URL
2. User bayar melalui URL yang diberikan
3. Midtrans kirim webhook ke `/api/payment/webhook`
4. Sistem update status pembayaran otomatis

## 📁 Struktur Project

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Seed data
├── src/
│   ├── config/                # Configuration files
│   │   ├── midtrans.config.js
│   │   ├── ml.config.js
│   │   └── upload.config.js
│   ├── controllers/           # Request handlers
│   ├── middlewares/           # Auth, validation, error handlers
│   │   ├── validators/
│   │   ├── auth.middleware.js
│   │   ├── upload.middleware.js
│   │   └── error.middleware.js
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   │   ├── ml.service.js
│   │   └── audio.service.js
│   ├── utils/                 # Helper functions
│   │   ├── prisma.js
│   │   ├── response.js
│   │   └── pdf-generator.js
│   └── app.js                 # Main Express app
├── tests/                     # Jest tests
├── uploads/                   # Uploaded files
├── .env.example
├── package.json
└── README.md
```

## 🔒 Keamanan

- Password hashing dengan bcrypt
- JWT authentication
- Role-based authorization
- Input validation dengan express-validator
- Helmet untuk security headers
- CORS configuration
- File upload validation

## 🗄️ Database

Menggunakan **TiDB MySQL** (MySQL-compatible) dengan Prisma ORM.

### Setup TiDB Cloud:

1. Daftar di [tidbcloud.com](https://tidbcloud.com)
2. Create Serverless Cluster (Free)
3. Copy connection string dari Dashboard > Connect
4. Paste ke `DATABASE_URL` di `.env`
5. Run migrations: `npx prisma migrate dev`

### Setup Local MySQL:

1. Install MySQL 8.0+
2. Create database: `CREATE DATABASE speech_delay_db;`
3. Update `DATABASE_URL` di `.env`
4. Run migrations

### Models Utama:

- **User** - Admin, Terapis, Orang Tua
- **Child** - Data anak
- **Diagnosis** - Hasil diagnosis & prediksi
- **TherapySession** - Booking & pembayaran terapi
- **GameLog** - Progress permainan
- **ProgressUpload** - Upload foto/video
- **MlPrediction** - Data prediksi ML untuk retraining

## 📝 Development Tips

### Run Database Migration

```bash
npx prisma migrate dev --name deskripsi_perubahan
```

### Generate Prisma Client

```bash
npx prisma generate
```

### View Database with Prisma Studio

```bash
npx prisma studio
```

### Menambah Validasi Baru

Tambahkan validator di `src/middlewares/validators/` dan gunakan di routes.

### Integrasi ML Model Baru

Update `src/services/ml.service.js` sesuai kebutuhan model Anda.

## 🐛 Troubleshooting

### Database Connection Error (TiDB/MySQL)

- Pastikan connection string benar dari TiDB Dashboard
- Format: `mysql://user:password@host:port/database`
- TiDB Cloud menggunakan port **4000**
- Local MySQL menggunakan port **3306**
- Cek firewall jika connect timeout
- Test koneksi: `npx prisma db pull`

### Prisma Migration Error

- Hapus folder `prisma/migrations` jika ada error
- Jalankan ulang: `npx prisma migrate dev`
- Untuk production, gunakan: `npx prisma migrate deploy`
- Pastikan MySQL version 8.0+ untuk UUID support

### TiDB Cloud Connection Issues

- Cek cluster status di dashboard (harus Active)
- Verify allowed IPs (default: allow all)
- TiDB free tier punya rate limit
- Gunakan connection pooling jika diperlukan

### Midtrans Error

- Cek apakah Server Key sudah benar
- Pastikan tidak dalam production mode saat development
- Cek dokumentasi Midtrans

### ML Service Unavailable

- Pastikan Python service berjalan di port yang sesuai
- Cek `ML_SERVICE_URL` di `.env`
- Sistem akan fallback ke rule-based logic

## 👥 Default Users (Setelah Seed)

```
Admin:
  Email: admin@example.com
  Password: password123

Therapist:
  Email: therapist@example.com
  Password: password123

Parent:
  Email: parent@example.com
  Password: password123
```

## 📄 License

ISC

## 🤝 Kontribusi

Silakan buat issue atau pull request untuk kontribusi.

## 📞 Support

Untuk pertanyaan atau bantuan, silakan buat issue di repository.

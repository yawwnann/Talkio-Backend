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

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Semua endpoint yang memerlukan autentikasi menggunakan **Bearer Token (JWT)**:

```http
Authorization: Bearer <your_jwt_token>
```

**Cara mendapatkan token:**
1. Login via `POST /api/auth/login`
2. Token akan ada di response `data.token`
3. Simpan token di secure storage (mobile) atau localStorage (web)
4. Token expires dalam **24 jam**

### Standard Response Format

#### Success Response (2xx)

```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

#### Error Response (4xx/5xx)

```json
{
  "status": "error",
  "message": "Error description",
  "data": null
}
```

#### Validation Error (400)

```json
{
  "status": "error",
  "message": "Validation failed",
  "data": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

---

### 🔐 Authentication Endpoints

#### 1. Register New User

**Endpoint:** `POST /api/auth/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "PARENT"
}
```

**Fields:**
- `email` (string, required): Valid email address
- `password` (string, required): Min 6 characters, must contain number
- `name` (string, optional): User's full name
- `role` (string, optional): `PARENT`, `THERAPIST`, or `ADMIN` (default: `PARENT`)

**Success Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "User Name",
    "role": "PARENT",
    "createdAt": "2026-04-05T10:00:00.000Z",
    "updatedAt": "2026-04-05T10:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "Email already registered."
}
```

---

#### 2. Login

**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN",
      "createdAt": "2026-04-05T10:00:00.000Z",
      "updatedAt": "2026-04-05T10:00:00.000Z"
    }
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "Invalid email or password."
}
```

---

### 👤 User Endpoints

#### Get My Profile

**Endpoint:** `GET /api/users/profile`

**Access:** Authenticated (All roles)

**Headers:**
```http
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Profile fetched",
  "data": {
    "id": "uuid-here",
    "email": "parent1@example.com",
    "name": "Ibu Anna",
    "role": "PARENT",
    "createdAt": "2026-04-05T10:00:00.000Z"
  }
}
```

---

### 👶 Children Management

#### 1. Create Child

**Endpoint:** `POST /api/children`

**Access:** Authenticated (PARENT only)

**Request Body:**
```json
{
  "name": "Ahmad Rizky",
  "dateOfBirth": "2023-05-15",
  "gender": "MALE"
}
```

**Fields:**
- `name` (string, required): 1-100 characters
- `dateOfBirth` (string, required): ISO 8601 date format, cannot be in future
- `gender` (string, required): `MALE` or `FEMALE`

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Child added successfully",
  "data": {
    "id": "child-uuid-here",
    "parentId": "parent-uuid-here",
    "name": "Ahmad Rizky",
    "dateOfBirth": "2023-05-15T00:00:00.000Z",
    "gender": "MALE",
    "createdAt": "2026-04-05T10:00:00.000Z",
    "updatedAt": "2026-04-05T10:00:00.000Z"
  }
}
```

---

#### 2. Get All My Children

**Endpoint:** `GET /api/children`

**Access:** Authenticated (PARENT only)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Children fetched successfully",
  "data": [
    {
      "id": "child-uuid-1",
      "parentId": "parent-uuid",
      "name": "Ahmad Rizky",
      "dateOfBirth": "2023-05-15T00:00:00.000Z",
      "gender": "MALE",
      "createdAt": "2026-04-05T10:00:00.000Z",
      "updatedAt": "2026-04-05T10:00:00.000Z"
    }
  ]
}
```

---

#### 3. Get Child Detail

**Endpoint:** `GET /api/children/:id`

**Access:** Authenticated (Parent of child, THERAPIST, or ADMIN)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Child details fetched successfully",
  "data": {
    "id": "child-uuid",
    "parentId": "parent-uuid",
    "name": "Ahmad Rizky",
    "dateOfBirth": "2023-05-15T00:00:00.000Z",
    "gender": "MALE",
    "diagnoses": [...],
    "therapySessions": [...],
    "gameLogs": [...],
    "progressUploads": [...]
  }
}
```

---

### 🔍 Diagnosis & ML Predictions

#### 1. Create Diagnosis (Check Symptoms)

**Endpoint:** `POST /api/diagnosis/check`

**Access:** Authenticated (PARENT only)

**Request Body:**
```json
{
  "childId": "child-uuid-here",
  "symptoms": [
    "tidak_menyapa",
    "tidak_menatap_mata",
    "kosakata_terbatas",
    "tidak_menunjuk"
  ],
  "useML": true
}
```

**Fields:**
- `childId` (string, required): Valid UUID of child
- `symptoms` (array, required): At least 1 symptom
- `useML` (boolean, optional): Use ML prediction (default: true). Falls back to rule-based if ML unavailable

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Diagnosis created successfully",
  "data": {
    "id": "diagnosis-uuid",
    "childId": "child-uuid",
    "symptoms": ["tidak_menyapa", "tidak_menatap_mata"],
    "riskLevel": "HIGH",
    "score": 0.85,
    "recommendation": "Segera jadwalkan konsultasi dengan terapis bicara profesional.",
    "createdAt": "2026-04-05T10:00:00.000Z",
    "risk_level": "HIGH",
    "score": 0.85,
    "recommendation": "Segera jadwalkan konsultasi dengan terapis bicara profesional.",
    "next_step": "/api/therapy/booking"
  }
}
```

**Risk Levels:**
- `LOW` (score < 0.3): Continue monitoring
- `MEDIUM` (score 0.3-0.7): Observation recommended
- `HIGH` (score > 0.7): Consult therapist immediately

---

#### 2. Get Diagnosis History

**Endpoint:** `GET /api/diagnosis/history/:childId`

**Access:** Authenticated

**Success Response (200):**
```json
{
  "status": "success",
  "message": "History fetched",
  "data": [
    {
      "id": "diagnosis-uuid",
      "childId": "child-uuid",
      "symptoms": ["tidak_menyapa"],
      "riskLevel": "HIGH",
      "score": 0.85,
      "recommendation": "Segera jadwalkan konsultasi...",
      "createdAt": "2026-04-05T10:00:00.000Z",
      "mlPrediction": {
        "id": "ml-uuid",
        "modelVersion": "v1.0.0",
        "predictionResult": 0.85
      }
    }
  ]
}
```

---

### 🏥 Therapy & Payments

#### 1. Book Therapy Session

**Endpoint:** `POST /api/therapy/booking`

**Access:** Authenticated (PARENT only)

**Request Body:**
```json
{
  "childId": "child-uuid-here",
  "therapistId": "therapist-uuid-here",
  "schedule": "2026-04-20T10:00:00Z",
  "therapyType": "Speech Therapy"
}
```

**Fields:**
- `childId` (string, required): Valid UUID
- `therapistId` (string, optional): UUID of therapist (can be null)
- `schedule` (string, required): ISO 8601 datetime, must be in future
- `therapyType` (string, required): 1-50 characters

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Therapy session booked. Proceed to payment.",
  "data": {
    "session": {
      "id": "session-uuid",
      "childId": "child-uuid",
      "therapistId": "therapist-uuid",
      "schedule": "2026-04-20T10:00:00.000Z",
      "paymentStatus": "PENDING",
      "therapyType": "Speech Therapy",
      "isActive": false,
      "transactionId": "THERAPY-session-uuid",
      "paymentUrl": "https://app.midtrans.com/snap/v2/..."
    },
    "paymentUrl": "https://app.midtrans.com/snap/v2/...",
    "transactionToken": "snap-token-here",
    "amount": 165000
  }
}
```

**Payment Flow:**
1. User calls this endpoint
2. Backend creates session with status `PENDING`
3. Backend generates Midtrans payment token
4. Frontend opens `paymentUrl` in browser/webview
5. User completes payment
6. Midtrans sends webhook to backend
7. Backend updates session to `SUCCESS` and `isActive: true`

---

#### 2. Get Therapy History

**Endpoint:** `GET /api/therapy/history`

**Access:** Authenticated (PARENT only)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Therapy history fetched",
  "data": [
    {
      "id": "session-uuid",
      "childId": "child-uuid",
      "therapistId": "therapist-uuid",
      "schedule": "2026-04-20T10:00:00.000Z",
      "paymentStatus": "SUCCESS",
      "therapyType": "Speech Therapy",
      "isActive": true,
      "child": {
        "id": "child-uuid",
        "name": "Ahmad Rizky"
      },
      "therapist": {
        "name": "Dr. Sarah Wijaya",
        "email": "therapist1@example.com"
      }
    }
  ]
}
```

---

### 💳 Payment Webhook

#### Midtrans Payment Notification

**Endpoint:** `POST /api/payment/webhook`

**Access:** Public (verified by signature)

**Request Body (from Midtrans):**
```json
{
  "order_id": "THERAPY-session-uuid",
  "status_code": "200",
  "gross_amount": "165000.00",
  "payment_type": "gopay",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "signature_key": "hash-here"
}
```

**Transaction Status Handling:**
- `settlement` → Payment successful, session activated
- `pending` → Waiting for payment
- `cancel` / `expire` / `deny` → Payment failed

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Notification received",
  "session_id": "session-uuid",
  "payment_status": "SUCCESS"
}
```

---

### 🎮 Game & Progress Tracking

#### 1. Log Game Result

**Endpoint:** `POST /api/game/log`

**Access:** Authenticated (PARENT only)

**Request Body:**
```json
{
  "childId": "child-uuid-here",
  "gameScore": 85,
  "duration": 180,
  "gameType": "Kata Bergambar"
}
```

**Fields:**
- `childId` (string, required): Valid UUID
- `gameScore` (number, required): Game score
- `duration` (number, required): Duration in seconds
- `gameType` (string, required): Game name

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Game progress saved",
  "data": {
    "id": "log-uuid",
    "childId": "child-uuid",
    "gameScore": 85,
    "duration": 180,
    "gameType": "Kata Bergambar",
    "playedAt": "2026-04-05T10:00:00.000Z"
  }
}
```

---

#### 2. Get Game History

**Endpoint:** `GET /api/game/history/:childId`

**Access:** Authenticated

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Game history fetched",
  "data": [
    {
      "id": "log-uuid",
      "childId": "child-uuid",
      "gameScore": 85,
      "duration": 180,
      "gameType": "Kata Bergambar",
      "playedAt": "2026-04-05T10:00:00.000Z"
    }
  ]
}
```

---

#### 3. Upload Progress (Photo/Video)

**Endpoint:** `POST /api/progress/upload`

**Access:** Authenticated (PARENT only)

**Request Type:** `multipart/form-data`

**Form Data:**
```
file: [image/video file]
childId: "child-uuid-here"
notes: "Anak mulai bisa mengucapkan kata 'mama'"
```

**File Limits:**
- Photos: Max 10MB (JPEG, PNG, WEBP)
- Videos: Max 50MB (MP4, MOV, AVI)

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Progress uploaded successfully",
  "data": {
    "id": "upload-uuid",
    "childId": "child-uuid",
    "fileUrl": "/uploads/file-uuid.jpg",
    "parentNotes": "Anak mulai bisa mengucapkan kata 'mama'",
    "therapistEvaluation": null,
    "createdAt": "2026-04-05T10:00:00.000Z"
  }
}
```

---

### 🤖 ML Prediction Endpoints

#### 1. Predict Speech Delay

**Endpoint:** `POST /api/v1/predict/speech-delay`

**Access:** Authenticated

**Request Body:**
```json
{
  "child_id": "child-uuid-here",
  "features": [1, 0, 1, 1, 0, 1]
}
```

**Fields:**
- `child_id` (string, required): Valid UUID
- `features` (array, required): Numerical features array for ML model

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Prediction completed",
  "data": {
    "child_id": "child-uuid",
    "risk_level": "HIGH",
    "score": 0.85,
    "confidence": 0.92,
    "recommendation": "Segera jadwalkan konsultasi dengan terapis bicara.",
    "model_version": "v1.0.0",
    "next_step": "/api/therapy/booking"
  }
}
```

**Note:** Requires Python ML service running. Falls back to rule-based if unavailable.

---

#### 2. Voice Analysis

**Endpoint:** `POST /api/v1/predict/voice-analysis`

**Access:** Authenticated

**Request Type:** `multipart/form-data`

**Form Data:**
```
audio: [audio file]
child_id: "child-uuid-here"
```

**Supported Audio Formats:** MP3, AAC, WAV, M4A (max 20MB)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Voice analysis completed",
  "data": {
    "child_id": "child-uuid",
    "analysis": {
      // ML analysis results
    },
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "model_version": "v1.0.0"
  }
}
```

---

#### 3. Check ML Service Health

**Endpoint:** `GET /api/v1/predict/health`

**Access:** Public

**Success Response (200):**
```json
{
  "status": "success",
  "message": "ML service health check",
  "data": {
    "status": "healthy",
    "service": "http://localhost:5000",
    "model_version": "v1.0.0"
  }
}
```

---

### 🎤 Audio Upload Endpoints

#### 1. Upload & Analyze Audio

**Endpoint:** `POST /api/v1/audio/upload`

**Access:** Authenticated

**Request Type:** `multipart/form-data`

**Form Data:**
```
audio: [audio file]
child_id: "child-uuid-here"
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Audio uploaded and analyzed",
  "data": {
    "child_id": "child-uuid",
    "file_info": {
      "name": "recording.m4a",
      "size": "2.5MB",
      "type": "audio/mp4"
    },
    "analysis": { /* ML results */ },
    "recommendations": ["Rec 1", "Rec 2"],
    "ml_service_available": true
  }
}
```

---

#### 2. Store Audio Only

**Endpoint:** `POST /api/v1/audio/store`

**Access:** Authenticated

**Request Type:** `multipart/form-data`

**Form Data:**
```
audio: [audio file]
child_id: "child-uuid-here"
notes: "Audio recording sample"
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Audio stored successfully",
  "data": {
    "upload_id": "upload-uuid",
    "file_info": {
      "name": "recording.m4a",
      "size": "2.5MB",
      "type": "audio/mp4",
      "url": "/uploads/audio-uuid.m4a"
    }
  }
}
```

---

### 👨‍⚕️ Therapist Endpoints

#### 1. Get My Patients

**Endpoint:** `GET /api/therapist/patients`

**Access:** Authenticated (THERAPIST only)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Patients fetched",
  "data": [
    {
      "id": "child-uuid",
      "name": "Ahmad Rizky",
      "dateOfBirth": "2023-05-15T00:00:00.000Z",
      "gender": "MALE",
      "parent": {
        "name": "Ibu Anna",
        "email": "parent1@example.com"
      }
    }
  ]
}
```

---

#### 2. Get Patient Detail

**Endpoint:** `GET /api/therapist/patient/:id`

**Access:** Authenticated (THERAPIST only)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Patient detail fetched",
  "data": {
    "id": "child-uuid",
    "name": "Ahmad Rizky",
    "diagnoses": [...],
    "therapySessions": [...],
    "gameLogs": [...],
    "progressUploads": [...]
  }
}
```

---

#### 3. Evaluate Patient Progress

**Endpoint:** `PATCH /api/therapist/evaluate`

**Access:** Authenticated (THERAPIST only)

**Request Body:**
```json
{
  "progressId": "upload-uuid-here",
  "evaluation": "Anak menunjukkan peningkatan dalam kosakata. Disarankan melanjutkan terapi 2x seminggu."
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Evaluation submitted",
  "data": {
    "id": "upload-uuid",
    "childId": "child-uuid",
    "fileUrl": "/uploads/file.jpg",
    "parentNotes": "Notes from parent",
    "therapistEvaluation": "Anak menunjukkan peningkatan...",
    "createdAt": "2026-04-05T10:00:00.000Z"
  }
}
```

---

#### 4. Generate Patient Report (PDF)

**Endpoint:** `GET /api/therapist/report/:id`

**Access:** Authenticated (THERAPIST only)

**Response:** PDF file download

**Report Contents:**
- Patient information (name, age, gender, parent)
- Diagnosis history with risk levels
- Therapy sessions history
- Game progress (last 20 games)
- Progress uploads (last 10 uploads)
- Therapist evaluations

---

### ⚙️ Admin Endpoints

#### 1. Get Dashboard Statistics

**Endpoint:** `GET /api/admin/dashboard`

**Access:** Authenticated (ADMIN only)

**Query Parameters:**
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)

**Example:** `GET /api/admin/dashboard?startDate=2026-04-01&endDate=2026-04-30`

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Dashboard stats fetched",
  "data": {
    "userCount": 50,
    "parentCount": 35,
    "therapistCount": 10,
    "childrenCount": 45,
    "sessionCount": 120,
    "activeTherapyCount": 25,
    "diagnosisCount": 80,
    "highRiskCount": 15,
    "revenue": 19800000,
    "revenueFormatted": "Rp 19.800.000"
  }
}
```

---

#### 2. Get All Users

**Endpoint:** `GET /api/admin/users`

**Access:** Authenticated (ADMIN only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by role (`PARENT`, `THERAPIST`, `ADMIN`)
- `search` (optional): Search by name or email

**Example:** `GET /api/admin/users?page=1&limit=10&role=PARENT&search=anna`

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Users fetched",
  "data": {
    "users": [
      {
        "id": "user-uuid",
        "email": "parent1@example.com",
        "name": "Ibu Anna",
        "role": "PARENT",
        "isBlocked": false,
        "blockedReason": null,
        "createdAt": "2026-04-05T10:00:00.000Z",
        "_count": {
          "children": 3
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 35,
      "totalPages": 4
    }
  }
}
```

---

#### 3. Manage User (Block/Unblock/Delete)

**Endpoint:** `PUT /api/admin/users/:id`

**Access:** Authenticated (ADMIN only)

**Request Body - Block:**
```json
{
  "action": "block",
  "reason": "Violation of terms of service"
}
```

**Request Body - Unblock:**
```json
{
  "action": "unblock"
}
```

**Request Body - Delete:**
```json
{
  "action": "delete"
}
```

**Success Response (200) - Block:**
```json
{
  "status": "success",
  "message": "User blocked successfully",
  "data": {
    "userId": "user-uuid",
    "reason": "Violation of terms of service"
  }
}
```

---

#### 4. Add Education Content

**Endpoint:** `POST /api/admin/education`

**Access:** Authenticated (ADMIN only)

**Request Body:**
```json
{
  "title": "Tahapan Perkembangan Bicara Anak",
  "content": "Artikel lengkap tentang milestone perkembangan...",
  "type": "ARTICLE"
}
```

**Fields:**
- `title` (string, required): Content title
- `content` (string, required): Article text or video URL
- `type` (string, required): `ARTICLE` or `VIDEO`

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Content added",
  "data": {
    "id": "content-uuid",
    "title": "Tahapan Perkembangan Bicara Anak",
    "content": "Artikel lengkap...",
    "type": "ARTICLE",
    "authorId": "admin-uuid",
    "createdAt": "2026-04-05T10:00:00.000Z",
    "updatedAt": "2026-04-05T10:00:00.000Z"
  }
}
```

---

### 📝 Error Codes Reference

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input or validation failed |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |
| 503 | Service Unavailable - ML service down |

---

### 🧪 Testing the API

#### Using Postman

1. Import `collection.json` from project root
2. Set `base_url` variable to `http://localhost:3000`
3. Run "Login" request to auto-save token
4. Test other endpoints

#### Using cURL

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Create Child:**
```bash
curl -X POST http://localhost:3000/api/children \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Child",
    "dateOfBirth": "2023-05-15",
    "gender": "MALE"
  }'
```

---

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

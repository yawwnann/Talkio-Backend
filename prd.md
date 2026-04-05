# PRD Backend - Sistem Deteksi Speech Delay (Express.js)

## 1. Arsitektur Teknis

- **Framework:** Express.js (Node.js)
- **Database:** PostgreSQL (Relational) untuk data user & medis jika data hasil diagnosa sangat dinamis.
- **Authentication:** JSON Web Token (JWT) dengan _role-based middleware_.
- **Storage:** Google Cloud Storage atau AWS S3 (untuk upload foto/video perkembangan anak).
- **Payment Gateway:** Midtrans (untuk integrasi pembayaran Rp165.000).
- **ORM:** Prisma

---

## 2. Struktur Database (Entity Relationship)

Backend harus mengelola entitas utama berikut:

1.  **Users:** id, email, password, role (admin, terapis, orang_tua).
2.  **Children:** id, parent_id, nama, tanggal_lahir, jenis_kelamin.
3.  **Diagnosis:** id, child_id, gejala_json, hasil_risiko, skor.
4.  **Therapy_Sessions:** id, child_id, therapist_id, jadwal, status_pembayaran (pending/success), tipe_terapi.
5.  **Game_Logs:** id, child_id, skor_game, durasi, jenis_game, timestamp.
6.  **Progress_Uploads:** id, child_id, file_url (foto/video), catatan_ortu, evaluasi_terapis.

---

## 3. Spesifikasi API Endpoint

### A. Endpoint Autentikasi & User

| Method | Endpoint             | Deskripsi                    | Role   |
| :----- | :------------------- | :--------------------------- | :----- |
| `POST` | `/api/auth/register` | Registrasi akun orang tua    | Public |
| `POST` | `/api/auth/login`    | Login & return JWT + Role    | Public |
| `GET`  | `/api/users/profile` | Ambil data profil user login | All    |

### B. Endpoint Orang Tua (Parent)

| Method | Endpoint               | Deskripsi                                          |
| :----- | :--------------------- | :------------------------------------------------- |
| `POST` | `/api/children`        | Tambah data anak                                   |
| `POST` | `/api/diagnosis/check` | Kirim gejala & hitung hasil risiko (Logic Deteksi) |
| `POST` | `/api/therapy/booking` | Buat janji terapi & generate payment link          |
| `GET`  | `/api/therapy/history` | Lihat riwayat pembayaran & jadwal                  |
| `POST` | `/api/game/log`        | Simpan progres setelah anak main game              |
| `POST` | `/api/progress/upload` | Upload foto/video perkembangan anak                |

### C. Endpoint Terapis (Therapist)

| Method  | Endpoint                     | Deskripsi                                       |
| :------ | :--------------------------- | :---------------------------------------------- |
| `GET`   | `/api/therapist/patients`    | Daftar anak yang dijadwalkan dengan terapis ini |
| `GET`   | `/api/therapist/patient/:id` | Detail data anak & hasil latihan suara          |
| `PATCH` | `/api/therapist/evaluate`    | Input evaluasi & update status perkembangan     |
| `GET`   | `/api/therapist/report/:id`  | Generate data untuk laporan perkembangan (PDF)  |

### D. Endpoint Admin

| Method | Endpoint               | Deskripsi                                     |
| :----- | :--------------------- | :-------------------------------------------- |
| `GET`  | `/api/admin/dashboard` | Statistik total user, revenue, & aset         |
| `PUT`  | `/api/admin/users/:id` | Kelola/Blokir user atau terapis               |
| `POST` | `/api/admin/education` | Tambah/Edit konten artikel atau video edukasi |

---

## 4. Business Logic Khusus

### 1. Integrasi Pembayaran (Webhook)

Karena ada alur **Status Pembayaran** di flowchart:

- Backend harus menyediakan **Webhook Endpoint** untuk menerima notifikasi dari Payment Gateway.
- Jika status = `settlement`, maka otomatis ubah `status_pembayaran` di tabel `Therapy_Sessions` menjadi `Berhasil` dan set `Jadwal Aktif`.

### 3. File Handling

Gunakan middleware **Multer** untuk memproses upload foto/video perkembangan anak sebelum dikirim ke Cloud Storage.

---

## 5. Keamanan Data

- **Password Hashing:** Menggunakan `bcrypt`.
- **CORS:** Batasi hanya untuk domain/origin aplikasi Flutter kamu.
- **Input Validation:** Menggunakan `joi` atau `express-validator` untuk memastikan data anak & gejala tidak kosong/cacat.

---

## 6. Contoh Response JSON (Hasil Diagnosa)

```json
{
  "status": "success",
  "data": {
    "child_id": "C123",
    "risk_level": "Tinggi",
    "score": 85,
    "recommendation": "Segera jadwalkan konsultasi dengan terapis bicara.",
    "next_step": "/api/therapy/booking"
  }
}
```

## 7. Integrasi Machine Learning (ML)

### A. Opsi Arsitektur Integrasi

Kamu bisa memilih salah satu dari dua jalur ini tergantung pada bahasa pemrograman yang digunakan untuk melatih model:

1.  **Opsi 1: TensorFlow.js (Native Express)**
    - **Kapan digunakan:** Jika model dilatih menggunakan TensorFlow dan dikonversi ke format web/node.
    - **Library:** `@tensorflow/tfjs-node`.
    - **Kelebihan:** Latensi rendah karena berjalan di proses yang sama dengan API.

2.  **Opsi 2: Flask/FastAPI Sidecar (Python Bridge)**
    - **Kapan digunakan:** Jika model dikonversi ke `.h5`, `.pkl`, atau `.pt` (PyTorch/Scikit-Learn).
    - **Alur:** Express.js menerima data -> Kirim request ke Microservice Python via HTTP/gRPC -> Python menjalankan prediksi -> Hasil dikirim balik ke Express.
    - **Kelebihan:** Ekosistem Python untuk ML jauh lebih matang.

---

### B. Alur Data Prediksi (Inference Flow)

1.  **Input Features:**
    - Data gejala dari Form (dikodekan menjadi matriks numerik/biner).
    - Data suara anak (jika menggunakan audio processing) yang di-upload oleh orang tua.
    - Data demografi (umur dalam bulan, jenis kelamin).

2.  **Preprocessing Service:**
    - Backend melakukan normalisasi data sebelum dimasukkan ke model.
    - Contoh: Mengubah jawaban "Ya/Tidak" menjadi `1` atau `0`.

3.  **Inference:**
    - Model memproses input dan menghasilkan probabilitas (misal: `0.85`).
    - Backend mengklasifikasikan probabilitas tersebut ke dalam label:
      - `< 0.3`: Risiko Rendah.
      - `0.3 - 0.7`: Risiko Sedang (Perlu Observasi).
      - `> 0.7`: Risiko Tinggi (Rekomendasi Terapi).

---

### C. Pembaruan Endpoint API (ML Focused)

| Method | Endpoint                         | Deskripsi                                              | Payload                                            |
| :----- | :------------------------------- | :----------------------------------------------------- | :------------------------------------------------- |
| `POST` | `/api/v1/predict/speech-delay`   | Mengirim data gejala ke model ML.                      | `{ "child_id": "ID", "features": [1, 0, 1, ...] }` |
| `POST` | `/api/v1/predict/voice-analysis` | Mengirim file audio untuk deteksi intonasi/artikulasi. | `multipart/form-data (audio file)`                 |

---

### D. Skema Database Tambahan

Untuk keperluan peningkatan model di masa depan (_Model Retraining_), kamu perlu menyimpan hasil prediksi vs validasi terapis:

```sql
TABLE ml_predictions (
    id UUID PRIMARY KEY,
    diagnosis_id UUID REFERENCES diagnosis(id),
    input_data JSONB,           -- Data yang dikirim ke model
    model_version VARCHAR(20),  -- Versi model (v1.0.2)
    prediction_result FLOAT,    -- Hasil mentah dari model
    actual_label VARCHAR(20),   -- (Opsional) Label benar dari terapis untuk feedback loop
    created_at TIMESTAMP
)
```

---

## 8. Tips Pengembangan untuk Kamu:

- **Pemisahan Concern:** Jangan satukan beban berat ML di _main thread_ Express jika trafiknya tinggi. Gunakan _worker threads_ atau microservice terpisah agar API tidak _freeze_ saat model sedang menghitung.
- **Audio Processing:** Jika model kamu mendeteksi suara, gunakan library seperti `FFmpeg` di backend untuk memastikan format audio dari Flutter (biasanya `.m4a` atau `.aac`) sesuai dengan format input model (biasanya `.wav` 16kHz).
- **Model Versioning:** Simpan file model kamu di Cloud Storage, dan buat fungsi di Express untuk memuat ulang model secara otomatis jika ada update, tanpa harus mematikan server.

**Apakah model ML-nya sudah kamu buat (misal di Python/Colab), atau kamu butuh bantuan untuk menentukan struktur data input (features) yang cocok untuk Speech Delay?**

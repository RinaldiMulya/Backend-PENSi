# 📚 Retirement Calculator API Documentation

## 🌐 Base URL
```
http://localhost:9000
```

## 📋 Overview
REST API untuk kalkulator pensiun berbasis Machine Learning yang dapat memprediksi kebutuhan dana pensiun berdasarkan 8 parameter keuangan pengguna.

---

## 🔗 Endpoints

### 1. Server Information
**GET** `/`

Mendapatkan informasi status server dan model.

#### Response
```json
{
  "message": "Retirement Calculator API Server",
  "status": "running",
  "modelLoaded": true
}
```

#### Status Codes
- `200` - Success

---

### 2. Health Check
**GET** `/health`

Mengecek kesehatan server dan status model.

#### Response
```json
{
  "status": "healthy",
  "modelLoaded": true,
  "timestamp": "2024-06-02T10:30:00.000Z"
}
```

#### Status Codes
- `200` - Server healthy
- `503` - Server not healthy

---

### 3. Model Status
**GET** `/model/status`

Mengecek status model ML (apakah sudah dimuat dan siap digunakan).

#### Response
```json
{
  "loaded": true,
  "ready": true
}
```

#### Response Fields
- `loaded` (boolean) - Model sudah dimuat
- `ready` (boolean) - Model siap untuk prediksi

#### Status Codes
- `200` - Success

---

### 4. Single Prediction
**POST** `/predict`

Melakukan prediksi tunggal berdasarkan input data pengguna.

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "inputData": [35, 5000000, 1000000, 50000000, 100000000, 120000000, 20000000, 25]
}
```

#### Input Data Fields (Array 8 elements)
1. **Age** - Umur saat ini (tahun)
2. **Monthly Income** - Penghasilan bulanan (Rupiah)
3. **Monthly Debt** - Pengeluaran cicilan bulanan (Rupiah)
4. **Savings** - Saldo tabungan saat ini (Rupiah)
5. **Net Worth** - Kekayaan bersih saat ini (Rupiah)
6. **Total Assets** - Total aset (Rupiah)
7. **Total Liabilities** - Total hutang (Rupiah)
8. **Retirement Years** - Tahun hidup setelah pensiun

#### Success Response
```json
{
  "success": true,
  "prediction": 1234567890.5,
  "inputData": [35, 5000000, 1000000, 50000000, 100000000, 120000000, 20000000, 25],
  "timestamp": "2024-06-02T10:30:00.000Z"
}
```

#### Error Responses

**Model Not Ready (503)**
```json
{
  "error": "Model not loaded",
  "message": "ML model is not ready. Please try again later."
}
```

**Invalid Input (400)**
```json
{
  "error": "Invalid input",
  "message": "inputData must be an array"
}
```

**Invalid Input Length (400)**
```json
{
  "error": "Invalid input length",
  "message": "inputData must contain exactly 8 values"
}
```

**Invalid Input Values (400)**
```json
{
  "error": "Invalid input values",
  "message": "All input values must be valid numbers"
}
```

**Prediction Error (500)**
```json
{
  "error": "Prediction failed",
  "message": "An error occurred during prediction"
}
```

#### Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `503` - Service Unavailable (model not ready)
- `500` - Internal Server Error

---

### 5. Batch Prediction
**POST** `/predict/batch`

Melakukan prediksi untuk multiple data sekaligus.

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "batchData": [
    [35, 5000000, 1000000, 50000000, 100000000, 120000000, 20000000, 25],
    [40, 6000000, 1500000, 60000000, 150000000, 180000000, 30000000, 20],
    [30, 4000000, 800000, 40000000, 80000000, 100000000, 20000000, 30]
  ]
}
```

#### Success Response
```json
{
  "success": true,
  "predictions": [
    {
      "index": 0,
      "input": [35, 5000000, 1000000, 50000000, 100000000, 120000000, 20000000, 25],
      "prediction": 1234567890.5
    },
    {
      "index": 1,
      "input": [40, 6000000, 1500000, 60000000, 150000000, 180000000, 30000000, 20],
      "prediction": 987654321.2
    },
    {
      "index": 2,
      "input": [30, 4000000, 800000, 40000000, 80000000, 100000000, 20000000, 30],
      "prediction": 1500000000.8
    }
  ],
  "count": 3,
  "timestamp": "2024-06-02T10:30:00.000Z"
}
```

#### Error Responses
Similar to single prediction with additional batch-specific errors:

**Invalid Batch Input (400)**
```json
{
  "error": "Invalid batch input",
  "message": "Item at index 0 must be an array of 8 numbers"
}
```

#### Status Codes
- `200` - Success
- `400` - Bad Request
- `503` - Service Unavailable
- `500` - Internal Server Error

---

## 🧪 Testing Examples

### Using cURL

#### Health Check
```bash
curl -X GET http://localhost:9000/health
```

#### Single Prediction
```bash
curl -X POST http://localhost:9000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": [35, 5000000, 1000000, 50000000, 100000000, 120000000, 20000000, 25]
  }'
```

#### Batch Prediction
```bash
curl -X POST http://localhost:9000/predict/batch \
  -H "Content-Type: application/json" \
  -d '{
    "batchData": [
      [35, 5000000, 1000000, 50000000, 100000000, 120000000, 20000000, 25],
      [40, 6000000, 1500000, 60000000, 150000000, 180000000, 30000000, 20]
    ]
  }'
```

### Using JavaScript (Fetch)

```javascript
// Single prediction
const response = await fetch('http://localhost:9000/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inputData: [35, 5000000, 1000000, 50000000, 100000000, 120000000, 20000000, 25]
  })
});

const result = await response.json();
console.log('Prediction:', result.prediction);
```

---

## 📊 Data Validation Rules

### Input Data Requirements
1. **Must be array** with exactly **8 numeric values**
2. **All values must be numbers** (not string, null, undefined)
3. **No NaN values** allowed
4. **No negative values** (logically, for financial data)

### Example Valid Input
```json
{
  "inputData": [
    35,        // Age: 35 years
    5000000,   // Monthly Income: Rp 5,000,000
    1000000,   // Monthly Debt: Rp 1,000,000
    50000000,  // Savings: Rp 50,000,000
    100000000, // Net Worth: Rp 100,000,000
    120000000, // Total Assets: Rp 120,000,000
    20000000,  // Total Liabilities: Rp 20,000,000
    25         // Retirement Years: 25 years
  ]
}
```

---

## ⚡ Performance Notes

- **Model Loading**: Model dimuat saat server start (bisa memakan waktu 2-10 detik)
- **Prediction Speed**: ~50-200ms per prediction
- **Batch Processing**: Lebih efisien untuk multiple predictions
- **Memory Usage**: Model menggunakan ~50-200MB RAM

---

## 🔧 Error Handling

API menggunakan standard HTTP status codes dan mengembalikan error dalam format konsisten:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Common Error Types
- `Model not loaded` - Model ML belum siap
- `Invalid input` - Format input salah
- `Invalid input length` - Jumlah input tidak sesuai
- `Invalid input values` - Nilai input tidak valid
- `Prediction failed` - Error saat prediksi

---

## 🚀 Deployment Notes

### Environment Variables
```bash
PORT=9000  # Server port (default: 9000)
```

### Required Files
- `model.json` - Model architecture
- `model_weights.bin` - Model weights (if separate)

### Dependencies
- Node.js >= 16.0.0
- TensorFlow.js Node >= 4.10.0
- Express >= 4.18.0

---

## 📝 Changelog

### Version 1.0.0
- Initial API release
- Single and batch prediction endpoints
- Health check and status endpoints
- Comprehensive error handling
- Input validation

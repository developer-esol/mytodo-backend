# 🧪 Location Integration - Test Examples

## Test the Complete Flow

### Step 1: Signup (Create PendingUser)

**Endpoint:** `POST http://localhost:5001/api/users/signup`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.test@example.com",
  "phone": "+61412345678",
  "password": "SecurePass123!",
  "location": {
    "country": "AU",
    "countryCode": "AU",
    "region": "VIC",
    "city": "Melbourne"
  }
}
```

**Expected Response (201):**
```json
{
  "message": "Signup successful, OTP sent to email",
  "email": "john.test@example.com"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5001/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.test@example.com",
    "phone": "+61412345678",
    "password": "SecurePass123!",
    "location": {
      "country": "AU",
      "countryCode": "AU",
      "region": "VIC",
      "city": "Melbourne"
    }
  }'
```

---

### Step 2: Check Email for OTP

Check the email inbox for `john.test@example.com` to get the OTP code.

**Example OTP:** `123456`

---

### Step 3: Verify OTP (Create User)

**Endpoint:** `POST http://localhost:5001/api/auth/verify-otp`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john.test@example.com",
  "otp": "123456"
}
```

**Expected Response (200):**
```json
{
  "verified": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68f726360ae1925ea5ad01cb",
    "email": "john.test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+61412345678",
    "location": {
      "country": "AU",
      "countryCode": "AU",
      "region": "VIC",
      "city": "Melbourne"
    },
    "role": "user",
    "isVerified": true
  },
  "message": "Account verified and created successfully!"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.test@example.com",
    "otp": "123456"
  }'
```

---

### Step 4: Login

**Endpoint:** `POST http://localhost:5001/api/users/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john.test@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "firebaseToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "68f726360ae1925ea5ad01cb",
    "email": "john.test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+61412345678",
    "location": {
      "country": "AU",
      "countryCode": "AU",
      "region": "VIC",
      "city": "Melbourne"
    },
    "avatar": "",
    "role": "user",
    "isVerified": true,
    "isEmailVerified": false,
    "isPhoneVerified": false
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.test@example.com",
    "password": "SecurePass123!"
  }'
```

---

### Step 5: Get Profile

**Endpoint:** `GET http://localhost:5001/api/users/profile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "68f726360ae1925ea5ad01cb",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.test@example.com",
    "phone": "+61412345678",
    "location": {
      "country": "AU",
      "countryCode": "AU",
      "region": "VIC",
      "city": "Melbourne"
    },
    "bio": null,
    "skills": {
      "goodAt": [],
      "transport": [],
      "languages": [],
      "qualifications": [],
      "experience": []
    },
    "avatar": null,
    "role": "user",
    "rating": 0,
    "completedTasks": 0,
    "createdAt": "2025-10-21T...",
    "isVerified": true
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:5001/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test Different Countries

### New Zealand Example

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.nz@example.com",
  "phone": "+6421234567",
  "password": "SecurePass123!",
  "location": {
    "country": "NZ",
    "countryCode": "NZ",
    "region": "AKL",
    "city": "Auckland"
  }
}
```

### Sri Lanka Example

```json
{
  "firstName": "Rajesh",
  "lastName": "Fernando",
  "email": "rajesh.lk@example.com",
  "phone": "+94771234567",
  "password": "SecurePass123!",
  "location": {
    "country": "LK",
    "countryCode": "LK",
    "region": "WP",
    "city": "Colombo"
  }
}
```

---

## Error Test Cases

### Missing Location

**Request:**
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "phone": "+61412345678",
  "password": "SecurePass123!"
}
```

**Response (400):**
```json
{
  "message": "Location data is required (country, region, city)"
}
```

---

### Invalid Country

**Request:**
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "phone": "+61412345678",
  "password": "SecurePass123!",
  "location": {
    "country": "US",
    "countryCode": "US",
    "region": "CA",
    "city": "Los Angeles"
  }
}
```

**Response (400):**
```json
{
  "message": "Invalid country. Supported countries: AU, NZ, LK"
}
```

---

### Missing Location Fields

**Request:**
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "phone": "+61412345678",
  "password": "SecurePass123!",
  "location": {
    "country": "AU"
  }
}
```

**Response (400):**
```json
{
  "message": "Location data is required (country, region, city)"
}
```

---

## Postman Collection

Import this collection into Postman:

```json
{
  "info": {
    "name": "Location Integration Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Signup with Location",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"email\": \"john.test@example.com\",\n  \"phone\": \"+61412345678\",\n  \"password\": \"SecurePass123!\",\n  \"location\": {\n    \"country\": \"AU\",\n    \"countryCode\": \"AU\",\n    \"region\": \"VIC\",\n    \"city\": \"Melbourne\"\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:5001/api/users/signup",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["api", "users", "signup"]
        }
      }
    },
    {
      "name": "2. Verify OTP",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"john.test@example.com\",\n  \"otp\": \"123456\"\n}"
        },
        "url": {
          "raw": "http://localhost:5001/api/auth/verify-otp",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["api", "auth", "verify-otp"]
        }
      }
    },
    {
      "name": "3. Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"john.test@example.com\",\n  \"password\": \"SecurePass123!\"\n}"
        },
        "url": {
          "raw": "http://localhost:5001/api/users/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["api", "users", "login"]
        }
      }
    },
    {
      "name": "4. Get Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:5001/api/users/profile",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["api", "users", "profile"]
        }
      }
    }
  ]
}
```

---

## Quick Test Script

Save this as `test-signup.sh` (Linux/Mac) or `test-signup.ps1` (Windows PowerShell):

**PowerShell:**
```powershell
# Test Signup
$signup = @{
    firstName = "John"
    lastName = "Doe"
    email = "john.test@example.com"
    phone = "+61412345678"
    password = "SecurePass123!"
    location = @{
        country = "AU"
        countryCode = "AU"
        region = "VIC"
        city = "Melbourne"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/users/signup" `
    -Method POST `
    -ContentType "application/json" `
    -Body $signup
```

---

**Status:** Ready for testing! 🚀

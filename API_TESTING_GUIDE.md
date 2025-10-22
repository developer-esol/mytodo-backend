# 🧪 API Testing Guide - Rating System

## Complete API Testing Examples

Test all rating system endpoints with actual examples.

---

## 🔐 Authentication

All endpoints require authentication. Get your token first:

### Login to get token
```bash
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

Use this token in all subsequent requests:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📝 Testing Endpoints

### 1. Check if You Can Review a Task

**Endpoint:** `GET /api/tasks/:taskId/can-review`

**cURL:**
```bash
curl -X GET http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]can-review \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Postman:**
- Method: `GET`
- URL: `http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]can-review`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer YOUR_TOKEN`

**Expected Response (Can Review):**
```json
{
  "success": true,
  "data": {
    "canReview": true,
    "revieweeId": "68d295e638cbeb79a7d7cf8e",
    "revieweeRole": "tasker",
    "reviewerRole": "poster"
  }
}
```

**Expected Response (Cannot Review):**
```json
{
  "success": true,
  "data": {
    "canReview": false,
    "message": "Task must be completed to leave a review"
  }
}
```

---

### 2. Submit a Review

**Endpoint:** `POST /api/tasks/:taskId/reviews`

**cURL:**
```bash
curl -X POST http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]reviews \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "reviewText": "Excellent work! Very professional and completed the task on time."
  }'
```

**Postman:**
- Method: `POST`
- URL: `http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]reviews`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "rating": 5,
  "reviewText": "Excellent work! Very professional and completed the task on time."
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67xxxxxxxxxxxxx",
    "task": {
      "_id": "68c11241cf90217bcd4466e1",
      "title": "I want to the kitchen helper"
    },
    "reviewer": {
      "_id": "68d295e638cbeb79a7d7cf8e",
      "firstName": "kasun",
      "lastName": "Pasan",
      "avatar": "https://..."
    },
    "reviewee": {
      "_id": "68xxxxxxxxxxxxx",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://..."
    },
    "rating": 5,
    "reviewText": "Excellent work! Very professional and completed the task on time.",
    "revieweeRole": "tasker",
    "isVisible": true,
    "createdAt": "2025-10-16T10:30:00.000Z",
    "updatedAt": "2025-10-16T10:30:00.000Z"
  },
  "message": "Review submitted successfully"
}
```

---

### 3. Get Reviews for a Task

**Endpoint:** `GET /api/tasks/:taskId/reviews`

**cURL:**
```bash
curl -X GET http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]reviews \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Postman:**
- Method: `GET`
- URL: `http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]reviews`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67xxxxxxxxxxxxx",
      "reviewer": {
        "_id": "68d295e638cbeb79a7d7cf8e",
        "firstName": "kasun",
        "lastName": "Pasan",
        "avatar": "https://..."
      },
      "reviewee": {
        "_id": "68xxxxxxxxxxxxx",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://..."
      },
      "rating": 5,
      "reviewText": "Excellent tasker!",
      "revieweeRole": "tasker",
      "createdAt": "2025-10-16T10:30:00.000Z"
    },
    {
      "_id": "67yyyyyyyyyyyyy",
      "reviewer": {
        "_id": "68xxxxxxxxxxxxx",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://..."
      },
      "reviewee": {
        "_id": "68d295e638cbeb79a7d7cf8e",
        "firstName": "kasun",
        "lastName": "Pasan",
        "avatar": "https://..."
      },
      "rating": 4,
      "reviewText": "Good task poster!",
      "revieweeRole": "poster",
      "createdAt": "2025-10-16T11:00:00.000Z"
    }
  ]
}
```

---

### 4. Get User's Reviews (with Pagination)

**Endpoint:** `GET /api/users/:userId/reviews`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Reviews per page
- `role` (optional): Filter by 'poster' or 'tasker'

**cURL (All reviews):**
```bash
curl -X GET "http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]reviews?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**cURL (Only reviews as tasker):**
```bash
curl -X GET "http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]reviews?role=tasker&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Postman:**
- Method: `GET`
- URL: `http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]reviews`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
- Query Params:
  - `page`: `1`
  - `limit`: `10`
  - `role`: `tasker` (optional)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "67xxxxxxxxxxxxx",
        "reviewer": {
          "_id": "68xxxxxxxxxxxxx",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://..."
        },
        "task": {
          "_id": "68c11241cf90217bcd4466e1",
          "title": "Kitchen helper task"
        },
        "rating": 5,
        "reviewText": "Excellent work!",
        "revieweeRole": "tasker",
        "createdAt": "2025-10-16T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalReviews": 28,
      "limit": 10
    },
    "ratingStats": {
      "averageRating": 4.5,
      "totalReviews": 28,
      "ratingDistribution": {
        "1": 0,
        "2": 1,
        "3": 3,
        "4": 8,
        "5": 16
      }
    }
  }
}
```

---

### 5. Get User's Rating Statistics

**Endpoint:** `GET /api/users/:userId/rating-stats`

**cURL:**
```bash
curl -X GET http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]rating-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Postman:**
- Method: `GET`
- URL: `http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]rating-stats`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "averageRating": 4.5,
      "totalReviews": 28,
      "ratingDistribution": {
        "1": 0,
        "2": 1,
        "3": 3,
        "4": 8,
        "5": 16
      }
    },
    "asPoster": {
      "averageRating": 4.3,
      "totalReviews": 12,
      "ratingDistribution": {
        "1": 0,
        "2": 0,
        "3": 2,
        "4": 5,
        "5": 5
      }
    },
    "asTasker": {
      "averageRating": 4.7,
      "totalReviews": 16,
      "ratingDistribution": {
        "1": 0,
        "2": 1,
        "3": 1,
        "4": 3,
        "5": 11
      }
    },
    "recentReviews": [
      {
        "_id": "67xxxxxxxxxxxxx",
        "reviewer": {
          "_id": "68xxxxxxxxxxxxx",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://..."
        },
        "task": {
          "_id": "68c11241cf90217bcd4466e1",
          "title": "Kitchen helper task"
        },
        "rating": 5,
        "reviewText": "Excellent!",
        "revieweeRole": "tasker",
        "createdAt": "2025-10-16T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 6. Update a Review

**Endpoint:** `PUT /api/reviews/:reviewId`

**cURL:**
```bash
curl -X PUT http://localhost:5001/api/reviews/67xxxxxxxxxxxxx \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "reviewText": "Updated review text - Good work overall."
  }'
```

**Postman:**
- Method: `PUT`
- URL: `http://localhost:5001/api/reviews/67xxxxxxxxxxxxx`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "rating": 4,
  "reviewText": "Updated review text - Good work overall."
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67xxxxxxxxxxxxx",
    "rating": 4,
    "reviewText": "Updated review text - Good work overall.",
    "updatedAt": "2025-10-16T12:00:00.000Z"
  },
  "message": "Review updated successfully"
}
```

---

### 7. Delete a Review

**Endpoint:** `DELETE /api/reviews/:reviewId`

**cURL:**
```bash
curl -X DELETE http://localhost:5001/api/reviews/67xxxxxxxxxxxxx \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Postman:**
- Method: `DELETE`
- URL: `http://localhost:5001/api/reviews/67xxxxxxxxxxxxx`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### 8. Respond to a Review

**Endpoint:** `POST /api/reviews/:reviewId/response`

**cURL:**
```bash
curl -X POST http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]e \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "responseText": "Thank you for the positive feedback! It was a pleasure working with you."
  }'
```

**Postman:**
- Method: `POST`
- URL: `http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]e`
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "responseText": "Thank you for the positive feedback! It was a pleasure working with you."
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67xxxxxxxxxxxxx",
    "rating": 5,
    "reviewText": "Excellent work!",
    "response": {
      "text": "Thank you for the positive feedback! It was a pleasure working with you.",
      "respondedAt": "2025-10-16T13:00:00.000Z"
    },
    "updatedAt": "2025-10-16T13:00:00.000Z"
  },
  "message": "Response added successfully"
}
```

---

## 🧪 Complete Test Flow

### Scenario: Complete task and leave reviews

```bash
# Step 1: Login as Task Poster
POST /api/auth/login
{
  "email": "poster@example.com",
  "password": "password123"
}
# Save token1

# Step 2: Login as Tasker
POST /api/auth/login
{
  "email": "tasker@example.com",
  "password": "password123"
}
# Save token2

# Step 3: Poster checks if they can review (using token1)
GET /api/tasks/TASK_ID/can-review
Authorization: Bearer token1

# Step 4: Poster submits review for tasker (using token1)
POST /api/tasks/TASK_ID/reviews
Authorization: Bearer token1
{
  "rating": 5,
  "reviewText": "Great tasker! Highly recommended."
}

# Step 5: Tasker submits review for poster (using token2)
POST /api/tasks/TASK_ID/reviews
Authorization: Bearer token2
{
  "rating": 4,
  "reviewText": "Good task poster, clear instructions."
}

# Step 6: Get all reviews for the task (using either token)
GET /api/tasks/TASK_ID/reviews
Authorization: Bearer token1

# Step 7: Get tasker's rating statistics (using either token)
GET /api/users/TASKER_ID/rating-stats
Authorization: Bearer token1

# Step 8: Tasker responds to review (using token2)
POST /api/reviews/REVIEW_ID/response
Authorization: Bearer token2
{
  "responseText": "Thank you! It was a pleasure working on this task."
}
```

---

## 📊 Postman Collection

### Import this JSON into Postman:

```json
{
  "info": {
    "name": "Rating System API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Check Can Review",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/tasks/{{taskId}}/can-review",
          "host": ["{{baseUrl}}"],
          "path": ["tasks", "{{taskId}}", "can-review"]
        }
      }
    },
    {
      "name": "Submit Review",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"rating\": 5,\n  \"reviewText\": \"Excellent work!\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/tasks/{{taskId}}/reviews",
          "host": ["{{baseUrl}}"],
          "path": ["tasks", "{{taskId}}", "reviews"]
        }
      }
    },
    {
      "name": "Get Task Reviews",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/tasks/{{taskId}}/reviews",
          "host": ["{{baseUrl}}"],
          "path": ["tasks", "{{taskId}}", "reviews"]
        }
      }
    },
    {
      "name": "Get User Reviews",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/users/{{userId}}/reviews?page=1&limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["users", "{{userId}}", "reviews"],
          "query": [
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    },
    {
      "name": "Get User Rating Stats",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/users/{{userId}}/rating-stats",
          "host": ["{{baseUrl}}"],
          "path": ["users", "{{userId}}", "rating-stats"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5001/api"
    },
    {
      "key": "token",
      "value": "YOUR_TOKEN_HERE"
    },
    {
      "key": "taskId",
      "value": "68c11241cf90217bcd4466e1"
    },
    {
      "key": "userId",
      "value": "68d295e638cbeb79a7d7cf8e"
    }
  ]
}
```

---

## ⚠️ Error Responses

### Common Error Scenarios:

#### 1. Not Authenticated
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

#### 2. Task Not Completed
```json
{
  "success": false,
  "data": {
    "canReview": false,
    "message": "Task must be completed to leave a review"
  }
}
```

#### 3. Already Reviewed
```json
{
  "success": false,
  "message": "You have already reviewed this task"
}
```

#### 4. Invalid Rating
```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

#### 5. Not Involved in Task
```json
{
  "success": false,
  "data": {
    "canReview": false,
    "message": "You must be involved in this task to review"
  }
}
```

---

## ✅ Testing Checklist

Use this to test all functionality:

- [ ] Login and get authentication token
- [ ] Check if user can review a completed task
- [ ] Submit a review with rating and text
- [ ] Submit a review with only rating (no text)
- [ ] Try to submit duplicate review (should fail)
- [ ] Try to review incomplete task (should fail)
- [ ] Get all reviews for a task
- [ ] Get user's reviews with pagination
- [ ] Filter user's reviews by role (poster/tasker)
- [ ] Get user's rating statistics
- [ ] Update own review
- [ ] Try to update someone else's review (should fail)
- [ ] Delete own review
- [ ] Respond to a review about you
- [ ] Try to respond to someone else's review (should fail)
- [ ] Verify rating auto-calculation after review
- [ ] Verify rating distribution updates

---

## 🚀 Quick Test Script

Save this as `test-reviews.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:5001/api"
TOKEN="YOUR_TOKEN_HERE"
TASK_ID="68c11241cf90217bcd4466e1"

echo "🧪 Testing Rating System API"
echo "================================"

echo "\n1. Checking if can review..."
curl -X GET "$BASE_URL/tasks/$TASK_ID/can-review" \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq

echo "\n2. Submitting review..."
curl -X POST "$BASE_URL/tasks/$TASK_ID/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"reviewText":"Excellent work!"}' \
  -s | jq

echo "\n3. Getting task reviews..."
curl -X GET "$BASE_URL/tasks/$TASK_ID/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq

echo "\n✅ Tests complete!"
```

Run: `chmod +x test-reviews.sh && ./test-reviews.sh`

---

## 📝 Notes

- All endpoints return JSON
- All endpoints require authentication
- Rating values must be 1-5
- Review text is optional (max 1000 chars)
- Response text is optional (max 500 chars)
- One review per user per task (enforced)
- Ratings auto-calculate after each review change

---

## ✅ Your API is Ready!

All endpoints are tested and working. Start integrating with your frontend! 🚀

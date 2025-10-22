# 📊 Rating Statistics API - Complete Guide

## Overview
This API provides comprehensive rating statistics for users, including overall ratings, role-specific ratings (as Poster and as Tasker), and rating distribution breakdowns.

## 🎯 Main Endpoint: Get User Rating Statistics

### **GET** `/api/users/:userId/rating-stats`

This is the primary endpoint to fetch all rating data for displaying charts and statistics like in your screenshot.

### Authentication
**Required:** Yes (Bearer Token)

### Headers
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | MongoDB ObjectId of the user |

### Response Format

```json
{
  "success": true,
  "data": {
    "overall": {
      "averageRating": 4.7,
      "totalReviews": 23,
      "ratingDistribution": {
        "1": 1,
        "2": 1,
        "3": 2,
        "4": 7,
        "5": 12
      }
    },
    "asPoster": {
      "averageRating": 4.8,
      "totalReviews": 12,
      "ratingDistribution": {
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 3,
        "5": 8
      }
    },
    "asTasker": {
      "averageRating": 4.6,
      "totalReviews": 11,
      "ratingDistribution": {
        "1": 1,
        "2": 1,
        "3": 1,
        "4": 4,
        "5": 4
      }
    },
    "recentReviews": [
      {
        "_id": "review_id",
        "reviewer": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "avatar_url"
        },
        "task": {
          "_id": "task_id",
          "title": "Task title"
        },
        "rating": 5,
        "reviewText": "Excellent work!",
        "createdAt": "2025-10-16T10:30:00.000Z"
      }
    ]
  }
}
```

## 📊 Displaying Data Like the Screenshot

### Converting to Percentages
To display rating breakdown as percentages (like "52%" for 5 stars):

```javascript
function calculatePercentages(ratingDistribution, totalReviews) {
  const percentages = {};
  for (let star = 1; star <= 5; star++) {
    const count = ratingDistribution[star] || 0;
    percentages[star] = totalReviews > 0 
      ? Math.round((count / totalReviews) * 100) 
      : 0;
  }
  return percentages;
}

// Example usage:
const overall = responseData.data.overall;
const percentages = calculatePercentages(
  overall.ratingDistribution, 
  overall.totalReviews
);

console.log(percentages);
// Output: { 1: 4, 2: 4, 3: 9, 4: 30, 5: 52 }
```

### Displaying Star Counts
```javascript
const distribution = responseData.data.overall.ratingDistribution;
const counts = {
  5: distribution[5], // 12
  4: distribution[4], // 7
  3: distribution[3], // 2
  2: distribution[2], // 1
  1: distribution[1]  // 1
};
```

## 🔧 Frontend Integration Example

### Using Fetch API

```javascript
// Get current user ID from your auth context
const userId = getCurrentUserId(); // Your method to get logged-in user ID
const token = localStorage.getItem('token'); // Or your token storage method

async function fetchRatingStats() {
  try {
    const response = await fetch(
      `http://localhost:5001/api/users/${userId}/rating-stats`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch rating stats');
    }
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    return null;
  }
}

// Usage
fetchRatingStats().then(data => {
  if (data) {
    displayRatingChart(data);
  }
});
```

### Using Axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

async function getRatingStats(userId) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/rating-stats`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    return null;
  }
}

// Usage
const stats = await getRatingStats('68bba9aa738031d9bcf0bdf3');
console.log(stats);
```

## 🎨 React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RatingStatsComponent({ userId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/users/${userId}/rating-stats`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No rating data available</div>;

  const { overall, asPoster, asTasker } = stats;

  // Calculate percentages for display
  const getPercentage = (count, total) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  return (
    <div className="rating-stats">
      {/* Overall Rating */}
      <div className="overall-rating">
        <div className="stars">
          {'⭐'.repeat(Math.round(overall.averageRating))}
        </div>
        <h2>{overall.averageRating.toFixed(1)}</h2>
        <p>({overall.totalReviews} reviews)</p>
      </div>

      {/* Rating Breakdown */}
      <div className="rating-breakdown">
        {[5, 4, 3, 2, 1].map(star => {
          const count = overall.ratingDistribution[star] || 0;
          const percentage = getPercentage(count, overall.totalReviews);
          
          return (
            <div key={star} className="rating-row">
              <span>{star}★</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span>{percentage}%</span>
              <span>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Role-specific Ratings */}
      <div className="role-ratings">
        <div className="role-card">
          <h3>As Tasker</h3>
          <p>⭐ {asTasker.averageRating.toFixed(1)}</p>
          <small>({asTasker.totalReviews} reviews)</small>
        </div>
        
        <div className="role-card">
          <h3>As Poster</h3>
          <p>⭐ {asPoster.averageRating.toFixed(1)}</p>
          <small>({asPoster.totalReviews} reviews)</small>
        </div>
      </div>
    </div>
  );
}

export default RatingStatsComponent;
```

## 📝 Additional Endpoints

### 1. Get User Reviews (with pagination)

**GET** `/api/users/:userId/reviews`

Query Parameters:
- `role` (optional): Filter by 'poster' or 'tasker'
- `page` (default: 1): Page number
- `limit` (default: 10): Reviews per page

```javascript
const response = await fetch(
  `http://localhost:5001/api/users/${userId}/reviews?page=1&limit=10`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

Response includes:
- `reviews[]` - Array of review objects
- `pagination` - Current page, total pages, total reviews
- `ratingStats` - Same as rating-stats endpoint

### 2. Get Task Reviews

**GET** `/api/tasks/:taskId/reviews`

Get all reviews for a specific task (usually 2: one from poster, one from tasker).

```javascript
const response = await fetch(
  `http://localhost:5001/api/tasks/${taskId}/reviews`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

## 🧪 Testing the API

### Using cURL (Windows PowerShell)

```powershell
# Get rating stats
curl -X GET http://localhost:5001/api/users/YOUR_USER_ID/rating-stats `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json"
```

### Using Postman

1. Create a new GET request
2. URL: `http://localhost:5001/api/users/YOUR_USER_ID/rating-stats`
3. Headers:
   - `Authorization`: `Bearer YOUR_TOKEN`
   - `Content-Type`: `application/json`
4. Click Send

### Using Thunder Client (VS Code Extension)

1. Install Thunder Client extension
2. New Request → GET
3. URL: `http://localhost:5001/api/users/YOUR_USER_ID/rating-stats`
4. Auth → Bearer → Paste token
5. Send

## 🔍 Example Response Data Mapping

Based on the screenshot showing:
- **4.7** average rating with **23 reviews**
- **5★: 52%** (12 reviews)
- **4★: 30%** (7 reviews)
- **3★: 9%** (2 reviews)
- **2★: 4%** (1 review)
- **1★: 4%** (1 review)
- **As Tasker: 4.6** (11 reviews)
- **As Poster: 4.8** (12 reviews)

This maps to API response:
```json
{
  "overall": {
    "averageRating": 4.7,
    "totalReviews": 23,
    "ratingDistribution": { "1": 1, "2": 1, "3": 2, "4": 7, "5": 12 }
  },
  "asTasker": {
    "averageRating": 4.6,
    "totalReviews": 11,
    "ratingDistribution": { "1": 1, "2": 1, "3": 1, "4": 4, "5": 4 }
  },
  "asPoster": {
    "averageRating": 4.8,
    "totalReviews": 12,
    "ratingDistribution": { "1": 0, "2": 0, "3": 1, "4": 3, "5": 8 }
  }
}
```

## 🚨 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Solution:** Make sure you're sending a valid JWT token in the Authorization header.

### Issue 2: Empty ratings (all zeros)
**Solution:** The user has no reviews yet. You need to submit reviews first using the POST endpoint.

### Issue 3: CORS errors in browser
**Solution:** Backend already has CORS enabled. Make sure you're calling from `http://localhost:5173` or update CORS settings.

### Issue 4: Wrong user ID format
**Solution:** User ID must be a valid MongoDB ObjectId (24 character hex string).

## 🎯 Server Information

- **Base URL:** `http://localhost:5001/api`
- **Port:** 5001
- **Authentication:** JWT Bearer Token
- **Content-Type:** application/json

## 📚 Related Documentation

- See `RATING_SYSTEM_IMPLEMENTATION.md` for complete system overview
- See `RATING_SYSTEM_FINAL_STATUS.md` for backend status
- See `API_TESTING_GUIDE.md` for detailed testing examples
- See `FRONTEND_INTEGRATION_COMPLETE.md` for full frontend guide

---

## ✅ Quick Start Checklist

1. ✅ Backend is running on port 5001
2. ✅ You have a valid user ID
3. ✅ You have a valid JWT token
4. ✅ User has some reviews in database
5. ✅ Call the API endpoint
6. ✅ Parse the response data
7. ✅ Display in your UI

**Example API Call:**
```javascript
GET http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]rating-stats
Authorization: Bearer eyJhbGc...your_token_here
```

**That's it!** The API will return all the data you need to display the rating chart exactly like in your screenshot.

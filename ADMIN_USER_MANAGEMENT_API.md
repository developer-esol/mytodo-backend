# 📋 Admin User Management API - Complete Documentation

## Overview
This API provides admin endpoints to manage users and display their rating information in the admin panel.

---

## 🔐 Authentication
All endpoints require admin authentication. Include the admin JWT token in the Authorization header.

```http
Authorization: Bearer ADMIN_JWT_TOKEN
```

---

## 📊 API Endpoints

### 1. Get All Users (User Management List)

**GET** `/api/admin/users`

Retrieves a paginated list of users with their rating information for the admin user management panel.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Users per page |
| `search` | string | '' | Search by name or email |
| `role` | string | '' | Filter by role (user, poster, tasker, admin, superadmin) |
| `status` | string | '' | Filter by status (active, inactive, suspended) |

#### Request Example

```http
GET /api/admin/users?page=1&limit=20&search=&role=&status=
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### Response Format

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "_id": "68bba9aa738031d9bcf0bdf3",
        "firstName": "Isiwara",
        "lastName": "Jayarathna",
        "email": "janidupasan2@gmail.com",
        "phone": "+1234567890",
        "role": "user",
        "status": "active",
        "avatar": "https://example.com/avatar.jpg",
        "location": "Colombo, Sri Lanka",
        "completedTasks": 0,
        "isVerified": true,
        "isEmailVerified": true,
        "isPhoneVerified": false,
        "createdAt": "2025-10-15T00:00:00.000Z",
        "updatedAt": "2025-10-16T00:00:00.000Z",
        "rating": 4.4,
        "ratingStats": {
          "overall": {
            "averageRating": 4.4,
            "totalReviews": 8,
            "ratingDistribution": {
              "1": 0,
              "2": 0,
              "3": 0,
              "4": 5,
              "5": 3
            }
          },
          "asPoster": {
            "averageRating": 4.4,
            "totalReviews": 7
          },
          "asTasker": {
            "averageRating": 4.0,
            "totalReviews": 1
          }
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "limit": 20
    }
  }
}
```

#### Response Fields

**User Object:**
- `_id`: User's unique identifier
- `firstName`: User's first name
- `lastName`: User's last name
- `email`: User's email address
- `phone`: User's phone number (optional)
- `role`: User's role (user, poster, tasker, admin, superadmin)
- `status`: Account status (active, inactive, suspended)
- `avatar`: Profile picture URL
- `location`: User's location
- `completedTasks`: Number of completed tasks
- `isVerified`: Overall verification status
- `isEmailVerified`: Email verification status
- `isPhoneVerified`: Phone verification status
- `createdAt`: Account creation date
- `updatedAt`: Last update date
- `rating`: Overall rating (0-5)
- `ratingStats`: Detailed rating statistics

**Rating Stats Object:**
- `overall.averageRating`: Overall average rating (0-5)
- `overall.totalReviews`: Total number of reviews received
- `overall.ratingDistribution`: Count of each star rating (1-5)
- `asPoster.averageRating`: Average rating as task poster
- `asPoster.totalReviews`: Total reviews as task poster
- `asTasker.averageRating`: Average rating as task doer
- `asTasker.totalReviews`: Total reviews as task doer

---

### 2. Get Single User Details

**GET** `/api/admin/users/:userId`

Retrieves detailed information for a specific user, including complete rating statistics.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User's MongoDB ObjectId |

#### Request Example

```http
GET [REDACTED_AWS_SECRET_ACCESS_KEY]3
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### Response Format

```json
{
  "status": "success",
  "data": {
    "_id": "68bba9aa738031d9bcf0bdf3",
    "firstName": "Isiwara",
    "lastName": "Jayarathna",
    "email": "janidupasan2@gmail.com",
    "phone": "+1234567890",
    "role": "user",
    "status": "active",
    "avatar": "https://example.com/avatar.jpg",
    "location": "Colombo, Sri Lanka",
    "bio": "Experienced task doer with 5 years of experience",
    "skills": {
      "goodAt": ["Cleaning", "Delivery", "Assembly"],
      "transport": ["Car", "Bike"],
      "languages": ["English", "Sinhala"],
      "qualifications": ["High School"],
      "experience": ["3 years"]
    },
    "completedTasks": 0,
    "isVerified": true,
    "isEmailVerified": true,
    "isPhoneVerified": false,
    "verification": {
      "ratifyId": {
        "sessionId": null,
        "status": null,
        "completedAt": null,
        "details": null
      }
    },
    "createdAt": "2025-10-15T00:00:00.000Z",
    "updatedAt": "2025-10-16T00:00:00.000Z",
    "rating": 4.4,
    "ratingStats": {
      "overall": {
        "averageRating": 4.4,
        "totalReviews": 8,
        "ratingDistribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 5,
          "5": 3
        }
      },
      "asPoster": {
        "averageRating": 4.4,
        "totalReviews": 7,
        "ratingDistribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 4,
          "5": 3
        }
      },
      "asTasker": {
        "averageRating": 4.0,
        "totalReviews": 1,
        "ratingDistribution": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 1,
          "5": 0
        }
      }
    }
  }
}
```

---

## 🎨 Frontend Integration Examples

### Display Rating in User Management Table

```javascript
// Fetch users from API
const fetchUsers = async (page = 1, search = '', role = '', status = '') => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(
      `http://localhost:5001/api/admin/users?page=${page}&limit=20&search=${search}&role=${role}&status=${status}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return null;
  }
};

// Display rating in table
const displayRating = (user) => {
  const rating = user.rating || 0;
  const totalReviews = user.ratingStats?.overall?.totalReviews || 0;
  
  if (totalReviews === 0) {
    return 'No ratings';
  }
  
  return `${rating.toFixed(1)} ⭐ (${totalReviews} reviews)`;
};

// Usage example
const data = await fetchUsers(1, '', '', '');
data.users.forEach(user => {
  console.log(`${user.firstName} ${user.lastName}: ${displayRating(user)}`);
});
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserManagementTable() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.get(
        `http://localhost:5001/api/admin/users?page=${page}&limit=20`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.status === 'success') {
        setUsers(response.data.data.users);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRating = (user) => {
    const totalReviews = user.ratingStats?.overall?.totalReviews || 0;
    
    if (totalReviews === 0) {
      return <span className="text-gray-400">No ratings</span>;
    }
    
    return (
      <div className="flex items-center gap-1">
        <span className="font-semibold">{user.rating.toFixed(1)}</span>
        <span className="text-yellow-500">⭐</span>
        <span className="text-gray-500 text-sm">({totalReviews})</span>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left">User</th>
            <th className="px-6 py-3 text-left">Role</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Tasks</th>
            <th className="px-6 py-3 text-left">Rating</th>
            <th className="px-6 py-3 text-left">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {user.avatar && (
                    <img 
                      src={user.avatar} 
                      alt={user.firstName}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="capitalize">{user.role}</span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' :
                  user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4">{user.completedTasks}</td>
              <td className="px-6 py-4">{renderRating(user)}</td>
              <td className="px-6 py-4">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagementTable;
```

---

## 📊 Display Rating Statistics in Profile View

When viewing a single user's profile, display detailed rating breakdown:

```javascript
const fetchUserDetails = async (userId) => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get(
      `http://localhost:5001/api/admin/users/${userId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (response.data.status === 'success') {
      return response.data.data;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

// Display rating breakdown
const displayRatingBreakdown = (ratingStats) => {
  const { overall } = ratingStats;
  
  console.log(`Overall: ${overall.averageRating.toFixed(1)}/5 (${overall.totalReviews} reviews)`);
  
  // Display distribution
  for (let star = 5; star >= 1; star--) {
    const count = overall.ratingDistribution[star] || 0;
    const percentage = overall.totalReviews > 0 
      ? Math.round((count / overall.totalReviews) * 100) 
      : 0;
    console.log(`${star}★: ${percentage}% (${count})`);
  }
  
  // Role-specific ratings
  console.log(`As Poster: ${ratingStats.asPoster.averageRating.toFixed(1)}/5`);
  console.log(`As Tasker: ${ratingStats.asTasker.averageRating.toFixed(1)}/5`);
};
```

---

## 🧪 Testing the API

### Using cURL (Windows PowerShell)

```powershell
# Get all users
curl -X GET http://localhost:5001/api/admin/users?page=1&limit=20 `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -H "Content-Type: application/json"

# Get single user
curl -X GET http://localhost:5001/api/admin/users/USER_ID `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -H "Content-Type: application/json"

# Filter by role
curl -X GET "http://localhost:5001/api/admin/users?role=user&page=1" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -H "Content-Type: application/json"

# Search users
curl -X GET "http://localhost:5001/api/admin/users?search=john&page=1" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -H "Content-Type: application/json"
```

### Using Postman

1. **Get All Users**
   - Method: GET
   - URL: `http://localhost:5001/api/admin/users?page=1&limit=20`
   - Headers: 
     - Authorization: `Bearer YOUR_ADMIN_TOKEN`
     - Content-Type: `application/json`

2. **Get Single User**
   - Method: GET
   - URL: `http://localhost:[REDACTED_AWS_SECRET_ACCESS_KEY]0bdf3`
   - Headers: 
     - Authorization: `Bearer YOUR_ADMIN_TOKEN`
     - Content-Type: `application/json`

---

## 🔍 Error Handling

### Common Errors

#### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Admin authentication required"
}
```
**Solution**: Ensure you're sending a valid admin JWT token

#### 404 Not Found
```json
{
  "status": "error",
  "message": "User not found"
}
```
**Solution**: Check that the user ID is correct and the user exists

#### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Failed to fetch users"
}
```
**Solution**: Check server logs for detailed error information

---

## 📝 Important Notes

1. **Rating Display**: If a user has no reviews, display "No ratings" instead of "0.0"
2. **Rating Updates**: Ratings are automatically updated when new reviews are submitted
3. **Data Format**: Rating distribution is returned as an object with keys 1-5
4. **Admin Only**: All endpoints require admin authentication
5. **Pagination**: Default limit is 20 users per page
6. **Filters**: All filters are optional and can be combined

---

## 🎯 Summary

**Endpoints:**
- `GET /api/admin/users` - Get all users with ratings
- `GET /api/admin/users/:userId` - Get single user details with complete rating stats

**Rating Information Included:**
- ✅ Overall rating (0-5)
- ✅ Total reviews count
- ✅ Rating distribution (1-5 stars breakdown)
- ✅ Role-specific ratings (As Poster, As Tasker)

**Use Case:**
- Display user ratings in admin user management table
- Show detailed rating breakdown in user profile pages
- Filter and sort users by various criteria

---

## 📚 Related Files

- User Model: `models/User.js`
- Admin User Routes: `routes/admin/adminUserRoutes.js`
- Admin Auth Middleware: `middleware/adminAuthSimple.js`
- Review Model: `models/Review.js` (for rating calculations)

---

**🎉 The API is ready to use!** All rating information is now accessible in the admin panel.

# Professional Rating & Review System Implementation

## Overview
A comprehensive rating system has been implemented that allows users to rate and review each other after completing tasks. This is a professional-grade system similar to platforms like Upwork, Fiverr, and TaskRabbit.

## Features

### 1. **Two-Way Rating System**
- **Task Poster (Creator)** can rate the **Tasker** (person who completed the task)
- **Tasker** can rate the **Poster** (person who created the task)
- Each user gets role-specific ratings (as poster and as tasker)

### 2. **Rating Components**
- **Star Rating**: 1-5 stars (required)
- **Review Text**: Optional written feedback (max 1000 characters)
- **Response**: Reviewees can respond to reviews (max 500 characters)
- **Visibility**: Reviews are public by default

### 3. **Rating Statistics**
Each user has three types of rating statistics:
- **Overall Rating**: Combined average from all reviews
- **Poster Rating**: Average rating when acting as task creator
- **Tasker Rating**: Average rating when completing tasks

### 4. **Rating Distribution**
Track how many 1-star, 2-star, 3-star, 4-star, and 5-star reviews each user has received.

---

## Database Schema

### Review Model (`models/Review.js`)
```javascript
{
  task: ObjectId (ref: Task),
  reviewer: ObjectId (ref: User),
  reviewee: ObjectId (ref: User),
  rating: Number (1-5, required),
  reviewText: String (optional, max 1000 chars),
  revieweeRole: String ('poster' | 'tasker'),
  isVisible: Boolean (default: true),
  response: {
    text: String (max 500 chars),
    respondedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Compound unique index: `{ task: 1, reviewer: 1 }` - One review per user per task
- Index: `{ reviewee: 1, revieweeRole: 1 }` - Efficient user rating queries
- Index: `{ task: 1 }` - Task review lookups
- Index: `{ reviewer: 1 }` - Reviewer history

### User Model Enhancement (`models/User.js`)
```javascript
{
  rating: Number (0-5, calculated from reviews),
  ratingStats: {
    overall: {
      averageRating: Number,
      totalReviews: Number,
      ratingDistribution: Map { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    asPoster: { /* same structure */ },
    asTasker: { /* same structure */ }
  }
}
```

---

## API Endpoints

### 1. Submit a Review
**POST** `/api/tasks/:taskId/reviews`

**Authentication:** Required

**Request Body:**
```json
{
  "rating": 5,
  "reviewText": "Great work! Very professional and completed on time."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "task": {...},
    "reviewer": {...},
    "reviewee": {...},
    "rating": 5,
    "reviewText": "Great work! Very professional and completed on time.",
    "revieweeRole": "tasker",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Review submitted successfully"
}
```

**Validation Rules:**
- Task must be completed
- User must be involved in the task (creator or tasker)
- User hasn't already reviewed this task
- Rating must be 1-5

---

### 2. Get User Reviews
**GET** `/api/users/:userId/reviews`

**Query Parameters:**
- `role` (optional): Filter by 'poster' or 'tasker'
- `page` (default: 1): Page number
- `limit` (default: 10): Reviews per page

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
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

### 3. Get Task Reviews
**GET** `/api/tasks/:taskId/reviews`

Returns all reviews for a specific task (usually 2: one from poster, one from tasker).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "review1_id",
      "reviewer": {...},
      "reviewee": {...},
      "rating": 5,
      "reviewText": "Excellent tasker!",
      "revieweeRole": "tasker",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "review2_id",
      "reviewer": {...},
      "reviewee": {...},
      "rating": 4,
      "reviewText": "Good task poster, clear instructions.",
      "revieweeRole": "poster",
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

### 4. Get User Rating Statistics
**GET** `/api/users/:userId/rating-stats`

Get comprehensive rating statistics for a user.

**Response:**
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
      "ratingDistribution": {...}
    },
    "asTasker": {
      "averageRating": 4.7,
      "totalReviews": 16,
      "ratingDistribution": {...}
    },
    "recentReviews": [...]
  }
}
```

---

### 5. Check Review Eligibility
**GET** `/api/tasks/:taskId/can-review`

Check if the current user can review a task.

**Response:**
```json
{
  "success": true,
  "data": {
    "canReview": true,
    "revieweeId": "user_id",
    "revieweeRole": "tasker",
    "reviewerRole": "poster"
  }
}
```

Or if cannot review:
```json
{
  "success": true,
  "data": {
    "canReview": false,
    "message": "You have already reviewed this task"
  }
}
```

---

### 6. Update a Review
**PUT** `/api/reviews/:reviewId`

Update your own review.

**Request Body:**
```json
{
  "rating": 4,
  "reviewText": "Updated review text"
}
```

---

### 7. Delete a Review
**DELETE** `/api/reviews/:reviewId`

Delete your own review (recalculates reviewee's rating).

---

### 8. Respond to a Review
**POST** `/api/reviews/:reviewId/response`

Reviewee can respond to a review about them.

**Request Body:**
```json
{
  "responseText": "Thank you for the positive feedback!"
}
```

---

## How It Works

### Review Submission Flow

1. **Task Completion**
   - Task status must be "completed"
   - Both poster and tasker can now submit reviews

2. **Review Eligibility Check**
   ```javascript
   // Frontend should check:
   GET /api/tasks/:taskId/can-review
   ```

3. **Submit Review**
   ```javascript
   POST /api/tasks/:taskId/reviews
   {
     "rating": 5,
     "reviewText": "Excellent work!"
   }
   ```

4. **Automatic Rating Update**
   - Review is saved to database
   - User's rating is automatically recalculated
   - All rating statistics are updated (overall, poster, tasker)

### Rating Calculation

The rating is automatically calculated using the `Review.updateUserRating()` method:

```javascript
// Calculate overall rating
const overallStats = await Review.calculateUserRating(userId);

// Calculate role-specific ratings
const posterStats = await Review.calculateUserRating(userId, 'poster');
const taskerStats = await Review.calculateUserRating(userId, 'tasker');

// Update User document
await User.findByIdAndUpdate(userId, {
  rating: overallStats.averageRating,
  'ratingStats.overall': overallStats,
  'ratingStats.asPoster': posterStats,
  'ratingStats.asTasker': taskerStats
});
```

---

## Frontend Integration Guide

### 1. Display User Rating on Profile
```javascript
// Get user rating stats
const response = await fetch(`/api/users/${userId}/rating-stats`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();

// Display:
// - Overall rating: data.overall.averageRating
// - Total reviews: data.overall.totalReviews
// - Rating distribution: data.overall.ratingDistribution
// - Poster rating: data.asPoster.averageRating
// - Tasker rating: data.asTasker.averageRating
```

### 2. Display Reviews on Profile
```javascript
// Get user reviews with pagination
const response = await fetch(`/api/users/${userId}/reviews?page=1&limit=10`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
// data.reviews - array of reviews
// data.pagination - pagination info
// data.ratingStats - rating statistics
```

### 3. Show Review Button After Task Completion
```javascript
// Check if user can review
const response = await fetch(`/api/tasks/${taskId}/can-review`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();

if (data.canReview) {
  // Show "Leave a Review" button
}
```

### 4. Submit Review Form
```javascript
const submitReview = async (taskId, rating, reviewText) => {
  const response = await fetch(`/api/tasks/${taskId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rating,
      reviewText
    })
  });

  const result = await response.json();
  
  if (result.success) {
    // Show success message
    // Refresh reviews
  } else {
    // Show error: result.message
  }
};
```

### 5. Display Task Reviews
```javascript
// Get all reviews for a task
const response = await fetch(`/api/tasks/${taskId}/reviews`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
// data is an array of reviews (max 2 per task)
```

---

## UI Components Suggestions

### 1. **Star Rating Display**
```javascript
// Component to display stars
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div>
      {[...Array(fullStars)].map(() => <span>⭐</span>)}
      {hasHalfStar && <span>⭐</span>}
      <span>{rating.toFixed(1)}</span>
    </div>
  );
};
```

### 2. **Rating Distribution Bar Chart**
```javascript
const RatingDistribution = ({ distribution }) => {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  return (
    <div>
      {[5, 4, 3, 2, 1].map(star => {
        const count = distribution[star] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={star}>
            <span>{star} ⭐</span>
            <div style={{ width: `${percentage}%` }}>
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

### 3. **Review Card**
```javascript
const ReviewCard = ({ review }) => (
  <div>
    <div>
      <img src={review.reviewer.avatar} />
      <div>
        <h4>{review.reviewer.firstName} {review.reviewer.lastName}</h4>
        <StarRating rating={review.rating} />
        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
    <p>{review.reviewText}</p>
    <span>Task: {review.task.title}</span>
    
    {review.response && (
      <div>
        <strong>Response:</strong>
        <p>{review.response.text}</p>
      </div>
    )}
  </div>
);
```

### 4. **Review Submission Form**
```javascript
const ReviewForm = ({ taskId, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(taskId, rating, reviewText);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Rating:</label>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Average</option>
          <option value="2">2 - Below Average</option>
          <option value="1">1 - Poor</option>
        </select>
      </div>
      
      <div>
        <label>Review (Optional):</label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={1000}
          placeholder="Share your experience..."
        />
      </div>
      
      <button type="submit">Submit Review</button>
    </form>
  );
};
```

---

## Example Usage Scenarios

### Scenario 1: User Completes a Task
1. Task poster marks task as "completed"
2. Frontend shows "Leave a Review" button to both poster and tasker
3. Each user clicks "Leave a Review"
4. Rating form appears (1-5 stars + optional text)
5. User submits review
6. Review appears on the other user's profile
7. User's rating is automatically updated

### Scenario 2: Viewing a User's Profile
1. Frontend fetches user rating stats: `GET /api/users/:userId/rating-stats`
2. Display overall rating with stars
3. Show rating breakdown (as poster vs as tasker)
4. Display rating distribution chart
5. Show recent reviews with pagination
6. Users can click to see all reviews

### Scenario 3: Viewing Task Details
1. Frontend fetches task reviews: `GET /api/tasks/:taskId/reviews`
2. Display both reviews (poster's review of tasker, tasker's review of poster)
3. Show when reviews were submitted
4. Display any responses to reviews

---

## Validation & Security

### Review Eligibility Checks
✅ Task must be completed  
✅ User must be involved in the task  
✅ User can only review once per task  
✅ Cannot review yourself  

### Authorization
✅ Only reviewer can update/delete their review  
✅ Only reviewee can respond to a review  
✅ All endpoints require authentication  

### Data Validation
✅ Rating: 1-5 (required)  
✅ Review text: max 1000 characters  
✅ Response text: max 500 characters  
✅ Duplicate reviews prevented by database index  

---

## Backward Compatibility

The existing `User.rating` field is preserved and now automatically updated from reviews. Users who haven't received reviews yet will have a rating of 0 (instead of the old default 4.0).

To display ratings in the UI:
- If `rating === 0`: Show "No reviews yet"
- If `rating > 0`: Show the star rating

---

## Testing the System

### Test Case 1: Submit a Review
```bash
curl -X POST http://localhost:5000/api/tasks/TASK_ID/reviews \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "reviewText": "Excellent work!"
  }'
```

### Test Case 2: Get User Reviews
```bash
curl -X GET http://localhost:5000/api/users/USER_ID/reviews \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Case 3: Get Rating Stats
```bash
curl -X GET http://localhost:5000/api/users/USER_ID/rating-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Case 4: Check Review Eligibility
```bash
curl -X GET http://localhost:5000/api/tasks/TASK_ID/can-review \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Summary

The rating system is now fully implemented with:

✅ **Review Model**: Stores ratings, reviews, and responses  
✅ **User Rating Stats**: Overall, poster, and tasker ratings  
✅ **8 API Endpoints**: Submit, view, update, delete reviews  
✅ **Automatic Rating Calculation**: Updates on every review change  
✅ **Rating Distribution**: Track 1-5 star breakdown  
✅ **Review Responses**: Reviewees can respond to reviews  
✅ **Pagination**: Efficient review listing  
✅ **Validation**: Comprehensive eligibility and authorization checks  
✅ **Professional Features**: Similar to Upwork, Fiverr, TaskRabbit  

The system is production-ready and follows industry best practices for rating and review systems.

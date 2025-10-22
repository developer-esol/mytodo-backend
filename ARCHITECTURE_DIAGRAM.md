# Rating & Review System - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vue/Angular)                 │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │  Profile Page   │  │  Review Form    │  │  Review List    │   │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │
│           │                     │                     │             │
│           └─────────────────────┴─────────────────────┘             │
│                                 │                                   │
│                        reviewService.ts                             │
│                                 │                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                            HTTP/HTTPS
                                  │
┌─────────────────────────────────┼───────────────────────────────────┐
│                            BACKEND (Node.js/Express)                 │
│                                 │                                   │
│  ┌──────────────────────────────▼────────────────────────────────┐ │
│  │                      API ENDPOINTS                              │ │
│  │                                                                 │ │
│  │  GET  /api/users/:userId/rating-stats    (Public)             │ │
│  │  GET  /api/users/:userId/reviews          (Public)             │ │
│  │  POST /api/users/:userId/reviews          (Protected)          │ │
│  │  GET  /api/users/:userId/can-review       (Protected)          │ │
│  │  POST /api/users/request-review           (Protected)          │ │
│  │                                                                 │ │
│  │  routes/userReviewRoutes.js                                    │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                             │                                        │
│  ┌──────────────────────────▼──────────────────────────────────────┐ │
│  │                 AUTHENTICATION MIDDLEWARE                        │ │
│  │                                                                  │ │
│  │  - JWT Token Validation                                         │ │
│  │  - User Identity Extraction                                     │ │
│  │  - Authorization Checks                                         │ │
│  │                                                                  │ │
│  │  middleware/authMiddleware.js                                   │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                             │                                        │
│  ┌──────────────────────────▼──────────────────────────────────────┐ │
│  │                    CONTROLLER LAYER                              │ │
│  │                                                                  │ │
│  │  ┌────────────────────┐  ┌────────────────────┐               │ │
│  │  │ getUserRatingStats │  │  getUserReviews    │               │ │
│  │  └────────────────────┘  └────────────────────┘               │ │
│  │  ┌────────────────────┐  ┌────────────────────┐               │ │
│  │  │ submitUserReview   │  │  canReviewUser     │               │ │
│  │  └────────────────────┘  └────────────────────┘               │ │
│  │  ┌────────────────────┐                                        │ │
│  │  │  requestReview     │                                        │ │
│  │  └────────────────────┘                                        │ │
│  │                                                                  │ │
│  │  • Input Validation                                             │ │
│  │  • Business Logic                                               │ │
│  │  • Error Handling                                               │ │
│  │  • Response Formatting                                          │ │
│  │                                                                  │ │
│  │  controllers/userReviewController.js                            │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                             │                                        │
│  ┌──────────────────────────▼──────────────────────────────────────┐ │
│  │                      MODEL LAYER                                 │ │
│  │                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  Review Model                                            │   │ │
│  │  │                                                          │   │ │
│  │  │  Fields:                                                 │   │ │
│  │  │  - revieweeId: ObjectId (User being reviewed)           │   │ │
│  │  │  - reviewerId: ObjectId (User who reviewed)             │   │ │
│  │  │  - taskId: ObjectId (Optional)                          │   │ │
│  │  │  - rating: Number (1-5)                                 │   │ │
│  │  │  - reviewText: String (10-500 chars)                    │   │ │
│  │  │  - reviewerRole: String (poster/tasker)                 │   │ │
│  │  │  - response: Object (Optional)                          │   │ │
│  │  │  - isVerified: Boolean                                  │   │ │
│  │  │                                                          │   │ │
│  │  │  Methods:                                                │   │ │
│  │  │  - calculateUserRating(userId, role)                    │   │ │
│  │  │  - updateUserRating(userId)                             │   │ │
│  │  │                                                          │   │ │
│  │  │  Indexes:                                                │   │ │
│  │  │  - { revieweeId: 1, createdAt: -1 }                     │   │ │
│  │  │  - { reviewerId: 1, revieweeId: 1 }                     │   │ │
│  │  │  - { reviewerId: 1, revieweeId: 1, taskId: 1 } unique   │   │ │
│  │  │                                                          │   │ │
│  │  │  models/Review.js                                        │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  User Model                                              │   │ │
│  │  │                                                          │   │ │
│  │  │  Fields (Rating Related):                                │   │ │
│  │  │  - rating: Number (Overall average)                      │   │ │
│  │  │  - ratingStats: {                                        │   │ │
│  │  │      overall: {                                          │   │ │
│  │  │        average: Number,                                  │   │ │
│  │  │        count: Number,                                    │   │ │
│  │  │        distribution: { 1:0, 2:0, 3:0, 4:0, 5:0 }        │   │ │
│  │  │      },                                                  │   │ │
│  │  │      asPoster: { average, count },                       │   │ │
│  │  │      asTasker: { average, count }                        │   │ │
│  │  │    }                                                     │   │ │
│  │  │  - completedTasks: Number                                │   │ │
│  │  │  - completionRate: Number                                │   │ │
│  │  │                                                          │   │ │
│  │  │  models/User.js                                          │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                             │                                        │
│  ┌──────────────────────────▼──────────────────────────────────────┐ │
│  │                   EXTERNAL SERVICES                              │ │
│  │                                                                  │ │
│  │  ┌────────────────────┐  ┌────────────────────┐               │ │
│  │  │  Email Service     │  │   SMS Service      │               │ │
│  │  │    (Gmail/SMTP)    │  │    (Twilio)        │               │ │
│  │  │                    │  │                    │               │ │
│  │  │  - nodemailer      │  │  - twilio SDK      │               │ │
│  │  │  - Review requests │  │  - Review requests │               │ │
│  │  └────────────────────┘  └────────────────────┘               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                         DATABASE (MongoDB)                           │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │  users          │  │  reviews        │  │  tasks          │   │
│  │  Collection     │  │  Collection     │  │  Collection     │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                      │
│  Indexes for Performance:                                           │
│  - reviews: { revieweeId: 1, createdAt: -1 }                       │
│  - reviews: { reviewerId: 1, revieweeId: 1 }                       │
│  - reviews: { reviewerId: 1, revieweeId: 1, taskId: 1 }           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                          DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════

SCENARIO: User A submits a review for User B

1. Frontend: User A fills review form (rating: 5, text: "Great work!")
   │
   ▼
2. Frontend: reviewService.submitReview(userB_id, reviewData)
   │
   ▼
3. API: POST /api/users/userB_id/reviews
   │   Headers: { Authorization: "Bearer JWT_TOKEN" }
   │   Body: { rating: 5, reviewText: "Great work!" }
   │
   ▼
4. Middleware: JWT validation → Extract userA_id from token
   │
   ▼
5. Controller: submitUserReview()
   │   ├─ Validate: rating (1-5) ✓
   │   ├─ Validate: reviewText length (10-500) ✓
   │   ├─ Check: Not self-review (userA_id ≠ userB_id) ✓
   │   └─ Check: No duplicate review ✓
   │
   ▼
6. Model: Create new Review document
   │   {
   │     revieweeId: userB_id,
   │     reviewerId: userA_id,
   │     rating: 5,
   │     reviewText: "Great work!",
   │     reviewerRole: "tasker",
   │     createdAt: 2025-10-17T10:30:00Z
   │   }
   │
   ▼
7. Database: Insert into reviews collection
   │
   ▼
8. Background: Update User B's rating statistics
   │   ├─ Calculate new overall average
   │   ├─ Update distribution count
   │   └─ Cache in user document
   │
   ▼
9. Controller: Populate reviewer data
   │
   ▼
10. Response: Return formatted review with success message
    │   {
    │     success: true,
    │     data: { /* review object */ },
    │     message: "Review submitted successfully"
    │   }
    │
    ▼
11. Frontend: Show success message, refresh review list


═══════════════════════════════════════════════════════════════════════
                       VALIDATION FLOW
═══════════════════════════════════════════════════════════════════════

Input Validation Chain:

1. Schema Validation (Mongoose)
   └─ Field types, required, min/max values

2. Business Logic Validation (Controller)
   ├─ Rating: Must be 1-5
   ├─ Text: Must be 10-500 characters
   ├─ Self-review: reviewerId ≠ revieweeId
   └─ Duplicates: No existing review for same user+task

3. Authentication Validation (Middleware)
   ├─ JWT token present
   ├─ Token valid and not expired
   └─ User exists in database

4. Database Constraints
   └─ Unique compound index prevents duplicates


═══════════════════════════════════════════════════════════════════════
                    RATING CALCULATION FLOW
═══════════════════════════════════════════════════════════════════════

When new review is submitted:

1. Find all reviews for user: Review.find({ revieweeId: userId })

2. Calculate Overall Stats:
   ├─ Average = Sum(ratings) / Count
   ├─ Count = Total number of reviews
   └─ Distribution = Count of each rating (1-5)

3. Calculate Role-Based Stats:
   ├─ As Poster: Filter by reviewerRole === 'poster'
   └─ As Tasker: Filter by reviewerRole === 'tasker'

4. Update User Document:
   User.findByIdAndUpdate(userId, {
     rating: overall.average,
     ratingStats: { overall, asPoster, asTasker }
   })

5. Cache for Fast Retrieval:
   - Stats stored in user document
   - No need to recalculate on every request
   - Updated asynchronously after each new review


═══════════════════════════════════════════════════════════════════════
                      SECURITY LAYERS
═══════════════════════════════════════════════════════════════════════

Layer 1: Network Security
└─ HTTPS/TLS encryption (in production)

Layer 2: Authentication
├─ JWT token validation
└─ Token expiration checks

Layer 3: Authorization
├─ User must be logged in to submit reviews
└─ Users cannot review themselves

Layer 4: Input Validation
├─ Schema validation (Mongoose)
├─ Business logic validation (Controller)
└─ Sanitization (trim, escape)

Layer 5: Database Security
├─ MongoDB connection authentication
├─ Unique indexes prevent duplicates
└─ Mongoose parameterized queries prevent injection

Layer 6: Rate Limiting (Can be added)
└─ Prevent spam/abuse


═══════════════════════════════════════════════════════════════════════
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     Component Hierarchy                          │
└─────────────────────────────────────────────────────────────────┘

app.js
  │
  ├─── routes/userReviewRoutes.js
  │     │
  │     ├─── GET /users/:userId/rating-stats
  │     │      └─── userReviewController.getUserRatingStats()
  │     │
  │     ├─── GET /users/:userId/reviews
  │     │      └─── userReviewController.getUserReviews()
  │     │
  │     ├─── POST /users/:userId/reviews [protect]
  │     │      └─── userReviewController.submitUserReview()
  │     │
  │     ├─── GET /users/:userId/can-review [protect]
  │     │      └─── userReviewController.canReviewUser()
  │     │
  │     └─── POST /users/request-review [protect]
  │            └─── userReviewController.requestReview()
  │
  ├─── middleware/authMiddleware.js
  │     └─── protect() - JWT validation
  │
  └─── models/
        ├─── Review.js
        │     ├─── calculateUserRating()
        │     └─── updateUserRating()
        │
        └─── User.js
              └─── ratingStats subdocument
```

## Request/Response Flow Diagram

```
┌──────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
│ Frontend │────▶│  Routes  │────▶│ Middleware │────▶│Controller│
└──────────┘     └──────────┘     └────────────┘     └──────────┘
      ▲                                                      │
      │                                                      ▼
      │                                                ┌──────────┐
      │                                                │  Models  │
      │                                                └──────────┘
      │                                                      │
      │                                                      ▼
      │                                                ┌──────────┐
      └────────────────────────────────────────────────│ Database │
                                                       └──────────┘
```

---

**Legend:**
- `[protect]` - Requires JWT authentication
- `→` - Data flow direction
- `├─` - Has child components
- `└─` - Last child component

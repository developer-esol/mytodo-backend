# Quick Start Guide - Rating & Review System Testing

## 🚀 Getting Started

### 1. Install Dependencies (if not already installed)
```bash
npm install nodemailer twilio
```

### 2. Start the Server
```bash
npm run dev
```

The server should start on `http://localhost:5001`

---

## 🧪 Testing Options

### Option 1: Automated Test Script
Run the comprehensive test suite:
```bash
node test-rating-review-system.js
```

This will automatically:
- Connect to MongoDB
- Find test users
- Generate auth tokens
- Run 9 different test cases
- Display results with color-coded output

### Option 2: Manual API Testing (Postman/cURL)

#### Test 1: Get Rating Statistics (No Auth Required)
```bash
curl http://localhost:5001/api/users/USER_ID/rating-stats
```

#### Test 2: Get User Reviews (No Auth Required)
```bash
curl "http://localhost:5001/api/users/USER_ID/reviews?page=1&limit=10&populate=reviewer"
```

#### Test 3: Check Review Eligibility (Auth Required)
```bash
curl http://localhost:5001/api/users/USER_ID/can-review \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test 4: Submit a Review (Auth Required)
```bash
curl -X POST http://localhost:5001/api/users/USER_ID/reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "reviewText": "Excellent work! Very professional and completed the task on time."
  }'
```

#### Test 5: Request Review via Email (Auth Required)
```bash
curl -X POST http://localhost:5001/api/users/request-review \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "email",
    "recipient": "test@example.com",
    "message": "Please leave me a review!"
  }'
```

#### Test 6: Request Review via SMS (Auth Required)
```bash
curl -X POST http://localhost:5001/api/users/request-review \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "sms",
    "recipient": "+1234567890",
    "message": "Please leave me a review!"
  }'
```

---

## 🔑 Getting a JWT Token

### Method 1: Login via API
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

### Method 2: Use Existing Token from Frontend
1. Open browser DevTools
2. Go to Application → Local Storage
3. Copy the `token` value

---

## 📊 Expected Results

### ✅ Successful Review Submission
```json
{
  "success": true,
  "data": {
    "_id": "67123abc...",
    "reviewerId": {
      "_id": "user456",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://..."
    },
    "revieweeId": "user789",
    "rating": 5,
    "reviewText": "Excellent work! Very professional.",
    "reviewerRole": "tasker",
    "createdAt": "2025-10-17T10:30:00Z"
  },
  "message": "Review submitted successfully"
}
```

### ❌ Validation Errors
```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

```json
{
  "success": false,
  "message": "Review text must be at least 10 characters"
}
```

```json
{
  "success": false,
  "message": "You cannot review yourself"
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:** Make sure MongoDB is running
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### Issue: "User not found"
**Solution:** Replace `USER_ID` with actual user ID from your database
```bash
# Get user IDs from MongoDB
mongosh
use Airtasker
db.users.find({}, {_id: 1, firstName: 1, lastName: 1}).limit(5)
```

### Issue: "401 Unauthorized"
**Solution:** 
1. Make sure you're logged in
2. Check JWT token is not expired
3. Include correct Authorization header: `Bearer YOUR_TOKEN`

### Issue: "Email/SMS not sending"
**Solution:** 
1. Check `.env` file has correct credentials
2. Gmail: Enable "Less secure app access" or use App Password
3. Twilio: Verify account and phone number

---

## 📝 Test Checklist

Before marking as complete, verify:

- [ ] Server starts without errors
- [ ] Can get rating statistics (public endpoint)
- [ ] Can get reviews with pagination
- [ ] Can submit a review with auth token
- [ ] Cannot review yourself (validation works)
- [ ] Cannot use invalid rating (1-5 only)
- [ ] Cannot use short review text (min 10 chars)
- [ ] Can check review eligibility
- [ ] Can send email review request
- [ ] Can send SMS review request (optional)
- [ ] Admin panel shows updated rating fields
- [ ] Rating statistics update after new review

---

## 🎯 Next Steps

1. **Frontend Integration**: Update frontend to use new endpoints
2. **Migration**: If you have old reviews, run migration script
3. **Production Deploy**: Update environment variables for production
4. **Monitoring**: Set up logging and error tracking

---

## 📚 Documentation Files

- `RATING_REVIEW_IMPLEMENTATION_COMPLETE.md` - Complete implementation details
- `test-rating-review-system.js` - Automated test script
- `controllers/userReviewController.js` - Controller implementation
- `routes/userReviewRoutes.js` - Route definitions

---

## ✅ Success Criteria

Your implementation is working correctly if:

1. ✅ All 9 automated tests pass
2. ✅ You can submit a review manually via Postman/cURL
3. ✅ Rating statistics update after new review
4. ✅ Validation prevents invalid data
5. ✅ Email/SMS review requests work
6. ✅ No console errors in server logs

---

*Happy Testing! 🎉*

# 🚛 Moving Task Feature - Mobile App Implementation

## Overview
This feature adds moving-specific functionality to the task creation system, specifically designed for mobile app users. When users select "moving" as a task category on mobile, they can specify pickup and dropoff locations with postal codes.

## 🔧 Implementation Details

### 1. Database Schema Updates
**File**: `models/Task.js`

Added new fields to the Task schema:
```javascript
// Moving-specific fields for mobile app
isMovingTask: {type: Boolean, default: false},
movingDetails: {
  pickupLocation: {
    address: {type: String},
    postalCode: {type: String}
  },
  dropoffLocation: {
    address: {type: String},
    postalCode: {type: String}
  }
}
```

### 2. Controller Updates
**File**: `controllers/taskController.js`

Enhanced the `createTask` function to:
- Detect mobile app requests via User-Agent or X-Platform header
- Process moving-specific fields only for mobile clients
- Validate required moving fields when `isMovingTask` is true

#### Mobile Detection Logic:
```javascript
const userAgent = req.headers['user-agent'] || '';
const isMobileApp = userAgent.includes('MyToDoo-Mobile') || 
                   userAgent.includes('Expo') || 
                   req.headers['x-platform'] === 'mobile';
```

#### Moving Task Validation:
```javascript
if (isMobileApp && isMovingTask) {
  if (!pickupLocation) missingFields.push("pickupLocation");
  if (!pickupPostalCode) missingFields.push("pickupPostalCode");
  if (!dropoffLocation) missingFields.push("dropoffLocation");
  if (!dropoffPostalCode) missingFields.push("dropoffPostalCode");
}
```

### 3. API Integration

#### Request Format (Mobile Only)
```http
POST /api/tasks
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
  User-Agent: MyToDoo-Mobile/1.0.0
  X-Platform: mobile

Body:
{
  "title": "Moving couch from apartment to new house",
  "category": "moving",
  "dateType": "DoneBy",
  "date": "2025-10-20",
  "time": "morning",
  "location": "General moving service",
  "details": "Need help moving furniture",
  "budget": 150,
  "currency": "USD",
  "isMovingTask": true,
  "pickupLocation": "Downtown Apartment Complex",
  "pickupPostalCode": "12345",
  "dropoffLocation": "Suburban House",
  "dropoffPostalCode": "67890"
}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "_id": "68f0acd369e9b1609976899c",
    "title": "Moving couch from apartment to new house",
    "isMovingTask": true,
    "movingDetails": {
      "pickupLocation": {
        "address": "Downtown Apartment Complex",
        "postalCode": "12345"
      },
      "dropoffLocation": {
        "address": "Suburban House",
        "postalCode": "67890"
      }
    },
    // ... other task fields
  }
}
```

## 📱 Mobile App Integration

### Frontend Implementation
The mobile app should:

1. **Detect Moving Category**: When user selects "moving" option
2. **Show Moving UI**: Display pickup and dropoff location fields
3. **Set Headers**: Include mobile identification headers
4. **Send Extra Fields**: Include moving-specific data in request

### Example Mobile Request Code:
```javascript
const createMovingTask = async (taskData) => {
  const requestData = {
    ...taskData,
    isMovingTask: true,
    pickupLocation: taskData.pickupLocation,
    pickupPostalCode: taskData.pickupPostalCode,
    dropoffLocation: taskData.dropoffLocation,
    dropoffPostalCode: taskData.dropoffPostalCode
  };

  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'MyToDoo-Mobile/1.0.0',
      'X-Platform': 'mobile'
    },
    body: JSON.stringify(requestData)
  });

  return response.json();
};
```

## 🔒 Security & Validation

### Platform Restriction
- Moving task fields are only processed for mobile app requests
- Web requests ignore moving-specific fields for security
- User-Agent and X-Platform headers are used for detection

### Validation Rules
- `pickupLocation`: Required string when `isMovingTask` is true
- `pickupPostalCode`: Required string when `isMovingTask` is true  
- `dropoffLocation`: Required string when `isMovingTask` is true
- `dropoffPostalCode`: Required string when `isMovingTask` is true

## 🧪 Testing

### Test Script
Run `test-moving-minimal.js` to verify functionality:
```bash
node test-moving-minimal.js
```

### Manual Testing
1. **Mobile Moving Task**: Send request with mobile headers and moving fields
2. **Mobile Normal Task**: Send request with mobile headers but no moving fields
3. **Web Moving Task**: Send request without mobile headers (moving fields ignored)

## 📊 Database Storage

Moving tasks are stored with the following structure:
```json
{
  "_id": "ObjectId",
  "title": "Moving couch",
  "isMovingTask": true,
  "movingDetails": {
    "pickupLocation": {
      "address": "123 Main St",
      "postalCode": "12345"
    },
    "dropoffLocation": {
      "address": "456 Oak Ave", 
      "postalCode": "67890"
    }
  },
  // ... standard task fields
}
```

## 🔄 Backward Compatibility

- Existing tasks remain unaffected (`isMovingTask` defaults to `false`)
- Web interface continues to work normally
- API maintains all existing functionality
- No breaking changes to current mobile app flows

## 🚀 Usage Examples

### Scenario 1: Moving Furniture
```json
{
  "title": "Move 3-seater sofa",
  "category": "moving",
  "isMovingTask": true,
  "pickupLocation": "Apartment 3B, Green Valley Complex",
  "pickupPostalCode": "10001",
  "dropoffLocation": "House 42, Maple Street",
  "dropoffPostalCode": "10002"
}
```

### Scenario 2: Office Relocation
```json
{
  "title": "Office desk and chair relocation",
  "category": "moving", 
  "isMovingTask": true,
  "pickupLocation": "5th Floor, Corporate Tower",
  "pickupPostalCode": "20001",
  "dropoffLocation": "2nd Floor, Business Plaza",
  "dropoffPostalCode": "20002"
}
```

## 📋 Implementation Checklist

- ✅ Updated Task model with moving fields
- ✅ Enhanced task creation controller
- ✅ Added mobile platform detection
- ✅ Implemented validation for moving fields
- ✅ Created comprehensive tests
- ✅ Maintained backward compatibility
- ✅ Added proper error handling
- ✅ Documented API usage

## 🎯 Key Benefits

1. **Mobile-First**: Designed specifically for mobile app UX
2. **Location Specific**: Captures exact pickup/dropoff addresses
3. **Postal Code Support**: Enables precise location identification
4. **Platform Aware**: Only activates for mobile requests
5. **Scalable**: Easy to extend with additional moving-specific fields
6. **Secure**: Validates all inputs and restricts feature access

This implementation provides a robust foundation for moving task functionality while maintaining the integrity and compatibility of the existing system.
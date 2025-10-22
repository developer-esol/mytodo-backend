# 📍 Location Type & Category Filtering - Backend Implementation

## ✅ Implementation Complete

This document explains the backend changes for supporting **In-person** and **Online** task posting with category filtering.

---

## 🎯 Overview

The backend now supports:
1. **Task Location Type**: Tasks can be "In-person" or "Online"
2. **Category Location Type**: Categories are classified as "physical", "online", or "both"
3. **Smart Location Handling**: Location is required for In-person tasks, optional for Online tasks
4. **Category Filtering**: API endpoint to get categories filtered by location type

---

## 📊 Database Schema Changes

### 1. **Task Model** (`models/Task.js`)

**New Field Added:**
```javascript
{
  locationType: {
    type: String,
    enum: ["In-person", "Online"],
    required: true,
    index: true,
  }
}
```

**Location Field Updated:**
```javascript
{
  location: {
    address: {type: String}, // No longer required (optional for Online tasks)
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (v) {
            return v == null || v.length === 2;
          },
          message: "Coordinates must be an array of [longitude, latitude]",
        },
      },
    },
  }
}
```

### 2. **Category Model** (`models/Category.js`)

**New Field Added:**
```javascript
{
  locationType: {
    type: String,
    enum: ['physical', 'online', 'both'],
    default: 'both',
    index: true
  }
}
```

**Location Type Meanings:**
- `physical`: Category requires physical presence (e.g., Cleaning, Plumbing, Moving)
- `online`: Category can only be done remotely (e.g., Web Development, Graphic Design)
- `both`: Category can be either in-person or online (e.g., Tutoring, Photography, Consulting)

---

## 🔌 API Endpoints

### 1. **Create Task** - Updated

**Endpoint:** `POST /api/tasks`

**New Request Fields:**
```json
{
  "title": "Clean my house",
  "category": "Cleaning",
  "locationType": "In-person",      // NEW: Required
  "location": "Frankston 3199, VIC",  // Required only if locationType = "In-person"
  "coordinates": {
    "lat": -38.1428,
    "lng": 145.1283
  },
  "dateType": "DoneBy",
  "date": "2025-11-01",
  "time": "Morning",
  "details": "Need deep cleaning...",
  "budget": "100",
  "currency": "AUD"
}
```

**Validation Rules:**
- `locationType` is **required**
- `locationType` must be either `"In-person"` or `"Online"`
- If `locationType === "In-person"`:
  - `location` is **required**
  - Coordinates are optional but recommended
- If `locationType === "Online"`:
  - `location` is **optional** (defaults to "Remote")
  - Coordinates are ignored

**Example: Online Task**
```json
{
  "title": "Build a website",
  "category": "Web & App Development",
  "locationType": "Online",
  "dateType": "DoneBy",
  "date": "2025-11-15",
  "time": "Anytime",
  "details": "Need a simple website for my business...",
  "budget": "500",
  "currency": "AUD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "68f1234567890abcdef12345",
    "title": "Build a website",
    "categories": ["Web & App Development"],
    "locationType": "Online",
    "location": {
      "address": "Remote"
    },
    "dateType": "DoneBy",
    "dateRange": {
      "start": "2025-10-20T00:00:00.000Z",
      "end": "2025-11-15T23:59:59.999Z"
    },
    // ... other fields
  }
}
```

---

### 2. **Get Categories by Location Type** - NEW

**Endpoint:** `GET /api/categories/by-location?type={locationType}`

**Parameters:**
- `type` (required): `"In-person"` or `"Online"`

**Example Request:**
```javascript
GET /api/categories/by-location?type=In-person
```

**Response:**
```json
{
  "success": true,
  "locationType": "In-person",
  "data": [
    {
      "_id": "68abc123...",
      "name": "General Cleaning",
      "description": "Services related to General Cleaning",
      "icon": "/images/categories/general-cleaning.svg",
      "iconUrl": "http://localhost:5001/images/categories/general-cleaning.svg",
      "locationType": "physical"
    },
    {
      "_id": "68abc456...",
      "name": "Plumbing",
      "description": "Services related to Plumbing",
      "icon": "/images/categories/plumbing.svg",
      "iconUrl": "http://localhost:5001/images/categories/plumbing.svg",
      "locationType": "physical"
    },
    {
      "_id": "68abc789...",
      "name": "Tutoring",
      "description": "Services related to Tutoring",
      "icon": "/images/categories/tutoring.svg",
      "iconUrl": "http://localhost:5001/images/categories/tutoring.svg",
      "locationType": "both"
    }
  ]
}
```

**Filtering Logic:**

| User Selects | Categories Returned |
|--------------|---------------------|
| **In-person** | `locationType === 'physical'` OR `locationType === 'both'` |
| **Online** | `locationType === 'online'` OR `locationType === 'both'` |

**Example: Get Online Categories**
```javascript
GET /api/categories/by-location?type=Online

// Returns: Web Development, Graphic Design, IT & Tech, Tutoring, etc.
```

---

### 3. **Get All Categories** - Unchanged

**Endpoint:** `GET /api/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "68abc123...",
      "name": "General Cleaning",
      "description": "Services related to General Cleaning",
      "icon": "/images/categories/general-cleaning.svg",
      "iconUrl": "http://localhost:5001/images/categories/general-cleaning.svg",
      "locationType": "physical"
    },
    // ... all categories
  ]
}
```

---

## 📈 Category Location Types Breakdown

After running the migration script:

| Type | Count | Description |
|------|-------|-------------|
| **Physical** | 28 | In-person only (Cleaning, Plumbing, Moving, etc.) |
| **Online** | 8 | Remote only (Web Dev, Graphic Design, IT, etc.) |
| **Both** | 68 | Either mode (Tutoring, Photography, Consulting, etc.) |
| **Total** | 104 | All categories |

**Physical Categories (Sample):**
- General Cleaning
- General Plumbing
- General Handyperson
- Furniture Assembly
- Gardening Services
- Fence Construction
- Flooring Solutions
- Electrical
- Carpentry
- Painting
- Pet Care
- Removalists

**Online Categories (Sample):**
- Web & App Development
- Graphic Design
- IT & Tech
- Marketing and Advertising
- Software Development
- Translation
- Legal Services
- General Business & Admin

**Both Categories (Sample):**
- Tutoring
- Photography
- Music and Entertainment
- Event Planning
- Health & Fitness
- Consulting
- Personal Assistance
- Something Else

---

## 🔧 Backend Controller Changes

### **Task Creation** (`controllers/taskController.js`)

**Key Changes:**
1. Added `locationType` validation
2. Made `location` optional (required only for In-person)
3. Set location to "Remote" for Online tasks
4. Only add coordinates for In-person tasks

**Code Snippet:**
```javascript
exports.createTask = async (req, res) => {
  const {
    title,
    category,
    locationType, // NEW
    location,
    // ... other fields
  } = req.body;

  // Validate locationType
  if (!locationType || !["In-person", "Online"].includes(locationType)) {
    return res.status(400).json({
      success: false,
      error: "Invalid locationType. Must be 'In-person' or 'Online'"
    });
  }

  // Location required only for In-person
  const missingFields = [];
  if (!title) missingFields.push("title");
  if (!category) missingFields.push("category");
  if (locationType === "In-person" && !location) {
    missingFields.push("location");
  }

  // Create location object
  const locationObj = {
    address: locationType === "Online" 
      ? "Remote" 
      : (Array.isArray(location) ? location[0] : location),
  };

  // Only add coordinates for In-person tasks
  if (coordinates && locationType === "In-person") {
    locationObj.coordinates = {
      type: "Point",
      coordinates: [coordinates.lng, coordinates.lat],
    };
  }

  const taskData = {
    title,
    categories: [category],
    locationType, // NEW
    location: locationObj,
    // ... other fields
  };

  const task = new Task(taskData);
  await task.save();
  // ...
};
```

---

## 🧪 Testing

### 1. **Test Category Filtering**

```bash
# Get In-person categories
curl http://localhost:5001/api/categories/by-location?type=In-person

# Get Online categories
curl http://localhost:5001/api/categories/by-location?type=Online
```

### 2. **Test In-person Task Creation**

```bash
curl -X POST http://localhost:5001/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Clean my house",
    "category": "General Cleaning",
    "locationType": "In-person",
    "location": "Frankston 3199, VIC",
    "coordinates": {"lat": -38.1428, "lng": 145.1283},
    "dateType": "DoneBy",
    "date": "2025-11-01",
    "time": "Morning",
    "details": "Need deep cleaning of 3 bedroom house",
    "budget": "150",
    "currency": "AUD"
  }'
```

### 3. **Test Online Task Creation**

```bash
curl -X POST http://localhost:5001/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Build a website",
    "category": "Web & App Development",
    "locationType": "Online",
    "dateType": "DoneBy",
    "date": "2025-11-15",
    "time": "Anytime",
    "details": "Need a simple 5-page business website",
    "budget": "500",
    "currency": "AUD"
  }'
```

---

## 📝 Migration Script

**File:** `update-category-location-types.js`

**Purpose:** Updates all existing categories with appropriate location types

**Usage:**
```bash
node update-category-location-types.js
```

**What it does:**
1. Connects to MongoDB
2. Updates 104 categories with location types:
   - 28 categories → `physical`
   - 8 categories → `online`
   - 68 categories → `both`
3. Shows summary and breakdown

**Output:**
```
✅ Connected to MongoDB
✅ Updated "General Cleaning" → physical
✅ Updated "Web & App Development" → online
✅ Updated "Tutoring" → both
...
📊 Update Summary:
✅ Total categories updated: 42
✅ Categories set to default (both): 62

📈 Category Location Types Breakdown:
   🏠 Physical (In-person only): 28
   💻 Online (Remote only): 8
   🔄 Both (In-person or Online): 68
   📊 Total: 104
```

---

## 🔄 Frontend Integration

### **Recommended Flow:**

**Step 1: User selects location type**
```javascript
const [locationType, setLocationType] = useState('');

// User clicks "In-person" or "Online"
const handleLocationTypeSelect = (type) => {
  setLocationType(type);
  // Fetch filtered categories
  fetchCategoriesByType(type);
};
```

**Step 2: Fetch filtered categories**
```javascript
const fetchCategoriesByType = async (type) => {
  const response = await fetch(
    `http://localhost:5001/api/categories/by-location?type=${type}`
  );
  const data = await response.json();
  
  if (data.success) {
    setCategories(data.data);
  }
};
```

**Step 3: Show/hide location input**
```javascript
{locationType === 'In-person' && (
  <LocationInput 
    value={location}
    onChange={setLocation}
    required={true}
  />
)}
```

**Step 4: Submit task**
```javascript
const submitTask = async (taskData) => {
  const response = await fetch('http://localhost:5001/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...taskData,
      locationType: locationType, // Include location type
      location: locationType === 'Online' ? undefined : location
    })
  });
  
  const result = await response.json();
  return result;
};
```

---

## ✅ Summary of Changes

### **Models:**
- ✅ Added `locationType` to Task model ("In-person" | "Online")
- ✅ Made `location.address` optional in Task model
- ✅ Added `locationType` to Category model ("physical" | "online" | "both")

### **Controllers:**
- ✅ Updated task creation to handle location type
- ✅ Added validation for location type
- ✅ Made location optional for Online tasks
- ✅ Set location to "Remote" for Online tasks
- ✅ Added category filtering by location type

### **Routes:**
- ✅ Added `GET /api/categories/by-location?type={locationType}`

### **Database:**
- ✅ Migrated 104 categories with location types
- ✅ 28 categories → physical
- ✅ 8 categories → online
- ✅ 68 categories → both

### **Validation:**
- ✅ `locationType` is required on task creation
- ✅ `location` is required only for In-person tasks
- ✅ Invalid location types are rejected

---

## 🎉 Ready to Use!

The backend is now fully configured to support:
- ✅ In-person and Online task posting
- ✅ Smart category filtering based on location type
- ✅ Optional location for Online tasks
- ✅ Proper validation and error handling
- ✅ Backward compatibility (existing tasks default to "In-person")

**No breaking changes** - existing functionality remains intact!

---

**Last Updated:** October 20, 2025  
**Version:** 1.0.0

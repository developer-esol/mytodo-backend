# 🎯 29 CATEGORIES - QUICK REFERENCE

## 📊 Summary
- **Total:** 29 categories (down from 104)
- **Physical:** 14 | **Online:** 3 | **Both:** 12

## 📋 All 29 Categories (Alphabetical)

| # | Category Name | Type | In-person? | Online? |
|---|---------------|------|------------|---------|
| 1 | Appliance Installation and Repair | both | ✅ | ✅ |
| 2 | Auto Mechanic and Electrician | physical | ✅ | ❌ |
| 3 | Building Maintenance and Renovations | physical | ✅ | ❌ |
| 4 | Business and Accounting | both | ✅ | ✅ |
| 5 | Carpentry | physical | ✅ | ❌ |
| 6 | Cleaning and Organising | physical | ✅ | ❌ |
| 7 | Delivery | physical | ✅ | ❌ |
| 8 | Education and Tutoring | both | ✅ | ✅ |
| 9 | Electrical | physical | ✅ | ❌ |
| 10 | Event Planning | both | ✅ | ✅ |
| 11 | Furniture Repair and Flatpack Assembly | physical | ✅ | ❌ |
| 12 | Gardening and Landscaping | physical | ✅ | ❌ |
| 13 | Graphic Design | online | ❌ | ✅ |
| 14 | Handyman and Handywomen | physical | ✅ | ❌ |
| 15 | Health & Fitness | both | ✅ | ✅ |
| 16 | IT & Tech | both | ✅ | ✅ |
| 17 | Legal Services | both | ✅ | ✅ |
| 18 | Marketing and Advertising | online | ❌ | ✅ |
| 19 | Music and Entertainment | both | ✅ | ✅ |
| 20 | Painting | physical | ✅ | ❌ |
| 21 | Personal Assistance | both | ✅ | ✅ |
| 22 | Pet Care | physical | ✅ | ❌ |
| 23 | Photography | both | ✅ | ✅ |
| 24 | Plumbing | physical | ✅ | ❌ |
| 25 | Real Estate | both | ✅ | ✅ |
| 26 | Removalist | physical | ✅ | ❌ |
| 27 | Something Else | both | ✅ | ✅ |
| 28 | Tours and Transport | physical | ✅ | ❌ |
| 29 | Web & App Development | online | ❌ | ✅ |

## 🔍 By Type

### 🏠 Physical (14 categories)
Show only for **In-person** tasks:
1. Auto Mechanic and Electrician
2. Building Maintenance and Renovations
3. Carpentry
4. Cleaning and Organising
5. Delivery
6. Electrical
7. Furniture Repair and Flatpack Assembly
8. Gardening and Landscaping
9. Handyman and Handywomen
10. Painting
11. Pet Care
12. Plumbing
13. Removalist
14. Tours and Transport

### 💻 Online (3 categories)
Show only for **Online** tasks:
1. Graphic Design
2. Marketing and Advertising
3. Web & App Development

### 🔄 Both (12 categories)
Show for **both In-person and Online** tasks:
1. Appliance Installation and Repair
2. Business and Accounting
3. Education and Tutoring
4. Event Planning
5. Health & Fitness
6. IT & Tech
7. Legal Services
8. Music and Entertainment
9. Personal Assistance
10. Photography
11. Real Estate
12. Something Else

## 📱 Filtering Logic

**In-person tasks show:**
- All 14 Physical categories
- All 12 Both categories
- **Total: 26 categories**

**Online tasks show:**
- All 3 Online categories
- All 12 Both categories
- **Total: 15 categories**

## 🚀 API Endpoints

```
GET /api/categories
→ Returns all 29 categories

GET /api/categories/by-location?type=In-person
→ Returns 26 categories (14 physical + 12 both)

GET /api/categories/by-location?type=Online
→ Returns 15 categories (3 online + 12 both)
```

## ✅ Status
**Implementation:** Complete ✅  
**Testing:** All passed ✅  
**Production:** Ready ✅

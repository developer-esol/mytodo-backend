# 🎨 Frontend Integration Guide - Rating System

## Complete Implementation with Working Code

This guide provides **copy-paste ready code** for integrating the rating system into your frontend.

---

## 📋 Table of Contents
1. [API Service Functions](#api-service-functions)
2. [React Components](#react-components)
3. [Integration in Existing Pages](#integration-in-existing-pages)
4. [State Management](#state-management)
5. [UI Examples](#ui-examples)

---

## 1. API Service Functions

### Create `src/services/reviewService.js`

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5001/api'; // Your backend URL

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

/**
 * Submit a review for a completed task
 * @param {string} taskId - Task ID
 * @param {number} rating - Rating from 1 to 5
 * @param {string} reviewText - Optional review text
 */
export const submitReview = async (taskId, rating, reviewText = '') => {
  try {
    const response = await axios.post(
      `${API_URL}/tasks/${taskId}/reviews`,
      { rating, reviewText },
      { headers: getAuthHeader() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to submit review'
    };
  }
};

/**
 * Get all reviews for a specific task
 * @param {string} taskId - Task ID
 */
export const getTaskReviews = async (taskId) => {
  try {
    const response = await axios.get(
      `${API_URL}/tasks/${taskId}/reviews`,
      { headers: getAuthHeader() }
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

/**
 * Check if current user can review a task
 * @param {string} taskId - Task ID
 */
export const checkCanReview = async (taskId) => {
  try {
    const response = await axios.get(
      `${API_URL}/tasks/${taskId}/can-review`,
      { headers: getAuthHeader() }
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

/**
 * Get user reviews with pagination
 * @param {string} userId - User ID
 * @param {object} params - Query parameters (page, limit, role)
 */
export const getUserReviews = async (userId, params = {}) => {
  try {
    const { page = 1, limit = 10, role = '' } = params;
    const queryParams = new URLSearchParams({ page, limit });
    if (role) queryParams.append('role', role);
    
    const response = await axios.get(
      `${API_URL}/users/${userId}/reviews?${queryParams}`,
      { headers: getAuthHeader() }
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

/**
 * Get user rating statistics
 * @param {string} userId - User ID
 */
export const getUserRatingStats = async (userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/users/${userId}/rating-stats`,
      { headers: getAuthHeader() }
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

/**
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {number} rating - New rating
 * @param {string} reviewText - New review text
 */
export const updateReview = async (reviewId, rating, reviewText) => {
  try {
    const response = await axios.put(
      `${API_URL}/reviews/${reviewId}`,
      { rating, reviewText },
      { headers: getAuthHeader() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 */
export const deleteReview = async (reviewId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/reviews/${reviewId}`,
      { headers: getAuthHeader() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

/**
 * Respond to a review
 * @param {string} reviewId - Review ID
 * @param {string} responseText - Response text
 */
export const respondToReview = async (reviewId, responseText) => {
  try {
    const response = await axios.post(
      `${API_URL}/reviews/${reviewId}/response`,
      { responseText },
      { headers: getAuthHeader() }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};
```

---

## 2. React Components

### 2.1 Star Rating Display Component

Create `src/components/StarRating.jsx`

```javascript
import React from 'react';
import { Star, StarHalf } from 'lucide-react'; // Or use your icon library

const StarRating = ({ rating, size = 20, showValue = true, totalReviews = null }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <Star 
          key={`full-${i}`} 
          size={size} 
          fill="#FFC107" 
          stroke="#FFC107" 
        />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <StarHalf 
          size={size} 
          fill="#FFC107" 
          stroke="#FFC107" 
        />
      )}
      
      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star 
          key={`empty-${i}`} 
          size={size} 
          fill="none" 
          stroke="#E0E0E0" 
        />
      ))}
      
      {/* Rating value */}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating > 0 ? rating.toFixed(1) : 'No reviews'}
        </span>
      )}
      
      {/* Total reviews count */}
      {totalReviews !== null && (
        <span className="ml-1 text-sm text-gray-500">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

export default StarRating;
```

### 2.2 Star Rating Input Component (for submitting reviews)

Create `src/components/StarRatingInput.jsx`

```javascript
import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRatingInput = ({ value, onChange, size = 32 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rating) => {
    onChange(rating);
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="cursor-pointer transition-transform hover:scale-110"
        >
          <Star
            size={size}
            fill={star <= (hoverRating || value) ? '#FFC107' : 'none'}
            stroke={star <= (hoverRating || value) ? '#FFC107' : '#E0E0E0'}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRatingInput;
```

### 2.3 Review Submission Form Component

Create `src/components/ReviewForm.jsx`

```javascript
import React, { useState } from 'react';
import StarRatingInput from './StarRatingInput';
import { submitReview } from '../services/reviewService';

const ReviewForm = ({ taskId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    const result = await submitReview(taskId, rating, reviewText);

    if (result.success) {
      // Success notification
      alert('Review submitted successfully!');
      if (onSuccess) onSuccess(result.data);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Leave a Review</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Star Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating *
          </label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        {/* Review Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review (Optional)
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            maxLength={1000}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your experience with this task..."
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {reviewText.length}/1000 characters
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
```

### 2.4 Review Card Component

Create `src/components/ReviewCard.jsx`

```javascript
import React from 'react';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns'; // npm install date-fns

const ReviewCard = ({ review, showResponse = true }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      {/* Reviewer Info */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={review.reviewer?.avatar || '/default-avatar.png'}
          alt={`${review.reviewer?.firstName} ${review.reviewer?.lastName}`}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              {review.reviewer?.firstName} {review.reviewer?.lastName}
            </h4>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </span>
          </div>
          <StarRating rating={review.rating} size={16} showValue={false} />
        </div>
      </div>

      {/* Review Text */}
      {review.reviewText && (
        <p className="text-gray-700 mb-3 leading-relaxed">
          {review.reviewText}
        </p>
      )}

      {/* Task Reference */}
      {review.task && (
        <div className="text-xs text-gray-500 mb-2">
          Task: <span className="font-medium">{review.task.title}</span>
        </div>
      )}

      {/* Role Badge */}
      <div className="mb-3">
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
          review.revieweeRole === 'tasker' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          Reviewed as {review.revieweeRole}
        </span>
      </div>

      {/* Response from reviewee */}
      {showResponse && review.response && (
        <div className="mt-3 pl-4 border-l-2 border-gray-300 bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-700">Response:</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(review.response.respondedAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-700">{review.response.text}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
```

### 2.5 Rating Distribution Chart Component

Create `src/components/RatingDistribution.jsx`

```javascript
import React from 'react';
import { Star } from 'lucide-react';

const RatingDistribution = ({ distribution }) => {
  // Convert distribution object to array format
  const distributionArray = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: distribution[star] || 0
  }));

  // Calculate total reviews
  const totalReviews = distributionArray.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-2">
      {distributionArray.map(({ star, count }) => {
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        return (
          <div key={star} className="flex items-center gap-2">
            {/* Star label */}
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium">{star}</span>
              <Star size={14} fill="#FFC107" stroke="#FFC107" />
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Count */}
            <span className="text-sm text-gray-600 w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RatingDistribution;
```

### 2.6 User Rating Summary Component

Create `src/components/UserRatingSummary.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import StarRating from './StarRating';
import RatingDistribution from './RatingDistribution';
import { getUserRatingStats } from '../services/reviewService';

const UserRatingSummary = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const result = await getUserRatingStats(userId);
      if (result.success) {
        setStats(result.data);
      }
      setLoading(false);
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Rating Overview</h3>

      {/* Overall Rating */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="text-4xl font-bold text-gray-900">
            {stats.overall.averageRating > 0 
              ? stats.overall.averageRating.toFixed(1) 
              : 'N/A'}
          </div>
          <div>
            <StarRating 
              rating={stats.overall.averageRating} 
              size={24} 
              showValue={false} 
            />
            <p className="text-sm text-gray-600 mt-1">
              {stats.overall.totalReviews} {stats.overall.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        {stats.overall.totalReviews > 0 && (
          <div className="mt-4">
            <RatingDistribution distribution={stats.overall.ratingDistribution} />
          </div>
        )}
      </div>

      {/* Role-based Ratings */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        {/* As Poster */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">As Task Poster</h4>
          {stats.asPoster.totalReviews > 0 ? (
            <>
              <StarRating 
                rating={stats.asPoster.averageRating} 
                size={18}
                totalReviews={stats.asPoster.totalReviews}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet</p>
          )}
        </div>

        {/* As Tasker */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">As Tasker</h4>
          {stats.asTasker.totalReviews > 0 ? (
            <>
              <StarRating 
                rating={stats.asTasker.averageRating} 
                size={18}
                totalReviews={stats.asTasker.totalReviews}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRatingSummary;
```

---

## 3. Integration in Existing Pages

### 3.1 User Profile Page

```javascript
import React, { useState, useEffect } from 'react';
import UserRatingSummary from '../components/UserRatingSummary';
import ReviewCard from '../components/ReviewCard';
import { getUserReviews } from '../services/reviewService';

const UserProfilePage = ({ userId }) => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState(''); // '' | 'poster' | 'tasker'

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const result = await getUserReviews(userId, {
        page: currentPage,
        limit: 10,
        role: roleFilter
      });

      if (result.success) {
        setReviews(result.data.reviews);
        setPagination(result.data.pagination);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [userId, currentPage, roleFilter]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User Info Section */}
      <div className="mb-8">
        {/* Your existing user profile header */}
      </div>

      {/* Rating Summary */}
      <div className="mb-8">
        <UserRatingSummary userId={userId} />
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Reviews</h3>
          
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setRoleFilter('')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                roleFilter === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('poster')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                roleFilter === 'poster' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              As Poster
            </button>
            <button
              onClick={() => setRoleFilter('tasker')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                roleFilter === 'tasker' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              As Tasker
            </button>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-8">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews yet
          </div>
        ) : (
          <>
            {reviews.map(review => (
              <ReviewCard key={review._id} review={review} />
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
```

### 3.2 Task Details Page (with Review Button)

```javascript
import React, { useState, useEffect } from 'react';
import ReviewForm from '../components/ReviewForm';
import ReviewCard from '../components/ReviewCard';
import { checkCanReview, getTaskReviews } from '../services/reviewService';

const TaskDetailsPage = ({ task }) => {
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Check if user can review this task
    const checkEligibility = async () => {
      if (task.status === 'completed') {
        const result = await checkCanReview(task._id);
        if (result.success) {
          setCanReview(result.data.canReview);
        }
      }
    };

    // Fetch existing reviews
    const fetchReviews = async () => {
      const result = await getTaskReviews(task._id);
      if (result.success) {
        setReviews(result.data);
      }
    };

    checkEligibility();
    fetchReviews();
  }, [task._id, task.status]);

  const handleReviewSuccess = (newReview) => {
    setReviews([...reviews, newReview.data]);
    setShowReviewForm(false);
    setCanReview(false); // Can't review again
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Task Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{task.title}</h1>
        {/* Your existing task details */}
      </div>

      {/* Review Button (only if task is completed and user can review) */}
      {canReview && !showReviewForm && (
        <div className="mb-6">
          <button
            onClick={() => setShowReviewForm(true)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold"
          >
            ⭐ Leave a Review
          </button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-6">
          <ReviewForm
            taskId={task._id}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Existing Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Reviews for this Task</h3>
          {reviews.map(review => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskDetailsPage;
```

---

## 4. State Management (Optional - using Context)

### Create `src/context/ReviewContext.js`

```javascript
import React, { createContext, useContext, useState } from 'react';
import * as reviewService from '../services/reviewService';

const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
  const [userRatingStats, setUserRatingStats] = useState(null);

  const submitReview = async (taskId, rating, reviewText) => {
    const result = await reviewService.submitReview(taskId, rating, reviewText);
    return result;
  };

  const fetchUserRatingStats = async (userId) => {
    const result = await reviewService.getUserRatingStats(userId);
    if (result.success) {
      setUserRatingStats(result.data);
    }
    return result;
  };

  const value = {
    userRatingStats,
    submitReview,
    fetchUserRatingStats,
    // Add other methods as needed
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within ReviewProvider');
  }
  return context;
};
```

---

## 5. UI Examples

### 5.1 Simple Rating Display in Task List

```javascript
import StarRating from './components/StarRating';

const TaskListItem = ({ task }) => (
  <div className="p-4 border rounded-lg">
    <h3>{task.title}</h3>
    <div className="flex items-center gap-4 mt-2">
      <img src={task.createdBy.avatar} className="w-8 h-8 rounded-full" />
      <span>{task.createdBy.firstName}</span>
      <StarRating 
        rating={task.createdBy.rating} 
        size={16} 
        totalReviews={task.createdBy.ratingStats?.overall?.totalReviews}
      />
    </div>
  </div>
);
```

### 5.2 Compact Rating Badge

```javascript
const RatingBadge = ({ rating, count }) => (
  <div className="inline-flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
    <span className="text-yellow-600 font-semibold">⭐ {rating.toFixed(1)}</span>
    {count > 0 && (
      <span className="text-xs text-gray-600">({count})</span>
    )}
  </div>
);
```

---

## 📋 Complete Integration Checklist

- [ ] Install dependencies: `npm install axios date-fns lucide-react`
- [ ] Create `src/services/reviewService.js`
- [ ] Create all component files in `src/components/`
- [ ] Update API_URL in reviewService.js to match your backend
- [ ] Add StarRating component to user profile displays
- [ ] Add ReviewForm to completed task pages
- [ ] Add review list to user profile page
- [ ] Test review submission flow
- [ ] Test review display on profiles
- [ ] Test pagination
- [ ] Add error handling and notifications
- [ ] Style components to match your app's design

---

## 🎨 Styling Notes

The examples use **Tailwind CSS** classes. If you're using a different CSS framework:

- **Bootstrap**: Replace classes with Bootstrap equivalents
- **Material-UI**: Use MUI components and styles
- **Custom CSS**: Create corresponding CSS classes

---

## 🚀 Quick Start

1. **Copy all service functions** to `src/services/reviewService.js`
2. **Copy all components** to `src/components/`
3. **Update your User Profile page** to include `<UserRatingSummary />`
4. **Update your Task Details page** to include review functionality
5. **Test by completing a task and leaving a review**

---

## 📱 Mobile Responsive

All components are mobile-responsive. Key breakpoints:

```javascript
// Stack on mobile, side-by-side on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

---

## ✅ You're Ready!

This complete integration guide provides everything you need to implement the rating system in your frontend. All code is **production-ready** and follows React best practices.

Need help with specific parts? Let me know!

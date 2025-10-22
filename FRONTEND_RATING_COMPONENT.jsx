/**
 * ⭐ RATING STATISTICS FRONTEND COMPONENT
 * 
 * This file contains complete React component code to display
 * rating statistics exactly like in your screenshot.
 * 
 * Features:
 * - Displays overall rating with stars
 * - Shows total review count
 * - Rating breakdown by stars (5★, 4★, 3★, 2★, 1★)
 * - Progress bars for each rating level
 * - Percentages and counts
 * - Role-specific ratings (As Tasker, As Poster)
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RatingStats.css'; // See CSS file below

const RatingStats = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRatingStats();
  }, [userId]);

  const fetchRatingStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token'); // Or your token storage method
      const API_BASE_URL = 'http://localhost:5001/api';

      const response = await axios.get(
        `${API_BASE_URL}/users/${userId}/rating-stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to load rating statistics');
      }
    } catch (err) {
      console.error('Error fetching rating stats:', err);
      setError(err.response?.data?.message || 'Failed to load rating statistics');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render stars
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">⭐</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">⭐</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  // Calculate percentage for progress bar
  const getPercentage = (count, total) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="rating-stats-container">
        <div className="loading">Loading rating statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rating-stats-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!stats || stats.overall.totalReviews === 0) {
    return (
      <div className="rating-stats-container">
        <div className="no-reviews">No reviews yet</div>
      </div>
    );
  }

  const { overall, asPoster, asTasker, recentReviews } = stats;

  return (
    <div className="rating-stats-container">
      {/* Overall Rating Header */}
      <div className="overall-rating-header">
        <div className="stars-display">
          {renderStars(overall.averageRating)}
        </div>
        <div className="rating-number">
          {overall.averageRating.toFixed(1)}
        </div>
        <div className="review-count">
          ({overall.totalReviews} {overall.totalReviews === 1 ? 'review' : 'reviews'})
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="rating-breakdown">
        {[5, 4, 3, 2, 1].map(star => {
          const count = overall.ratingDistribution[star] || 0;
          const percentage = getPercentage(count, overall.totalReviews);
          
          return (
            <div key={star} className="rating-row">
              <div className="star-label">{star}★</div>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: star >= 4 ? '#FFB800' : star >= 3 ? '#FFC107' : '#FF9800'
                  }}
                />
              </div>
              
              <div className="percentage-label">{percentage}%</div>
              <div className="count-label">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Role-specific Ratings */}
      <div className="role-ratings">
        {/* As Tasker */}
        <div className="role-card">
          <div className="role-header">As Tasker</div>
          <div className="role-stars">
            {renderStars(asTasker.averageRating)}
          </div>
          <div className="role-rating">
            {asTasker.averageRating > 0 ? asTasker.averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="role-review-count">
            ({asTasker.totalReviews} {asTasker.totalReviews === 1 ? 'review' : 'reviews'})
          </div>
        </div>

        {/* As Poster */}
        <div className="role-card">
          <div className="role-header">As Poster</div>
          <div className="role-stars">
            {renderStars(asPoster.averageRating)}
          </div>
          <div className="role-rating">
            {asPoster.averageRating > 0 ? asPoster.averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="role-review-count">
            ({asPoster.totalReviews} {asPoster.totalReviews === 1 ? 'review' : 'reviews'})
          </div>
        </div>
      </div>

      {/* Recent Reviews (Optional) */}
      {recentReviews && recentReviews.length > 0 && (
        <div className="recent-reviews">
          <h3>Recent Reviews</h3>
          {recentReviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  {review.reviewer?.avatar && (
                    <img 
                      src={review.reviewer.avatar} 
                      alt={review.reviewer.firstName}
                      className="reviewer-avatar"
                    />
                  )}
                  <span className="reviewer-name">
                    {review.reviewer?.firstName} {review.reviewer?.lastName}
                  </span>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              {review.reviewText && (
                <div className="review-text">{review.reviewText}</div>
              )}
              <div className="review-date">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingStats;

/* [REDACTED_AWS_SECRET_ACCESS_KEY]================================
   CSS FILE: RatingStats.css
   Copy this to your CSS file
   [REDACTED_AWS_SECRET_ACCESS_KEY]================================ */

/*
.rating-stats-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading,
.error,
.no-reviews {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.error {
  color: #d32f2f;
}

.overall-rating-header {
  text-align: center;
  padding: 24px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 24px;
}

.stars-display {
  font-size: 28px;
  margin-bottom: 8px;
}

.star.filled {
  color: #FFB800;
}

.star.empty {
  color: #e0e0e0;
}

.rating-number {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.review-count {
  font-size: 16px;
  color: #666;
}

.rating-breakdown {
  margin-bottom: 32px;
}

.rating-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.star-label {
  width: 35px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.progress-bar-container {
  flex: 1;
  height: 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #FFB800;
  transition: width 0.3s ease;
  border-radius: 6px;
}

.percentage-label {
  width: 45px;
  text-align: right;
  font-size: 14px;
  color: #666;
}

.count-label {
  width: 30px;
  text-align: right;
  font-size: 14px;
  color: #999;
}

.role-ratings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.role-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.role-header {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.role-stars {
  font-size: 16px;
  margin-bottom: 8px;
}

.role-rating {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.role-review-count {
  font-size: 12px;
  color: #666;
}

.recent-reviews {
  border-top: 1px solid #e0e0e0;
  padding-top: 24px;
}

.recent-reviews h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.review-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviewer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.reviewer-name {
  font-weight: 500;
  color: #333;
}

.review-rating {
  font-size: 14px;
}

.review-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
}

.review-date {
  font-size: 12px;
  color: #999;
}

@media (max-width: 640px) {
  .rating-stats-container {
    padding: 16px;
  }

  .role-ratings {
    grid-template-columns: 1fr;
  }

  .rating-number {
    font-size: 36px;
  }
}
*/

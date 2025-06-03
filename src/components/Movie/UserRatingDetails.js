import React, { useState, useEffect, useContext } from 'react';
import styles from '../../styles/UserRatingDetails.module.css';
import { RatingContext } from './RatingStats';

const UserRatingDetails = ({ movieSlug }) => {
  const { showUserRatingDetails, setShowUserRatingDetails, showStats } = useContext(RatingContext) || {};
  const [userRatings, setUserRatings] = useState([]);
  const [filteredRatings, setFilteredRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState(0); // 0 means all ratings
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'highest', 'lowest'

  useEffect(() => {
    const fetchUserRatings = async () => {
      // Only fetch data when dropdown is visible and we have a movie slug
      if (!movieSlug || !showDetails) return;

      try {
        setLoading(true);
        setError(null);
        
        // Define base API URL once for consistency
        const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        
        // Step 1: Fetch movie ID from slug
        const movieResponse = await fetch(`${baseApiUrl}/movies/${movieSlug}`);
        if (!movieResponse.ok) {
          throw new Error(`Failed to fetch movie info: ${movieResponse.status}`);
        }
        
        const movieData = await movieResponse.json();
        if (!movieData.data || !movieData.data._id) {
          throw new Error('Movie ID not found');
        }
        
        const movieId = movieData.data._id;
        
        // Step 2: Fetch ratings with populated user data
        const ratingsResponse = await fetch(`${baseApiUrl}/ratings/movie/${movieId}`);
        if (!ratingsResponse.ok) {
          throw new Error(`Failed to fetch ratings: ${ratingsResponse.status}`);
        }
        const ratingsData = await ratingsResponse.json();
        
        // Step 3: Process the ratings data - user info is already included from backend
        let formattedRatings = [];
        
        if (ratingsData && ratingsData.data && ratingsData.data.ratings) {
          const ratings = ratingsData.data.ratings;
          
          formattedRatings = ratings.map(rating => ({
            id: rating._id,
            rating: rating.rating,
            createdAt: new Date(rating.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),            
            rawDate: new Date(rating.createdAt),            
            user: {
              id: rating.userId?._id || 'unknown',
              username: rating.userId?.fullname || rating.userId?.username || 'Người dùng ẩn danh',
              email: rating.userId?.email || '',
              avatar: getAvatarUrl(rating.userId?.avatar || '')
            }
          }));
          
          // Sort ratings by date (newest first)
          formattedRatings.sort((a, b) => b.rawDate - a.rawDate);
        }
        
        setUserRatings(formattedRatings);
        setFilteredRatings(formattedRatings);
      } catch (err) {
        console.error('Error fetching user ratings:', err);
        setError('Không thể tải thông tin đánh giá chi tiết');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRatings();
  }, [movieSlug, showDetails]);  // Listen for changes to showStats from RatingStats component
  useEffect(() => {
    // If stats are shown and details are also shown, hide details
    if (showStats && showDetails) {
      setShowDetails(false);
    }
  }, [showStats]);

  // Apply filter and sort when selectedStarFilter or sortOrder changes
  useEffect(() => {
    // First, filter the ratings
    let result = selectedStarFilter === 0
      ? [...userRatings] // Copy all ratings
      : userRatings.filter(rating => rating.rating === selectedStarFilter);
      
    // Then, sort the filtered ratings
    switch (sortOrder) {
      case 'highest':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        result.sort((a, b) => a.rating - b.rating);
        break;
      case 'newest':
      default:
        result.sort((a, b) => b.rawDate - a.rawDate);
        break;
    }
    
    setFilteredRatings(result);
  }, [selectedStarFilter, userRatings, sortOrder]);
  // Format avatar URLs consistently
  const getAvatarUrl = (avatar) => {
    if (!avatar) return "/img/avatar.png";
    
    let avatarUrl = avatar;
    
    // Convert relative paths to absolute URLs
    if (avatarUrl && avatarUrl.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      // Remove /api part if it exists in baseUrl
      const baseWithoutApi = baseUrl.endsWith('/api') 
        ? baseUrl.substring(0, baseUrl.length - 4) 
        : baseUrl;
      
      // Create full URL
      avatarUrl = `${baseWithoutApi}${avatarUrl}`;
    }
    
    // Only add cache-busting for non-external URLs (exclude Google, Cloudinary, etc.)
    if (!avatarUrl.includes('?') && 
        !avatarUrl.includes('googleusercontent.com') && 
        !avatarUrl.includes('cloudinary.com')) {
      avatarUrl = `${avatarUrl}?t=${Date.now()}`;
    }
    
    return avatarUrl;
  };
  const handleToggleDetails = () => {
    const newDetailsState = !showDetails;
    setShowDetails(newDetailsState);
    
    // Update the shared context state
    if (setShowUserRatingDetails) {
      setShowUserRatingDetails(newDetailsState);
    }
  };

  const handleFilterChange = (starValue) => {
    setSelectedStarFilter(starValue);
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
    
    // Apply sorting to the filtered ratings
    let sortedRatings = [...filteredRatings];
    
    switch (order) {
      case 'highest':
        sortedRatings.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        sortedRatings.sort((a, b) => a.rating - b.rating);
        break;
      case 'newest':
      default:
        sortedRatings.sort((a, b) => b.rawDate - a.rawDate);
        break;
    }
    
    setFilteredRatings(sortedRatings);
  };

  return (
    <div className={styles.userRatingDetailsContainer}>      <button 
        className={styles.detailsToggle}
        onClick={handleToggleDetails}
        title={`Xem chi tiết ${userRatings.length} đánh giá từ người dùng`}
        aria-expanded={showDetails}
        aria-haspopup="true"
      >
        <span>Chi tiết đánh giá</span>
        {userRatings.length > 0 && (
          <span className={styles.ratingBadge}>{userRatings.length}</span>
        )}
        <i className={`bi ${showDetails ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
      </button>
      
      {showDetails && (
        <div className={styles.detailsDropdown}>
          <h6 className={styles.detailsHeader}>
            <span>Đánh giá từ người dùng</span>
            {userRatings.length > 0 && (
              <div className={styles.sortControls}>                <button
                  className={`${styles.sortButton} ${sortOrder === 'newest' ? styles.active : ''}`}
                  onClick={() => handleSortChange('newest')}
                  title="Sắp xếp theo mới nhất"
                >
                  <i className="bi bi-calendar-check"></i>
                </button><button
                  className={`${styles.sortButton} ${sortOrder === 'highest' ? styles.active : ''}`}
                  onClick={() => handleSortChange('highest')}
                  title="Sắp xếp theo sao cao nhất"
                >
                  <i className="bi bi-star-fill"></i><i className="bi bi-arrow-down"></i>
                </button>
                <button
                  className={`${styles.sortButton} ${sortOrder === 'lowest' ? styles.active : ''}`}
                  onClick={() => handleSortChange('lowest')}
                  title="Sắp xếp theo sao thấp nhất"
                >
                  <i className="bi bi-star-fill"></i><i className="bi bi-arrow-up"></i>
                </button>
              </div>
            )}
          </h6>
            {/* Star Filter */}          <div className={styles.starFilter}>            <button 
              className={`${styles.starFilterButton} ${selectedStarFilter === 0 ? styles.active : ''}`}
              onClick={() => handleFilterChange(0)}
              title="Tất cả đánh giá"
              aria-label="Hiển thị tất cả đánh giá"
            >
              <span>Tất cả</span>
              <span className={styles.ratingCount}>{userRatings.length}</span>
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => {
              const count = userRatings.filter(rating => rating.rating === star).length;
              return (
                <button
                  key={star}
                  className={`${styles.starFilterButton} ${selectedStarFilter === star ? styles.active : ''}`}
                  onClick={() => handleFilterChange(star)}
                  title={`Lọc đánh giá ${star} sao`}
                  disabled={count === 0}
                  aria-label={`Lọc đánh giá ${star} sao, có ${count} đánh giá`}
                >
                  <span className={styles.starValue}>{star}<i className="bi bi-star-fill"></i></span>
                  <span className={styles.ratingCount}>{count || 0}</span>
                </button>
              );
            })}
          </div>
          
          {/* Hiển thị thống kê về số lượng đánh giá */}
          {userRatings.length > 0 && selectedStarFilter !== 0 && (
            <div className={styles.filterStats}>
              Đang hiển thị {filteredRatings.length} trên tổng số {userRatings.length} đánh giá
            </div>
          )}
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <i className="bi bi-exclamation-circle"></i>
              <p>{error}</p>
            </div>          ) : filteredRatings.length === 0 ? (
            <div className={styles.noRatingsMessage}>
              <i className={`bi ${selectedStarFilter === 0 ? 'bi-star' : 'bi-funnel'} text-muted`}></i>
              <p>
                {selectedStarFilter === 0 
                  ? "Chưa có đánh giá từ người dùng" 
                  : `Không có đánh giá ${selectedStarFilter} sao nào`}
              </p>
              {selectedStarFilter !== 0 && userRatings.length > 0 && (
                <button 
                  className={styles.resetFilterButton} 
                  onClick={() => handleFilterChange(0)}
                >
                  <i className="bi bi-arrow-repeat me-1"></i>
                  Hiển thị tất cả
                </button>
              )}
            </div>
          ) : (
            <div className={styles.ratingsList}>
              {filteredRatings.map(rating => (                <div 
                  key={rating.id} 
                  className={`${styles.ratingItem} ${selectedStarFilter > 0 ? styles.highlighted : ''}`}
                >
                  <div className={styles.userInfo}>                    <img 
                      src={rating.user.avatar}
                      alt={rating.user.username}
                      className={styles.userAvatar}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/img/avatar.png";
                      }}
                      loading="lazy"
                    />
                    <div className={styles.userDetails}>
                      <div className={styles.userName}>
                        <i className="bi bi-person-fill me-1"></i>
                        {rating.user.username}
                      </div>
                      {rating.user.email && (
                        <div className={styles.userEmail}>
                          <i className="bi bi-envelope-fill me-1"></i>
                          {rating.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.ratingInfo}>
                    <div className={styles.ratingValue}>
                      <span className={styles.ratingNumber}>{rating.rating}</span>
                      <i className="bi bi-star-fill ms-1"></i>
                    </div>
                    <div className={styles.ratingDate}>
                      <i className="bi bi-calendar3 me-1"></i>
                      {rating.createdAt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRatingDetails;

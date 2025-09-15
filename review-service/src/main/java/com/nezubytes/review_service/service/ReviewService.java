package com.nezubytes.review_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.nezubytes.review_service.client.NegPosClient;
import com.nezubytes.review_service.dto.ReviewRequest;
import com.nezubytes.review_service.dto.ReviewResponse;
import com.nezubytes.review_service.model.Review;
import com.nezubytes.review_service.repository.ReviewRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {
    private  final ReviewRepository reviewRepository;

    private final NegPosClient negPosClient; 

    public ReviewResponse createReview(ReviewRequest reviewRequest){
        Review review = Review.builder()
            .title(reviewRequest.title())
            .description(reviewRequest.description())
            .foodId(reviewRequest.foodId())
            .resturantId(reviewRequest.resturantId())
            .userId(reviewRequest.userId())
            .reactionCountLike(reviewRequest.reactionCountLike())
            .reactionCountDislike(reviewRequest.reactionCountDislike())
            .reactionUsersLike(reviewRequest.reactionUsersLike())
            .reactionUsersDislike(reviewRequest.reactionUsersDislike())
            .comments(reviewRequest.comments())
            .createdAt(reviewRequest.createdAt())
            .updatedAt(reviewRequest.updatedAt())
            .sentiment(reviewRequest.sentiment())
            .build();
        
        NegPosClient.SentimentResponse response = negPosClient.analyze_sentiment(review.getDescription());
        review.setSentiment(response.sentiment());

        reviewRepository.save(review); 

        return new ReviewResponse(
            review.getId(),
            review.getTitle(),
            review.getDescription(),
            review.getFoodId(),
            review.getResturantId(),
            review.getUserId(),
            review.getReactionCountLike(),
            review.getReactionCountDislike(),
            review.getReactionUsersLike(),
            review.getReactionUsersDislike(),
            review.getComments(),
            review.getCreatedAt(),
            review.getUpdatedAt(),
            review.getSentiment()
        );
    }

    public List<ReviewResponse> getAllResponse(){
        return reviewRepository.findAll()
                .stream()
                .map(review -> new ReviewResponse(
                     review.getId(),
                    review.getTitle(),
                    review.getDescription(),
                    review.getFoodId(),
                    review.getResturantId(),
                    review.getUserId(),
                    review.getReactionCountLike(),
                    review.getReactionCountDislike(),
                    review.getReactionUsersLike(),
                    review.getReactionUsersDislike(),
                    review.getComments(),
                    review.getCreatedAt(),
                    review.getUpdatedAt(),
                    review.getSentiment()
                ))
                .toList();
    }

    public ReviewResponse updateReview(String id, ReviewRequest reviewRequest){
        Review review = reviewRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));

        if (reviewRequest.title() != null) 
            review.setTitle(reviewRequest.title());

        if (reviewRequest.description() != null) 
            review.setDescription(reviewRequest.description());

        if (reviewRequest.foodId() != null) 
            review.setFoodId(reviewRequest.foodId());

        if (reviewRequest.resturantId() != null) 
            review.setResturantId(reviewRequest.resturantId());

        if (reviewRequest.userId() != null) 
            review.setUserId(reviewRequest.userId());

        if (reviewRequest.reactionCountLike() != null) 
            review.setReactionCountLike(reviewRequest.reactionCountLike());

        if (reviewRequest.reactionCountDislike() != null) 
            review.setReactionCountDislike(reviewRequest.reactionCountDislike());

        if (reviewRequest.reactionUsersLike() != null && !reviewRequest.reactionUsersLike().isEmpty()) {
            if (review.getReactionUsersLike() == null) {
                review.setReactionUsersLike(new ArrayList<>());
            }
            review.getReactionUsersLike().addAll(reviewRequest.reactionUsersLike());
        }
        
        if (reviewRequest.reactionUsersDislike() != null && !reviewRequest.reactionUsersDislike().isEmpty()) {
            if (review.getReactionUsersDislike() == null) {
                review.setReactionUsersDislike(new ArrayList<>());
            }
            review.getReactionUsersDislike().addAll(reviewRequest.reactionUsersDislike());
        }

        if (reviewRequest.comments() != null && !reviewRequest.comments().isEmpty()) {
            if (review.getComments() == null) {
                review.setComments(new ArrayList<>());
            }
            review.getComments().addAll(reviewRequest.comments());
        }

        
        review.setUpdatedAt(LocalDateTime.now());

        Review updatedReview = reviewRepository.save(review);

        return new ReviewResponse(
            updatedReview.getId(),
            updatedReview.getTitle(),
            updatedReview.getDescription(),
            updatedReview.getFoodId(),
            updatedReview.getResturantId(),
            updatedReview.getUserId(),
            updatedReview.getReactionCountLike(),
            updatedReview.getReactionCountDislike(),
            updatedReview.getReactionUsersLike(),
            updatedReview.getReactionUsersDislike(),
            updatedReview.getComments(),
            updatedReview.getCreatedAt(),
            updatedReview.getUpdatedAt(),
            updatedReview.getSentiment()
        );
    }

    public void deleteReview(String id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));

        reviewRepository.delete(review);
    }

    public ReviewResponse getReviewById(String id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));

        return new ReviewResponse(
                review.getId(),
                review.getTitle(),
                review.getDescription(),
                review.getFoodId(),
                review.getResturantId(),
                review.getUserId(),
                review.getReactionCountLike(),
                review.getReactionCountDislike(),
                review.getReactionUsersLike(),
                review.getReactionUsersDislike(),
                review.getComments(),
                review.getCreatedAt(),
                review.getUpdatedAt(),
                review.getSentiment()
        );
    }

    public List<ReviewResponse> getReviewsByFoodId(String foodId) {
        return reviewRepository.findByFoodId(foodId)
                .stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getTitle(),
                        review.getDescription(),
                        review.getFoodId(),
                        review.getResturantId(),
                        review.getUserId(),
                        review.getReactionCountLike(),
                        review.getReactionCountDislike(),
                        review.getReactionUsersLike(),
                        review.getReactionUsersDislike(),
                        review.getComments(),
                        review.getCreatedAt(),
                        review.getUpdatedAt(),
                        review.getSentiment()
                ))
                .toList();
    }

    public List<ReviewResponse> getReviewsByUserId(String userId) {
        return reviewRepository.findByUserId(userId)
                .stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getTitle(),
                        review.getDescription(),
                        review.getFoodId(),
                        review.getResturantId(),
                        review.getUserId(),
                        review.getReactionCountLike(),
                        review.getReactionCountDislike(),
                        review.getReactionUsersLike(),
                        review.getReactionUsersDislike(),
                        review.getComments(),
                        review.getCreatedAt(),
                        review.getUpdatedAt(),
                        review.getSentiment()
                ))
                .toList();
    }

    public List<ReviewResponse> getReviewsByRestaurantId(String restaurantId) {
        return reviewRepository.findByResturantId(restaurantId)
                .stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getTitle(),
                        review.getDescription(),
                        review.getFoodId(),
                        review.getResturantId(),
                        review.getUserId(),
                        review.getReactionCountLike(),
                        review.getReactionCountDislike(),
                        review.getReactionUsersLike(),
                        review.getReactionUsersDislike(),
                        review.getComments(),
                        review.getCreatedAt(),
                        review.getUpdatedAt(),
                        review.getSentiment()
                ))
                .toList();
    }

    public ReviewResponse increaseLike(String reviewId, String userId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        // Initialize list if null
        if (review.getReactionUsersLike() == null) {
            review.setReactionUsersLike(new ArrayList<>());
        }

        // Check if user already liked this review
        if (review.getReactionUsersLike().contains(userId)) {
            throw new RuntimeException("User has already liked this review");
        }

        // Remove from dislike list if user previously disliked
        if (review.getReactionUsersDislike() != null && review.getReactionUsersDislike().contains(userId)) {
            review.getReactionUsersDislike().remove(userId);
            int currentDislikeCount = review.getReactionCountDislike() != null ? review.getReactionCountDislike() : 0;
            review.setReactionCountDislike(Math.max(0, currentDislikeCount - 1));
        }

        // Add to like list and increment count
        review.getReactionUsersLike().add(userId);
        int currentLikeCount = review.getReactionCountLike() != null ? review.getReactionCountLike() : 0;
        review.setReactionCountLike(currentLikeCount + 1);
        review.setUpdatedAt(LocalDateTime.now());

        Review updatedReview = reviewRepository.save(review);

        return new ReviewResponse(
            updatedReview.getId(),
            updatedReview.getTitle(),
            updatedReview.getDescription(),
            updatedReview.getFoodId(),
            updatedReview.getResturantId(),
            updatedReview.getUserId(),
            updatedReview.getReactionCountLike(),
            updatedReview.getReactionCountDislike(),
            updatedReview.getReactionUsersLike(),
            updatedReview.getReactionUsersDislike(),
            updatedReview.getComments(),
            updatedReview.getCreatedAt(),
            updatedReview.getUpdatedAt(),
            updatedReview.getSentiment()
        );
    }

    public ReviewResponse increaseDislike(String reviewId, String userId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        // Initialize list if null
        if (review.getReactionUsersDislike() == null) {
            review.setReactionUsersDislike(new ArrayList<>());
        }

        // Check if user already disliked this review
        if (review.getReactionUsersDislike().contains(userId)) {
            throw new RuntimeException("User has already disliked this review");
        }

        // Remove from like list if user previously liked
        if (review.getReactionUsersLike() != null && review.getReactionUsersLike().contains(userId)) {
            review.getReactionUsersLike().remove(userId);
            int currentLikeCount = review.getReactionCountLike() != null ? review.getReactionCountLike() : 0;
            review.setReactionCountLike(Math.max(0, currentLikeCount - 1));
        }

        // Add to dislike list and increment count
        review.getReactionUsersDislike().add(userId);
        int currentDislikeCount = review.getReactionCountDislike() != null ? review.getReactionCountDislike() : 0;
        review.setReactionCountDislike(currentDislikeCount + 1);
        review.setUpdatedAt(LocalDateTime.now());

        Review updatedReview = reviewRepository.save(review);

        return new ReviewResponse(
            updatedReview.getId(),
            updatedReview.getTitle(),
            updatedReview.getDescription(),
            updatedReview.getFoodId(),
            updatedReview.getResturantId(),
            updatedReview.getUserId(),
            updatedReview.getReactionCountLike(),
            updatedReview.getReactionCountDislike(),
            updatedReview.getReactionUsersLike(),
            updatedReview.getReactionUsersDislike(),
            updatedReview.getComments(),
            updatedReview.getCreatedAt(),
            updatedReview.getUpdatedAt(),
            updatedReview.getSentiment()
        );
    }

    public ReviewResponse decreaseLike(String reviewId, String userId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        // Check if user has liked this review
        if (review.getReactionUsersLike() == null || !review.getReactionUsersLike().contains(userId)) {
            throw new RuntimeException("User has not liked this review");
        }

        // Remove from like list and decrement count
        review.getReactionUsersLike().remove(userId);
        int currentLikeCount = review.getReactionCountLike() != null ? review.getReactionCountLike() : 0;
        review.setReactionCountLike(Math.max(0, currentLikeCount - 1));
        review.setUpdatedAt(LocalDateTime.now());

        Review updatedReview = reviewRepository.save(review);

        return new ReviewResponse(
            updatedReview.getId(),
            updatedReview.getTitle(),
            updatedReview.getDescription(),
            updatedReview.getFoodId(),
            updatedReview.getResturantId(),
            updatedReview.getUserId(),
            updatedReview.getReactionCountLike(),
            updatedReview.getReactionCountDislike(),
            updatedReview.getReactionUsersLike(),
            updatedReview.getReactionUsersDislike(),
            updatedReview.getComments(),
            updatedReview.getCreatedAt(),
            updatedReview.getUpdatedAt(),
            updatedReview.getSentiment()
        );
    }

    public ReviewResponse decreaseDislike(String reviewId, String userId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        // Check if user has disliked this review
        if (review.getReactionUsersDislike() == null || !review.getReactionUsersDislike().contains(userId)) {
            throw new RuntimeException("User has not disliked this review");
        }

        // Remove from dislike list and decrement count
        review.getReactionUsersDislike().remove(userId);
        int currentDislikeCount = review.getReactionCountDislike() != null ? review.getReactionCountDislike() : 0;
        review.setReactionCountDislike(Math.max(0, currentDislikeCount - 1));
        review.setUpdatedAt(LocalDateTime.now());

        Review updatedReview = reviewRepository.save(review);

        return new ReviewResponse(
            updatedReview.getId(),
            updatedReview.getTitle(),
            updatedReview.getDescription(),
            updatedReview.getFoodId(),
            updatedReview.getResturantId(),
            updatedReview.getUserId(),
            updatedReview.getReactionCountLike(),
            updatedReview.getReactionCountDislike(),
            updatedReview.getReactionUsersLike(),
            updatedReview.getReactionUsersDislike(),
            updatedReview.getComments(),
            updatedReview.getCreatedAt(),
            updatedReview.getUpdatedAt(),
            updatedReview.getSentiment()
        );
    }


}

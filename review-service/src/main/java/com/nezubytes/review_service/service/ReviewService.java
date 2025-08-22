package com.nezubytes.review_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

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
            .build();
        
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
            review.getUpdatedAt()
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
                    review.getUpdatedAt()
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

        // Always update timestamp
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
            updatedReview.getUpdatedAt()
        );
    }



}

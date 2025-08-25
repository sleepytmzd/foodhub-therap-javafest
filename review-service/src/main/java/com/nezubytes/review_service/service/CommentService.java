package com.nezubytes.review_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.nezubytes.review_service.dto.CommentRequest;
import com.nezubytes.review_service.dto.CommentResponse;
import com.nezubytes.review_service.model.Comment;
import com.nezubytes.review_service.model.Review;
import com.nezubytes.review_service.repository.CommentRepository;
import com.nezubytes.review_service.repository.ReviewRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {
    private final CommentRepository commentRepository; 
    private final ReviewRepository reviewRepository; 

    public CommentResponse createComment(CommentRequest commentRequest){
        Comment comment = Comment.builder()
            .reviewId(commentRequest.reviewId())
            .userId(commentRequest.userId())
            .content(commentRequest.content())
            .createdAt(LocalDateTime.now())
            .build(); 
        commentRepository.save(comment); 

        Review review = reviewRepository.findById(commentRequest.reviewId())
            .orElseThrow(() -> new RuntimeException("Review not found with id: " + commentRequest.reviewId()));

        if (review.getComments() == null) {
            review.setComments(new ArrayList<>());
        }
        review.getComments().add(comment.getId());  
        review.setUpdatedAt(LocalDateTime.now());
        reviewRepository.save(review);

        return new CommentResponse(
            comment.getId(),
            comment.getReviewId(),
            comment.getUserId(),
            comment.getContent(),
            comment.getCreatedAt(), 
            comment.getUpdatedAt()
        );
    }

    public List<CommentResponse> getCommentsByReviewId(String reviewId) {
        List<Comment> comments = commentRepository.findByReviewId(reviewId);

        return comments.stream()
            .map(comment -> new CommentResponse(
                comment.getId(),
                comment.getReviewId(),
                comment.getUserId(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
            ))
            .toList();
    }

    public CommentResponse updateComment(String id, CommentRequest commentRequest) {
        Comment comment = commentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        if (commentRequest.content() != null) {
            comment.setContent(commentRequest.content());
        }

       
        comment.setUpdatedAt(LocalDateTime.now());

        Comment updatedComment = commentRepository.save(comment);

        return new CommentResponse(
            updatedComment.getId(),
            updatedComment.getReviewId(),
            updatedComment.getUserId(),
            updatedComment.getContent(),
            updatedComment.getCreatedAt(),
            updatedComment.getUpdatedAt()
        );
    }


}

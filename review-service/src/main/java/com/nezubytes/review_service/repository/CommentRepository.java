package com.nezubytes.review_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nezubytes.review_service.model.Comment;

public interface CommentRepository extends MongoRepository<Comment, String>{
        List<Comment> findByReviewId(String reviewId);

}

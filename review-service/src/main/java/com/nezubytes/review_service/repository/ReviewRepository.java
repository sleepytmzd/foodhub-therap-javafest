package com.nezubytes.review_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nezubytes.review_service.model.Review;

public interface ReviewRepository extends MongoRepository<Review, String> {

}

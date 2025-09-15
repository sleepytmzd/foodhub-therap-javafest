package com.nezubytes.review_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nezubytes.review_service.model.Review;

public interface ReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByFoodId(String foodId);

    List<Review> findByUserId(String userId);

    List<Review> findByResturantId(String resturantId);
}


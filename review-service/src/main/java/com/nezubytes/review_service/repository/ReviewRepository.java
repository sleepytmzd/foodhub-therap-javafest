package com.nezubytes.review_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nezubytes.review_service.model.Review;

import java.util.Collection;
import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByFoodId(String foodId);

    List<Review> findByUserId(String userId);
}


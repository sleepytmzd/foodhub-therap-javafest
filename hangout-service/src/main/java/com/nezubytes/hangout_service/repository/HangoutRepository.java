package com.nezubytes.hangout_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nezubytes.hangout_service.model.Hangout;


public interface HangoutRepository extends MongoRepository<Hangout, String> {
    List<Hangout> findByRestaurantId(String restaurantId);
}

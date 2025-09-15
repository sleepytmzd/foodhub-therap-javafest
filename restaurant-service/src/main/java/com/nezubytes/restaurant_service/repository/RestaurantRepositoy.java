package com.nezubytes.restaurant_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nezubytes.restaurant_service.model.Restaurant;

public interface RestaurantRepositoy extends MongoRepository<Restaurant, String>{

}

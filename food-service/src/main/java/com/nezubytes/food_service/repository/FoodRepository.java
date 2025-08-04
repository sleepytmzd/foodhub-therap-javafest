package com.nezubytes.food_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nezubytes.food_service.model.Food;

public interface FoodRepository extends MongoRepository<Food, String>{

}

package com.nezubytes.food_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.nezubytes.food_service.dto.FoodRequest;
import com.nezubytes.food_service.dto.FoodResponse;
import com.nezubytes.food_service.service.FoodService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/food")
@RequiredArgsConstructor
public class FoodController {
    private final FoodService foodService; 

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FoodResponse createFood(@RequestBody FoodRequest foodRequest){
        return foodService.createFood(foodRequest); 
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<FoodResponse> getAllFood() {
        return foodService.getAllFoods();
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public FoodResponse updateFood(@PathVariable String id, @RequestBody FoodRequest foodRequest) {
        return foodService.updateFood(id, foodRequest);
    }

    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public String deleteFood(@PathVariable String id) {
        return foodService.deleteFood(id);
    }
}

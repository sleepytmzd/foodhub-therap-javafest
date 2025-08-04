package com.nezubytes.food_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nezubytes.food_service.dto.FoodRequest;
import com.nezubytes.food_service.dto.FoodResponse;
import com.nezubytes.food_service.model.Food;
import com.nezubytes.food_service.repository.FoodRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FoodService {
    private final FoodRepository foodRepository; 

    public FoodResponse createFood(FoodRequest foodRequest){
        Food food = Food.builder()
                    .f_name(foodRequest.f_name())
                    .description(foodRequest.description())
                    .category(foodRequest.category())
                    .nutrition_table(foodRequest.nutrition_table())
                    .resturant_id(foodRequest.resturant_id())
                    .image_url(foodRequest.image_url())
                    .build();
        foodRepository.save(food); 
        return new FoodResponse(food.getId(), food.getDescription(), food.getF_name(), food.getCategory(), food.getNutrition_table(), food.getResturant_id(), food.getImage_url(), food.getUser_id()); 
    }

    public List<FoodResponse> getAllFoods() {
        return foodRepository.findAll()
                .stream()
                .map(food -> new FoodResponse(food.getId(), food.getDescription(), food.getF_name(), food.getCategory(), food.getNutrition_table(), food.getResturant_id(), food.getImage_url(), food.getUser_id()))
                .toList();
    }

    // TODO: Implmenet Exception
    public String deleteFood(String id) {
        if (!foodRepository.existsById(id)) {
            // log.info("Food Not Found with this ID");
        }
        foodRepository.deleteById(id);

        return "Deleted Successfully"; 
    }

    public FoodResponse updateFood(String id, FoodRequest foodRequest) {
        Food food = foodRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Food not found with id: " + id));

        if (foodRequest.f_name() != null) food.setF_name(foodRequest.f_name());
        if (foodRequest.description() != null) food.setDescription(foodRequest.description());
        if (foodRequest.category() != null) food.setCategory(foodRequest.category());
        if (foodRequest.nutrition_table() != null) food.setNutrition_table(foodRequest.nutrition_table());
        if (foodRequest.resturant_id() != null) food.setResturant_id(foodRequest.resturant_id());
        if (foodRequest.image_url() != null) food.setImage_url(foodRequest.image_url());
        if (foodRequest.user_id() != null) food.setUser_id(foodRequest.user_id());

        Food updateFood = foodRepository.save(food);

        return new FoodResponse(
            updateFood.getId(),
            updateFood.getF_name(),
            updateFood.getDescription(),
            updateFood.getCategory(),
            updateFood.getNutrition_table(),
            updateFood.getResturant_id(),
            updateFood.getImage_url(),
            updateFood.getUser_id()
        );
    }

   
}   

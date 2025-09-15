package com.nezubytes.food_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nezubytes.food_service.client.QdrantClient;
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

    private final QdrantClient qdrantClient; 

    public FoodResponse createFood(FoodRequest foodRequest){
        Food food = Food.builder()
                    .f_name(foodRequest.f_name())
                    .description(foodRequest.description())
                    .category(foodRequest.category())
                    .nutrition_table(foodRequest.nutrition_table())
                    .resturant_id(foodRequest.resturant_id())
                    .image_url(foodRequest.image_url())
                    .price(foodRequest.price())
                    .user_id(foodRequest.user_id())
                    .build();
        foodRepository.save(food); 


        // qdrantClient.add_point_food(food.getF_name(), food.getDescription(), food.getCategory(), food.getNutrition_table(), food.getPrice(), food.getId(), "Ksu ekta"); 
        
        qdrantClient.add_point_food(
                (food.getF_name() != null && !food.getF_name().isEmpty()) ? food.getF_name() : "deynai", 
                (food.getDescription() != null && !food.getDescription().isEmpty()) ? food.getDescription() : "deynai", 
                (food.getCategory() != null && !food.getCategory().isEmpty()) ? food.getCategory() : "deynai", 
                (food.getNutrition_table() != null && !food.getNutrition_table().isEmpty()) ? food.getNutrition_table() : "deynai", 
                food.getPrice() != null ? food.getPrice() : 0,  // Default price to 0 if null
                (food.getId() != null && !food.getId().isEmpty()) ? food.getId() : "deynai",
                (food.getResturant_id() != null && !food.getResturant_id().isEmpty()) ? food.getResturant_id() : "deynai"
            );

        return new FoodResponse(food.getId(), food.getDescription(), food.getF_name(), food.getCategory(), food.getNutrition_table(), food.getResturant_id(), food.getImage_url(), food.getUser_id(), food.getPrice()); 
    }

    public List<FoodResponse> getAllFoods() {
        return foodRepository.findAll()
                .stream()
                .map(food -> new FoodResponse(food.getId(), food.getDescription(), food.getF_name(), food.getCategory(), food.getNutrition_table(), food.getResturant_id(), food.getImage_url(), food.getUser_id(),  food.getPrice()))
                .toList();
    }

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
        if (foodRequest.price() != null) food.setPrice(foodRequest.price());

        Food updateFood = foodRepository.save(food);

        return new FoodResponse(
            updateFood.getId(),
            updateFood.getF_name(),
            updateFood.getDescription(),
            updateFood.getCategory(),
            updateFood.getNutrition_table(),
            updateFood.getResturant_id(),
            updateFood.getImage_url(),
            updateFood.getUser_id(),
            updateFood.getPrice()
        );
    }

    public FoodResponse getFoodById(String id){
        Food food = foodRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Food not found with id: " + id));
        
        
            return new FoodResponse(food.getId(), food.getDescription(), food.getF_name(), food.getCategory(), food.getNutrition_table(), food.getResturant_id(), food.getImage_url(), food.getUser_id(), food.getPrice()); 
        
    }

   
}   

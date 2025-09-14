package com.nezubytes.food_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nezubytes.food_service.client.ImageClient;
import com.nezubytes.food_service.dto.FoodRequest;
import com.nezubytes.food_service.dto.FoodResponse;
import com.nezubytes.food_service.dto.UploadResponseDTO;
import com.nezubytes.food_service.service.FoodService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/food")
@RequiredArgsConstructor
public class FoodController {
    private final FoodService foodService;

    private final ImageClient imageClient;

//    @PostMapping
//    @ResponseStatus(HttpStatus.CREATED)
//    public FoodResponse createFood(@RequestBody FoodRequest foodRequest){
//        return foodService.createFood(foodRequest);
//    }
    @PostMapping(consumes = {"multipart/form-data"})
    @ResponseStatus(HttpStatus.CREATED)
    public FoodResponse createFood(@RequestPart("food") FoodRequest foodRequest,
                                   @RequestPart("image") MultipartFile imageFile){
        ResponseEntity<UploadResponseDTO> uploaded = imageClient.upload(imageFile);
        UploadResponseDTO uploadedBody = uploaded.getBody();
        String imageUrl = uploadedBody.getUrl();

        FoodRequest updatedRequest = new FoodRequest(
                foodRequest.id(),
                foodRequest.description(),
                foodRequest.f_name(),
                foodRequest.category(),
                foodRequest.nutrition_table(),
                foodRequest.resturant_id(),
                imageUrl,   // <-- replaced with the uploaded image URL
                foodRequest.user_id(),
                foodRequest.price()
        );

        return foodService.createFood(updatedRequest);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<FoodResponse> getAllFood() {
        return foodService.getAllFoods();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FoodResponse> getFoodById(@PathVariable String id) {
        try {
            FoodResponse food = foodService.getFoodById(id);
            return ResponseEntity.ok(food);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

//    @PutMapping("/{id}")
//    @ResponseStatus(HttpStatus.OK)
//    public FoodResponse updateFood(@PathVariable String id, @RequestBody FoodRequest foodRequest) {
//        return foodService.updateFood(id, foodRequest);
//    }
    @PutMapping(path="/{id}", consumes = {"multipart/form-data"})
    @ResponseStatus(HttpStatus.OK)
    public FoodResponse updateFood(@PathVariable String id, @RequestPart("food") FoodRequest foodRequest,
                                   @RequestPart(value="image", required = false) MultipartFile imageFile) {
        if(imageFile != null){
            ResponseEntity<UploadResponseDTO> uploaded = imageClient.upload(imageFile);
            UploadResponseDTO uploadedBody = uploaded.getBody();
            String imageUrl = uploadedBody.getUrl();

            foodRequest = new FoodRequest(
                    foodRequest.id(),
                    foodRequest.description(),
                    foodRequest.f_name(),
                    foodRequest.category(),
                    foodRequest.nutrition_table(),
                    foodRequest.resturant_id(),
                    imageUrl,   // <-- replaced with the uploaded image URL
                    foodRequest.user_id(),
                    foodRequest.price()
            );
        }

        return foodService.updateFood(id, foodRequest);
    }

    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public String deleteFood(@PathVariable String id) {
        return foodService.deleteFood(id);
    }
}

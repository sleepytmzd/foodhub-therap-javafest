package com.nezubytes.restaurant_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nezubytes.restaurant_service.client.QdrantClient;
import com.nezubytes.restaurant_service.dto.RestaurantRequest;
import com.nezubytes.restaurant_service.dto.RestaurantResponse;
import com.nezubytes.restaurant_service.model.Restaurant;
import com.nezubytes.restaurant_service.repository.RestaurantRepositoy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RestaurantService {
    private final RestaurantRepositoy restaurantRepositoy; 

    private final QdrantClient qdrantClient; 

    public RestaurantResponse createRestaurant(RestaurantRequest restaurantRequest){
        Restaurant restaurant = Restaurant.builder()
                                .name(restaurantRequest.name())
                                .location(restaurantRequest.location())
                                .description(restaurantRequest.description())
                                .category(restaurantRequest.category())
                                .weblink(restaurantRequest.weblink())
                                .foodIds(restaurantRequest.foodIdList())
                                .build();
        restaurantRepositoy.save(restaurant); 
        log.info("Restaurant Created Successfully");
        
        qdrantClient.add_point_restaurant(restaurant.getName(), restaurant.getDescription(), restaurant.getLocation(), restaurant.getCategory(), restaurant.getId()); 

        return new RestaurantResponse(restaurant.getId(), restaurant.getName(),restaurant.getLocation(), restaurant.getDescription(), restaurant.getCategory(), restaurant.getWeblink(), restaurant.getFoodIds()); 
                                
    }

    public List<RestaurantResponse> getAllRestaurants(){
        return restaurantRepositoy.findAll()
            .stream()
            .map(restaurant -> new RestaurantResponse(restaurant.getId(), restaurant.getName(),restaurant.getLocation(), restaurant.getDescription(), restaurant.getCategory(), restaurant.getWeblink(), restaurant.getFoodIds()))
            .toList(); 
    }

    public void deleteRestaurant(String restaurantId) {
        if (restaurantRepositoy.existsById(restaurantId)) {
            restaurantRepositoy.deleteById(restaurantId);
            log.info("Restaurant with id {} deleted successfully", restaurantId);
        } else {
            log.warn("Restaurant with id {} not found, cannot delete", restaurantId);
            throw new RuntimeException("Restaurant not found with id: " + restaurantId);
        }
    }

    public RestaurantResponse getRestaurantById(String id) {
        Restaurant restaurant = restaurantRepositoy.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found with id: " + id));
        
        return new RestaurantResponse(
            restaurant.getId(), 
            restaurant.getName(),
            restaurant.getLocation(), 
            restaurant.getDescription(), 
            restaurant.getCategory(), 
            restaurant.getWeblink(), 
            restaurant.getFoodIds()
        );
    }

}

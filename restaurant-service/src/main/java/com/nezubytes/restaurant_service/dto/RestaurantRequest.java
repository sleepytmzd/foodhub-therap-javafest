package com.nezubytes.restaurant_service.dto;

import java.util.List;

public record RestaurantRequest(String name, String location, String description, String category, String weblink, List<String> foodIdList) {

}

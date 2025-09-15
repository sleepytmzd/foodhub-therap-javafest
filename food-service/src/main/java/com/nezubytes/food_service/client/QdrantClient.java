package com.nezubytes.food_service.client;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.PostExchange;

public interface QdrantClient {
    @PostExchange("/add-point-food")
    String add_point_food(@RequestParam String name, @RequestParam String description, @RequestParam String category, @RequestParam String nutrition_table, @RequestParam Integer price, @RequestParam String db_id, @RequestParam String restaurant);
}

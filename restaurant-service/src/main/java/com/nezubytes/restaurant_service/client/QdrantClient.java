package com.nezubytes.restaurant_service.client;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.PostExchange;

public interface  QdrantClient {
    @PostExchange("/add-point-restaurant")
    String add_point_restaurant(@RequestParam String name, @RequestParam String description, @RequestParam String location, @RequestParam String category, @RequestParam String db_id);

}

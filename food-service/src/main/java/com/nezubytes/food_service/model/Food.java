package com.nezubytes.food_service.model;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(value="food")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Food {
    private String id;
    private String description; 
    private String f_name;
    private String category;
    private String nutrition_table; 
    private String resturant_id;
    private String image_url;
    private String user_id;
}

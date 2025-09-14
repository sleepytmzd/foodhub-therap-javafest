package com.nezubytes.restaurant_service.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(value = "restaurants")

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {
    @Id
    private String id;

    private String name;
    private String location;
    private String description;
    private String category;
    private String weblink; 

    // Reference to Food IDs
    private List<String> foodIds;
}

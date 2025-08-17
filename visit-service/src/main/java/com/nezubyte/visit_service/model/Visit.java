package com.nezubyte.visit_service.model;

import java.util.List;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(value="Visit")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Visit {
    private String id; 
    private String userId; 
    private String location; 
    private String time; 
    private String resturantName; 
    private List<String> foods; 
}

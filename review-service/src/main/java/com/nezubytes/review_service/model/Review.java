package com.nezubytes.review_service.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(value="Review")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Review {
    @Id
    private String id; 
    private String title; 
    private String description; 
    private String foodId;
    private String resturantId;
    private String userId; 

    private int reactionCountLike;
    private int reactionCountDislike;

    private List<String> reactionUsersLike;
    private List<String> reactionUsersDislike;

    private List<String> comments; 

    private LocalDateTime createdAt; 
    private LocalDateTime updatedAt;  
}

package com.nezubytes.hangout_service.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(value = "hangout")

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hangout {
    @Id
    private String id; 
    private String message;
    private String userId1;
    private String userId2;
    private String restaurantId;
    private Boolean approvedByUser1;
    private Boolean approvedByUser2;
    private LocalDateTime allocatedTime; 

    private List<String> foodIds; 
}

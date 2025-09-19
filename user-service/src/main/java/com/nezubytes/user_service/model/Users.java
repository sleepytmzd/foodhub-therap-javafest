package com.nezubytes.user_service.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Users {
    @Id
    private String id;
    private String name;
    private String firstName;
    private String lastName;
    private String email;
    private String coverPhoto;
    private String userPhoto;
    private String location;
    private float totalCriticScore;
    private float coins;
    private LocalDateTime createdAt;
    private LocalDateTime lastRechargedAt;
    private List<String> following;
    private List<String> followers;
    private List<String> visits;
    private List<String> criticScoreHistory;
    private List<String> locationRecommendations;
}

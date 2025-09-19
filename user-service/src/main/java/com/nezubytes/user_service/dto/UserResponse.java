package com.nezubytes.user_service.dto;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(String id, String name, String firstName, String lastName, String email, String coverPhoto, String userPhoto, String location, float totalCriticScore, float coins, LocalDateTime createdAt, LocalDateTime lastRechargedAt, List<String> following, List<String> followers, List<String> visits, List<String> criticScoreHistory, List<String> locationRecommendations) {
}

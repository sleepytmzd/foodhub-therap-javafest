package com.nezubytes.user_service.dto;

import java.util.List;

public record UserRequest(String id, String name, String firstName, String lastName, String email, String coverPhoto, String userPhoto, String location, float totalCriticScore, List<String> following, List<String> followers, List<String> visits, List<String> criticScoreHistory, List<String> locationRecommendations) {
}

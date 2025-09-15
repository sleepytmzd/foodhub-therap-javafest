package com.nezubytes.review_service.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ReviewResponse(String id, String title, String description, String foodId, String resturantId, String userId, Integer reactionCountLike, Integer reactionCountDislike, List<String> reactionUsersLike, List<String> reactionUsersDislike, List<String> comments, LocalDateTime createdAt, LocalDateTime updatedAt, String sentiment) {

}

package com.nezubytes.review_service.dto;

import java.time.LocalDateTime;

public record CommentResponse(String id, String reviewId, String userId, String content, LocalDateTime createdAt, LocalDateTime updatedAt) {

}

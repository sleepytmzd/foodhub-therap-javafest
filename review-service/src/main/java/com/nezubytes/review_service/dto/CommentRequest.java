package com.nezubytes.review_service.dto;

import java.time.LocalDateTime;

public record CommentRequest(String id, String reviewId, String userId, String content, LocalDateTime createdAt, LocalDateTime updatedAt) {

}

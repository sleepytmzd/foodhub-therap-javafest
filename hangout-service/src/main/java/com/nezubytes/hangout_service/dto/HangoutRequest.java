package com.nezubytes.hangout_service.dto;
import java.time.LocalDateTime;
import java.util.List;

public record HangoutRequest(String message, String userId1, String userId2, String restaurantId, Boolean approvedByUser1, Boolean approvedByUser2, LocalDateTime allocatedTime,  List<String> foodIds) {

}

package com.nezubyte.visit_service.dto;
import java.util.List;


public record VisitRequest(String id, String userId, String location, String time, String resturantName, List<String> foods) {

}

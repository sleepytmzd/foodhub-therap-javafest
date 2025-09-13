package com.nezubytes.review_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.nezubytes.review_service.dto.ReviewRequest;
import com.nezubytes.review_service.dto.ReviewResponse;
import com.nezubytes.review_service.service.ReviewService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ReviewResponse createReview(@RequestBody ReviewRequest reviewRequest) {
       return reviewService.createReview(reviewRequest);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<ReviewResponse> createReview() {
       return reviewService.getAllResponse();
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ReviewResponse getReviewById(@PathVariable String id) {
        return reviewService.getReviewById(id);
    }

    @GetMapping("/food/{foodId}")
    @ResponseStatus(HttpStatus.OK)
    public List<ReviewResponse> getReviewsByFoodId(@PathVariable String foodId) {
        return reviewService.getReviewsByFoodId(foodId);
    }

    @GetMapping("/user/{userId}")
    @ResponseStatus(HttpStatus.OK)
    public List<ReviewResponse> getReviewsByUserId(@PathVariable String userId) {
        return reviewService.getReviewsByUserId(userId);
    }


    @PutMapping("/{id}")
   @ResponseStatus(HttpStatus.OK)
   public ReviewResponse updateFood(@PathVariable String id, @RequestBody ReviewRequest reviewRequest) {
       return reviewService.updateReview(id, reviewRequest);
   }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@PathVariable String id) {
        reviewService.deleteReview(id);
    }
    
}

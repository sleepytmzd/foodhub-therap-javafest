package com.nezubytes.review_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/restaurant/{restaurantId}")
    @ResponseStatus(HttpStatus.OK)
    public List<ReviewResponse> getReviewsByRestaurantId(@PathVariable String restaurantId) {
        return reviewService.getReviewsByRestaurantId(restaurantId);
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
    
    @PostMapping("/{id}/like/{userId}")
    @ResponseStatus(HttpStatus.OK)
    public ReviewResponse increaseLike(@PathVariable String id, @PathVariable String userId) {
        return reviewService.increaseLike(id, userId);
    }

    @PostMapping("/{id}/dislike/{userId}")
    @ResponseStatus(HttpStatus.OK)
    public ReviewResponse increaseDislike(@PathVariable String id, @PathVariable String userId) {
        return reviewService.increaseDislike(id, userId);
    }

    @DeleteMapping("/{id}/like/{userId}")
    @ResponseStatus(HttpStatus.OK)
    public ReviewResponse decreaseLike(@PathVariable String id, @PathVariable String userId) {
        return reviewService.decreaseLike(id, userId);
    }

    @DeleteMapping("/{id}/dislike/{userId}")
    @ResponseStatus(HttpStatus.OK)
    public ReviewResponse decreaseDislike(@PathVariable String id, @PathVariable String userId) {
        return reviewService.decreaseDislike(id, userId);
    }
}

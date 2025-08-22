package com.nezubytes.review_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
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

   @PutMapping("/{id}")
   @ResponseStatus(HttpStatus.OK)
   public ReviewResponse updateFood(@PathVariable String id, @RequestBody ReviewRequest reviewRequest) {
       return reviewService.updateReview(id, reviewRequest);
   }
    
}

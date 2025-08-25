package com.nezubytes.review_service.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nezubytes.review_service.dto.CommentRequest;
import com.nezubytes.review_service.dto.CommentResponse;
import com.nezubytes.review_service.service.CommentService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/comment")
@RequiredArgsConstructor
public class CommentController {
    private final  CommentService commentService;

    @PostMapping
    public CommentResponse createComment(@RequestBody CommentRequest commentRequest) {
       return commentService.createComment(commentRequest); 
    }

    @GetMapping("/review/{reviewId}")
    public List<CommentResponse> getCommentsByReviewId(@PathVariable String reviewId) {
        return commentService.getCommentsByReviewId(reviewId);
    }

    @PutMapping("/{id}")
    public CommentResponse updateComment(
            @PathVariable String id,
            @RequestBody CommentRequest commentRequest) {
        return commentService.updateComment(id, commentRequest);
    }
    
}

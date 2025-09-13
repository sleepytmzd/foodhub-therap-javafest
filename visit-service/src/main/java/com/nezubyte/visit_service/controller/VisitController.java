package com.nezubyte.visit_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.nezubyte.visit_service.dto.VisitRequest;
import com.nezubyte.visit_service.dto.VisitResponse;
import com.nezubyte.visit_service.service.VisitService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/visit")
@RequiredArgsConstructor
public class VisitController {
    private final VisitService visitService;

    @PostMapping
    public VisitResponse createFood(@RequestBody VisitRequest visitRequest) {
        return visitService.createVisit(visitRequest); 
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<VisitResponse> getAllVisit(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("name");
        System.out.println("username: " + username);
        return visitService.getAllVisit();
    }

    @GetMapping("/{user_id}")
    public List<VisitResponse> getVisitsByUser(@PathVariable String user_id) {
        return visitService.getVisitsByUserId(user_id);
    }

    @GetMapping("/id/{id}")
    @ResponseStatus(HttpStatus.OK)
    public VisitResponse getVisitById(@PathVariable String id) {
        return visitService.getVisitById(id);
    }

    @GetMapping("/restaurant/{restaurantName}")
    @ResponseStatus(HttpStatus.OK)
    public List<VisitResponse> getVisitsByRestaurant(@PathVariable String restaurantName) {
        return visitService.getVisitsByRestaurant(restaurantName);
    }


    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public VisitResponse updateVisit(@PathVariable String id, @RequestBody VisitRequest visitRequest) {
        return visitService.updateVisit(id, visitRequest);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVisit(@PathVariable String id) {
        visitService.deleteVisit(id);
    }

    }

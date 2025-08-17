package com.nezubyte.visit_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
    public List<VisitResponse> getAllVisit() {
        return visitService.getAllVisit();
    }

    @GetMapping("/{user_id}")
    public List<VisitResponse> getVisitsByUser(@PathVariable String user_id) {
        return visitService.getVisitsByUserId(user_id);
    }
        
    }   

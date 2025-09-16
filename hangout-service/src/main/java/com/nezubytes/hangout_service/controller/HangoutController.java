package com.nezubytes.hangout_service.controller;

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

import com.nezubytes.hangout_service.dto.HangoutRequest;
import com.nezubytes.hangout_service.dto.HangoutResponse;
import com.nezubytes.hangout_service.service.HangoutService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/hangout")
@RequiredArgsConstructor
public class HangoutController {
    private final HangoutService hangoutService; 

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HangoutResponse createHangout(@RequestBody HangoutRequest hangoutRequest) {
        return hangoutService.createHangout(hangoutRequest); 
    }

    
    @GetMapping
    public List<HangoutResponse> getAllHangouts() {
        return hangoutService.getAllHangouts();
    }

    
    @GetMapping("/{id}")
    public HangoutResponse getHangoutById(@PathVariable String id) {
        return hangoutService.getHangoutById(id);
    }

    
    @PutMapping("/{id}")
    public HangoutResponse updateHangout(@PathVariable String id, @RequestBody HangoutRequest hangoutRequest) {
        return hangoutService.updateHangout(id, hangoutRequest);
    }

    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHangout(@PathVariable String id) {
        hangoutService.deleteHangout(id);
    }

     
    @GetMapping("/restaurant/{restaurantId}")
    public List<HangoutResponse> getHangoutsByRestaurantId(@PathVariable String restaurantId) {
        return hangoutService.getHangoutsByRestaurantId(restaurantId);
    }

}

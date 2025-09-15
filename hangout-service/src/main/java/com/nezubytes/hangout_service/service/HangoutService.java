package com.nezubytes.hangout_service.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.nezubytes.hangout_service.dto.HangoutRequest;
import com.nezubytes.hangout_service.dto.HangoutResponse;
import com.nezubytes.hangout_service.model.Hangout;
import com.nezubytes.hangout_service.repository.HangoutRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class HangoutService {
    private final HangoutRepository hangoutRepository; 

    public HangoutResponse createHangout(HangoutRequest hangoutRequest){
        Hangout hangout = Hangout.builder()
                           .message(hangoutRequest.message())
                           .userId1(hangoutRequest.userId1())
                           .userId2(hangoutRequest.userId2())
                           .restaurantId(hangoutRequest.restaurantId())
                           .approvedByUser1(hangoutRequest.approvedByUser1())
                           .approvedByUser2(hangoutRequest.approvedByUser2())
                           .allocatedTime(hangoutRequest.allocatedTime())
                           .foodIds(hangoutRequest.foodIds())
                           .build(); 

        hangoutRepository.save(hangout); 

        return new HangoutResponse(hangout.getId(), hangout.getMessage(), hangout.getUserId1(), hangout.getUserId2(), hangout.getRestaurantId(), hangout.getApprovedByUser1(), hangout.getApprovedByUser2(), hangout.getAllocatedTime(), hangout.getFoodIds()); 


    }

    public List<HangoutResponse> getAllHangouts() {
        List<Hangout> hangouts = hangoutRepository.findAll();  
        return hangouts.stream()
                       .map(hangout -> new HangoutResponse(hangout.getId(), hangout.getMessage(), hangout.getUserId1(), hangout.getUserId2(), hangout.getRestaurantId(), hangout.getApprovedByUser1(), hangout.getApprovedByUser2(), hangout.getAllocatedTime(), hangout.getFoodIds()))
                       .collect(Collectors.toList());
    }

     public HangoutResponse getHangoutById(String hangoutId) {
        Hangout hangout = hangoutRepository.findById(hangoutId)
                                           .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hangout with ID " + hangoutId + " not found"));
        return new HangoutResponse(hangout.getId(), hangout.getMessage(), hangout.getUserId1(), hangout.getUserId2(), hangout.getRestaurantId(), hangout.getApprovedByUser1(), hangout.getApprovedByUser2(), hangout.getAllocatedTime(), hangout.getFoodIds());
    }

     
   public HangoutResponse updateHangout(String hangoutId, HangoutRequest hangoutRequest) {
        
        Hangout hangout = hangoutRepository.findById(hangoutId)
                                           .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hangout with ID " + hangoutId + " not found"));

        
        if (hangoutRequest.message() != null) {
            hangout.setMessage(hangoutRequest.message());
        }
        if (hangoutRequest.userId1() != null) {
            hangout.setUserId1(hangoutRequest.userId1());
        }
        if (hangoutRequest.userId2() != null) {
            hangout.setUserId2(hangoutRequest.userId2());
        }
        if (hangoutRequest.restaurantId() != null) {
            hangout.setRestaurantId(hangoutRequest.restaurantId());
        }
        if (hangoutRequest.approvedByUser1() != null) {
            hangout.setApprovedByUser1(hangoutRequest.approvedByUser1());
        }
        if (hangoutRequest.approvedByUser2() != null) {
            hangout.setApprovedByUser2(hangoutRequest.approvedByUser2());
        }
        if (hangoutRequest.allocatedTime() != null) {
            hangout.setAllocatedTime(hangoutRequest.allocatedTime());
        }
        if (hangoutRequest.foodIds() != null) {
            hangout.setFoodIds(hangoutRequest.foodIds());
        }

        
        hangoutRepository.save(hangout);

        
        return new HangoutResponse(hangout.getId(), hangout.getMessage(), hangout.getUserId1(), hangout.getUserId2(), hangout.getRestaurantId(), hangout.getApprovedByUser1(), hangout.getApprovedByUser2(), hangout.getAllocatedTime(), hangout.getFoodIds());
    }

    public void deleteHangout(String hangoutId) {
        Hangout hangout = hangoutRepository.findById(hangoutId)
                                           .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hangout with ID " + hangoutId + " not found"));

        hangoutRepository.delete(hangout);
    }


     // Get Hangouts by Restaurant ID
    public List<HangoutResponse> getHangoutsByRestaurantId(String restaurantId) {
        List<Hangout> hangouts = hangoutRepository.findByRestaurantId(restaurantId);
        return hangouts.stream()
                       .map(hangout -> new HangoutResponse(hangout.getId(), hangout.getMessage(), hangout.getUserId1(), hangout.getUserId2(), hangout.getRestaurantId(), hangout.getApprovedByUser1(), hangout.getApprovedByUser2(), hangout.getAllocatedTime(), hangout.getFoodIds()))
                       .collect(Collectors.toList());
    }

}

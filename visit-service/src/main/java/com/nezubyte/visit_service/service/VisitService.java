package com.nezubyte.visit_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nezubyte.visit_service.dto.VisitRequest;
import com.nezubyte.visit_service.dto.VisitResponse;
import com.nezubyte.visit_service.model.Visit;
import com.nezubyte.visit_service.repository.VisitRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitService {
    private final VisitRepository visitRepository; 

    public VisitResponse createVisit(VisitRequest visitRequest){
        Visit visit = Visit.builder()
            .location(visitRequest.location())
            .time(visitRequest.time())
            .resturantName(visitRequest.resturantName())
            .foods(visitRequest.foods())
            .userId(visitRequest.userId())
            .build(); 
        
        visitRepository.save(visit); 
        return new VisitResponse(
            visit.getId(),
            visit.getUserId(),
            visit.getLocation(),
            visit.getTime(),
            visit.getResturantName(),
            visit.getFoods()
            );
    }

    public List<VisitResponse> getAllVisit() {
         return visitRepository.findAll()
                .stream()
                .map(visit -> new VisitResponse(
                    visit.getId(),
                    visit.getUserId(),
                    visit.getLocation(),
                    visit.getTime(),
                    visit.getResturantName(),
                    visit.getFoods()
                    ))
                .toList();
    }

    public List<VisitResponse> getVisitsByUserId(String user_id) {
    return visitRepository.findByUserId(user_id)
            .stream()
            .map(visit -> new VisitResponse(
                    visit.getId(),
                    visit.getUserId(),
                    visit.getLocation(),
                    visit.getTime(),
                    visit.getResturantName(),
                    visit.getFoods()
                    ))
                .toList();
    }

    public VisitResponse updateVisit(String id, VisitRequest visitRequest) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visit not found with id: " + id));

        if (visitRequest.location() != null)
            visit.setLocation(visitRequest.location());

        if (visitRequest.time() != null)
            visit.setTime(visitRequest.time());

        if (visitRequest.resturantName() != null)
            visit.setResturantName(visitRequest.resturantName());

        if (visitRequest.foods() != null && !visitRequest.foods().isEmpty())
            visit.setFoods(visitRequest.foods());

        if (visitRequest.userId() != null)
            visit.setUserId(visitRequest.userId());

        Visit updatedVisit = visitRepository.save(visit);

        return new VisitResponse(
                updatedVisit.getId(),
                updatedVisit.getUserId(),
                updatedVisit.getLocation(),
                updatedVisit.getTime(),
                updatedVisit.getResturantName(),
                updatedVisit.getFoods()
        );
    }

    public void deleteVisit(String id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visit not found with id: " + id));
        visitRepository.delete(visit);
    }

    public VisitResponse getVisitById(String id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visit not found with id: " + id));

        return new VisitResponse(
                visit.getId(),
                visit.getUserId(),
                visit.getLocation(),
                visit.getTime(),
                visit.getResturantName(),
                visit.getFoods()
        );
    }

    public List<VisitResponse> getVisitsByRestaurant(String restaurantName) {
        return visitRepository.findByResturantName(restaurantName)
                .stream()
                .map(visit -> new VisitResponse(
                        visit.getId(),
                        visit.getUserId(),
                        visit.getLocation(),
                        visit.getTime(),
                        visit.getResturantName(),
                        visit.getFoods()
                ))
                .toList();
    }



}

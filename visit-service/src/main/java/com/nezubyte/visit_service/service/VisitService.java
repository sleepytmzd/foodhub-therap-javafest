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
}

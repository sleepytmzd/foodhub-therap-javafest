package com.nezubyte.visit_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.nezubyte.visit_service.model.Visit;

public interface VisitRepository extends  MongoRepository<Visit, String> {
    List<Visit> findByUserId(String user_id);
}

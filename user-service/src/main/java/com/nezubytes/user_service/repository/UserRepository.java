package com.nezubytes.user_service.repository;

import com.nezubytes.user_service.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<Users, String> {
}

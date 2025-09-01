package com.nezubytes.user_service.service;

import com.nezubytes.user_service.dto.UserRequest;
import com.nezubytes.user_service.dto.UserResponse;
import com.nezubytes.user_service.model.Users;
import com.nezubytes.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;

    public UserResponse createUser(UserRequest userRequest) {
        Users user = mapToEntity(userRequest);
        userRepository.save(user);
        return mapToResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(String id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found with id: " + id
                ));
        return mapToResponse(user);
    }

    public UserResponse updateUser(String id, UserRequest userRequest) {
        Users existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        existingUser.setName(userRequest.name());
        existingUser.setFirstName(userRequest.firstName());
        existingUser.setLastName(userRequest.lastName());
        existingUser.setEmail(userRequest.email());
        existingUser.setUserPhoto(userRequest.userPhoto());
        existingUser.setCoverPhoto(userRequest.coverPhoto());
        existingUser.setLocation(userRequest.location());
        existingUser.setTotalCriticScore(userRequest.totalCriticScore());
        existingUser.setFollowers(userRequest.followers());
        existingUser.setFollowing(userRequest.following());
        existingUser.setVisits(userRequest.visits());
        existingUser.setCriticScoreHistory(userRequest.criticScoreHistory());
        existingUser.setLocationRecommendations(userRequest.locationRecommendations());

        userRepository.save(existingUser);
        return mapToResponse(existingUser);
    }

    // Delete User
    public String deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
        return "User deleted successfully";
    }


    private Users mapToEntity(UserRequest request) {
        return Users.builder()
                .id(request.id())
                .name(request.name())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .userPhoto(request.userPhoto())
                .coverPhoto(request.coverPhoto())
                .location(request.location())
                .totalCriticScore(request.totalCriticScore())
                .followers(request.followers())
                .following(request.following())
                .visits(request.visits())
                .criticScoreHistory(request.criticScoreHistory())
                .locationRecommendations(request.locationRecommendations())
                .build();
    }

    private UserResponse mapToResponse(Users user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getCoverPhoto(),
                user.getUserPhoto(),
                user.getLocation(),
                user.getTotalCriticScore(),
                user.getFollowing(),
                user.getFollowers(),
                user.getVisits(),
                user.getCriticScoreHistory(),
                user.getLocationRecommendations()
        );
    }
}

package com.nezubytes.user_service.controller;

import com.nezubytes.user_service.client.ImageClient;
import com.nezubytes.user_service.dto.UploadResponseDTO;
import com.nezubytes.user_service.dto.UserRequest;
import com.nezubytes.user_service.dto.UserResponse;
import com.nezubytes.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final ImageClient imageClient;

//    @PostMapping(consumes = {"multipart/form-data"})
    @PostMapping()
    @ResponseStatus(HttpStatus.CREATED)
//    public UserResponse createUser(@RequestPart("user")UserRequest userRequest, @RequestPart("userPhoto")MultipartFile userPhoto, @RequestPart("coverPhoto")MultipartFile coverPhoto, @AuthenticationPrincipal Jwt jwt){
    public UserResponse createUser(@RequestBody UserRequest userRequest, @AuthenticationPrincipal Jwt jwt){
//        ResponseEntity<UploadResponseDTO> uploadedUserPhoto = imageClient.upload(userPhoto);
//        UploadResponseDTO uploadedUserPhotoBody = uploadedUserPhoto.getBody();
//        String userPhotoUrl = uploadedUserPhotoBody.getUrl();
//
//        ResponseEntity<UploadResponseDTO> uploadedCoverPhoto = imageClient.upload(coverPhoto);
//        UploadResponseDTO uploadedCoverPhotoBody = uploadedCoverPhoto.getBody();
//        String coverPhotoUrl = uploadedCoverPhotoBody.getUrl();

        UserRequest updatedRequest = new UserRequest(
                userRequest.id(),
                userRequest.name(),
                userRequest.firstName(),
                userRequest.lastName(),
                userRequest.email(),
//                coverPhotoUrl,
//                userPhotoUrl,
                userRequest.coverPhoto(),
                userRequest.userPhoto(),
                userRequest.location(),
                userRequest.totalCriticScore(),
                userRequest.following(),
                userRequest.followers(),
                userRequest.visits(),
                userRequest.criticScoreHistory(),
                userRequest.locationRecommendations()
        );
        return userService.createUser(updatedRequest);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<UserResponse> getAllUsers(){
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public UserResponse getUserById(@PathVariable String id) {
        return userService.getUserById(id);
    }


    @PutMapping(path="/{id}", consumes = {"multipart/form-data"})
    @ResponseStatus(HttpStatus.OK)
    public UserResponse updateUser(@PathVariable String id, @RequestPart("user")UserRequest userRequest, @RequestPart("userPhoto")MultipartFile userPhoto, @RequestPart("coverPhoto")MultipartFile coverPhoto, @AuthenticationPrincipal Jwt jwt){
        String userPhotoUrl = userRequest.userPhoto();
        String coverPhotoUrl = userRequest.coverPhoto();
        if(userPhoto != null && !userPhoto.isEmpty()){
            ResponseEntity<UploadResponseDTO> uploadedUserPhoto = imageClient.upload(userPhoto);
            UploadResponseDTO uploadedUserPhotoBody = uploadedUserPhoto.getBody();
            userPhotoUrl = uploadedUserPhotoBody.getUrl();
        }
        if(coverPhoto != null && !coverPhoto.isEmpty()){
            ResponseEntity<UploadResponseDTO> uploadedCoverPhoto = imageClient.upload(coverPhoto);
            UploadResponseDTO uploadedCoverPhotoBody = uploadedCoverPhoto.getBody();
            coverPhotoUrl = uploadedCoverPhotoBody.getUrl();
        }
        userRequest = new UserRequest(
                userRequest.id(),
                userRequest.name(),
                userRequest.firstName(),
                userRequest.lastName(),
                userRequest.email(),
                coverPhotoUrl,
                userPhotoUrl,
                userRequest.location(),
                userRequest.totalCriticScore(),
                userRequest.following(),
                userRequest.followers(),
                userRequest.visits(),
                userRequest.criticScoreHistory(),
                userRequest.locationRecommendations()
        );
        return userService.updateUser(id, userRequest);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public String deleteUser(@PathVariable String id){
        return userService.deleteUser(id);
    }
}

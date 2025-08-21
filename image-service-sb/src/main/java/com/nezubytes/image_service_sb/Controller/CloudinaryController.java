package com.nezubytes.image_service_sb.Controller;

import com.nezubytes.image_service_sb.Model.UploadResponseDTO;
import com.nezubytes.image_service_sb.Service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/image")
public class CloudinaryController {
    @Autowired
    private CloudinaryService cloudinaryService;


    @PostMapping("/upload")
    public ResponseEntity<UploadResponseDTO> upload(@RequestParam("file") MultipartFile file){
        try {
            String imageUrl = cloudinaryService.uploadFile(file);
            return ResponseEntity.ok(new UploadResponseDTO(imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new UploadResponseDTO("Upload failed: " + e.getMessage()));
        }
    }
}

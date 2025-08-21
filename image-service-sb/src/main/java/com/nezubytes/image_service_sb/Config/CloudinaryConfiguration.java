package com.nezubytes.image_service_sb.Config;

import com.cloudinary.Cloudinary;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfiguration {
    @Value("${cloudinary.url}")
    private String cloudinaryUrl;
    @Bean
    public Cloudinary cloudinary(){
        Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
        System.out.println("Connected to cloudinary!\n" + cloudinary.config.cloudName);
        return cloudinary;
    }
}

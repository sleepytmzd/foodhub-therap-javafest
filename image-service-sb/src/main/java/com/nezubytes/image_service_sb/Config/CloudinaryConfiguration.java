package com.nezubytes.image_service_sb.Config;

import com.cloudinary.Cloudinary;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfiguration {
    @Bean
    public Cloudinary cloudinary(){
        Dotenv dotenv = Dotenv.load();
        Cloudinary cloudinary = new Cloudinary(dotenv.get("CLOUDINARY_URL"));
        System.out.println("Connected to cloudinary!\n" + cloudinary.config.cloudName);
        return cloudinary;
    }
}

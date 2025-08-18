package com.nezubytes.image_service_sb.Config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class CloudinaryConfiguration {
//    private final Environment environment;
//
//    public CloudinaryConfiguration(Environment environment) {
//        this.environment = environment;
//    }
@Value("${cloudinary.url}")
private String cloudinaryUrl;
    @Bean
    public Cloudinary cloudinary(){
//        Dotenv dotenv = Dotenv.load();
//        Cloudinary cloudinary = new Cloudinary(dotenv.get("CLOUDINARY_URL"));
//        Cloudinary cloudinary = new Cloudinary(environment.getProperty("cloudinary.url"));
        Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
        System.out.println("Connected to cloudinary!\n" + cloudinary.config.cloudName);
        return cloudinary;
    }
}

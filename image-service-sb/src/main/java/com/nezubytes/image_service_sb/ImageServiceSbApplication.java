package com.nezubytes.image_service_sb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class ImageServiceSbApplication {

	public static void main(String[] args) {
		SpringApplication.run(ImageServiceSbApplication.class, args);
	}

}

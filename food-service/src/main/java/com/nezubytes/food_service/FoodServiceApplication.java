package com.nezubytes.food_service;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class FoodServiceApplication {

	public static void main(String[] args) {
//		Dotenv dotenv = Dotenv.load(); // Loads from .env in the current directory
//		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		SpringApplication.run(FoodServiceApplication.class, args);
	}

}

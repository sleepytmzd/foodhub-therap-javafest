package com.nezubytes.restaurant_service;

import org.springframework.boot.SpringApplication;

public class TestRestaurantServiceApplication {

	public static void main(String[] args) {
		SpringApplication.from(RestaurantServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}

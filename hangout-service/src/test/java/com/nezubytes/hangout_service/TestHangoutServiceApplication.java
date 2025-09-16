package com.nezubytes.hangout_service;

import org.springframework.boot.SpringApplication;

public class TestHangoutServiceApplication {

	public static void main(String[] args) {
		SpringApplication.from(HangoutServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}

package com.nezubyte.visit_service;

import org.springframework.boot.SpringApplication;

public class TestVisitServiceApplication {

	public static void main(String[] args) {
		SpringApplication.from(VisitServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}

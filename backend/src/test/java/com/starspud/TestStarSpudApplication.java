package com.starspud;

import org.springframework.boot.SpringApplication;

public class TestStarSpudApplication {

	public static void main(String[] args) {
		SpringApplication.from(StarSpudApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}

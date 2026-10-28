package dev.alvarodevicente.b2borders;

import org.springframework.boot.SpringApplication;

public class TestB2bOrdersApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(B2bOrdersApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}

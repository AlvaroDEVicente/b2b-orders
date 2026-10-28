package dev.alvarodevicente.b2borders;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class B2bOrdersApiApplicationTests {

	@Test
	void contextLoads() {
	}

}

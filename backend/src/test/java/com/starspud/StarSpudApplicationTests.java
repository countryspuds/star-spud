package com.starspud;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.testcontainers.junit.jupiter.Testcontainers;

// Docker가 꺼져 있으면 실패 대신 건너뜁니다.
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class StarSpudApplicationTests {

	@Test
	void contextLoads() {
	}

}

package com.datapulse;

import com.datapulse.identity.Rudra24BKT0125Identity;
import com.datapulse.identity.Udiksha24BAI0086Identity;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DataPulseApplication {
    public static void main(String[] args) {
        SpringApplication.run(DataPulseApplication.class, args);
    }

    @Bean
    CommandLineRunner teamIdentityOutput(
            Rudra24BKT0125Identity rudra24BKT0125,
            Udiksha24BAI0086Identity udiksha24BAI0086) {
        return args -> {
            System.out.println(rudra24BKT0125.printRudra24BKT0125Identity());
            System.out.println(udiksha24BAI0086.printUdiksha24BAI0086Identity());
        };
    }
}

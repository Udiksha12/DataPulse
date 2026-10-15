package com.datapulse.security;

import com.datapulse.domain.RoleEntity;
import com.datapulse.domain.UserEntity;
import com.datapulse.repository.RoleRepository;
import com.datapulse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SeedUsers {
    @Bean
    ApplicationRunner seedDemoUsers(
            RoleRepository roles,
            UserRepository users,
            PasswordEncoder passwordEncoder,
            @Value("${datapulse.seed.admin-email:}") String adminEmail,
            @Value("${datapulse.seed.admin-password:}") String adminPassword,
            @Value("${datapulse.seed.analyst-email:}") String analystEmail,
            @Value("${datapulse.seed.analyst-password:}") String analystPassword,
            @Value("${datapulse.seed.rudra-email:}") String rudraEmail,
            @Value("${datapulse.seed.rudra-password:}") String rudraPassword) {
        return args -> {
            RoleEntity adminRole = roles.findByRoleName("ADMIN").orElseGet(() -> saveRole(roles, "ADMIN", "Manages all users and datasets."));
            RoleEntity analystRole = roles.findByRoleName("ANALYST").orElseGet(() -> saveRole(roles, "ANALYST", "Manages owned datasets and validation runs."));
            createIfConfigured(users, passwordEncoder, adminRole, adminEmail, adminPassword, "Udiksha Agarwal (24BAI0086)");
            createIfConfigured(users, passwordEncoder, analystRole, analystEmail, analystPassword, "Bakya (24BAI0071)");
            createIfConfigured(users, passwordEncoder, analystRole, rudraEmail, rudraPassword, "Rudra (24BKT0125)");
        };
    }

    private RoleEntity saveRole(RoleRepository roles, String name, String description) {
        RoleEntity role = new RoleEntity();
        role.setRoleName(name);
        role.setDescription(description);
        return roles.save(role);
    }

    private void createIfConfigured(UserRepository users, PasswordEncoder encoder, RoleEntity role,
                                    String email, String password, String fullName) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) return;
        users.findByEmailIgnoreCase(email).orElseGet(() -> {
            UserEntity user = new UserEntity();
            user.setRole(role);
            user.setFullName(fullName);
            user.setEmail(email.trim().toLowerCase());
            user.setPasswordHash(encoder.encode(password));
            user.setActive(true);
            return users.save(user);
        });
    }
}

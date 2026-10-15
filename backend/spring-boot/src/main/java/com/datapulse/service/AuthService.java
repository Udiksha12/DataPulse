package com.datapulse.service;

import com.datapulse.api.ApiDtos;
import com.datapulse.api.ApiException;
import com.datapulse.domain.UserEntity;
import com.datapulse.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
    }

    @Transactional(readOnly = true)
    public ApiDtos.AuthResponse login(ApiDtos.LoginRequest request) {
        UserEntity user = users.findByEmailIgnoreCase(request.email().trim())
                .filter(UserEntity::isActive)
                .orElseThrow(() -> ApiException.unauthorized("Email or password is incorrect."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Email or password is incorrect.");
        }

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("datapulse")
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofHours(3)))
                .subject(user.getUserId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("roles", List.of("ROLE_" + user.getRole().getRoleName()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new ApiDtos.AuthResponse(token, userView(user));
    }

    @Transactional(readOnly = true)
    public ApiDtos.UserView currentUser(Jwt jwt) {
        long userId;
        try {
            userId = Long.parseLong(jwt.getSubject());
        } catch (NumberFormatException ex) {
            throw ApiException.unauthorized("The session is invalid. Please sign in again.");
        }
        UserEntity user = users.findById(userId)
                .filter(UserEntity::isActive)
                .orElseThrow(() -> ApiException.unauthorized("This account is unavailable."));
        return userView(user);
    }

    private ApiDtos.UserView userView(UserEntity user) {
        return new ApiDtos.UserView(user.getUserId(), user.getFullName(), user.getEmail(), user.getRole().getRoleName());
    }
}

package com.datapulse.api;

import com.datapulse.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiDtos.AuthResponse login(@Valid @RequestBody ApiDtos.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public ApiDtos.UserView me(@AuthenticationPrincipal Jwt jwt) {
        return authService.currentUser(jwt);
    }

    @PostMapping("/logout")
    public ApiDtos.LogoutResponse logout() {
        // JWTs are stateless; the client must clear its local token.
        return new ApiDtos.LogoutResponse(true);
    }
}

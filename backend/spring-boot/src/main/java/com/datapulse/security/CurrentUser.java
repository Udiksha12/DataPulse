package com.datapulse.security;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

public final class CurrentUser {
    private CurrentUser() { }

    public static long id(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }

    public static boolean isAdmin(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        return roles != null && roles.contains("ROLE_ADMIN");
    }
}

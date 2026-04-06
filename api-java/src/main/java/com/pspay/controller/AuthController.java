package com.pspay.controller;

import com.pspay.config.JwtService;
import com.pspay.entity.User;
import com.pspay.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email и пароль обязательны"));
        }

        return userRepo.findByEmail(email)
                .filter(u -> encoder.matches(password, u.getPasswordHash()))
                .map(u -> {
                    String token = jwtService.generateToken(u.getId(), u.getEmail());
                    return ResponseEntity.ok(Map.of(
                            "token", token,
                            "user", Map.of("id", u.getId(), "email", u.getEmail(), "fullName", u.getFullName())
                    ));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Неверный email или пароль")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String fullName = body.get("fullName");
        if (email == null || password == null || fullName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Все поля обязательны"));
        }

        if (userRepo.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Пользователь с таким email уже существует"));
        }

        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        u.setFullName(fullName);
        userRepo.save(u);

        String token = jwtService.generateToken(u.getId(), u.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "user", Map.of("id", u.getId(), "email", u.getEmail(), "fullName", u.getFullName())
        ));
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request) {
        return Map.of("message", "Выход выполнен");
    }
}

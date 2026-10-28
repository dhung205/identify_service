package com.duyhung.identify_service.service;

import com.duyhung.identify_service.dto.response.AuthenticationResponse;
import com.duyhung.identify_service.entity.OAuth2LoginTicket;
import com.duyhung.identify_service.entity.User;
import com.duyhung.identify_service.exception.AppException;
import com.duyhung.identify_service.exception.ErrorCode;
import com.duyhung.identify_service.repository.OAuth2LoginTicketRepository;
import com.duyhung.identify_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class OAuth2LoginService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long TICKET_LIFETIME_SECONDS = 120;

    private final OAuth2LoginTicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final AuthenticationService authenticationService;

    public String issueTicket(String userId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawTicket = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        ticketRepository.save(OAuth2LoginTicket.builder()
                .id(sha256(rawTicket))
                .userId(userId)
                .expiresAt(Instant.now().plusSeconds(TICKET_LIFETIME_SECONDS))
                .build());
        return rawTicket;
    }

    @Transactional
    public AuthenticationResponse exchange(String rawTicket) {
        if (rawTicket == null || rawTicket.isBlank()) throw new AppException(ErrorCode.UNAUTHENTICATED);
        String digest = sha256(rawTicket);
        OAuth2LoginTicket ticket = ticketRepository.findById(digest)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        if (ticketRepository.consumeIfValid(digest, Instant.now()) != 1)
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        User user = userRepository.findById(ticket.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        return authenticationService.authenticateOAuthUser(user);
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}

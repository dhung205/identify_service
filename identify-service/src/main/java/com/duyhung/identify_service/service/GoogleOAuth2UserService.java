package com.duyhung.identify_service.service;

import com.duyhung.identify_service.entity.Role;
import com.duyhung.identify_service.entity.User;
import com.duyhung.identify_service.repository.RoleRepository;
import com.duyhung.identify_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User googleUser = super.loadUser(request);
        User user = persistUser(googleUser.getAttributes());
        return new DefaultOAuth2User(
                java.util.Set.of(new SimpleGrantedAuthority("ROLE_USER")),
                Map.of("id", user.getId(), "sub", user.getGoogleId()),
                "sub");
    }

    @Transactional
    public OidcUser loadOidcUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        OidcUser googleUser = new OidcUserService().loadUser(request);
        persistUser(googleUser.getAttributes());
        return new DefaultOidcUser(googleUser.getAuthorities(), googleUser.getIdToken(), "sub");
    }

    private User persistUser(Map<String, Object> attributes) {
        String googleId = text(attributes.get("sub"));
        String email = text(attributes.get("email"));
        Object verified = attributes.get("email_verified");
        if (googleId == null || email == null || !Boolean.TRUE.equals(verified)) {
            throw new AuthenticationServiceException("Google account must provide a verified email and subject");
        }

        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        User user = userRepository.findByGoogleId(googleId).orElseGet(() -> {
            User existing = userRepository.findByUsername(normalizedEmail).orElse(null);
            if (existing != null && existing.getGoogleId() != null) {
                throw new AuthenticationServiceException("Email is already linked to another Google account");
            }
            if (existing != null) {
                existing.setGoogleId(googleId);
                existing.setEmail(normalizedEmail);
                return existing;
            }

            Role defaultRole = roleRepository.findById(com.duyhung.identify_service.enums.Role.USER.name())
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name(com.duyhung.identify_service.enums.Role.USER.name())
                            .description("Default user role")
                            .permissions(new HashSet<>())
                            .build()));
            return User.builder()
                    .username(normalizedEmail)
                    .email(normalizedEmail)
                    .googleId(googleId)
                    .firstName(text(attributes.get("given_name")))
                    .lastName(text(attributes.get("family_name")))
                    .roles(new HashSet<>(java.util.Set.of(defaultRole)))
                    .build();
        });
        return userRepository.save(user);
    }

    private String text(Object value) {
        return value instanceof String string && !string.isBlank() ? string : null;
    }
}

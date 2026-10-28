package com.duyhung.identify_service.configuration;

import com.duyhung.identify_service.repository.UserRepository;
import com.duyhung.identify_service.service.OAuth2LoginService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class GoogleOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final UserRepository userRepository;
    private final OAuth2LoginService loginService;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String googleId = principal.getAttribute("sub");
        String userId = userRepository.findByGoogleId(googleId)
                .orElseThrow(() -> new ServletException("OAuth2 account was not persisted")).getId();
        String ticket = loginService.issueTicket(userId);
        response.setHeader("Referrer-Policy", "no-referrer");
        getRedirectStrategy().sendRedirect(request, response, UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("code", ticket).build().encode().toUriString());
    }
}

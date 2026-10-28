package com.duyhung.identify_service.controller;

import com.duyhung.identify_service.dto.request.ApiResponse;
import com.duyhung.identify_service.dto.request.OAuth2ExchangeRequest;
import com.duyhung.identify_service.dto.response.AuthenticationResponse;
import com.duyhung.identify_service.service.OAuth2LoginService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {
    private final OAuth2LoginService loginService;

    @PostMapping("/exchange")
    public ApiResponse<AuthenticationResponse> exchange(@RequestBody OAuth2ExchangeRequest request) {
        return ApiResponse.<AuthenticationResponse>builder()
                .result(loginService.exchange(request.getCode()))
                .build();
    }
}

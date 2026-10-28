package com.duyhung.identify_service.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OAuth2ExchangeRequest {
    private String code;
}

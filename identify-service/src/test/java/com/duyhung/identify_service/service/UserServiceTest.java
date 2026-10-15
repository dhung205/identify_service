package com.duyhung.identify_service.service;


import com.duyhung.identify_service.dto.request.UserCreationRequest;
import com.duyhung.identify_service.dto.response.UserResponse;
import com.duyhung.identify_service.entity.User;
import com.duyhung.identify_service.exception.AppException;
import com.duyhung.identify_service.repository.UserRepository;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;


import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@TestPropertySource("/test.properties")
public class UserServiceTest {
    @Autowired
    private UserService userService;

    @MockitoBean
    private UserRepository userRepository;

    private UserCreationRequest request;
    private UserResponse userResponse;
    private User user;
    private LocalDate dob;

    @BeforeEach
    void initData() {
        dob = LocalDate.of(1990, 1, 1);

        request = UserCreationRequest.builder()
                .username("hung")
                .firstName("Hung")
                .lastName("Duc")
                .password("12345678")
                .dob(dob)
                .build();

        userResponse = UserResponse.builder()
                .id("5e7b15715c4b")
                .username("hung")
                .firstName("Hung")
                .lastName("Duc")
                .dob(dob)
                .build();

        user = User.builder()
                .id("5e7b15715c4b")
                .username("hung")
                .firstName("Hung")
                .lastName("Duc")
                .dob(dob)
                .build();

    }

    @Test
    void createUser_validRequest_success() throws Exception {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(user);

        // When
        var response = userService.createUser(request);

        // Then
        Assertions.assertThat(response.getId()).isEqualTo("5e7b15715c4b");
        Assertions.assertThat(response.getUsername()).isEqualTo("hung");


    }

    @Test
    void createUser_userExisted_fail() throws Exception {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        // When
        var exception = assertThrows(AppException.class,
                () -> userService.createUser(request));

        Assertions.assertThat(exception.getErrorCode().getCode())
                .isEqualTo(1002);
    }

    @Test
    @WithMockUser(username = "hung")
    void getMyInfo_valid_success() {
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(user));
        var reponse = userService.getMyInfo();
        Assertions.assertThat(reponse.getUsername()).isEqualTo("hung");
        Assertions.assertThat(reponse.getId()).isEqualTo("5e7b15715c4b");


    }

    @Test
    @WithMockUser(username = "hung")
    void getMyInfo_userNotFound_error() {
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.ofNullable(null));

        // When
        var exception = assertThrows(AppException.class,
                () -> userService.getMyInfo());

        Assertions.assertThat(exception.getErrorCode().getCode()).isEqualTo(1005);

    }
}

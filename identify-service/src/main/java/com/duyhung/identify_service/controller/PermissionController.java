package com.duyhung.identify_service.controller;


import com.duyhung.identify_service.dto.request.ApiResponse;
import com.duyhung.identify_service.dto.request.PermissionRequest;
import com.duyhung.identify_service.dto.response.PermissionRespone;
import com.duyhung.identify_service.service.PermissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class PermissionController {
    PermissionService permissionService;

    @PostMapping
    ApiResponse<PermissionRespone> create(@RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionRespone>builder()
                .result(permissionService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<PermissionRespone>> getAll() {
        return ApiResponse.<List<PermissionRespone>>builder()
                .result(permissionService.getAll())
                .build();
    }

    @DeleteMapping("/{permisson}")
    ApiResponse<Void> delete(@PathVariable String permisson) {
        permissionService.delete(permisson);
        return ApiResponse.<Void>builder().build();
    }
}

package com.duyhung.identify_service.service;


import com.duyhung.identify_service.dto.request.PermissionRequest;
import com.duyhung.identify_service.dto.response.PermissionRespone;
import com.duyhung.identify_service.entity.Permission;
import com.duyhung.identify_service.mapper.PermissionMapper;
import com.duyhung.identify_service.repository.PermissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class PermissionService {

    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    public PermissionRespone create(PermissionRequest request) {
        Permission permission = permissionMapper.toPermission(request);
        permission = permissionRepository.save(permission);
        return permissionMapper.toPermissionRespone(permission);
    }

    public List<PermissionRespone> getAll() {
        var permisions = permissionRepository.findAll();
        return permisions.stream().map(permissionMapper::toPermissionRespone).toList();
    }

    public void delete(String permisson) {
        permissionRepository.deleteById(permisson);
    }

}

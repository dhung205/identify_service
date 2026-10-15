package com.duyhung.identify_service.service;


import com.duyhung.identify_service.dto.request.RoleRequest;
import com.duyhung.identify_service.dto.response.RoleRespone;
import com.duyhung.identify_service.mapper.RoleMapper;
import com.duyhung.identify_service.repository.PermissionRepository;
import com.duyhung.identify_service.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    public RoleRespone create(RoleRequest request) {
        var role = roleMapper.torole(request);

        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));

        role = roleRepository.save(role);
        return roleMapper.toRoleRespone(role);
    }

    public List<RoleRespone> getAll() {
        return roleRepository.findAll()
                .stream()
                .map(roleMapper::toRoleRespone)
                .toList();
    }

    public void delete(String role) {
        roleRepository.deleteById(role);
    }
}

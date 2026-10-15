package com.duyhung.identify_service.mapper;

import com.duyhung.identify_service.dto.request.PermissionRequest;
import com.duyhung.identify_service.dto.response.PermissionRespone;
import com.duyhung.identify_service.entity.Permission;
import org.mapstruct.Mapper;


@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);
    PermissionRespone toPermissionRespone(Permission permission);
}

package com.duyhung.identify_service.mapper;

import com.duyhung.identify_service.dto.request.RoleRequest;
import com.duyhung.identify_service.dto.response.RoleRespone;
import com.duyhung.identify_service.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "permissions", ignore = true)
    Role torole(RoleRequest request);

    RoleRespone toRoleRespone(Role role);
}

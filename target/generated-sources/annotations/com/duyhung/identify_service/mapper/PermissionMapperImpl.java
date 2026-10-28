package com.duyhung.identify_service.mapper;

import com.duyhung.identify_service.dto.request.PermissionRequest;
import com.duyhung.identify_service.dto.response.PermissionRespone;
import com.duyhung.identify_service.entity.Permission;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-22T16:17:36+0700",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.6 (Oracle Corporation)"
)
@Component
public class PermissionMapperImpl implements PermissionMapper {

    @Override
    public Permission toPermission(PermissionRequest request) {
        if ( request == null ) {
            return null;
        }

        Permission.PermissionBuilder permission = Permission.builder();

        permission.name( request.getName() );
        permission.description( request.getDescription() );

        return permission.build();
    }

    @Override
    public PermissionRespone toPermissionRespone(Permission permission) {
        if ( permission == null ) {
            return null;
        }

        PermissionRespone.PermissionResponeBuilder permissionRespone = PermissionRespone.builder();

        permissionRespone.name( permission.getName() );
        permissionRespone.description( permission.getDescription() );

        return permissionRespone.build();
    }
}

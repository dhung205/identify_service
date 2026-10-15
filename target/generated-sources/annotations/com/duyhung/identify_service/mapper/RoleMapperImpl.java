package com.duyhung.identify_service.mapper;

import com.duyhung.identify_service.dto.request.RoleRequest;
import com.duyhung.identify_service.dto.response.PermissionRespone;
import com.duyhung.identify_service.dto.response.RoleRespone;
import com.duyhung.identify_service.entity.Permission;
import com.duyhung.identify_service.entity.Role;
import java.util.LinkedHashSet;
import java.util.Set;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-14T13:36:16+0700",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.6 (Oracle Corporation)"
)
@Component
public class RoleMapperImpl implements RoleMapper {

    @Override
    public Role torole(RoleRequest request) {
        if ( request == null ) {
            return null;
        }

        Role.RoleBuilder role = Role.builder();

        role.name( request.getName() );
        role.description( request.getDescription() );

        return role.build();
    }

    @Override
    public RoleRespone toRoleRespone(Role role) {
        if ( role == null ) {
            return null;
        }

        RoleRespone.RoleResponeBuilder roleRespone = RoleRespone.builder();

        roleRespone.name( role.getName() );
        roleRespone.description( role.getDescription() );
        roleRespone.permissions( permissionSetToPermissionResponeSet( role.getPermissions() ) );

        return roleRespone.build();
    }

    protected PermissionRespone permissionToPermissionRespone(Permission permission) {
        if ( permission == null ) {
            return null;
        }

        PermissionRespone.PermissionResponeBuilder permissionRespone = PermissionRespone.builder();

        permissionRespone.name( permission.getName() );
        permissionRespone.description( permission.getDescription() );

        return permissionRespone.build();
    }

    protected Set<PermissionRespone> permissionSetToPermissionResponeSet(Set<Permission> set) {
        if ( set == null ) {
            return null;
        }

        Set<PermissionRespone> set1 = new LinkedHashSet<PermissionRespone>( Math.max( (int) ( set.size() / .75f ) + 1, 16 ) );
        for ( Permission permission : set ) {
            set1.add( permissionToPermissionRespone( permission ) );
        }

        return set1;
    }
}

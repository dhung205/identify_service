package com.duyhung.identify_service.mapper;

import com.duyhung.identify_service.dto.request.UserCreationRequest;
import com.duyhung.identify_service.dto.request.UserUpdateRequest;
import com.duyhung.identify_service.dto.response.PermissionRespone;
import com.duyhung.identify_service.dto.response.RoleRespone;
import com.duyhung.identify_service.dto.response.UserResponse;
import com.duyhung.identify_service.entity.Permission;
import com.duyhung.identify_service.entity.Role;
import com.duyhung.identify_service.entity.User;
import java.util.LinkedHashSet;
import java.util.Set;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-22T16:17:36+0700",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.6 (Oracle Corporation)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public User toUser(UserCreationRequest request) {
        if ( request == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.username( request.getUsername() );
        user.password( request.getPassword() );
        user.firstName( request.getFirstName() );
        user.lastName( request.getLastName() );
        user.dob( request.getDob() );

        return user.build();
    }

    @Override
    public UserResponse toUserResponse(User user) {
        if ( user == null ) {
            return null;
        }

        UserResponse.UserResponseBuilder userResponse = UserResponse.builder();

        userResponse.id( user.getId() );
        userResponse.username( user.getUsername() );
        userResponse.firstName( user.getFirstName() );
        userResponse.lastName( user.getLastName() );
        userResponse.dob( user.getDob() );
        userResponse.roles( roleSetToRoleResponeSet( user.getRoles() ) );

        return userResponse.build();
    }

    @Override
    public void updateUser(User user, UserUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        user.setPassword( request.getPassword() );
        user.setFirstName( request.getFirstName() );
        user.setLastName( request.getLastName() );
        user.setDob( request.getDob() );
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

    protected RoleRespone roleToRoleRespone(Role role) {
        if ( role == null ) {
            return null;
        }

        RoleRespone.RoleResponeBuilder roleRespone = RoleRespone.builder();

        roleRespone.name( role.getName() );
        roleRespone.description( role.getDescription() );
        roleRespone.permissions( permissionSetToPermissionResponeSet( role.getPermissions() ) );

        return roleRespone.build();
    }

    protected Set<RoleRespone> roleSetToRoleResponeSet(Set<Role> set) {
        if ( set == null ) {
            return null;
        }

        Set<RoleRespone> set1 = new LinkedHashSet<RoleRespone>( Math.max( (int) ( set.size() / .75f ) + 1, 16 ) );
        for ( Role role : set ) {
            set1.add( roleToRoleRespone( role ) );
        }

        return set1;
    }
}

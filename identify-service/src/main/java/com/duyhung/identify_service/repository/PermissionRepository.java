package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.dto.response.PermissionRespone;
import com.duyhung.identify_service.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;


@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {

}

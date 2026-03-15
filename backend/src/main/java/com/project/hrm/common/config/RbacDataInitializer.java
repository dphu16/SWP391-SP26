package com.project.hrm.common.config;

import com.project.hrm.module.corehr.entity.Permission;
import com.project.hrm.module.corehr.entity.Role;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.repository.PermissionRepository;
import com.project.hrm.module.corehr.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class RbacDataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) {
        Map<String, String> permissionSeed = Map.of(
                "EMPLOYEE_READ", "View employee information",
                "EMPLOYEE_WRITE", "Update employee information",
                "REQUEST_APPROVE", "Approve requests",
                "REQUEST_REJECT", "Reject requests",
                "ONBOARDING_MANAGE", "Manage onboarding workflow"
        );

        Map<String, Permission> permissions = new HashMap<>();
        permissionSeed.forEach((name, description) -> {
            Permission permission = permissionRepository.findByName(name)
                    .orElseGet(() -> permissionRepository.save(new Permission(null, name, description)));
            if (permission.getDescription() == null || permission.getDescription().isBlank()) {
                permission.setDescription(description);
                permission = permissionRepository.save(permission);
            }
            permissions.put(name, permission);
        });

        seedRole(EmployeeRole.ROLE_ADMIN, "System administrator", permissions.values());
        seedRole(EmployeeRole.ROLE_HR, "Human resources", List.of(
                permissions.get("EMPLOYEE_READ"),
                permissions.get("EMPLOYEE_WRITE"),
                permissions.get("REQUEST_APPROVE"),
                permissions.get("REQUEST_REJECT"),
                permissions.get("ONBOARDING_MANAGE")
        ));
        seedRole(EmployeeRole.ROLE_MANAGER, "Department manager", List.of(
                permissions.get("EMPLOYEE_READ"),
                permissions.get("REQUEST_APPROVE"),
                permissions.get("REQUEST_REJECT")
        ));
        seedRole(EmployeeRole.ROLE_FINANCE, "Finance officer", List.of(permissions.get("EMPLOYEE_READ")));
        seedRole(EmployeeRole.ROLE_MENTOR, "Mentor", List.of(permissions.get("EMPLOYEE_READ")));
        seedRole(EmployeeRole.ROLE_EMPLOYEE, "Employee", List.of(permissions.get("EMPLOYEE_READ")));
        seedRole(EmployeeRole.ROLE_INTERN, "Intern", List.of(permissions.get("EMPLOYEE_READ")));
    }

    private void seedRole(EmployeeRole roleName, String description, Iterable<Permission> assignedPermissions) {
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role created = new Role();
                    created.setName(roleName);
                    return roleRepository.save(created);
                });

        role.setDescription(description);
        Set<Permission> permissionSet = new HashSet<>();
        assignedPermissions.forEach(permissionSet::add);
        role.setPermissions(permissionSet);
        roleRepository.save(role);
    }
}

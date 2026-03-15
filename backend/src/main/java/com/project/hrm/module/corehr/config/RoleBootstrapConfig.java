package com.project.hrm.module.corehr.config;

import com.project.hrm.module.corehr.entity.Role;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class RoleBootstrapConfig {

    @Bean
    public CommandLineRunner ensureDefaultRoles(RoleRepository roleRepository) {
        return args -> {
            Map<EmployeeRole, String> roleDescriptions = Map.of(
                    EmployeeRole.ROLE_ADMIN, "System administrator",
                    EmployeeRole.ROLE_HR, "Human resources",
                    EmployeeRole.ROLE_MANAGER, "Department manager",
                    EmployeeRole.ROLE_FINANCE, "Finance staff",
                    EmployeeRole.ROLE_MENTOR, "Mentor",
                    EmployeeRole.ROLE_EMPLOYEE, "Employee",
                    EmployeeRole.ROLE_INTERN, "Intern");

            for (Map.Entry<EmployeeRole, String> entry : roleDescriptions.entrySet()) {
                if (!roleRepository.existsByName(entry.getKey())) {
                    Role role = new Role();
                    role.setName(entry.getKey());
                    role.setDescription(entry.getValue());
                    roleRepository.save(role);
                }
            }
        };
    }
}

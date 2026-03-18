package com.project.hrm.module.corehr.entity;

import com.project.hrm.module.corehr.enums.AuthProvider;
import com.project.hrm.module.corehr.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", unique = true)
    private Employee employee;

    @Column(name = "password_hash")
    private String password;

    @Column(nullable = false, unique = true, length = 100)
    private String email;


    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public Role getPrimaryRole() {
        if (roles == null || roles.isEmpty()) return null;
        return roles.stream()
            .filter(r -> r != null && r.getName() != null)
            .findFirst()
            .orElse(null);
    }

    public String getPrimaryRoleName() {
        Role primary = getPrimaryRole();
        return (primary != null && primary.getName() != null) 
            ? primary.getName().name() 
            : null;
    }

    public boolean hasRole(String roleName) {
        if (roleName == null || roles == null || roles.isEmpty()) return false;
        return roles.stream()
            .filter(r -> r != null && r.getName() != null)
            .anyMatch(r -> r.getName().name().equalsIgnoreCase(roleName));
    }

}

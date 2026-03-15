package com.project.hrm.common.auth.service;

import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepo;

    @Override
    public UserDetails loadUserByUsername(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Not Found: " + email));

        System.out.println(">>> Password from DB: " + user.getPassword());
        List<GrantedAuthority> authorities = user.getRoles().stream()
            .map(r -> {
                String roleName = r.getName().name();
                return roleName.startsWith("ROLE_")
                    ? new SimpleGrantedAuthority(roleName)
                    : new SimpleGrantedAuthority("ROLE_" + roleName);
            })
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword() == null ? "" : user.getPassword(),
                authorities
        );
    }
}

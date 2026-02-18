package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.dto.*;
import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.mapper.*;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class EmployeeService {

    private static final String PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    private static final int PASSWORD_LENGTH = 12;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmployeeRepository employeeRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationRepository applicationRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            PositionRepository positionRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ApplicationRepository applicationRepository) {
        this.employeeRepository = employeeRepository;
        this.positionRepository = positionRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.applicationRepository = applicationRepository;
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    protected Employee getEmployeeById(UUID id) {
        return employeeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    protected Department getDepartmentById(UUID id) {
        return departmentRepository.findById(id).get();
    }

    protected Position getPositionById(UUID id) {
        return positionRepository.findById(id).get();
    }

    /**
     * Converts a Vietnamese full name to a clean ASCII slug.
     * E.g. "Nguyễn Văn An" -> "nguyenVanAn"
     */
    private String toAsciiSlug(String fullName) {
        if (fullName == null || fullName.isBlank())
            return "user";

        // Normalize unicode (NFD) then strip combining diacritical marks
        String normalized = Normalizer.normalize(fullName.trim(), Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String ascii = pattern.matcher(normalized).replaceAll("");

        // Replace đ/Đ which is not decomposed by NFD
        ascii = ascii.replace("đ", "d").replace("Đ", "D");

        // Split into words, capitalize each word except the first, join
        String[] parts = ascii.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            String word = parts[i].replaceAll("[^a-zA-Z0-9]", "");
            if (word.isEmpty())
                continue;
            if (i == 0) {
                sb.append(word.toLowerCase());
            } else {
                sb.append(Character.toUpperCase(word.charAt(0)));
                sb.append(word.substring(1).toLowerCase());
            }
        }
        return sb.length() > 0 ? sb.toString() : "user";
    }

    /**
     * Generates a unique username based on the employee's full name.
     * Appends a numeric suffix if the base username is already taken.
     * E.g. "nguyenVanAn", "nguyenVanAn2", "nguyenVanAn3", ...
     */
    private String generateUniqueUsername(String fullName) {
        String base = toAsciiSlug(fullName);
        String candidate = base;
        int suffix = 2;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    /**
     * Generates a cryptographically secure random password of
     * {@value PASSWORD_LENGTH} characters,
     * guaranteed to contain at least one uppercase, one lowercase, one digit, and
     * one special char.
     */
    private String generateSecurePassword() {
        StringBuilder sb = new StringBuilder(PASSWORD_LENGTH);

        // Guarantee at least one character from each required category
        sb.append(PASSWORD_CHARS.charAt(SECURE_RANDOM.nextInt(26))); // uppercase
        sb.append(PASSWORD_CHARS.charAt(26 + SECURE_RANDOM.nextInt(26))); // lowercase
        sb.append(PASSWORD_CHARS.charAt(52 + SECURE_RANDOM.nextInt(10))); // digit
        sb.append(PASSWORD_CHARS.charAt(62 + SECURE_RANDOM.nextInt(PASSWORD_CHARS.length() - 62))); // special

        // Fill the rest randomly
        for (int i = 4; i < PASSWORD_LENGTH; i++) {
            sb.append(PASSWORD_CHARS.charAt(SECURE_RANDOM.nextInt(PASSWORD_CHARS.length())));
        }

        // Shuffle to avoid predictable positions
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = SECURE_RANDOM.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }
        return new String(chars);
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public Page<EmployeeDTO> getAllEmployees(Pageable pageable) {
        return employeeRepository.findAllWithDetails(pageable)
                .map(EmployeeMapper::toDTO);
    }

    public EmployeeDetailDTO getEmployeeDetail(UUID id) {
        Employee employee = getEmployeeById(id);
        return EmployeeDetailMapper.toDTO(employee);
    }

    public EmployeeDetailDTO updateEmployee(UUID id, EmployeeChangeDTO req) {
        Employee e = getEmployeeById(id);

        // === Personal Information ===
        if (req.getFullName() != null)
            e.setFullName(req.getFullName());
        if (req.getEmail() != null)
            e.setEmail(req.getEmail());
        if (req.getPhone() != null)
            e.setPhone(req.getPhone());
        if (req.getAddress() != null)
            e.setAddress(req.getAddress());
        if (req.getGender() != null)
            e.setGender(req.getGender());
        if (req.getCitizenId() != null)
            e.setCitizenId(req.getCitizenId());
        if (req.getTaxCode() != null)
            e.setTaxCode(req.getTaxCode());
        if (req.getDateOfBirth() != null)
            e.setDateOfBirth(req.getDateOfBirth());
        if (req.getDateOfJoining() != null)
            e.setDateOfJoining(req.getDateOfJoining());
        if (req.getAvatarUrl() != null)
            e.setAvatarUrl(req.getAvatarUrl());

        // === Job Information ===
        if (req.getDepartmentId() != null) {
            Department department = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Phòng ban không tồn tại: " + req.getDepartmentId()));
            e.setDepartment(department);
        }
        if (req.getPositionId() != null) {
            Position position = positionRepository.findById(req.getPositionId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Vị trí không tồn tại: " + req.getPositionId()));
            e.setPosition(position);
        }
        if (req.getStatusPos() != null)
            e.setStatusPos(req.getStatusPos());

        // === User Account ===
        if (e.getUser() != null) {
            if (req.getRole() != null)
                e.getUser().setRole(req.getRole());
            if (req.getStatus() != null)
                e.getUser().setStatus(req.getStatus());
            if (req.getEmail() != null)
                e.getUser().setEmail(req.getEmail());
        }

        Employee saved = employeeRepository.save(e);
        return EmployeeDetailMapper.toDTO(saved);
    }

    /**
     * Creates a new employee with auto-generated login credentials.
     *
     * <p>
     * Business rules applied:
     * <ul>
     * <li>User role is set to {@link UserRole#EMPLOYEE}.</li>
     * <li>User account status is set to {@link UserStatus#ACTIVE}.</li>
     * <li>Employee status is set to {@link EmployeeStatus#ONBOARDING}.</li>
     * <li>A unique username is derived from the employee's full name.</li>
     * <li>A secure random password is generated and hashed with BCrypt before
     * persisting.</li>
     * <li>The raw (plain-text) password is returned once in the response for the
     * admin to share.</li>
     * </ul>
     */
    @Transactional
    public NewHireResponseDTO createNewHire(CreateNewHireDTO request) {

        // 1. Validate referenced entities
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Phòng ban không tồn tại: " + request.getDepartmentId()));

        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Vị trí không tồn tại: " + request.getPositionId()));

        // 2. Generate credentials
        String rawPassword = generateSecurePassword();
        String username = generateUniqueUsername(request.getFullName());

        // 3. Build the User account
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword)); // BCrypt hash
        user.setEmail(request.getEmail());
        user.setRole(UserRole.EMPLOYEE); // Default role
        user.setStatus(UserStatus.ACTIVE); // Default status

        // 4. Build the Employee and link the User
        Employee employee = NewHireMapper.toEntity(request, department, position);
        employee.setUser(user);
        employee.setStatusPos(EmployeeStatus.ONBOARDING); // Default employee status

        // 5. Persist (CascadeType.ALL on Employee.user saves the User automatically)
        Employee saved = employeeRepository.save(employee);

        // 6. Xóa hồ sơ ứng viên sau khi tạo nhân viên thành công
        if (request.getSourceApplicationId() != null) {
            applicationRepository.deleteById(request.getSourceApplicationId());
        }

        // 7. Return response including the raw password (shown once)
        return NewHireMapper.toResponseDTO(saved, rawPassword);
    }
}

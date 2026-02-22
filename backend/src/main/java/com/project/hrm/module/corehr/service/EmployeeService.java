package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.ResponseDTO.InactiveEmployeeResponseDTO;
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
import com.project.hrm.module.corehr.repository.OnboardingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class EmployeeService implements IEmployeeService {

    private static final String PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    private static final int PASSWORD_LENGTH = 12;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmployeeRepository employeeRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OnboardingRepository applicationRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            PositionRepository positionRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            OnboardingRepository applicationRepository) {
        this.employeeRepository = employeeRepository;
        this.positionRepository = positionRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.applicationRepository = applicationRepository;
    }

    protected Employee getEmployeeById(UUID id) {
        return employeeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    public String toShortSlug(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "user";
        }

        // 1. Loại bỏ dấu và chuẩn hóa chuỗi
        String ascii = removeAccent(fullName.trim());

        // 2. Tách các từ
        String[] parts = ascii.split("\\s+");
        if (parts.length == 0)
            return "user";

        StringBuilder sb = new StringBuilder();

        // 3. Lấy từ cuối cùng (Tên chính) và viết hoa chữ cái đầu
        String firstName = parts[parts.length - 1].replaceAll("[^a-zA-Z0-9]", "");
        if (!firstName.isEmpty()) {
            sb.append(Character.toUpperCase(firstName.charAt(0)));
            sb.append(firstName.substring(1).toLowerCase());
        }

        // 4. Lấy các chữ cái đầu của Họ và Tên lót, viết hoa hết
        for (int i = 0; i < parts.length - 1; i++) {
            String word = parts[i].replaceAll("[^a-zA-Z0-9]", "");
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0)));
            }
        }

        return sb.toString();
    }

    private String removeAccent(String str) {
        String normalized = Normalizer.normalize(str, Normalizer.Form.NFD);
        String ascii = DIACRITICS_PATTERN.matcher(normalized).replaceAll("");
        return ascii.replace("đ", "d").replace("Đ", "D");
    }

    private String generateUniqueUsername(String fullName) {
        String base = toShortSlug(fullName);
        String candidate = base;
        int suffix = 2;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

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
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEmail(request.getEmail());
        user.setRole(UserRole.EMPLOYEE); // Default role
        user.setStatus(UserStatus.INACTIVE); // Default status

        // 4. Build the Employee and link the User
        Employee employee = NewHireMapper.toEntity(request, department, position);
        employee.setUser(user);
        employee.setStatusPos(EmployeeStatus.OFFICIAL); // Default employee status

        // 5. Persist (CascadeType.ALL on Employee.user saves the User automatically)
        Employee saved = employeeRepository.save(employee);

        // 6. Xóa hồ sơ ứng viên sau khi tạo nhân viên thành công
        if (request.getSourceApplicationId() != null) {
            applicationRepository.deleteById(request.getSourceApplicationId());
        }

        // 7. Return response including the raw password (shown once)
        return NewHireMapper.toResponseDTO(saved, rawPassword);
    }

    @Override
    public List<InactiveEmployeeResponseDTO> getInactiveEmployees() {
        List<EmployeeStatus> inactiveStatuses = List.of(
                EmployeeStatus.TERMINATED,
                EmployeeStatus.RESIGNED);

        return employeeRepository.findByStatusPosIn(inactiveStatuses)
                .stream()
                .map(InactiveEmployeeMapper::toDTO)
                .toList();
    }

}

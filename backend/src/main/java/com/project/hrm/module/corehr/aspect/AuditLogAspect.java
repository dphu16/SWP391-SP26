package com.project.hrm.module.corehr.aspect;

import com.project.hrm.module.corehr.dto.request.EmployeeChangeDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeSelfUpdateDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.PersonnelChange;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.PersonnelChangeRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import com.project.hrm.module.corehr.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspect {

    private final AuditLogService auditLogService;
    private final EmployeeRepository employeeRepository;
    private final PersonnelChangeRepository personnelChangeRepository;
    private final UserRepository userRepository;

    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String emailOrUsername = auth.getName();
            return userRepository.findByEmail(emailOrUsername)
                    .map(u -> {
                        if (u.getEmployee() != null && u.getEmployee().getFullName() != null
                                && !u.getEmployee().getFullName().isBlank()) {
                            return u.getEmployee().getFullName();
                        }
                        return emailOrUsername;
                    })
                    .orElse(emailOrUsername);
        }
        return "System";
    }

    // Capture Employee Update (HR and Self)
    @Around("execution(* com.project.hrm.module.corehr.service.directory.EmployeeCommandService.updateEmployee(..)) || "
            +
            "execution(* com.project.hrm.module.corehr.service.directory.EmployeeSelfUpdateService.selfUpdate(..))")
    public Object auditEmployeeUpdate(ProceedingJoinPoint pjp) throws Throwable {
        UUID id = (UUID) pjp.getArgs()[0];
        
        UUID employeeId = userRepository.findById(id)
            .map(u -> u.getEmployee() != null ? u.getEmployee().getEmployeeId() : null)
            .orElse(null);

        Employee oldEmp = employeeRepository.findById(employeeId).orElse(null);

        // PRE-CAPTURE old values to prevent Hibernate session auto-update issues
        String oldRole = resolvePrimaryRoleName(oldEmp);
        String oldStatus = (oldEmp != null && oldEmp.getStatus() != null) ? oldEmp.getStatus().name() : "";
        String oldName = (oldEmp != null) ? oldEmp.getFullName() : "";
        String oldEmail = (oldEmp != null && oldEmp.getPersonal() != null) ? oldEmp.getPersonal().getEmail() : "";
        String oldPhone = (oldEmp != null && oldEmp.getPersonal() != null) ? oldEmp.getPersonal().getPhone() : "";
        String oldAddress = (oldEmp != null && oldEmp.getPersonal() != null) ? oldEmp.getPersonal().getAddress() : "";

        Object result = pjp.proceed(); // Perform update

        Employee newEmp = employeeRepository.findById(employeeId).orElse(null);
        if (newEmp != null && oldEmp != null) {
            String actor = getCurrentUser();
            Object arg1 = pjp.getArgs()[1];
            boolean specificFieldLogged = false;

            String entityIdStr = employeeId != null ? employeeId.toString() : id.toString();

            // Check Role change (only for updateEmployee)
            String newRole = resolvePrimaryRoleName(newEmp);
            if (!oldRole.equals(newRole)) {
                auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "role", oldRole, newRole, actor,
                        actor + " changed role from " + oldRole + " to " + newRole);
                specificFieldLogged = true;
            }

            // Check Status change (only for updateEmployee)
            String newStatus = (newEmp.getStatus() != null) ? newEmp.getStatus().name() : "";
            if (!oldStatus.equals(newStatus)) {
                auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "status", oldStatus, newStatus,
                        actor, actor + " changed status from " + oldStatus + " to " + newStatus);
                specificFieldLogged = true;
            }

            // Detect specific profile changes
            if (arg1 instanceof EmployeeChangeDTO req) {
                if (req.getFullName() != null && !req.getFullName().equals(oldName)) {
                    auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "fullName", oldName,
                            req.getFullName(), actor, actor + " updated name");
                    specificFieldLogged = true;
                }
                if (req.getEmail() != null && !req.getEmail().equals(oldEmail)) {
                    auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "email", oldEmail,
                            req.getEmail(), actor, actor + " updated email");
                    specificFieldLogged = true;
                }
                if (req.getPhone() != null && !req.getPhone().equals(oldPhone)) {
                    auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "phone", oldPhone,
                            req.getPhone(), actor, actor + " updated phone");
                    specificFieldLogged = true;
                }
                if (req.getAddress() != null && !req.getAddress().equals(oldAddress)) {
                    auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "address", oldAddress,
                            req.getAddress(), actor, actor + " updated address");
                    specificFieldLogged = true;
                }
            } else if (arg1 instanceof EmployeeSelfUpdateDTO req) {
                if (req.getEmail() != null && !req.getEmail().equals(oldEmail)) {
                    auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "email", oldEmail,
                            req.getEmail(), actor, actor + " updated own email");
                    specificFieldLogged = true;
                }
                if (req.getPhone() != null && !req.getPhone().equals(oldPhone)) {
                    auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "phone", oldPhone,
                            req.getPhone(), actor, actor + " updated own phone");
                    specificFieldLogged = true;
                }
                if (req.getAddress() != null && !req.getAddress().equals(oldAddress)) {
                    auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "address", oldAddress,
                            req.getAddress(), actor, actor + " updated own address");
                    specificFieldLogged = true;
                }
            }

            // FALLBACK LOG: Always ensure at least one log if something happened but no
            // specific field was caught
            if (!specificFieldLogged) {
                auditLogService.recordAction("Employee", entityIdStr, employeeId, "UPDATE", "profile", "", "", actor,
                        actor + " updated employee profile");
            }
        }

        return result;
    }

    private String resolvePrimaryRoleName(Employee employee) {
        if (employee == null || employee.getUser() == null) {
            return "";
        }

        String roleName = employee.getUser().getPrimaryRoleName();
        return roleName != null ? roleName : "";
    }

    // Capture Request Creation
    @Around("execution(* com.project.hrm.module.corehr.service.directory.PersonnelChangeService.createRequest(..))")
    public Object auditRequestCreation(ProceedingJoinPoint pjp) throws Throwable {
        Object result = pjp.proceed();
        try {
            if (result != null) {
                // result is PersonnelChangeResponseDTO
                String actor = getCurrentUser();
                java.lang.reflect.Method getChangeIdMethod = result.getClass().getMethod("getChangeId");
                UUID changeId = (UUID) getChangeIdMethod.invoke(result);
                java.lang.reflect.Method getEmployeeIdMethod = result.getClass().getMethod("getEmployeeId");
                UUID employeeId = (UUID) getEmployeeIdMethod.invoke(result);
                java.lang.reflect.Method getChangeTypeMethod = result.getClass().getMethod("getChangeType");
                Object changeType = getChangeTypeMethod.invoke(result);

                auditLogService.recordAction(
                        "Request", changeId.toString(), employeeId, "CREATE", "requestType",
                        null, changeType.toString(), actor, actor + " created a " + changeType + " request");
            }
        } catch (Exception e) {
            log.warn("Failed to audit request creation", e);
        }
        return result;
    }

    // Capture Request Status Change (hrConfirm, managerApprove, reject)
    @Around("execution(* com.project.hrm.module.corehr.service.directory.PersonnelChangeService.hrConfirm(..)) || " +
            "execution(* com.project.hrm.module.corehr.service.directory.PersonnelChangeService.managerApprove(..)) || "
            +
            "execution(* com.project.hrm.module.corehr.service.directory.PersonnelChangeService.reject(..))")
    public Object auditRequestStatusChange(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().getName();
        UUID changeId = (UUID) pjp.getArgs()[0]; // First argument is always changeId

        PersonnelChange oldChange = personnelChangeRepository.findById(changeId).orElse(null);
        String oldStatus = oldChange != null && oldChange.getStatus() != null ? oldChange.getStatus().name() : "";

        Object result = pjp.proceed();

        PersonnelChange newChange = personnelChangeRepository.findById(changeId).orElse(null);
        if (newChange != null && oldChange != null) {
            String newStatus = newChange.getStatus().name();
            if (!oldStatus.equals(newStatus)) {
                String actor = getCurrentUser();
                auditLogService.recordAction(
                        "Request", changeId.toString(), newChange.getEmployee().getEmployeeId(),
                        methodName.equals("reject") ? "REJECT" : "APPROVE",
                        "status", oldStatus, newStatus, actor,
                        actor + " changed " + newChange.getChangeType() + " request status from " + oldStatus + " to "
                                + newStatus);
            }
        }

        return result;
    }

}

package com.project.hrm.module.corehr.service.directory;

import com.project.hrm.module.corehr.dto.response.ContractResponseDTO;
import com.project.hrm.module.corehr.entity.Contract;
import com.project.hrm.module.corehr.repository.ContractRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ContractService {

    private static final Logger log = LoggerFactory.getLogger(ContractService.class);
    private static final int ALERT_DAYS_BEFORE = 30;

    private final ContractRepository contractRepository;

    public ContractService(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    public List<ContractResponseDTO> getContractsByEmployee(UUID employeeId) {
        return contractRepository.findByEmployee_EmployeeIdOrderByStartDateDesc(employeeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ContractResponseDTO> getExpiringContracts() {
        LocalDate today = LocalDate.now();
        LocalDate alertDate = today.plusDays(ALERT_DAYS_BEFORE);
        return contractRepository.findExpiringContracts(today, alertDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * BRD 2.3: Scheduled job runs daily to check for contracts expiring in 30 days.
     * Logs alerts for HR and managers.
     */
    @Scheduled(cron = "0 0 8 * * *") // Every day at 8 AM
    public void checkExpiringContracts() {
        LocalDate today = LocalDate.now();
        LocalDate alertDate = today.plusDays(ALERT_DAYS_BEFORE);
        List<Contract> expiring = contractRepository.findExpiringContracts(today, alertDate);

        for (Contract contract : expiring) {
            log.warn("CONTRACT EXPIRING: Employee {} ({}), Contract #{} expires on {}",
                    contract.getEmployee().getFullName(),
                    contract.getEmployee().getEmployeeCode(),
                    contract.getContractNumber(),
                    contract.getEndDate());
        }

        if (!expiring.isEmpty()) {
            log.info("Total contracts expiring within {} days: {}", ALERT_DAYS_BEFORE, expiring.size());
        }
    }

    private ContractResponseDTO toDTO(Contract contract) {
        return ContractResponseDTO.builder()
                .contractId(contract.getContractId())
                .contractNumber(contract.getContractNumber())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .baseSalary(contract.getBaseSalary())
                .status(contract.getStatus())
                .build();
    }
}

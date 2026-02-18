package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.dto.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.dto.ChangeRequestResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.EmployeeChangeRequest;
import com.project.hrm.module.corehr.enums.ChangeRequestStatus;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.repository.EmployeeChangeRequestRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeChangeRequestServiceTest {

        @Mock
        private EmployeeRepository employeeRepository;

        @Mock
        private EmployeeChangeRequestRepository changeRequestRepository;

        @InjectMocks
        private EmployeeChangeRequestService service;

        private UUID employeeId;
        private UUID createdBy;
        private Employee activeEmployee;

        @BeforeEach
        void setUp() {
                employeeId = UUID.randomUUID();
                createdBy = employeeId;

                activeEmployee = Employee.builder()
                                .employeeId(employeeId)
                                .fullName("Nguyen Van A")
                                .phone("0901234567")
                                .address("123 Le Loi, Q1, HCM")
                                .citizenId("012345678901")
                                .taxCode("0123456789")
                                .email("nguyenvana@personal.com")
                                .statusPos(EmployeeStatus.OFFICIAL)
                                .build();
        }

        @Nested
        @DisplayName("Successful creation")
        class SuccessfulCreation {

                @Test
                @DisplayName("Should create change request when phone is changed")
                void shouldCreateChangeRequest_WhenPhoneChanged() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0987654321")
                                        .build();

                        EmployeeChangeRequest savedEntity = EmployeeChangeRequest.builder()
                                        .id(UUID.randomUUID())
                                        .employee(activeEmployee)
                                        .oldData(Map.of("phone", "0901234567"))
                                        .newData(Map.of("phone", "0987654321"))
                                        .status(ChangeRequestStatus.PENDING)
                                        .createdBy(createdBy)
                                        .createdAt(OffsetDateTime.now())
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);
                        when(changeRequestRepository.saveAndFlush(any(EmployeeChangeRequest.class)))
                                        .thenReturn(savedEntity);

                        ChangeRequestResponseDTO response = service.createChangeRequest(employeeId, dto, createdBy);

                        assertThat(response).isNotNull();
                        assertThat(response.getId()).isEqualTo(savedEntity.getId());
                        assertThat(response.getStatus()).isEqualTo(ChangeRequestStatus.PENDING);
                        assertThat(response.getCreatedAt()).isNotNull();

                        ArgumentCaptor<EmployeeChangeRequest> captor = ArgumentCaptor
                                        .forClass(EmployeeChangeRequest.class);
                        verify(changeRequestRepository).saveAndFlush(captor.capture());

                        EmployeeChangeRequest captured = captor.getValue();
                        assertThat(captured.getOldData()).containsEntry("phone", "0901234567");
                        assertThat(captured.getNewData()).containsEntry("phone", "0987654321");
                        assertThat(captured.getStatus()).isEqualTo(ChangeRequestStatus.PENDING);
                        assertThat(captured.getCreatedBy()).isEqualTo(createdBy);
                }

                @Test
                @DisplayName("Should create change request with multiple fields changed")
                void shouldCreateChangeRequest_WhenMultipleFieldsChanged() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0987654321")
                                        .address("456 Nguyen Hue, Q1, HCM")
                                        .personalEmail("newemail@personal.com")
                                        .build();

                        EmployeeChangeRequest savedEntity = EmployeeChangeRequest.builder()
                                        .id(UUID.randomUUID())
                                        .employee(activeEmployee)
                                        .oldData(Map.of("phone", "0901234567", "address", "123 Le Loi, Q1, HCM",
                                                        "personalEmail", "nguyenvana@personal.com"))
                                        .newData(Map.of("phone", "0987654321", "address", "456 Nguyen Hue, Q1, HCM",
                                                        "personalEmail", "newemail@personal.com"))
                                        .status(ChangeRequestStatus.PENDING)
                                        .createdBy(createdBy)
                                        .createdAt(OffsetDateTime.now())
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);
                        when(changeRequestRepository.saveAndFlush(any(EmployeeChangeRequest.class)))
                                        .thenReturn(savedEntity);

                        ChangeRequestResponseDTO response = service.createChangeRequest(employeeId, dto, createdBy);

                        assertThat(response).isNotNull();
                        assertThat(response.getStatus()).isEqualTo(ChangeRequestStatus.PENDING);

                        ArgumentCaptor<EmployeeChangeRequest> captor = ArgumentCaptor
                                        .forClass(EmployeeChangeRequest.class);
                        verify(changeRequestRepository).saveAndFlush(captor.capture());

                        EmployeeChangeRequest captured = captor.getValue();
                        assertThat(captured.getOldData()).hasSize(3);
                        assertThat(captured.getNewData()).hasSize(3);
                }

                @Test
                @DisplayName("Should create change request for PROBATION employee")
                void shouldCreateChangeRequest_WhenEmployeeIsProbation() {
                        activeEmployee.setStatusPos(EmployeeStatus.PROBATION);

                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .address("New Address Here")
                                        .build();

                        EmployeeChangeRequest savedEntity = EmployeeChangeRequest.builder()
                                        .id(UUID.randomUUID())
                                        .employee(activeEmployee)
                                        .oldData(Map.of("address", "123 Le Loi, Q1, HCM"))
                                        .newData(Map.of("address", "New Address Here"))
                                        .status(ChangeRequestStatus.PENDING)
                                        .createdBy(createdBy)
                                        .createdAt(OffsetDateTime.now())
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);
                        when(changeRequestRepository.saveAndFlush(any(EmployeeChangeRequest.class)))
                                        .thenReturn(savedEntity);

                        ChangeRequestResponseDTO response = service.createChangeRequest(employeeId, dto, createdBy);

                        assertThat(response).isNotNull();
                        assertThat(response.getStatus()).isEqualTo(ChangeRequestStatus.PENDING);
                }

                @Test
                @DisplayName("Should handle null old values correctly in snapshot")
                void shouldHandleNullOldValues() {
                        activeEmployee.setCitizenId(null);

                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .citizenId("123456789012")
                                        .build();

                        EmployeeChangeRequest savedEntity = EmployeeChangeRequest.builder()
                                        .id(UUID.randomUUID())
                                        .employee(activeEmployee)
                                        .oldData(Map.of())
                                        .newData(Map.of("citizenId", "123456789012"))
                                        .status(ChangeRequestStatus.PENDING)
                                        .createdBy(createdBy)
                                        .createdAt(OffsetDateTime.now())
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);
                        when(changeRequestRepository.saveAndFlush(any(EmployeeChangeRequest.class)))
                                        .thenReturn(savedEntity);

                        ChangeRequestResponseDTO response = service.createChangeRequest(employeeId, dto, createdBy);

                        assertThat(response).isNotNull();

                        ArgumentCaptor<EmployeeChangeRequest> captor = ArgumentCaptor
                                        .forClass(EmployeeChangeRequest.class);
                        verify(changeRequestRepository).saveAndFlush(captor.capture());

                        EmployeeChangeRequest captured = captor.getValue();
                        assertThat(captured.getNewData()).containsEntry("citizenId", "123456789012");
                }
        }

        @Nested
        @DisplayName("Employee not found")
        class EmployeeNotFound {

                @Test
                @DisplayName("Should throw exception when employee does not exist")
                void shouldThrow_WhenEmployeeNotFound() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0987654321")
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.empty());

                        assertThatThrownBy(() -> service.createChangeRequest(employeeId, dto, createdBy))
                                        .isInstanceOf(BusinessRuleException.class)
                                        .satisfies(ex -> {
                                                BusinessRuleException bre = (BusinessRuleException) ex;
                                                assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.EMPLOYEE_NOT_FOUND);
                                        })
                                        .hasMessageContaining("Employee not found");

                        verify(changeRequestRepository, never()).saveAndFlush(any());
                }
        }

        @Nested
        @DisplayName("Employee not active")
        class EmployeeNotActive {

                @Test
                @DisplayName("Should throw exception when employee is TERMINATED")
                void shouldThrow_WhenEmployeeTerminated() {
                        activeEmployee.setStatusPos(EmployeeStatus.TERMINATED);

                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0987654321")
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));

                        assertThatThrownBy(() -> service.createChangeRequest(employeeId, dto, createdBy))
                                        .isInstanceOf(BusinessRuleException.class)
                                        .satisfies(ex -> {
                                                BusinessRuleException bre = (BusinessRuleException) ex;
                                                assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.EMPLOYEE_NOT_ACTIVE);
                                        })
                                        .hasMessageContaining("not in an active status");

                        verify(changeRequestRepository, never()).saveAndFlush(any());
                }

                @Test
                @DisplayName("Should throw exception when employee is RESIGNED")
                void shouldThrow_WhenEmployeeResigned() {
                        activeEmployee.setStatusPos(EmployeeStatus.RESIGNED);

                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0987654321")
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));

                        assertThatThrownBy(() -> service.createChangeRequest(employeeId, dto, createdBy))
                                        .isInstanceOf(BusinessRuleException.class)
                                        .satisfies(ex -> {
                                                BusinessRuleException bre = (BusinessRuleException) ex;
                                                assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.EMPLOYEE_NOT_ACTIVE);
                                        });

                        verify(changeRequestRepository, never()).saveAndFlush(any());
                }

                @Test
                @DisplayName("Should throw exception when employee is ONBOARDING")
                void shouldThrow_WhenEmployeeOnboarding() {
                        activeEmployee.setStatusPos(EmployeeStatus.ONBOARDING);

                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0987654321")
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));

                        assertThatThrownBy(() -> service.createChangeRequest(employeeId, dto, createdBy))
                                        .isInstanceOf(BusinessRuleException.class)
                                        .satisfies(ex -> {
                                                BusinessRuleException bre = (BusinessRuleException) ex;
                                                assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.EMPLOYEE_NOT_ACTIVE);
                                        });

                        verify(changeRequestRepository, never()).saveAndFlush(any());
                }
        }

        @Nested
        @DisplayName("Pending request already exists")
        class PendingRequestExists {

                @Test
                @DisplayName("Should throw exception when employee already has a PENDING request")
                void shouldThrow_WhenPendingRequestExists() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0987654321")
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(true);

                        assertThatThrownBy(() -> service.createChangeRequest(employeeId, dto, createdBy))
                                        .isInstanceOf(BusinessRuleException.class)
                                        .satisfies(ex -> {
                                                BusinessRuleException bre = (BusinessRuleException) ex;
                                                assertThat(bre.getErrorCode())
                                                                .isEqualTo(ErrorCode.PENDING_REQUEST_EXISTS);
                                        })
                                        .hasMessageContaining("pending change request");

                        verify(changeRequestRepository, never()).saveAndFlush(any());
                }
        }

        @Nested
        @DisplayName("No data changed")
        class NoDataChanged {

                @Test
                @DisplayName("Should throw exception when new data equals current data")
                void shouldThrow_WhenDataUnchanged() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0901234567")
                                        .address("123 Le Loi, Q1, HCM")
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);

                        assertThatThrownBy(() -> service.createChangeRequest(employeeId, dto, createdBy))
                                        .isInstanceOf(BusinessRuleException.class)
                                        .satisfies(ex -> {
                                                BusinessRuleException bre = (BusinessRuleException) ex;
                                                assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.NO_DATA_CHANGED);
                                        })
                                        .hasMessageContaining("No data changes detected");

                        verify(changeRequestRepository, never()).saveAndFlush(any());
                }

                @Test
                @DisplayName("Should throw exception when single field is unchanged")
                void shouldThrow_WhenSingleFieldUnchanged() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0901234567")
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);

                        assertThatThrownBy(() -> service.createChangeRequest(employeeId, dto, createdBy))
                                        .isInstanceOf(BusinessRuleException.class)
                                        .satisfies(ex -> {
                                                BusinessRuleException bre = (BusinessRuleException) ex;
                                                assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.NO_DATA_CHANGED);
                                        });

                        verify(changeRequestRepository, never()).saveAndFlush(any());
                }

                @Test
                @DisplayName("Should throw when personalEmail same as current email")
                void shouldThrow_WhenPersonalEmailUnchanged() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .personalEmail("nguyenvana@personal.com")
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);

                        assertThatThrownBy(() -> service.createChangeRequest(employeeId, dto, createdBy))
                                        .isInstanceOf(BusinessRuleException.class)
                                        .satisfies(ex -> {
                                                BusinessRuleException bre = (BusinessRuleException) ex;
                                                assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.NO_DATA_CHANGED);
                                        });

                        verify(changeRequestRepository, never()).saveAndFlush(any());
                }
        }

        @Nested
        @DisplayName("Verify interaction and data integrity")
        class DataIntegrity {

                @Test
                @DisplayName("Should only include provided fields in old/new data maps")
                void shouldOnlyIncludeProvidedFields() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .taxCode("9876543210")
                                        .build();

                        EmployeeChangeRequest savedEntity = EmployeeChangeRequest.builder()
                                        .id(UUID.randomUUID())
                                        .employee(activeEmployee)
                                        .oldData(Map.of("taxCode", "0123456789"))
                                        .newData(Map.of("taxCode", "9876543210"))
                                        .status(ChangeRequestStatus.PENDING)
                                        .createdBy(createdBy)
                                        .createdAt(OffsetDateTime.now())
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);
                        when(changeRequestRepository.saveAndFlush(any(EmployeeChangeRequest.class)))
                                        .thenReturn(savedEntity);

                        service.createChangeRequest(employeeId, dto, createdBy);

                        ArgumentCaptor<EmployeeChangeRequest> captor = ArgumentCaptor
                                        .forClass(EmployeeChangeRequest.class);
                        verify(changeRequestRepository).saveAndFlush(captor.capture());

                        EmployeeChangeRequest captured = captor.getValue();
                        assertThat(captured.getOldData()).containsOnlyKeys("taxCode");
                        assertThat(captured.getNewData()).containsOnlyKeys("taxCode");
                        assertThat(captured.getOldData()).containsEntry("taxCode", "0123456789");
                        assertThat(captured.getNewData()).containsEntry("taxCode", "9876543210");
                }

                @Test
                @DisplayName("Should set employee reference on saved entity")
                void shouldSetEmployeeReference() {
                        ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                                        .phone("0987654321")
                                        .build();

                        EmployeeChangeRequest savedEntity = EmployeeChangeRequest.builder()
                                        .id(UUID.randomUUID())
                                        .employee(activeEmployee)
                                        .oldData(Map.of("phone", "0901234567"))
                                        .newData(Map.of("phone", "0987654321"))
                                        .status(ChangeRequestStatus.PENDING)
                                        .createdBy(createdBy)
                                        .createdAt(OffsetDateTime.now())
                                        .build();

                        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployee));
                        when(changeRequestRepository.existsByEmployee_EmployeeIdAndStatus(
                                        employeeId, ChangeRequestStatus.PENDING)).thenReturn(false);
                        when(changeRequestRepository.saveAndFlush(any(EmployeeChangeRequest.class)))
                                        .thenReturn(savedEntity);

                        service.createChangeRequest(employeeId, dto, createdBy);

                        ArgumentCaptor<EmployeeChangeRequest> captor = ArgumentCaptor
                                        .forClass(EmployeeChangeRequest.class);
                        verify(changeRequestRepository).saveAndFlush(captor.capture());

                        assertThat(captor.getValue().getEmployee()).isEqualTo(activeEmployee);
                        assertThat(captor.getValue().getEmployee().getEmployeeId()).isEqualTo(employeeId);
                }
        }
}

package com.project.hrm.module.corehr.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.module.corehr.dto.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.repository.EmployeeChangeRequestRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EmployeeChangeRequestControllerIntegrationTest {

    private static final String ENDPOINT = "/api/employee-change-requests";
    private static final String EMPLOYEE_ID_HEADER = "X-Employee-Id";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmployeeChangeRequestRepository changeRequestRepository;

    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        changeRequestRepository.deleteAll();

        testEmployee = Employee.builder()
                .fullName("Tran Thi B")
                .employeeCode("EMP-TEST-001")
                .phone("0901234567")
                .address("789 Vo Van Tan, Q3, HCM")
                .citizenId("012345678901")
                .taxCode("0123456789")
                .email("tranthib@personal.com")
                .statusPos(EmployeeStatus.OFFICIAL)
                .build();

        testEmployee = employeeRepository.save(testEmployee);
    }

    @Nested
    @DisplayName("POST /api/employee-change-requests - Success")
    class SuccessScenarios {

        @Test
        @DisplayName("Should return 201 with response body when changing phone")
        void shouldReturn201_WhenPhoneChanged() throws Exception {
            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .phone("0987654321")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").isNotEmpty())
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andExpect(jsonPath("$.createdAt").isNotEmpty());
        }

        @Test
        @DisplayName("Should return 201 when changing multiple fields")
        void shouldReturn201_WhenMultipleFieldsChanged() throws Exception {
            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .phone("0987654321")
                    .address("New Address 123")
                    .citizenId("987654321012")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").isNotEmpty())
                    .andExpect(jsonPath("$.status").value("PENDING"));
        }
    }

    @Nested
    @DisplayName("POST /api/employee-change-requests - Validation Errors")
    class ValidationErrors {

        @Test
        @DisplayName("Should return 400 when request body is empty")
        void shouldReturn400_WhenBodyEmpty() throws Exception {
            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                    .andExpect(jsonPath("$.message").isNotEmpty());
        }

        @Test
        @DisplayName("Should return 400 when phone format is invalid")
        void shouldReturn400_WhenPhoneInvalid() throws Exception {
            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .phone("12345")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                    .andExpect(jsonPath("$.message", containsString("phone")));
        }

        @Test
        @DisplayName("Should return 400 when citizenId format is invalid")
        void shouldReturn400_WhenCitizenIdInvalid() throws Exception {
            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .citizenId("ABC")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        @DisplayName("Should return 400 when taxCode format is invalid")
        void shouldReturn400_WhenTaxCodeInvalid() throws Exception {
            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .taxCode("INVALID")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        @DisplayName("Should return 400 when email format is invalid")
        void shouldReturn400_WhenEmailInvalid() throws Exception {
            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .personalEmail("not-an-email")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }
    }

    @Nested
    @DisplayName("POST /api/employee-change-requests - Business Rule Violations")
    class BusinessRuleViolations {

        @Test
        @DisplayName("Should return 400 when employee not found")
        void shouldReturn400_WhenEmployeeNotFound() throws Exception {
            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .phone("0987654321")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("EMPLOYEE_NOT_FOUND"))
                    .andExpect(jsonPath("$.path").value(ENDPOINT));
        }

        @Test
        @DisplayName("Should return 400 when employee is not active")
        void shouldReturn400_WhenEmployeeInactive() throws Exception {
            testEmployee.setStatusPos(EmployeeStatus.TERMINATED);
            employeeRepository.save(testEmployee);

            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .phone("0987654321")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("EMPLOYEE_NOT_ACTIVE"));
        }

        @Test
        @DisplayName("Should return 400 when data is unchanged")
        void shouldReturn400_WhenDataUnchanged() throws Exception {
            ChangeRequestCreateDTO dto = ChangeRequestCreateDTO.builder()
                    .phone("0901234567")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("NO_DATA_CHANGED"));
        }

        @Test
        @DisplayName("Should return 400 when pending request already exists")
        void shouldReturn400_WhenPendingExists() throws Exception {
            ChangeRequestCreateDTO firstDto = ChangeRequestCreateDTO.builder()
                    .phone("0987654321")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(firstDto)))
                    .andExpect(status().isCreated());

            ChangeRequestCreateDTO secondDto = ChangeRequestCreateDTO.builder()
                    .address("Another Address")
                    .build();

            mockMvc.perform(post(ENDPOINT)
                    .header(EMPLOYEE_ID_HEADER, testEmployee.getEmployeeId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(secondDto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("PENDING_REQUEST_EXISTS"));
        }
    }
}

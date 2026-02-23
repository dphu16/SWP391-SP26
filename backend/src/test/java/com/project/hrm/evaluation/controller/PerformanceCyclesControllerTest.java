package com.project.hrm.evaluation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.evaluation.dto.PerformanceCyclesRequest;
import com.project.hrm.evaluation.entity.PerformanceCycles;
import com.project.hrm.evaluation.service.PerformanceCyclesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class PerformanceCyclesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PerformanceCyclesService service;

    @Test
    void create_returnsCreated() throws Exception {
        PerformanceCyclesRequest req = new PerformanceCyclesRequest();
        req.setNameCycle("2026 Cycle");
        req.setDateStart(LocalDate.of(2026,1,1));
        req.setDateEnd(LocalDate.of(2026,12,31));

        PerformanceCycles saved = new PerformanceCycles();
        UUID id = UUID.randomUUID();
        saved.setIdCycle(id);
        saved.setNameCycle(req.getNameCycle());
        saved.setDateStart(req.getDateStart());
        saved.setDateEnd(req.getDateEnd());

        given(service.create(any(PerformanceCycles.class))).willReturn(saved);

        mockMvc.perform(post("/api/performance-cycles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nameCycle").value("2026 Cycle"));
    }

    @Test
    void getAll_returnsList() throws Exception {
        PerformanceCycles a = new PerformanceCycles();
        a.setIdCycle(UUID.randomUUID());
        a.setNameCycle("Cycle A");

        PerformanceCycles b = new PerformanceCycles();
        b.setIdCycle(UUID.randomUUID());
        b.setNameCycle("Cycle B");

        given(service.getAll()).willReturn(List.of(a, b));

        mockMvc.perform(get("/api/performance-cycles").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nameCycle").value("Cycle A"));
    }
}


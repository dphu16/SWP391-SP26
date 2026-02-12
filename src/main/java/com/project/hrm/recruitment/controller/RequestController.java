package com.project.hrm.recruitment.controller;

import com.project.hrm.recruitment.dto.request.CreateReqRequest;
import com.project.hrm.recruitment.dto.response.RequestResponse;
import com.project.hrm.recruitment.service.RequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;


    @PostMapping("/create")
    public ResponseEntity<RequestResponse> create(
            @Valid @RequestBody CreateReqRequest request) {

        RequestResponse response =
                requestService.createRequest(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequestResponse> getById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                requestService.getRequestById(id)
        );
    }
    @GetMapping
    public ResponseEntity<List<RequestResponse>> getAllRequest() {
        List<RequestResponse> request = requestService.getAllRequest();
        return ResponseEntity.ok(request);
    }


}

package com.marocloc.marocloc_backend.saga.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.saga.dto.SagaResponse;
import com.marocloc.marocloc_backend.saga.model.SagaInstance;
import com.marocloc.marocloc_backend.saga.model.SagaStep;
import com.marocloc.marocloc_backend.saga.repository.SagaInstanceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(ApiRoutes.V1 + "/sagas")
@RequiredArgsConstructor
@Tag(name = "Saga Orchestration", description = "Track distributed Saga instances")
public class SagaController {

    private final SagaInstanceRepository sagaInstanceRepository;

    @GetMapping("/{sagaId}")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'PROPRIETAIRE', 'ADMIN')")
    @Operation(summary = "Get Saga by id", description = "Returns the Saga instance with its steps")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<SagaResponse>> getSaga(@PathVariable Long sagaId) {
        SagaInstance instance = sagaInstanceRepository.findById(sagaId)
                .orElseThrow(() -> new IllegalArgumentException("Saga not found: " + sagaId));
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(instance)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List Sagas", description = "Admin endpoint to list all Saga instances")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<SagaResponse>>> listSagas(Pageable pageable) {
        Page<SagaInstance> page = sagaInstanceRepository.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(page.map(this::mapToResponse)));
    }

    private SagaResponse mapToResponse(SagaInstance instance) {
        List<SagaResponse.SagaStepResponse> steps = instance.getSteps().stream()
                .map(this::mapStep)
                .collect(Collectors.toList());

        return SagaResponse.builder()
                .id(instance.getId())
                .sagaType(instance.getSagaType().name())
                .status(instance.getStatus().name())
                .correlationId(instance.getCorrelationId())
                .provider(instance.getProvider())
                .result(instance.getResult())
                .resultMessage(instance.getResultMessage())
                .payload(instance.getPayload())
                .steps(steps)
                .createdAt(instance.getCreatedAt())
                .updatedAt(instance.getUpdatedAt())
                .build();
    }

    private SagaResponse.SagaStepResponse mapStep(SagaStep step) {
        return SagaResponse.SagaStepResponse.builder()
                .id(step.getId())
                .name(step.getStepName())
                .order(step.getStepOrder())
                .status(step.getStatus().name())
                .input(step.getInputJson())
                .output(step.getOutputJson())
                .errorMessage(step.getErrorMessage())
                .createdAt(step.getCreatedAt())
                .updatedAt(step.getUpdatedAt())
                .build();
    }
}

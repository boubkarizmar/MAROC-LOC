package com.marocloc.marocloc_backend.saga.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marocloc.marocloc_backend.saga.model.SagaInstance;
import com.marocloc.marocloc_backend.saga.model.SagaStatus;
import com.marocloc.marocloc_backend.saga.model.SagaStep;
import com.marocloc.marocloc_backend.saga.model.SagaStepStatus;
import com.marocloc.marocloc_backend.saga.model.SagaType;
import com.marocloc.marocloc_backend.saga.repository.SagaInstanceRepository;
import com.marocloc.marocloc_backend.saga.repository.SagaStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SagaOrchestrator {

    private final SagaInstanceRepository sagaInstanceRepository;
    private final SagaStepRepository sagaStepRepository;
    private final List<SagaDefinition> sagaDefinitions;
    private final ObjectMapper objectMapper;

    @Transactional
    public SagaInstance start(SagaType type, String correlationId, String provider, Map<String, Object> payload) {
        SagaDefinition definition = findDefinition(type);

        SagaInstance instance = SagaInstance.builder()
                .sagaType(type)
                .status(SagaStatus.STARTED)
                .correlationId(correlationId)
                .provider(provider)
                .payload(payload != null ? new HashMap<>(payload) : new HashMap<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        for (int i = 0; i < definition.getSteps().size(); i++) {
            SagaStepDefinition stepDef = definition.getSteps().get(i);
            SagaStep step = SagaStep.builder()
                    .sagaInstance(instance)
                    .stepName(stepDef.getName())
                    .stepOrder(i)
                    .status(SagaStepStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            instance.addStep(step);
        }

        instance.setStatus(SagaStatus.IN_PROGRESS);
        sagaInstanceRepository.save(instance);

        executeFromCurrentStep(instance, definition);
        return instance;
    }

    @Transactional
    public SagaInstance advance(String correlationId, String eventName, Map<String, Object> eventData) {
        SagaInstance instance = sagaInstanceRepository.findByCorrelationId(correlationId)
                .orElseThrow(() -> new IllegalArgumentException("Saga not found for correlationId: " + correlationId));

        SagaDefinition definition = findDefinition(instance.getSagaType());
        SagaContext context = SagaContext.fromMap(instance.getPayload());

        if (eventData != null) {
            eventData.forEach(context::set);
        }
        context.set("lastEvent", eventName);

        int currentStepIndex = findCurrentStepIndex(instance);
        if (currentStepIndex < 0 || currentStepIndex >= definition.getSteps().size()) {
            log.warn("Saga {} is not in a state to advance", instance.getId());
            return instance;
        }

        SagaStep currentStep = instance.getSteps().get(currentStepIndex);
        SagaStepDefinition stepDef = definition.getSteps().get(currentStepIndex);

        if (!stepDef.isWaitForExternalEvent()) {
            throw new IllegalStateException("Current step " + stepDef.getName() + " is not waiting for an external event");
        }

        currentStep.setStatus(SagaStepStatus.SUCCEEDED);
        currentStep.setOutputJson(context.toMap());
        currentStep.setUpdatedAt(LocalDateTime.now());

        instance.setPayload(context.toMap());
        instance.setStatus(SagaStatus.IN_PROGRESS);
        instance.setUpdatedAt(LocalDateTime.now());
        sagaStepRepository.save(currentStep);

        executeFromCurrentStep(instance, definition);
        return instance;
    }

    @Transactional(readOnly = true)
    public Optional<SagaInstance> findById(Long sagaId) {
        return sagaInstanceRepository.findById(sagaId);
    }

    @Transactional(readOnly = true)
    public Optional<SagaInstance> findByCorrelationId(String correlationId) {
        return sagaInstanceRepository.findByCorrelationId(correlationId);
    }

    private void executeFromCurrentStep(SagaInstance instance, SagaDefinition definition) {
        SagaContext context = SagaContext.fromMap(instance.getPayload());

        int startIndex = findCurrentStepIndex(instance);
        if (startIndex < 0) {
            finalizeSaga(instance, context, SagaStatus.COMPLETED, "Saga completed successfully");
            return;
        }

        for (int i = startIndex; i < definition.getSteps().size(); i++) {
            SagaStepDefinition stepDef = definition.getSteps().get(i);
            SagaStep step = instance.getSteps().get(i);

            if (stepDef.isWaitForExternalEvent()) {
                step.setStatus(SagaStepStatus.PENDING);
                step.setInputJson(context.toMap());
                step.setUpdatedAt(LocalDateTime.now());
                instance.setPayload(context.toMap());
                instance.setStatus(SagaStatus.WAITING);
                instance.setUpdatedAt(LocalDateTime.now());
                sagaStepRepository.save(step);
                sagaInstanceRepository.save(instance);
                log.info("Saga {} paused at waiting step {}", instance.getId(), stepDef.getName());
                return;
            }

            try {
                step.setStatus(SagaStepStatus.EXECUTING);
                step.setInputJson(context.toMap());
                step.setUpdatedAt(LocalDateTime.now());
                sagaStepRepository.save(step);

                stepDef.getAction().execute(context);

                step.setStatus(SagaStepStatus.SUCCEEDED);
                step.setOutputJson(context.toMap());
                step.setUpdatedAt(LocalDateTime.now());
                sagaStepRepository.save(step);

                instance.setPayload(context.toMap());
                instance.setUpdatedAt(LocalDateTime.now());
            } catch (Exception ex) {
                log.error("Saga {} step {} failed: {}", instance.getId(), stepDef.getName(), ex.getMessage(), ex);
                step.setStatus(SagaStepStatus.FAILED);
                step.setErrorMessage(ex.getMessage());
                step.setUpdatedAt(LocalDateTime.now());
                sagaStepRepository.save(step);

                compensate(instance, definition, i, context);
                return;
            }
        }

        finalizeSaga(instance, context, SagaStatus.COMPLETED, "Saga completed successfully");
    }

    private void compensate(SagaInstance instance, SagaDefinition definition, int failedStepIndex, SagaContext context) {
        boolean allCompensated = true;
        List<SagaStep> steps = instance.getSteps();

        for (int i = failedStepIndex; i >= 0; i--) {
            SagaStepDefinition stepDef = definition.getSteps().get(i);
            SagaStep step = steps.get(i);

            if (stepDef.getCompensation() == null || step.getStatus() == SagaStepStatus.COMPENSATED) {
                continue;
            }

            try {
                step.setStatus(SagaStepStatus.COMPENSATING);
                step.setUpdatedAt(LocalDateTime.now());
                sagaStepRepository.save(step);

                stepDef.getCompensation().compensate(context);

                step.setStatus(SagaStepStatus.COMPENSATED);
                step.setUpdatedAt(LocalDateTime.now());
                sagaStepRepository.save(step);
            } catch (Exception compEx) {
                log.error("Saga {} compensation failed for step {}: {}", instance.getId(), stepDef.getName(), compEx.getMessage(), compEx);
                step.setStatus(SagaStepStatus.FAILED);
                step.setErrorMessage("Compensation failed: " + compEx.getMessage());
                step.setUpdatedAt(LocalDateTime.now());
                sagaStepRepository.save(step);
                allCompensated = false;
            }
        }

        SagaStatus finalStatus = allCompensated ? SagaStatus.COMPENSATED : SagaStatus.FAILED;
        String message = allCompensated
                ? "Saga compensated after step failure"
                : "Saga failed and compensation could not fully complete";
        finalizeSaga(instance, context, finalStatus, message);
    }

    private void finalizeSaga(SagaInstance instance, SagaContext context, SagaStatus status, String message) {
        instance.setStatus(status);
        instance.setResult(status.name());
        instance.setResultMessage(message);
        instance.setPayload(context.toMap());
        instance.setUpdatedAt(LocalDateTime.now());
        sagaInstanceRepository.save(instance);
        log.info("Saga {} finalized with status {}", instance.getId(), status);
    }

    private int findCurrentStepIndex(SagaInstance instance) {
        List<SagaStep> steps = instance.getSteps();
        for (int i = 0; i < steps.size(); i++) {
            SagaStepStatus status = steps.get(i).getStatus();
            if (status != SagaStepStatus.SUCCEEDED && status != SagaStepStatus.COMPENSATED) {
                return i;
            }
        }
        return -1;
    }

    private SagaDefinition findDefinition(SagaType type) {
        return sagaDefinitions.stream()
                .filter(d -> d.getType() == type)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No saga definition registered for type: " + type));
    }
}

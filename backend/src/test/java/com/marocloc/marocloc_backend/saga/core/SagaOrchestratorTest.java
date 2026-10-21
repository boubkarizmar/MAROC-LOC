package com.marocloc.marocloc_backend.saga.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marocloc.marocloc_backend.saga.model.SagaInstance;
import com.marocloc.marocloc_backend.saga.model.SagaStatus;
import com.marocloc.marocloc_backend.saga.model.SagaStepStatus;
import com.marocloc.marocloc_backend.saga.model.SagaType;
import com.marocloc.marocloc_backend.saga.repository.SagaInstanceRepository;
import com.marocloc.marocloc_backend.saga.repository.SagaStepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SagaOrchestratorTest {

    private SagaInstanceRepository instanceRepository;
    private SagaStepRepository stepRepository;
    private SagaOrchestrator orchestrator;
    private final Map<String, SagaInstance> storage = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @BeforeEach
    void setUp() {
        storage.clear();
        idGenerator.set(1);
        instanceRepository = mock(SagaInstanceRepository.class);
        stepRepository = mock(SagaStepRepository.class);

        when(instanceRepository.save(any(SagaInstance.class))).thenAnswer(invocation -> {
            SagaInstance instance = invocation.getArgument(0);
            if (instance.getId() == null) {
                instance.setId(idGenerator.getAndIncrement());
            }
            storage.put(instance.getCorrelationId(), instance);
            return instance;
        });
        when(instanceRepository.findByCorrelationId(any())).thenAnswer(invocation ->
                Optional.ofNullable(storage.get(invocation.getArgument(0))));
        when(instanceRepository.findById(anyLong())).thenAnswer(invocation ->
                storage.values().stream()
                        .filter(i -> i.getId().equals(invocation.getArgument(0)))
                        .findFirst());

        SagaDefinition definition = new SagaDefinition(SagaType.PAYMENT_ADVERTISEMENT, List.of(
                SagaStepDefinition.of(
                        "STEP_ONE",
                        ctx -> ctx.set("value", 42),
                        ctx -> ctx.set("compensated", true)
                ),
                SagaStepDefinition.waiting(
                        "WAIT_STEP",
                        ctx -> {
                        }
                ),
                SagaStepDefinition.of(
                        "STEP_TWO",
                        ctx -> {
                            if ("FAILURE".equals(ctx.get("eventResult"))) {
                                throw new RuntimeException("Simulated failure");
                            }
                            ctx.set("final", "ok");
                        },
                        ctx -> ctx.set("finalCompensated", true)
                )
        ));

        orchestrator = new SagaOrchestrator(instanceRepository, stepRepository, List.of(definition), new ObjectMapper());
    }

    @Test
    void start_shouldExecuteFirstStepsUntilWaiting() {
        SagaInstance instance = orchestrator.start(SagaType.PAYMENT_ADVERTISEMENT, "corr-1", "TEST", Map.of("k", "v"));

        assertEquals(SagaStatus.WAITING, instance.getStatus());
        assertEquals(3, instance.getSteps().size());
        assertEquals(SagaStepStatus.SUCCEEDED, instance.getSteps().get(0).getStatus());
        assertEquals(SagaStepStatus.PENDING, instance.getSteps().get(1).getStatus());
        assertEquals(42, instance.getPayload().get("value"));
    }

    @Test
    void advance_withSuccess_shouldCompleteSaga() {
        orchestrator.start(SagaType.PAYMENT_ADVERTISEMENT, "corr-2", "TEST", new HashMap<>());

        SagaInstance advanced = orchestrator.advance("corr-2", "SUCCESS", Map.of("eventResult", "SUCCESS"));

        assertEquals(SagaStatus.COMPLETED, advanced.getStatus());
        assertEquals(SagaStepStatus.SUCCEEDED, advanced.getSteps().get(1).getStatus());
        assertEquals(SagaStepStatus.SUCCEEDED, advanced.getSteps().get(2).getStatus());
        assertEquals("ok", advanced.getPayload().get("final"));
    }

    @Test
    void advance_withFailure_shouldCompensatePreviousSteps() {
        orchestrator.start(SagaType.PAYMENT_ADVERTISEMENT, "corr-3", "TEST", new HashMap<>());

        SagaInstance advanced = orchestrator.advance("corr-3", "FAILURE", Map.of("eventResult", "FAILURE"));

        assertEquals(SagaStatus.COMPENSATED, advanced.getStatus());
        assertEquals(SagaStepStatus.COMPENSATED, advanced.getSteps().get(0).getStatus());
        assertTrue((Boolean) advanced.getPayload().get("compensated"));
    }

    @Test
    void findByCorrelationId_shouldReturnInstance() {
        SagaInstance instance = SagaInstance.builder()
                .id(10L)
                .sagaType(SagaType.PAYMENT_ADVERTISEMENT)
                .status(SagaStatus.COMPLETED)
                .correlationId("corr-x")
                .build();
        storage.put("corr-x", instance);
        when(instanceRepository.findByCorrelationId("corr-x")).thenReturn(Optional.of(instance));

        Optional<SagaInstance> result = orchestrator.findByCorrelationId("corr-x");

        assertTrue(result.isPresent());
        assertEquals("corr-x", result.get().getCorrelationId());
    }
}

package com.marocloc.marocloc_backend.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;
import java.util.UUID;

/**
 * Audit aspect that logs all controller method invocations with timing.
 * Useful for debugging, performance monitoring, and security auditing.
 */
@Slf4j
@Aspect
@Component
public class AuditAspect {

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void restController() {}

    @Around("restController()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        long start = System.currentTimeMillis();

        String methodName = joinPoint.getSignature().toShortString();
        Object[] args = joinPoint.getArgs();

        HttpServletRequest request = getCurrentRequest();
        String httpMethod = request != null ? request.getMethod() : "UNKNOWN";
        String uri = request != null ? request.getRequestURI() : "UNKNOWN";
        String clientIp = request != null ? getClientIp(request) : "UNKNOWN";

        log.info("[{}] {} {} {} - args={} - client={}",
                traceId, httpMethod, uri, methodName,
                Arrays.toString(maskSensitiveArgs(args)), clientIp);

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            log.info("[{}] {} {} {} - completed in {}ms", traceId, httpMethod, uri, methodName, duration);
            return result;
        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - start;
            log.error("[{}] {} {} {} - failed in {}ms - error: {}",
                    traceId, httpMethod, uri, methodName, duration, ex.getMessage());
            throw ex;
        }
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest() : null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    private Object[] maskSensitiveArgs(Object[] args) {
        if (args == null) return new Object[0];
        return Arrays.stream(args)
                .map(arg -> {
                    if (arg instanceof String s && (s.contains("password") || s.contains("token") || s.contains("secret"))) {
                        return "***MASKED***";
                    }
                    return arg;
                })
                .toArray();
    }
}

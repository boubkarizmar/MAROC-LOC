package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.PaymentTransaction;
import com.marocloc.marocloc_backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final EmailService emailService;

    private static final String INVOICE_PREFIX = "FAC-MAROCLOC-";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Transactional
    public String generateInvoiceNumber() {
        return INVOICE_PREFIX + LocalDateTime.now().format(DATE_FORMATTER) + "-" +
               UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Transactional
    public void sendPaymentConfirmationEmail(User user, PaymentTransaction transaction) {
        try {
            emailService.sendPaymentConfirmationEmail(
                user.getEmail(),
                transaction.getProviderTransactionId() != null ? transaction.getProviderTransactionId() : transaction.getId().toString(),
                transaction.getAmount()
            );
            log.info("Payment confirmation email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send payment confirmation email to {}", user.getEmail(), e);
        }
    }

    @Transactional
    public void sendInvoiceEmail(User user, String invoiceNumber, Double amount) {
        try {
            emailService.sendInvoiceEmail(user.getEmail(), invoiceNumber, amount);
            log.info("Invoice email sent to {} for invoice {}", user.getEmail(), invoiceNumber);
        } catch (Exception e) {
            log.error("Failed to send invoice email to {}", user.getEmail(), e);
        }
    }
}

package com.marocloc.marocloc_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:noreply@marocloc.ma}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Async("emailTaskExecutor")
    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Simple email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send simple email to {}", to, e);
        }
    }

    @Async("emailTaskExecutor")
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name()
            );
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("HTML email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}", to, e);
        }
    }

    public void sendVerificationEmail(String to, String token) {
        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        Context context = new Context();
        context.setVariable("verificationLink", verificationLink);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/verification", context);
        sendHtmlEmail(to, "Vérifiez votre adresse e-mail - MAROC-LOC", htmlContent);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        Context context = new Context();
        context.setVariable("resetLink", resetLink);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/password-reset", context);
        sendHtmlEmail(to, "Réinitialisation de votre mot de passe - MAROC-LOC", htmlContent);
    }

    public void sendWelcomeEmail(String to, String userName) {
        Context context = new Context();
        context.setVariable("userName", userName);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/welcome", context);
        sendHtmlEmail(to, "Bienvenue sur MAROC-LOC !", htmlContent);
    }

    public void sendPropertyApprovedEmail(String to, String propertyTitle) {
        Context context = new Context();
        context.setVariable("propertyTitle", propertyTitle);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/property-approved", context);
        sendHtmlEmail(to, "Votre annonce a été approuvée - MAROC-LOC", htmlContent);
    }

    public void sendNewMessageNotification(String to, String senderName, String propertyTitle) {
        Context context = new Context();
        context.setVariable("senderName", senderName);
        context.setVariable("propertyTitle", propertyTitle);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/new-message", context);
        sendHtmlEmail(to, "Nouveau message concernant " + propertyTitle + " - MAROC-LOC", htmlContent);
    }

    public void sendVisitRequestNotification(String to, String requesterName, String propertyTitle, String requestedDate) {
        Context context = new Context();
        context.setVariable("requesterName", requesterName);
        context.setVariable("propertyTitle", propertyTitle);
        context.setVariable("requestedDate", requestedDate);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/visit-request", context);
        sendHtmlEmail(to, "Demande de visite pour " + propertyTitle + " - MAROC-LOC", htmlContent);
    }

    public void sendPaymentConfirmationEmail(String to, String transactionId, BigDecimal amount) {
        Context context = new Context();
        context.setVariable("transactionId", transactionId);
        context.setVariable("amount", amount);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/payment-confirmation", context);
        sendHtmlEmail(to, "Confirmation de paiement - MAROC-LOC", htmlContent);
    }

    public void sendReservationConfirmationEmail(String buyerEmail, String sellerEmail, String propertyTitle,
                                                  BigDecimal amount, String transactionType) {
        Context context = new Context();
        context.setVariable("propertyTitle", propertyTitle);
        context.setVariable("amount", amount);
        context.setVariable("transactionType", transactionType);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/reservation-confirmation", context);
        String subject = ("PURCHASE".equalsIgnoreCase(transactionType) ? "Achat" : "Réservation")
                + " confirmé(e) - " + propertyTitle + " - MAROC-LOC";
        sendHtmlEmail(buyerEmail, subject, htmlContent);
        if (sellerEmail != null && !sellerEmail.equalsIgnoreCase(buyerEmail)) {
            sendHtmlEmail(sellerEmail, subject, htmlContent);
        }
    }

    public void sendReservationFailureEmail(String buyerEmail, String propertyTitle, String reason, String transactionType) {
        Context context = new Context();
        context.setVariable("propertyTitle", propertyTitle);
        context.setVariable("reason", reason != null ? reason : "Paiement refusé ou annulé");
        context.setVariable("transactionType", transactionType);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/reservation-failure", context);
        String subject = "Échec de " + ("PURCHASE".equalsIgnoreCase(transactionType) ? "l'achat" : "la réservation")
                + " - " + propertyTitle + " - MAROC-LOC";
        sendHtmlEmail(buyerEmail, subject, htmlContent);
    }

    public void sendInvoiceEmail(String to, String invoiceNumber, Double amount) {
        Context context = new Context();
        context.setVariable("invoiceNumber", invoiceNumber);
        context.setVariable("amount", amount);
        context.setVariable("frontendUrl", frontendUrl);

        String htmlContent = templateEngine.process("email/invoice", context);
        sendHtmlEmail(to, "Votre facture " + invoiceNumber + " - MAROC-LOC", htmlContent);
    }
}

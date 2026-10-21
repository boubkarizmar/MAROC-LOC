package com.marocloc.marocloc_backend.notification.template;

import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.notification.model.Notification;
import com.marocloc.marocloc_backend.notification.model.NotificationPriority;
import com.marocloc.marocloc_backend.notification.model.NotificationType;

import java.util.Map;

public final class NotificationTemplate {

    private NotificationTemplate() {
    }

    private static Notification.NotificationBuilder base(NotificationType type, String title, String message, String icon) {
        return Notification.builder()
                .type(type)
                .title(title)
                .message(message)
                .icon(icon)
                .priority(NotificationPriority.NORMAL);
    }

    // =================== AUTH ===================
    public static Notification accountCreated(Long userId) {
        return base(NotificationType.ACCOUNT_CREATED, "Bienvenue sur MAROC-LOC", "Votre compte a été créé avec succès.", "👋")
                .userId(userId)
                .actionUrl("/profile")
                .build();
    }

    public static Notification emailVerification(Long userId) {
        return base(NotificationType.EMAIL_VERIFICATION, "Vérification de votre email", "Veuillez vérifier votre adresse email pour activer votre compte.", "✉️")
                .userId(userId)
                .priority(NotificationPriority.HIGH)
                .build();
    }

    public static Notification accountValidated(Long userId) {
        return base(NotificationType.ACCOUNT_VALIDATED, "Compte validé", "Votre compte est maintenant vérifié.", "✅")
                .userId(userId)
                .build();
    }

    public static Notification passwordChanged(Long userId) {
        return base(NotificationType.PASSWORD_CHANGED, "Mot de passe modifié", "Votre mot de passe a été changé avec succès.", "🔒")
                .userId(userId)
                .priority(NotificationPriority.HIGH)
                .build();
    }

    public static Notification suspiciousLogin(Long userId) {
        return base(NotificationType.SUSPICIOUS_LOGIN, "Connexion suspecte", "Nous avons détecté une connexion inhabituelle sur votre compte.", "🚨")
                .userId(userId)
                .priority(NotificationPriority.URGENT)
                .build();
    }

    // =================== RESERVATION ===================
    public static Notification reservationCreated(Long ownerId, Long tenantId, Long propertyId, String propertyTitle) {
        return base(NotificationType.RESERVATION_CREATED, "Nouvelle demande de réservation",
                "Un locataire souhaite réserver le bien : " + propertyTitle, "🏠")
                .userId(ownerId)
                .senderId(tenantId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/dashboard/reservations")
                .priority(NotificationPriority.HIGH)
                .build();
    }

    public static Notification reservationConfirmed(Long tenantId, Long ownerId, Long propertyId, String propertyTitle) {
        return base(NotificationType.RESERVATION_CONFIRMED, "Réservation confirmée",
                "Votre réservation pour " + propertyTitle + " a été confirmée.", "✅")
                .userId(tenantId)
                .senderId(ownerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/reservations")
                .build();
    }

    public static Notification reservationRefused(Long tenantId, Long ownerId, Long propertyId, String propertyTitle) {
        return base(NotificationType.RESERVATION_REFUSED, "Réservation refusée",
                "Votre demande de réservation pour " + propertyTitle + " a été refusée.", "❌")
                .userId(tenantId)
                .senderId(ownerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/reservations")
                .build();
    }

    public static Notification reservationCancelled(Long userId, Long actorId, Long propertyId, String propertyTitle) {
        return base(NotificationType.RESERVATION_CANCELLED, "Réservation annulée",
                "La réservation pour " + propertyTitle + " a été annulée.", "🚫")
                .userId(userId)
                .senderId(actorId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/reservations")
                .build();
    }

    public static Notification reservationExpired(Long userId, Long propertyId, String propertyTitle) {
        return base(NotificationType.RESERVATION_EXPIRED, "Réservation expirée",
                "Votre réservation pour " + propertyTitle + " a expiré.", "⏰")
                .userId(userId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/reservations")
                .build();
    }

    // =================== PURCHASE ===================
    public static Notification purchaseCreated(Long ownerId, Long buyerId, Long propertyId, String propertyTitle) {
        return base(NotificationType.PURCHASE_CREATED, "Nouvelle demande d'achat",
                "Un acheteur souhaite acquérir le bien : " + propertyTitle, "🏠")
                .userId(ownerId)
                .senderId(buyerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/dashboard/purchases")
                .priority(NotificationPriority.HIGH)
                .build();
    }

    public static Notification purchasePaid(Long ownerId, Long buyerId, Long propertyId, String propertyTitle) {
        return base(NotificationType.PURCHASE_PAID, "Achat payé",
                "Le paiement pour " + propertyTitle + " a été reçu.", "💰")
                .userId(ownerId)
                .senderId(buyerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/dashboard/purchases")
                .build();
    }

    public static Notification purchaseFailed(Long userId, Long propertyId, String propertyTitle) {
        return base(NotificationType.PURCHASE_FAILED, "Achat échoué",
                "Le paiement pour " + propertyTitle + " a échoué.", "❌")
                .userId(userId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/reservations")
                .build();
    }

    // =================== PAYMENT ===================
    public static Notification paymentSuccess(Long userId, String provider, String orderId) {
        return base(NotificationType.PAYMENT_CMI_SUCCESS, "Paiement réussi",
                "Votre paiement via " + provider + " (commande " + orderId + ") a été validé.", "💳")
                .userId(userId)
                .metadata(Map.of("provider", provider, "orderId", orderId))
                .actionUrl("/payments")
                .build();
    }

    public static Notification paymentFailed(Long userId, String provider, String orderId) {
        return base(NotificationType.PAYMENT_FAILED, "Paiement échoué",
                "Votre paiement via " + provider + " (commande " + orderId + ") a échoué.", "❌")
                .userId(userId)
                .metadata(Map.of("provider", provider, "orderId", orderId))
                .actionUrl("/payments")
                .build();
    }

    public static Notification paymentRefunded(Long userId, String provider, String orderId) {
        return base(NotificationType.PAYMENT_REFUNDED, "Paiement remboursé",
                "Votre paiement via " + provider + " (commande " + orderId + ") a été remboursé.", "↩️")
                .userId(userId)
                .metadata(Map.of("provider", provider, "orderId", orderId))
                .actionUrl("/payments")
                .build();
    }

    public static Notification paymentPending(Long userId, String provider, String orderId) {
        return base(NotificationType.PAYMENT_PENDING, "Paiement en attente",
                "Votre paiement via " + provider + " (commande " + orderId + ") est en attente de validation.", "⏳")
                .userId(userId)
                .metadata(Map.of("provider", provider, "orderId", orderId))
                .actionUrl("/payments")
                .build();
    }

    // =================== ADVERTISEMENT ===================
    public static Notification advertisementCreated(Long userId, Long adId) {
        return base(NotificationType.ADVERTISEMENT_CREATED, "Publicité créée", "Votre publicité a été créée et est en attente de validation.", "📢")
                .userId(userId)
                .entityId(adId)
                .entityType("ADVERTISEMENT")
                .actionUrl("/dashboard/ads")
                .build();
    }

    public static Notification advertisementApproved(Long userId, Long adId) {
        return base(NotificationType.ADVERTISEMENT_APPROVED, "Publicité approuvée", "Votre publicité a été approuvée et est maintenant en ligne.", "✅")
                .userId(userId)
                .entityId(adId)
                .entityType("ADVERTISEMENT")
                .actionUrl("/dashboard/ads")
                .build();
    }

    public static Notification advertisementRejected(Long userId, Long adId, String reason) {
        return base(NotificationType.ADVERTISEMENT_REJECTED, "Publicité rejetée",
                "Votre publicité a été rejetée. Motif : " + reason, "❌")
                .userId(userId)
                .entityId(adId)
                .entityType("ADVERTISEMENT")
                .actionUrl("/dashboard/ads")
                .build();
    }

    public static Notification advertisementExpired(Long userId, Long adId) {
        return base(NotificationType.ADVERTISEMENT_EXPIRED, "Publicité expirée", "Votre publicité a expiré.", "⏰")
                .userId(userId)
                .entityId(adId)
                .entityType("ADVERTISEMENT")
                .actionUrl("/dashboard/ads")
                .build();
    }

    public static Notification advertisementExpiringSoon(Long userId, Long adId, long daysLeft) {
        return base(NotificationType.ADVERTISEMENT_EXPIRING_SOON, "Publicité bientôt expirée",
                "Votre publicité expire dans " + daysLeft + " jour(s).", "⏰")
                .userId(userId)
                .entityId(adId)
                .entityType("ADVERTISEMENT")
                .actionUrl("/dashboard/ads")
                .priority(NotificationPriority.HIGH)
                .build();
    }

    // =================== PROPERTY ===================
    public static Notification propertyCreated(Long ownerId, Long propertyId) {
        return base(NotificationType.PROPERTY_CREATED, "Bien créé", "Votre bien a été soumis et est en attente de validation.", "🏠")
                .userId(ownerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/dashboard/properties")
                .build();
    }

    public static Notification propertyApproved(Long ownerId, Long propertyId, String title) {
        return base(NotificationType.PROPERTY_APPROVED, "Bien approuvé",
                "Votre bien \"" + title + "\" a été approuvé.", "✅")
                .userId(ownerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/property/" + propertyId)
                .build();
    }

    public static Notification propertyRejected(Long ownerId, Long propertyId, String title, String reason) {
        return base(NotificationType.PROPERTY_REJECTED, "Bien refusé",
                "Votre bien \"" + title + "\" a été refusé. Motif : " + reason, "❌")
                .userId(ownerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/dashboard/properties")
                .build();
    }

    public static Notification propertySold(Long ownerId, Long buyerId, Long propertyId, String title) {
        return base(NotificationType.PROPERTY_SOLD, "Bien vendu",
                "Félicitations ! Votre bien \"" + title + "\" a été vendu.", "🎉")
                .userId(ownerId)
                .senderId(buyerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/dashboard/properties")
                .priority(NotificationPriority.HIGH)
                .build();
    }

    public static Notification propertyReserved(Long ownerId, Long tenantId, Long propertyId, String title) {
        return base(NotificationType.PROPERTY_RESERVED, "Bien réservé",
                "Votre bien \"" + title + "\" a été réservé.", "🔒")
                .userId(ownerId)
                .senderId(tenantId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/dashboard/properties")
                .priority(NotificationPriority.HIGH)
                .build();
    }

    // =================== MESSAGES ===================
    public static Notification newMessage(Long receiverId, Long senderId, String senderName, Long conversationId) {
        return base(NotificationType.NEW_MESSAGE, "Nouveau message",
                "Vous avez reçu un message de " + senderName + ".", "💬")
                .userId(receiverId)
                .senderId(senderId)
                .entityId(conversationId)
                .entityType("CONVERSATION")
                .actionUrl("/messages")
                .build();
    }

    public static Notification newConversation(Long receiverId, Long senderId, String senderName) {
        return base(NotificationType.NEW_CONVERSATION, "Nouvelle conversation",
                senderName + " a démarré une conversation avec vous.", "💬")
                .userId(receiverId)
                .senderId(senderId)
                .actionUrl("/messages")
                .build();
    }

    // =================== REVIEWS ===================
    public static Notification newReview(Long ownerId, Long reviewerId, Long propertyId, String propertyTitle) {
        return base(NotificationType.NEW_REVIEW, "Nouvel avis",
                "Votre bien \"" + propertyTitle + "\" a reçu un nouvel avis.", "⭐")
                .userId(ownerId)
                .senderId(reviewerId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/property/" + propertyId)
                .build();
    }

    public static Notification reviewApproved(Long reviewerId, Long reviewId, Long propertyId) {
        return base(NotificationType.REVIEW_APPROVED, "Avis approuvé", "Votre avis a été approuvé.", "✅")
                .userId(reviewerId)
                .entityId(reviewId)
                .entityType("REVIEW")
                .actionUrl("/property/" + propertyId)
                .build();
    }

    public static Notification reviewRejected(Long reviewerId, Long reviewId, String reason) {
        return base(NotificationType.REVIEW_REJECTED, "Avis refusé",
                "Votre avis a été refusé. Motif : " + reason, "❌")
                .userId(reviewerId)
                .entityId(reviewId)
                .entityType("REVIEW")
                .actionUrl("/profile")
                .build();
    }

    // =================== VISITS ===================
    public static Notification visitScheduled(Long ownerId, Long tenantId, Long visitId, Long propertyId, String propertyTitle) {
        return base(NotificationType.VISIT_SCHEDULED, "Visite programmée",
                "Une visite pour \"" + propertyTitle + "\" a été programmée.", "📅")
                .userId(ownerId)
                .senderId(tenantId)
                .entityId(visitId)
                .entityType("VISIT")
                .actionUrl("/dashboard/visits")
                .build();
    }

    public static Notification visitConfirmed(Long tenantId, Long ownerId, Long visitId, Long propertyId, String propertyTitle) {
        return base(NotificationType.VISIT_CONFIRMED, "Visite confirmée",
                "Votre visite pour \"" + propertyTitle + "\" a été confirmée.", "✅")
                .userId(tenantId)
                .senderId(ownerId)
                .entityId(visitId)
                .entityType("VISIT")
                .actionUrl("/visits")
                .build();
    }

    public static Notification visitCancelled(Long userId, Long actorId, Long visitId, Long propertyId, String propertyTitle) {
        return base(NotificationType.VISIT_CANCELLED, "Visite annulée",
                "La visite pour \"" + propertyTitle + "\" a été annulée.", "🚫")
                .userId(userId)
                .senderId(actorId)
                .entityId(visitId)
                .entityType("VISIT")
                .actionUrl("/visits")
                .build();
    }

    public static Notification visitCompleted(Long userId, Long visitId, Long propertyId, String propertyTitle) {
        return base(NotificationType.VISIT_COMPLETED, "Visite terminée",
                "La visite pour \"" + propertyTitle + "\" est terminée.", "✅")
                .userId(userId)
                .entityId(visitId)
                .entityType("VISIT")
                .actionUrl("/visits")
                .build();
    }

    public static Notification visitReminder(Long userId, Long visitId, Long propertyId, String propertyTitle, long minutesBefore) {
        String when = minutesBefore >= 60 ? (minutesBefore / 60) + " heure(s)" : minutesBefore + " minute(s)";
        return base(NotificationType.VISIT_REMINDER, "Rappel de visite",
                "Votre visite pour \"" + propertyTitle + "\" commence dans " + when + ".", "⏰")
                .userId(userId)
                .entityId(visitId)
                .entityType("VISIT")
                .actionUrl("/visits")
                .priority(NotificationPriority.HIGH)
                .build();
    }

    // =================== AI ===================
    public static Notification aiRecommendation(Long userId, Long propertyId, String propertyTitle) {
        return base(NotificationType.AI_RECOMMENDATION, "Nouvelle recommandation IA",
                "Nous avons trouvé un bien qui pourrait vous intéresser : " + propertyTitle, "🤖")
                .userId(userId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/property/" + propertyId)
                .build();
    }

    // =================== SYSTEM ===================
    public static Notification systemAnnouncement(Role role, String title, String message) {
        return base(NotificationType.SYSTEM_ANNOUNCEMENT, title, message, "📢")
                .role(role)
                .priority(NotificationPriority.LOW)
                .build();
    }

    public static Notification priceDrop(Long userId, Long propertyId, String propertyTitle) {
        return base(NotificationType.PRICE_DROP, "Baisse de prix",
                "Le prix de \"" + propertyTitle + "\" a baissé.", "📉")
                .userId(userId)
                .entityId(propertyId)
                .entityType("PROPERTY")
                .actionUrl("/property/" + propertyId)
                .build();
    }

    public static Notification fraudFlag(Long adminId, Long entityId, String entityType) {
        return base(NotificationType.FRAUD_FLAG, "Alerte fraude",
                "Un élément suspect a été détecté sur " + entityType + " #" + entityId + ".", "🚨")
                .userId(adminId)
                .entityId(entityId)
                .entityType(entityType)
                .actionUrl("/admin")
                .priority(NotificationPriority.URGENT)
                .build();
    }

    // =================== ROLE-TARGETED ADMIN ===================
    public static Notification forRole(Role role, NotificationType type, String title, String message, String icon) {
        return base(type, title, message, icon)
                .role(role)
                .build();
    }
}

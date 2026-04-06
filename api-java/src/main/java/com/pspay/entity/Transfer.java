package com.pspay.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "transfers")
public class Transfer {
    @Id
    private UUID id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "direction_id")
    private Long directionId;

    @Column(name = "provider_id")
    private Long providerId;

    @Column(nullable = false, length = 20)
    private String status = "CREATED";

    @Column(name = "sender_card", length = 19)
    private String senderCard;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "receiver_card", length = 30)
    private String receiverCard;

    @Column(name = "receiver_name")
    private String receiverName;

    @Column(name = "receiver_phone", length = 30)
    private String receiverPhone;

    @Column(name = "receiver_account", length = 50)
    private String receiverAccount;

    @Column(name = "amount_send", precision = 15, scale = 2)
    private BigDecimal amountSend;

    @Column(name = "amount_receive", precision = 15, scale = 2)
    private BigDecimal amountReceive;

    @Column(name = "currency_from", length = 3)
    private String currencyFrom;

    @Column(name = "currency_to", length = 3)
    private String currencyTo;

    @Column(name = "exchange_rate", precision = 15, scale = 6)
    private BigDecimal exchangeRate;

    @Column(precision = 15, scale = 2)
    private BigDecimal commission;

    @Column(name = "total_debit", precision = 15, scale = 2)
    private BigDecimal totalDebit;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}

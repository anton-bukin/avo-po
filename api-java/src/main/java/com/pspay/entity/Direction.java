package com.pspay.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "directions")
public class Direction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "country_from", nullable = false, length = 3)
    private String countryFrom;

    @Column(name = "country_to", nullable = false, length = 3)
    private String countryTo;

    @Column(name = "currency_from", nullable = false, length = 3)
    private String currencyFrom;

    @Column(name = "currency_to", nullable = false, length = 3)
    private String currencyTo;

    @Column(name = "margin_percent")
    private BigDecimal marginPercent = BigDecimal.ZERO;

    @Column(name = "commission_percent")
    private BigDecimal commissionPercent = new BigDecimal("1.5");

    @Column(name = "min_commission")
    private BigDecimal minCommission = new BigDecimal("50");

    @Column(name = "is_active")
    private Boolean isActive = true;
}

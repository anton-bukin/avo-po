package com.pspay.controller;

import com.pspay.entity.Direction;
import com.pspay.repository.*;
import com.pspay.service.CbrRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReferenceController {

    private final DirectionRepository directionRepo;
    private final CountryRepository countryRepo;
    private final ProviderRepository providerRepo;
    private final PaymentMethodRepository paymentMethodRepo;
    private final CbrRateService cbrService;

    @GetMapping("/directions")
    public List<?> directions() {
        return directionRepo.findByIsActiveTrueOrderById();
    }

    @GetMapping("/countries")
    public List<?> countries() {
        return countryRepo.findAllByOrderByNameAsc();
    }

    @GetMapping("/providers")
    public List<?> providers() {
        return providerRepo.findByIsActiveTrueOrderByNameAsc();
    }

    @GetMapping("/payment-methods")
    public List<?> paymentMethods() {
        return paymentMethodRepo.findByIsActiveTrueOrderByIdAsc();
    }

    @GetMapping("/rates")
    public Map<String, Object> rates() {
        List<Direction> dirs = directionRepo.findByIsActiveTrueOrderById();

        Map<String, Object> rates = new LinkedHashMap<>();
        Map<String, Object> commissions = new LinkedHashMap<>();

        for (Direction dir : dirs) {
            String currency = dir.getCurrencyTo();
            if (!rates.containsKey(currency)) {
                BigDecimal margin = dir.getMarginPercent() != null ? dir.getMarginPercent() : BigDecimal.ZERO;
                BigDecimal rate = cbrService.getRubToForeignRate(currency, margin);
                if (rate != null) rates.put(currency, rate);
            }
            commissions.put(String.valueOf(dir.getId()), Map.of(
                    "rate", dir.getCommissionPercent() != null ? dir.getCommissionPercent() : new BigDecimal("1.5"),
                    "min", dir.getMinCommission() != null ? dir.getMinCommission() : new BigDecimal("50")
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rates", rates);
        result.put("commissions", commissions);
        result.put("commissionRate", 0.015);
        result.put("minCommission", 50);
        result.put("cbrDate", cbrService.getCbrDate());
        return result;
    }
}

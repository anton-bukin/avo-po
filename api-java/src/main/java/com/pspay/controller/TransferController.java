package com.pspay.controller;

import com.pspay.entity.Direction;
import com.pspay.entity.Transfer;
import com.pspay.repository.DirectionRepository;
import com.pspay.repository.ProviderRepository;
import com.pspay.repository.TransferRepository;
import com.pspay.service.CbrRateService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferRepository transferRepo;
    private final DirectionRepository directionRepo;
    private final ProviderRepository providerRepo;
    private final CbrRateService cbrService;

    private Long getUserId(HttpServletRequest req) {
        return (Long) req.getAttribute("userId");
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        Long userId = getUserId(req);
        Object dirIdObj = body.get("directionId");
        if (dirIdObj == null) return ResponseEntity.badRequest().body(Map.of("error", "Направление перевода обязательно"));

        Long dirId = ((Number) dirIdObj).longValue();
        Direction dir = directionRepo.findById(dirId).orElse(null);
        if (dir == null) return ResponseEntity.badRequest().body(Map.of("error", "Направление не найдено"));

        Long providerId = providerRepo.findFirstByCountry(dir.getCountryTo()).map(p -> p.getId()).orElse(null);

        Transfer t = new Transfer();
        t.setUserId(userId);
        t.setDirectionId(dirId);
        t.setProviderId(providerId);
        t.setSenderCard((String) body.get("senderCard"));
        t.setSenderName((String) body.get("senderName"));
        t.setReceiverCard((String) body.get("receiverCard"));
        t.setReceiverName((String) body.get("receiverName"));
        t.setReceiverPhone((String) body.get("receiverPhone"));
        t.setReceiverAccount((String) body.get("receiverAccount"));
        if (body.get("amountSend") != null) {
            t.setAmountSend(new BigDecimal(body.get("amountSend").toString()));
        }
        t.setCurrencyFrom(dir.getCurrencyFrom());
        t.setCurrencyTo(dir.getCurrencyTo());
        transferRepo.save(t);

        return ResponseEntity.status(HttpStatus.CREATED).body(formatTransfer(t, null));
    }

    @PostMapping("/{id}/calculate")
    public ResponseEntity<?> calculate(@PathVariable UUID id, @RequestBody Map<String, Object> body, HttpServletRequest req) {
        Long userId = getUserId(req);
        Transfer t = transferRepo.findByIdAndUserId(id, userId).orElse(null);
        if (t == null) return ResponseEntity.status(404).body(Map.of("error", "Перевод не найден"));

        BigDecimal amount = body.get("amountSend") != null
                ? new BigDecimal(body.get("amountSend").toString())
                : t.getAmountSend();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Укажите сумму перевода"));
        }

        Direction dir = directionRepo.findById(t.getDirectionId()).orElse(null);
        BigDecimal margin = dir != null && dir.getMarginPercent() != null ? dir.getMarginPercent() : BigDecimal.ZERO;
        BigDecimal commPercent = dir != null && dir.getCommissionPercent() != null ? dir.getCommissionPercent() : new BigDecimal("1.5");
        BigDecimal minComm = dir != null && dir.getMinCommission() != null ? dir.getMinCommission() : new BigDecimal("50");

        BigDecimal rate = cbrService.getRubToForeignRate(t.getCurrencyTo(), margin);
        if (rate == null) rate = BigDecimal.ONE;

        BigDecimal commission = amount.multiply(commPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        if (commission.compareTo(minComm) < 0) commission = minComm;

        BigDecimal totalDebit = amount.add(commission);
        BigDecimal amountReceive = amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);

        t.setAmountSend(amount);
        t.setAmountReceive(amountReceive);
        t.setExchangeRate(rate);
        t.setCommission(commission);
        t.setTotalDebit(totalDebit);
        transferRepo.save(t);

        return ResponseEntity.ok(formatTransfer(t, null));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable UUID id, HttpServletRequest req) {
        Long userId = getUserId(req);
        Transfer t = transferRepo.findByIdAndUserId(id, userId).orElse(null);
        if (t == null) return ResponseEntity.status(404).body(Map.of("error", "Перевод не найден"));

        if (!"CREATED".equals(t.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Перевод в статусе " + t.getStatus() + ", подтверждение невозможно"));
        }
        if (t.getAmountSend() == null || t.getCommission() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Сначала выполните расчёт параметров перевода"));
        }

        log.info("[STUB] Списание {} {} с карты {}", t.getTotalDebit(), t.getCurrencyFrom(), t.getSenderCard());
        t.setStatus("PROCESSING");
        t.setConfirmedAt(Instant.now());
        transferRepo.save(t);

        log.info("[STUB] Отправка платёжного поручения партнёру provider_id={}", t.getProviderId());
        simulatePartnerProcessing(t.getId());

        return ResponseEntity.ok(formatTransfer(t, null));
    }

    @Async
    public void simulatePartnerProcessing(UUID transferId) {
        try {
            long delay = 2000 + (long) (Math.random() * 3000);
            Thread.sleep(delay);

            Transfer t = transferRepo.findById(transferId).orElse(null);
            if (t == null) return;

            if (Math.random() > 0.1) {
                t.setStatus("COMPLETED");
                t.setCompletedAt(Instant.now());
                log.info("[STUB] Перевод {} завершён успешно", transferId);
            } else {
                t.setStatus("FAILED");
                t.setErrorMessage("Ошибка на стороне партнёра");
                log.info("[STUB] Перевод {} завершён с ошибкой", transferId);
            }
            transferRepo.save(t);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable UUID id, HttpServletRequest req) {
        Long userId = getUserId(req);
        return transferRepo.findByIdAndUserId(id, userId)
                .map(t -> ResponseEntity.ok(formatTransfer(t, null)))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Перевод не найден")));
    }

    @GetMapping
    public List<Map<String, Object>> list(HttpServletRequest req) {
        Long userId = getUserId(req);
        List<Transfer> transfers = transferRepo.findByUserIdOrderByCreatedAtDesc(userId);

        // Get direction names
        Map<Long, String> dirNames = new HashMap<>();
        directionRepo.findAll().forEach(d -> dirNames.put(d.getId(), d.getName()));

        return transfers.stream().map(t -> formatTransfer(t, dirNames.get(t.getDirectionId()))).toList();
    }

    static Map<String, Object> formatTransfer(Transfer t, String directionName) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId().toString());
        m.put("status", t.getStatus());
        m.put("directionId", t.getDirectionId());
        m.put("directionName", directionName);
        m.put("providerId", t.getProviderId());
        m.put("senderCard", t.getSenderCard());
        m.put("senderName", t.getSenderName());
        m.put("receiverCard", t.getReceiverCard());
        m.put("receiverName", t.getReceiverName());
        m.put("receiverPhone", t.getReceiverPhone());
        m.put("receiverAccount", t.getReceiverAccount());
        m.put("amountSend", t.getAmountSend());
        m.put("amountReceive", t.getAmountReceive());
        m.put("currencyFrom", t.getCurrencyFrom());
        m.put("currencyTo", t.getCurrencyTo());
        m.put("exchangeRate", t.getExchangeRate());
        m.put("commission", t.getCommission());
        m.put("totalDebit", t.getTotalDebit());
        m.put("createdAt", t.getCreatedAt());
        m.put("confirmedAt", t.getConfirmedAt());
        m.put("completedAt", t.getCompletedAt());
        m.put("errorMessage", t.getErrorMessage());
        return m;
    }
}

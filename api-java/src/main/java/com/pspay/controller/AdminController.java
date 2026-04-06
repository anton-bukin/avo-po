package com.pspay.controller;

import com.pspay.entity.Country;
import com.pspay.entity.Direction;
import com.pspay.entity.Transfer;
import com.pspay.repository.*;
import com.pspay.service.CbrRateService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepo;
    private final TransferRepository transferRepo;
    private final DirectionRepository directionRepo;
    private final CountryRepository countryRepo;
    private final CbrRateService cbrService;

    @Value("${app.admin.user-id}")
    private Long adminUserId;

    private boolean isAdmin(HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        return adminUserId.equals(userId);
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
    }

    // GET /api/v1/admin/stats
    @GetMapping("/stats")
    public ResponseEntity<?> stats(HttpServletRequest req) {
        if (!isAdmin(req)) return forbidden();

        Map<String, Object> byStatus = new LinkedHashMap<>();
        transferRepo.countByStatus().forEach(row -> byStatus.put((String) row[0], ((Number) row[1]).intValue()));

        return ResponseEntity.ok(Map.of(
                "totalUsers", userRepo.count(),
                "totalTransfers", transferRepo.countAll(),
                "transfersByStatus", byStatus,
                "totalVolume", transferRepo.totalCompletedVolume()
        ));
    }

    // GET /api/v1/admin/users
    @GetMapping("/users")
    public ResponseEntity<?> users(HttpServletRequest req) {
        if (!isAdmin(req)) return forbidden();

        List<Map<String, Object>> result = userRepo.findAllWithStats().stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", row[0]);
            m.put("email", row[1]);
            m.put("fullName", row[2]);
            m.put("createdAt", row[3]);
            m.put("transferCount", ((Number) row[4]).intValue());
            m.put("totalSent", row[5] instanceof BigDecimal bd ? bd.doubleValue() : 0.0);
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // GET /api/v1/admin/transfers
    @GetMapping("/transfers")
    public ResponseEntity<?> transfers(HttpServletRequest req,
                                       @RequestParam(required = false) String status,
                                       @RequestParam(required = false) Long userId,
                                       @RequestParam(defaultValue = "100") int limit,
                                       @RequestParam(defaultValue = "0") int offset) {
        if (!isAdmin(req)) return forbidden();

        long total = transferRepo.countFiltered(status, userId);
        var page = transferRepo.findFiltered(status, userId, PageRequest.of(offset / Math.max(limit, 1), Math.max(limit, 1)));

        Map<Long, String> dirNames = directionRepo.findAll().stream().collect(Collectors.toMap(Direction::getId, Direction::getName));
        Map<Long, String> userEmails = new HashMap<>();
        Map<Long, String> userNames = new HashMap<>();
        userRepo.findAll().forEach(u -> { userEmails.put(u.getId(), u.getEmail()); userNames.put(u.getId(), u.getFullName()); });

        List<Map<String, Object>> transfers = page.getContent().stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>(TransferController.formatTransfer(t, dirNames.get(t.getDirectionId())));
            m.put("userEmail", userEmails.get(t.getUserId()));
            m.put("userName", userNames.get(t.getUserId()));
            return m;
        }).toList();

        return ResponseEntity.ok(Map.of("total", total, "transfers", transfers));
    }

    // GET /api/v1/admin/transfers/export
    @GetMapping("/transfers/export")
    public void exportCsv(HttpServletRequest req, HttpServletResponse resp,
                          @RequestParam(required = false) String status,
                          @RequestParam(required = false) Long userId) throws Exception {
        if (!isAdmin(req)) {
            resp.setStatus(403);
            resp.getWriter().write("{\"error\":\"Доступ запрещён\"}");
            return;
        }

        List<Transfer> transfers = transferRepo.findAllFiltered(status, userId);
        Map<Long, String> dirNames = directionRepo.findAll().stream().collect(Collectors.toMap(Direction::getId, Direction::getName));
        Map<Long, String> userEmails = new HashMap<>();
        Map<Long, String> userNames = new HashMap<>();
        userRepo.findAll().forEach(u -> { userEmails.put(u.getId(), u.getEmail()); userNames.put(u.getId(), u.getFullName()); });

        resp.setContentType("text/csv; charset=utf-8");
        resp.setHeader("Content-Disposition", "attachment; filename=\"transfers_" + java.time.LocalDate.now() + ".csv\"");

        PrintWriter w = resp.getWriter();
        w.write("\uFEFF"); // BOM
        w.println("ID,Статус,Направление,Пользователь,Email,Карта отправителя,Имя отправителя,Карта получателя,Имя получателя,Телефон получателя,Сумма отправки,Валюта отправки,Сумма получения,Валюта получения,Курс,Комиссия,Итого списано,Создан,Подтверждён,Завершён,Ошибка");

        for (Transfer t : transfers) {
            w.println(String.join(",",
                    csvField(t.getId()), csvField(t.getStatus()), csvField(dirNames.get(t.getDirectionId())),
                    csvField(userNames.get(t.getUserId())), csvField(userEmails.get(t.getUserId())),
                    csvField(t.getSenderCard()), csvField(t.getSenderName()),
                    csvField(t.getReceiverCard()), csvField(t.getReceiverName()), csvField(t.getReceiverPhone()),
                    csvField(t.getAmountSend()), csvField(t.getCurrencyFrom()),
                    csvField(t.getAmountReceive()), csvField(t.getCurrencyTo()),
                    csvField(t.getExchangeRate()), csvField(t.getCommission()), csvField(t.getTotalDebit()),
                    csvField(t.getCreatedAt()), csvField(t.getConfirmedAt()), csvField(t.getCompletedAt()),
                    csvField(t.getErrorMessage())
            ));
        }
    }

    private String csvField(Object val) {
        String s = val != null ? val.toString() : "";
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }

    // GET /api/v1/admin/directions
    @GetMapping("/directions")
    public ResponseEntity<?> directions(HttpServletRequest req) {
        if (!isAdmin(req)) return forbidden();

        List<Direction> dirs = directionRepo.findAll();
        Map<String, Country> countries = countryRepo.findAll().stream().collect(Collectors.toMap(Country::getCode, c -> c));

        List<Map<String, Object>> result = dirs.stream().map(d -> {
            Country c = countries.get(d.getCountryTo());
            BigDecimal margin = d.getMarginPercent() != null ? d.getMarginPercent() : BigDecimal.ZERO;
            BigDecimal cbrRaw = cbrService.getCbrRawRate(d.getCurrencyTo());
            BigDecimal cbrRate = cbrRaw != null ? BigDecimal.ONE.divide(cbrRaw, 6, RoundingMode.HALF_UP) : null;
            BigDecimal effectiveRate = cbrService.getRubToForeignRate(d.getCurrencyTo(), margin);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("code", d.getCode());
            m.put("name", d.getName());
            m.put("countryFrom", d.getCountryFrom());
            m.put("countryTo", d.getCountryTo());
            m.put("countryToName", c != null ? c.getName() : null);
            m.put("countryToFlag", c != null ? c.getFlag() : null);
            m.put("currencyFrom", d.getCurrencyFrom());
            m.put("currencyTo", d.getCurrencyTo());
            m.put("marginPercent", margin);
            m.put("commissionPercent", d.getCommissionPercent() != null ? d.getCommissionPercent() : new BigDecimal("1.5"));
            m.put("minCommission", d.getMinCommission() != null ? d.getMinCommission() : new BigDecimal("50"));
            m.put("isActive", d.getIsActive());
            m.put("cbrRate", cbrRate);
            m.put("effectiveRate", effectiveRate);
            m.put("cbrRateName", null);
            return m;
        }).sorted(Comparator.comparing(m -> (Long) m.get("id"))).toList();

        return ResponseEntity.ok(Map.of("directions", result, "cbrDate", cbrService.getCbrDate()));
    }

    // PATCH /api/v1/admin/directions/:id
    @PatchMapping("/directions/{id}")
    public ResponseEntity<?> updateDirection(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest req) {
        if (!isAdmin(req)) return forbidden();

        Direction d = directionRepo.findById(id).orElse(null);
        if (d == null) return ResponseEntity.status(404).body(Map.of("error", "Направление не найдено"));

        if (body.containsKey("marginPercent")) {
            BigDecimal v = new BigDecimal(body.get("marginPercent").toString());
            if (v.compareTo(BigDecimal.valueOf(-50)) < 0 || v.compareTo(BigDecimal.valueOf(50)) > 0)
                return ResponseEntity.badRequest().body(Map.of("error", "Маржа должна быть от -50% до 50%"));
            d.setMarginPercent(v);
        }
        if (body.containsKey("commissionPercent")) {
            BigDecimal v = new BigDecimal(body.get("commissionPercent").toString());
            if (v.compareTo(BigDecimal.ZERO) < 0 || v.compareTo(BigDecimal.valueOf(30)) > 0)
                return ResponseEntity.badRequest().body(Map.of("error", "Комиссия должна быть от 0% до 30%"));
            d.setCommissionPercent(v);
        }
        if (body.containsKey("minCommission")) {
            BigDecimal v = new BigDecimal(body.get("minCommission").toString());
            if (v.compareTo(BigDecimal.ZERO) < 0)
                return ResponseEntity.badRequest().body(Map.of("error", "Мин. комиссия не может быть отрицательной"));
            d.setMinCommission(v);
        }
        if (body.containsKey("isActive")) {
            d.setIsActive((Boolean) body.get("isActive"));
        }

        directionRepo.save(d);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}

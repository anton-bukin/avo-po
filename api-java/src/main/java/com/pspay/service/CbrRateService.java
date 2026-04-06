package com.pspay.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class CbrRateService {

    private static final String CBR_URL = "https://www.cbr.ru/scripts/XML_daily.asp";
    private static final Pattern VALUTE_PATTERN = Pattern.compile("<Valute[^>]*>([\\s\\S]*?)</Valute>");
    private static final Pattern TAG_PATTERN = Pattern.compile("<(\\w+)>([^<]*)</\\1>");

    private final Map<String, BigDecimal> rates = new ConcurrentHashMap<>(); // RUB per 1 unit foreign
    private volatile String cbrDate = "—";
    private volatile long lastFetchTime = 0;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Get rate: how many units of foreign currency per 1 RUB, with margin applied.
     */
    public BigDecimal getRubToForeignRate(String currencyTo, BigDecimal marginPercent) {
        ensureRatesLoaded();
        BigDecimal rubPerUnit = rates.get(currencyTo);
        if (rubPerUnit == null) return null;

        // baseRate = 1 / rubPerUnit (foreign per 1 RUB)
        BigDecimal baseRate = BigDecimal.ONE.divide(rubPerUnit, 10, RoundingMode.HALF_UP);

        // Apply margin: effective = baseRate * (1 - margin/100)
        BigDecimal marginMultiplier = BigDecimal.ONE.subtract(
                marginPercent.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP));
        return baseRate.multiply(marginMultiplier).setScale(6, RoundingMode.HALF_UP);
    }

    /**
     * Get raw CBR rate (RUB per 1 unit foreign), no margin.
     */
    public BigDecimal getCbrRawRate(String currencyTo) {
        ensureRatesLoaded();
        return rates.get(currencyTo);
    }

    public String getCbrDate() {
        ensureRatesLoaded();
        return cbrDate;
    }

    private void ensureRatesLoaded() {
        if (System.currentTimeMillis() - lastFetchTime > 3600_000) {
            fetchRates();
        }
    }

    @Scheduled(fixedRate = 3600_000) // refresh every hour
    public void fetchRates() {
        try {
            log.info("[CBR] Fetching exchange rates...");
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(CBR_URL)).GET().build();
            HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

            // Read as Windows-1251
            byte[] bytes;
            try (InputStream is = response.body(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                is.transferTo(baos);
                bytes = baos.toByteArray();
            }
            String xml = new String(bytes, Charset.forName("Windows-1251"));

            parseXml(xml);
            lastFetchTime = System.currentTimeMillis();
            log.info("[CBR] Loaded {} rates for {}", rates.size(), cbrDate);
        } catch (Exception e) {
            log.error("[CBR] Failed to fetch rates", e);
        }
    }

    private void parseXml(String xml) {
        // Extract date
        Matcher dateMatcher = Pattern.compile("Date=\"([^\"]*)\"").matcher(xml);
        if (dateMatcher.find()) cbrDate = dateMatcher.group(1);

        Matcher valuteMatcher = VALUTE_PATTERN.matcher(xml);
        while (valuteMatcher.find()) {
            String block = valuteMatcher.group(1);
            Map<String, String> tags = new java.util.HashMap<>();
            Matcher tagMatcher = TAG_PATTERN.matcher(block);
            while (tagMatcher.find()) {
                tags.put(tagMatcher.group(1), tagMatcher.group(2).trim());
            }

            String charCode = tags.get("CharCode");
            String valueStr = tags.get("Value");
            String nominalStr = tags.get("Nominal");

            if (charCode != null && valueStr != null) {
                BigDecimal value = new BigDecimal(valueStr.replace(",", "."));
                int nominal = nominalStr != null ? Integer.parseInt(nominalStr) : 1;
                // Normalize to per-1-unit
                BigDecimal perUnit = value.divide(BigDecimal.valueOf(nominal), 10, RoundingMode.HALF_UP);
                rates.put(charCode, perUnit);
            }
        }
    }
}

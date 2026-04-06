package com.pspay.service;

import com.pspay.entity.*;
import com.pspay.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CountryRepository countryRepo;
    private final DirectionRepository directionRepo;
    private final ProviderRepository providerRepo;
    private final PaymentMethodRepository paymentMethodRepo;
    private final UserRepository userRepo;

    @Override
    public void run(String... args) {
        if (countryRepo.count() > 0) return;

        seedCountries();
        seedDirections();
        seedProviders();
        seedPaymentMethods();
        seedDemoUser();
    }

    private void seedCountries() {
        String[][] data = {
            {"RUS", "Россия", "RUB", "🇷🇺"},
            {"UZB", "Узбекистан", "UZS", "🇺🇿"},
            {"TJK", "Таджикистан", "TJS", "🇹🇯"},
            {"KGZ", "Кыргызстан", "KGS", "🇰🇬"},
            {"KAZ", "Казахстан", "KZT", "🇰🇿"},
            {"AZE", "Азербайджан", "AZN", "🇦🇿"},
            {"GEO", "Грузия", "GEL", "🇬🇪"},
            {"TUR", "Турция", "TRY", "🇹🇷"},
            {"CHN", "Китай", "CNY", "🇨🇳"},
            {"ARM", "Армения", "AMD", "🇦🇲"},
        };
        for (String[] d : data) {
            Country c = new Country();
            c.setCode(d[0]); c.setName(d[1]); c.setCurrency(d[2]); c.setFlag(d[3]);
            countryRepo.save(c);
        }
    }

    private void seedDirections() {
        String[][] data = {
            {"RU-UZ", "Россия → Узбекистан", "RUS", "UZB", "RUB", "UZS"},
            {"RU-TJ", "Россия → Таджикистан", "RUS", "TJK", "RUB", "TJS"},
            {"RU-KG", "Россия → Кыргызстан", "RUS", "KGZ", "RUB", "KGS"},
            {"RU-KZ", "Россия → Казахстан", "RUS", "KAZ", "RUB", "KZT"},
            {"RU-AZ", "Россия → Азербайджан", "RUS", "AZE", "RUB", "AZN"},
            {"RU-GE", "Россия → Грузия", "RUS", "GEO", "RUB", "GEL"},
            {"RU-TR", "Россия → Турция", "RUS", "TUR", "RUB", "TRY"},
            {"RU-CN", "Россия → Китай", "RUS", "CHN", "RUB", "CNY"},
            {"RU-AM", "Россия → Армения", "RUS", "ARM", "RUB", "AMD"},
        };
        for (String[] d : data) {
            Direction dir = new Direction();
            dir.setCode(d[0]); dir.setName(d[1]); dir.setCountryFrom(d[2]);
            dir.setCountryTo(d[3]); dir.setCurrencyFrom(d[4]); dir.setCurrencyTo(d[5]);
            directionRepo.save(dir);
        }
    }

    private void seedProviders() {
        String[][] data = {
            {"partner-uz", "UzTransfer", "UZB"},
            {"partner-tj", "TajPay", "TJK"},
            {"partner-kg", "KyrgyzRemit", "KGZ"},
            {"partner-kz", "KazTransfer", "KAZ"},
            {"partner-az", "AzerPay", "AZE"},
            {"partner-ge", "GeoPay", "GEO"},
            {"partner-tr", "TurkRemit", "TUR"},
            {"partner-cn", "ChinaPay", "CHN"},
            {"partner-am", "ArmTransfer", "ARM"},
        };
        for (String[] d : data) {
            Provider p = new Provider();
            p.setCode(d[0]); p.setName(d[1]); p.setCountry(d[2]);
            providerRepo.save(p);
        }
    }

    private void seedPaymentMethods() {
        String[][] data = {
            {"card-visa", "Visa", "card"},
            {"card-mc", "Mastercard", "card"},
            {"card-mir", "МИР", "card"},
            {"bank-account", "Банковский счёт", "account"},
            {"mobile-wallet", "Мобильный кошелёк", "wallet"},
        };
        for (String[] d : data) {
            PaymentMethod pm = new PaymentMethod();
            pm.setCode(d[0]); pm.setName(d[1]); pm.setType(d[2]);
            paymentMethodRepo.save(pm);
        }
    }

    private void seedDemoUser() {
        if (userRepo.existsByEmail("demo@pspay.ru")) return;
        User u = new User();
        u.setEmail("demo@pspay.ru");
        u.setPasswordHash(new BCryptPasswordEncoder().encode("demo123"));
        u.setFullName("Демо Пользователь");
        userRepo.save(u);
    }
}

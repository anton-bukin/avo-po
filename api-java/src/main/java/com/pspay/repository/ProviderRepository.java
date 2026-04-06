package com.pspay.repository;

import com.pspay.entity.Provider;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    List<Provider> findByIsActiveTrueOrderByNameAsc();
    Optional<Provider> findFirstByCountry(String country);
}

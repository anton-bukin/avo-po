package com.pspay.repository;

import com.pspay.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CountryRepository extends JpaRepository<Country, String> {
    List<Country> findAllByOrderByNameAsc();
}

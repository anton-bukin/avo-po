package com.pspay.repository;

import com.pspay.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findByIsActiveTrueOrderByIdAsc();
}

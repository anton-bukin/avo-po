package com.pspay.repository;

import com.pspay.entity.Transfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransferRepository extends JpaRepository<Transfer, UUID> {
    Optional<Transfer> findByIdAndUserId(UUID id, Long userId);
    List<Transfer> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COUNT(t) FROM Transfer t")
    long countAll();

    @Query("SELECT COALESCE(SUM(t.amountSend), 0) FROM Transfer t WHERE t.status = 'COMPLETED'")
    BigDecimal totalCompletedVolume();

    @Query("SELECT t.status, COUNT(t) FROM Transfer t GROUP BY t.status")
    List<Object[]> countByStatus();

    // Admin queries with optional filters
    @Query("SELECT t FROM Transfer t WHERE (:status IS NULL OR t.status = :status) AND (:userId IS NULL OR t.userId = :userId) ORDER BY t.createdAt DESC")
    Page<Transfer> findFiltered(String status, Long userId, Pageable pageable);

    @Query("SELECT COUNT(t) FROM Transfer t WHERE (:status IS NULL OR t.status = :status) AND (:userId IS NULL OR t.userId = :userId)")
    long countFiltered(String status, Long userId);

    @Query("SELECT t FROM Transfer t WHERE (:status IS NULL OR t.status = :status) AND (:userId IS NULL OR t.userId = :userId) ORDER BY t.createdAt DESC")
    List<Transfer> findAllFiltered(String status, Long userId);
}

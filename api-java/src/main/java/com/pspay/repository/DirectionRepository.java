package com.pspay.repository;

import com.pspay.entity.Direction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DirectionRepository extends JpaRepository<Direction, Long> {
    List<Direction> findByIsActiveTrueOrderById();
    boolean existsByCode(String code);
}

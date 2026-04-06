package com.pspay.repository;

import com.pspay.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("""
        SELECT u.id as id, u.email as email, u.fullName as fullName, u.createdAt as createdAt,
               (SELECT COUNT(t) FROM Transfer t WHERE t.userId = u.id) as transferCount,
               (SELECT COALESCE(SUM(t.amountSend), 0) FROM Transfer t WHERE t.userId = u.id AND t.status = 'COMPLETED') as totalSent
        FROM User u ORDER BY u.createdAt DESC
    """)
    List<Object[]> findAllWithStats();
}

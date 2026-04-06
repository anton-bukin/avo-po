package com.pspay.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "providers")
public class Provider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 3)
    private String country;

    @Column(name = "is_active")
    private Boolean isActive = true;
}

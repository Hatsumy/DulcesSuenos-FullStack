package com.hatsumy.ventasalmacen.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "categorias")
@Data
public class Categoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    // Constructor vacío necesario para JPA
    public Categoria() {}

    // Constructor para inicializar fácilmente
    public Categoria(String nombre) {
        this.nombre = nombre;
    }
}
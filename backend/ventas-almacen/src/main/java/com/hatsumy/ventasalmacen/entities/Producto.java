package com.hatsumy.ventasalmacen.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "productos")
@Data
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nombre;
    private String categoria;
    
    @Column(name = "codigo_barras")
    private String codigoBarras;
    
    private Integer stock;

    // ASEGÚRATE DE QUE ESTA LÍNEA EXISTA
    private Double precio; 
    
    @Column(name = "precio_compra")
    private Double precioCompra;
}
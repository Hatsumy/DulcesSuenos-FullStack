package com.hatsumy.ventasalmacen.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "detalle_ventas")
@Data
public class DetalleVenta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "producto_id")
    private Producto producto;

    private Integer cantidad;
    
    @Column(name = "precio_unitario")
    private Double precioUnitario;

    @Column(name = "precio_compra_historico") // El nuevo campo de tu captura
    private Double precioCompraHistorico;
}
package com.hatsumy.ventasalmacen.services;

import com.hatsumy.ventasalmacen.entities.*;
import com.hatsumy.ventasalmacen.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VentaService {
    @Autowired
    private VentaRepository ventaRepository;
    @Autowired
    private ProductoRepository productoRepository;

    public List<Venta> listarTodas() {
        return ventaRepository.findAll();
    }

    @Transactional
    public Venta registrarVenta(Venta venta) {
        if (venta.getDetalles() == null || venta.getDetalles().isEmpty()) {
            throw new RuntimeException("La venta no tiene productos.");
        }

        for (DetalleVenta detalle : venta.getDetalles()) {
            Producto p = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            if (p.getStock() < detalle.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + p.getNombre());
            }

            // Sincronización de precios con la entidad Producto
            detalle.setPrecioUnitario(p.getPrecio()); 
            detalle.setPrecioCompraHistorico(p.getPrecioCompra());

            p.setStock(p.getStock() - detalle.getCantidad());
            productoRepository.save(p);
        }
        return ventaRepository.save(venta);
    }

    public Map<LocalDate, Double> obtenerResumenVentasPorDia() {
        return ventaRepository.findAll().stream()
            .filter(v -> v.getFecha() != null)
            .collect(Collectors.groupingBy(
                v -> v.getFecha().toLocalDate(),
                Collectors.summingDouble(v -> v.getTotal() != null ? v.getTotal() : 0.0)
            ));
    }
}
package com.hatsumy.ventasalmacen.controllers;

import com.hatsumy.ventasalmacen.entities.Venta;
import com.hatsumy.ventasalmacen.services.VentaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate; // Importante agregar esto
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "*")
public class VentaController {
    
    @Autowired
    private VentaService ventaService;

    @GetMapping
    public List<Venta> listar() {
        return ventaService.listarTodas();
    }

    @PostMapping
    public Venta crear(@RequestBody Venta venta) {
        return ventaService.registrarVenta(venta);
    }

    // Cambiamos Map<String, Double> por Map<LocalDate, Double>
    @GetMapping("/resumen")
    public Map<LocalDate, Double> resumen() {
        return ventaService.obtenerResumenVentasPorDia();
    }
}
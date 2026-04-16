package com.hatsumy.ventasalmacen.controllers;

import com.hatsumy.ventasalmacen.entities.Producto;
import com.hatsumy.ventasalmacen.services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {
    @Autowired
    private ProductoService productoService;

    @GetMapping
    public List<Producto> listar() { return productoService.listarTodos(); }

    @PostMapping
    public Producto guardar(@RequestBody Producto producto) { 
        return productoService.guardar(producto); 
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) { 
        productoService.eliminar(id); 
    }
}
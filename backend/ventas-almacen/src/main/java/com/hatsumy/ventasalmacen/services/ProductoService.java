package com.hatsumy.ventasalmacen.services;

import com.hatsumy.ventasalmacen.entities.Producto;
import com.hatsumy.ventasalmacen.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductoService {
    @Autowired
    private ProductoRepository productoRepository;

    public List<Producto> listarTodos() { return productoRepository.findAll(); }

    public Producto guardar(Producto producto) { return productoRepository.save(producto); }

    public void eliminar(Long id) { productoRepository.deleteById(id); }

    public Producto buscarPorId(Long id) { 
        return productoRepository.findById(id).orElse(null); 
    }
}
package com.hatsumy.ventasalmacen.controllers;

import com.hatsumy.ventasalmacen.entities.Categoria;
import com.hatsumy.ventasalmacen.repositories.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "*")
public class CategoriaController {
    @Autowired
    private CategoriaRepository categoriaRepository;

    @GetMapping
    public List<Categoria> listar() { return categoriaRepository.findAll(); }
}
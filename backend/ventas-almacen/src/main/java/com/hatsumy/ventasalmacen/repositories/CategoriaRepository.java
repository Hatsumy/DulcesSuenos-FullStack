package com.hatsumy.ventasalmacen.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hatsumy.ventasalmacen.entities.Categoria;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    // Esto nos servirá por si luego queremos buscar una categoría por su nombre exacto
    Categoria findByNombre(String nombre);
}
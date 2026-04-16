package com.hatsumy.ventasalmacen.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hatsumy.ventasalmacen.entities.Producto;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
}
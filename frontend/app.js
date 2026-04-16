/* ========================================================
   SISTEMA DULCES SUEÑOS - CONEXIÓN API (SIN LOGIN)
   ======================================================== */
const API_URL = "http://localhost:8080/api";

let productosDisponibles = [];
let carrito = [];
let productosVendidosRecientes = [];
let chartCat;
let chartTen;
let procesandoVenta = false;
const META_VENTAS = 1000.00;

// Función unificada de filtrado de productos
function filtrarProductos(termino) {
    if (!termino) return productosDisponibles;
    const t = termino.toLowerCase();
    return productosDisponibles.filter(p => 
        p.nombre.toLowerCase().includes(t) || 
        p.categoria.toLowerCase().includes(t) ||
        (p.codigoBarras && p.codigoBarras.includes(t)) ||
        p.id.toString() === t
    );
}

// 1. INICIALIZACIÓN
async function inicializar() {
    initCharts();
    await cargarCategoriasDinamicas();
    await refreshData();
    
    const buscadorCaja = document.getElementById("codigoBarras");
    if (buscadorCaja) {
        buscadorCaja.addEventListener("input", (e) => {
            const termino = e.target.value.toLowerCase();
            const filtrados = filtrarProductos(termino);
            renderTable("tablaProductos", true, filtrados);
        });

        buscadorCaja.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault(); 
                const valorInput = buscadorCaja.value.trim();
                let productoEncontrado = productosDisponibles.find(p => p.codigoBarras === valorInput);
                if (!productoEncontrado) productoEncontrado = productosDisponibles.find(p => p.id.toString() === valorInput);
                if (!productoEncontrado) productoEncontrado = productosDisponibles.find(p => p.nombre.toLowerCase() === valorInput.toLowerCase());

                if (productoEncontrado) {
                    agregarAlCarrito(productoEncontrado.id);
                    buscadorCaja.value = ""; 
                    renderTable("tablaProductos", true); 
                    Swal.fire({ title: "¡Agregado!", text: `${productoEncontrado.nombre}`, icon: "success", timer: 800, showConfirmButton: false, toast: true, position: 'top-end' });
                } else {
                    Swal.fire({ title: "No encontrado", icon: "warning", timer: 1000 });
                }
            }
        });
    }

    const buscadorGeneral = document.getElementById("busquedaProducto");
    if (buscadorGeneral) {
        buscadorGeneral.addEventListener("input", (e) => {
            const termino = e.target.value.toLowerCase();
            const filtrados = filtrarProductos(termino);
            renderTable("tablaProductos", true, filtrados);
        });
    }
    setInterval(async () => { await refreshData(); }, 300000); // Actualizar cada 5 minutos
}

// 2. CATEGORÍAS Y DASHBOARD
async function cargarCategoriasDinamicas() {
    try {
        const res = await fetch(`${API_URL}/categorias`);
        const categorias = await res.json();
        const selectRegistro = document.getElementById("prodCategoria");
        const optionsHtml = categorias.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join("");
        if (selectRegistro) selectRegistro.innerHTML = optionsHtml;
        if (chartCat) {
            chartCat.data.labels = categorias.map(c => c.nombre);
            chartCat.update();
        }
    } catch (e) { 
        console.error("Error categorías:", e);
        // Fallback: categorías básicas si falla la carga
        const selectRegistro = document.getElementById("prodCategoria");
        if (selectRegistro) {
            selectRegistro.innerHTML = '<option value="Ropa">Ropa</option><option value="Accesorios">Accesorios</option><option value="Cuidado">Cuidado</option><option value="Juguetes">Juguetes</option>';
        }
    }
}

async function actualizarDashboard() {
    try {
        const resVentas = await fetch(`${API_URL}/ventas`);
        const ventas = await resVentas.json();
        const resResumen = await fetch(`${API_URL}/ventas/resumen`);
        const resumen = await resResumen.json();

        const hoy = new Date().toLocaleDateString('en-CA');
        const ingresoHoy = resumen[hoy] || 0;
        document.getElementById("ingresoTotal").innerText = ingresoHoy.toFixed(2);
        const porc = Math.min((ingresoHoy / META_VENTAS) * 100, 100);
        document.getElementById("metaVentasBarra").style.width = porc + "%";

        const ventasHoy = ventas.filter(v => v.fecha.startsWith(hoy));
        if (ventasHoy.length > 0) {
            const ult = ventasHoy[ventasHoy.length - 1];
            document.getElementById("productoEstrella").innerText = ult.detalles[0].producto.nombre;
            document.getElementById("categoriaEstrella").innerText = ult.detalles[0].producto.categoria;
        }

        const labels7Dias = [];
        const datos7Dias = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const fechaKey = d.toLocaleDateString('en-CA');
            labels7Dias.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
            datos7Dias.push(resumen[fechaKey] || 0);
        }
        chartTen.data.labels = labels7Dias;
        chartTen.data.datasets[0].data = datos7Dias;
        chartTen.update();

        const conteo = {};
        chartCat.data.labels.forEach(l => conteo[l] = 0);
        ventas.forEach(v => v.detalles.forEach(d => {
            const catName = d.producto.categoria;
            if(conteo[catName] !== undefined) conteo[catName] += d.cantidad;
        }));
        chartCat.data.datasets[0].data = Object.values(conteo);
        chartCat.update();
    } catch (e) { console.error("Error Dashboard:", e); }
}

// 3. TABLAS E INVENTARIO
function renderTable(containerId, isInventario, listaPersonalizada = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const datosAMostrar = listaPersonalizada ? listaPersonalizada : productosDisponibles;
    
    if (datosAMostrar.length === 0) {
        container.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-4">Sin resultados</td></tr>`;
        return;
    }
    
    const filasHtml = datosAMostrar.map(p => {
        const isLow = p.stock <= 5;
        const actionHtml = isInventario 
            ? `<button class="btn-action-round btn-add mx-auto" onclick="agregarAlCarrito(${p.id})"><i class="bi bi-cart-plus-fill"></i></button>`
            : `<div class="d-flex gap-2 justify-content-center">
                <button class="btn-action-round btn-edit" onclick="prepararEdicion(${p.id})"><i class="bi bi-pencil-square"></i></button>
                <button class="btn-action-round btn-delete" onclick="eliminarProducto(${p.id})"><i class="bi bi-trash3-fill"></i></button>
               </div>`;
        
        const precioMostrado = (p.precio || p.precioCompra || 0).toFixed(2);
        
        return `<tr><td><div class="fw-bold text-dark">${p.nombre}</div><div class="small text-muted">${p.codigoBarras || 'S/C'}</div><span class="premium-cat-badge">${p.categoria}</span></td><td class="fw-bold">S/ ${precioMostrado}</td><td><span class="stock-badge ${isLow ? 'stock-low' : 'stock-high'}">${isLow ? '⚠️ ' : ''}${p.stock}</span></td><td class="text-center">${actionHtml}</td></tr>`;
    });
    
    container.innerHTML = filasHtml.join('');
}

async function cargarInventario() {
    try {
        const res = await fetch(`${API_URL}/productos`);
        productosDisponibles = await res.json();
        renderTable("tablaProductos", true);
        renderTable("tablaGestion", false);
    } catch (e) { 
        console.error("Error cargando inventario:", e);
        productosDisponibles = []; // Fallback vacío
        renderTable("tablaProductos", true);
        renderTable("tablaGestion", false);
    }
}

// 4. CAJA Y VENTA
function agregarAlCarrito(id) {
    const p = productosDisponibles.find(x => x.id === id);
    if (!p) {
        return Swal.fire({ icon: 'error', title: 'Producto no encontrado', text: 'El producto no existe en el inventario' });
    }
    if (p.stock <= 0) {
        return Swal.fire({ icon: 'warning', title: 'Sin Stock', text: p.nombre + ' no tiene stock disponible', timer: 2000, showConfirmButton: false });
    }
    const enCarro = carrito.find(x => x.id === id);
    if (enCarro) { 
        if (enCarro.cantidad < p.stock) {
            enCarro.cantidad++;
        } else {
            Swal.fire({ icon: 'info', title: 'Stock insuficiente', text: 'Solo hay ' + p.stock + ' unidades disponibles', timer: 2000, showConfirmButton: false });
            return;
        }
    } else { 
        carrito.push({ ...p, cantidad: 1 }); 
    }
    renderCarrito();
}

function renderCarrito() {
    const body = document.getElementById("carritoVenta");
    let total = 0;
    body.innerHTML = carrito.map((item, i) => {
        // MODIFICACIÓN 2: Seguro para el precio en el cálculo del carrito
        const precioItem = item.precio || item.precioCompra || 0;
        total += precioItem * item.cantidad;
        return `<tr><td class="small fw-bold">${item.nombre}</td><td class="text-center">x${item.cantidad}</td><td class="text-end fw-bold">S/ ${(precioItem * item.cantidad).toFixed(2)}</td><td class="text-end"><i class="bi bi-x-circle text-danger cp" onclick="quitar(${i})"></i></td></tr>`;
    }).join("");
    document.getElementById("totalVenta").innerText = total.toFixed(2);
}

function quitar(i) { carrito.splice(i, 1); renderCarrito(); }

// --- 1. FUNCIÓN DE VENTA MODIFICADA ---
async function procesarVenta() {
    if (procesandoVenta) return;
    
    if (carrito.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Carrito vacio', text: 'Agrega productos antes de finalizar la compra' });
        return;
    }
    const totalVenta = parseFloat(document.getElementById("totalVenta").innerText);
    if (isNaN(totalVenta) || totalVenta <= 0) {
        Swal.fire({ icon: 'error', title: 'Error en el total', text: 'El total de la venta no es valido' });
        return;
    }
    
    procesandoVenta = true;
    const btnVenta = document.querySelector('button[onclick="procesarVenta()"]');
    if (btnVenta) {
        btnVenta.disabled = true;
        btnVenta.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
    }
    
    const ventaData = { 
        total: totalVenta, 
        detalles: carrito.map(c => ({ 
            producto: { id: c.id }, 
            cantidad: c.cantidad,
            precioUnitario: c.precio || 0 
        })) 
    };
    
    try {
        const vendidoIds = carrito.map(c => c.id);
        const res = await fetch(`${API_URL}/ventas`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(ventaData) 
        });

        const data = await res.json();

        if (res.ok) {
            productosVendidosRecientes = vendidoIds;
            abrirBoleta(carrito, totalVenta, data.id); 
            carrito = []; 
            renderCarrito(); 
            await refreshData();
        } else {
            Swal.fire({ 
                icon: 'warning', 
                title: 'No se pudo completar', 
                text: data.message || "Error en el servidor" 
            });
        }
    } catch (e) { 
        Swal.fire("Error", "No se pudo conectar con el servidor", "error"); 
    } finally {
        procesandoVenta = false;
        if (btnVenta) {
            btnVenta.disabled = false;
            btnVenta.innerHTML = 'FINALIZAR COMPRA';
        }
    }
}

// --- 2. ESCUCHADOR PARA EL CIERRE DE LA BOLETA ---
// Pon esto al final de tu app.js o dentro de inicializar()
document.addEventListener("DOMContentLoaded", () => {
    const modalBoletaElement = document.getElementById('modalBoleta');
    if (modalBoletaElement) {
        modalBoletaElement.addEventListener('hidden.bs.modal', function () {
            // Este código se ejecuta SOLO cuando el usuario cierra la boleta
            Swal.fire({
                icon: 'success',
                title: '¡Venta Registrada!',
                text: 'El inventario de Dulces Sueños se actualizó correctamente.',
                timer: 4000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            if (productosVendidosRecientes.length > 0) {
                const stocksBajos = productosDisponibles
                    .filter(p => productosVendidosRecientes.includes(p.id) && p.stock <= 5);

                if (stocksBajos.length > 0) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Stock bajo',
                        html: `Stock bajo en ${stocksBajos.map(p => `<strong>${p.nombre}</strong> (${p.stock})`).join(', ')}`,
                        confirmButtonText: 'Entendido'
                    });
                }
                productosVendidosRecientes = [];
            }
        });
    }
});

function abrirBoleta(items, total, idVenta) {
    const ahora = new Date();
    document.getElementById('fechaBoleta').innerText = ahora.toLocaleString();
    document.getElementById('nroBoleta').innerText = `BOL-${String(idVenta).padStart(4, '0')}`;
    document.getElementById('totalBoleta').innerText = `S/ ${total.toFixed(2)}`;
    const detalle = document.getElementById('detalleBoleta');
    detalle.innerHTML = items.map(item => {
        const pUnit = item.precio || item.precioCompra || 0;
        return `<tr><td><strong>${item.cantidad}</strong> x ${item.nombre}</td><td class="text-end">S/ ${(pUnit * item.cantidad).toFixed(2)}</td></tr>`;
    }).join("");
    new bootstrap.Modal(document.getElementById('modalBoleta')).show();
}

// 5. EXCEL Y CRUD
async function exportarExcelVentas() {
    try {
        const res = await fetch(`${API_URL}/ventas`);
        const ventas = await res.json();

        if (!ventas || ventas.length === 0) {
            return Swal.fire("Sin datos", "No hay ventas para exportar", "warning");
        }

        // 1. Preparamos los datos con encabezados limpios
        const datosExcel = [];
        ventas.forEach(v => {
            v.detalles.forEach(d => {
                const pUnitario = d.precioUnitario > 0 ? d.precioUnitario : (d.producto.precio || 0);
                datosExcel.push({
                    "ID VENTA": v.id,
                    "FECHA": new Date(v.fecha).toLocaleString('es-PE'),
                    "PRODUCTO": d.producto.nombre.toUpperCase(), // Mayúsculas para resaltar
                    "CATEGORÍA": d.producto.categoria,
                    "CANTIDAD": d.cantidad,
                    "PRECIO UNIT.": pUnitario,
                    "TOTAL": (d.cantidad * pUnitario)
                });
            });
        });

        // 2. Crear la hoja
        const hoja = XLSX.utils.json_to_sheet(datosExcel);

        // 3. CONFIGURACIÓN DE MÁRGENES (Ancho de columnas)
        // Esto es lo que hace que no se vea todo amontonado
        hoja['!cols'] = [
            { wch: 12 }, // ID
            { wch: 20 }, // Fecha
            { wch: 40 }, // Producto (le damos más aire)
            { wch: 15 }, // Categoría
            { wch: 10 }, // Cantidad
            { wch: 15 }, // Precio
            { wch: 15 }  // Total
        ];

        // 4. Crear el libro y descargar
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "REPORTE DULCES SUEÑOS");

        XLSX.writeFile(libro, "Reporte_Ventas_Boutique.xlsx");

        Swal.fire({
            title: "¡Reporte Exitoso!",
            text: "Se aplicaron anchos de columna y limpieza de datos",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });

    } catch (error) {
        Swal.fire("Error", "No se pudo generar el archivo", "error");
    }
}

function prepararEdicion(id) {
    const p = productosDisponibles.find(x => x.id === id);
    document.getElementById("prodId").value = p.id;
    document.getElementById("prodNombre").value = p.nombre;
    document.getElementById("prodCategoria").value = p.categoria;
    document.getElementById("prodCodigoBarras").value = p.codigoBarras || "";
    document.getElementById("prodPrecio").value = p.precio || p.precioCompra || 0;
    document.getElementById("prodStock").value = p.stock;
    document.getElementById("btnGuardar").innerHTML = "✅ Actualizar Producto";
}

document.getElementById("formProducto").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById("prodNombre").value.trim();
    const categoria = document.getElementById("prodCategoria").value.trim();
    const codigoBarras = document.getElementById("prodCodigoBarras").value.trim();
    const precioStr = document.getElementById("prodPrecio").value.trim();
    const stockStr = document.getElementById("prodStock").value.trim();
    
    if (!nombre) {
        return Swal.fire({ icon: 'warning', title: 'Nombre requerido', text: 'Por favor ingresa el nombre del producto' });
    }
    if (!categoria) {
        return Swal.fire({ icon: 'warning', title: 'Categoria requerida', text: 'Por favor selecciona una categoria' });
    }
    
    const precio = parseFloat(precioStr);
    if (isNaN(precio) || precio <= 0) {
        return Swal.fire({ icon: 'warning', title: 'Precio invalido', text: 'El precio debe ser mayor a 0' });
    }
    
    const stock = parseInt(stockStr);
    if (isNaN(stock) || stock < 0) {
        return Swal.fire({ icon: 'warning', title: 'Stock invalido', text: 'El stock no puede ser negativo' });
    }
    
    const prod = {
        id: document.getElementById("prodId").value || null,
        nombre: nombre,
        categoria: categoria,
        codigoBarras: codigoBarras || null,
        precio: precio,
        stock: stock
    };
    
    try {
        const res = await fetch(`${API_URL}/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prod) });
        if (res.ok) {
            document.getElementById("formProducto").reset();
            document.getElementById("prodId").value = "";
            document.getElementById("btnGuardar").innerHTML = "💾 Guardar Producto";
            Swal.fire({ icon: 'success', title: 'Guardado', text: prod.id ? 'Producto actualizado' : 'Producto creado', timer: 1500, showConfirmButton: false });
            await refreshData();
        } else {
            Swal.fire({ icon: 'error', title: 'Error al guardar', text: 'No se pudo guardar el producto' });
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error de conexion', text: 'No se pudo conectar con el servidor' });
    }
});

async function eliminarProducto(id) {
    const producto = productosDisponibles.find(p => p.id === id);
    Swal.fire({
        icon: 'warning',
        title: 'Eliminar producto',
        html: `<strong>${producto?.nombre || 'Producto'}</strong><br><span class="text-muted small">Esta accion no se puede deshacer</span>`,
        showCancelButton: true,
        confirmButtonColor: '#d90166',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Si, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El producto fue eliminado correctamente', timer: 1500, showConfirmButton: false });
                    await refreshData();
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el producto' });
                }
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'Error de conexion', text: 'No se pudo conectar con el servidor' });
            }
        }
    });
}

async function cargarHistorialDia() {
    try {
        const res = await fetch(`${API_URL}/ventas`);
        const todas = await res.json();
        const hoy = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        
        // Filtramos y ordenamos por ID descendente
        const ventasHoy = todas.filter(v => v.fecha && v.fecha.startsWith(hoy))
                               .sort((a,b) => b.id - a.id);

        const contenedor = document.getElementById("contenedorHistorialDia");
        if (!contenedor) return;

        if (ventasHoy.length === 0) {
            contenedor.innerHTML = '<div class="text-center text-muted p-4"><i class="bi bi-receipt fs-1"></i><br>No hay ventas registradas hoy</div>';
            return;
        }

        contenedor.innerHTML = ventasHoy.map(v => `
            <div class="card mb-2 border-0 shadow-sm p-3" style="border-left: 4px solid #d90166 !important; border-radius:15px;">
                <div class="d-flex justify-content-between">
                    <div>
                        <span class="small text-muted">Ticket #${v.id}</span>
                        <div class="fw-bold text-dark">S/ ${v.total ? v.total.toFixed(2) : '0.00'}</div>
                    </div>
                    <div class="text-end">
                        ${v.detalles?.map(d => `<span class="premium-cat-badge ms-1">${d.cantidad || 0} ${d.producto?.nombre || 'Producto'}</span>`).join("") || ''}
                    </div>
                </div>
            </div>
        `).join("");
    } catch (e) {
        console.error("Error cargando historial:", e);
        const contenedor = document.getElementById("contenedorHistorialDia");
        if (contenedor) {
            contenedor.innerHTML = '<div class="text-center text-danger p-4"><i class="bi bi-exclamation-triangle fs-1"></i><br>Error al cargar historial de ventas</div>';
        }
    }
}

function initCharts() {
    chartCat = new Chart(document.getElementById('chartCategorias').getContext('2d'), { type: 'doughnut', data: { labels: [], datasets: [{ data: [], backgroundColor: ['#d90166', '#f241a3', '#f7a1cb', '#ffc2e2', '#cbd5e0'], borderWidth: 0 }] }, options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    chartTen = new Chart(document.getElementById('chartTendencia').getContext('2d'), { type: 'line', data: { labels: [], datasets: [{ label: 'Ventas S/', data: [], borderColor: '#d90166', backgroundColor: 'rgba(217, 1, 102, 0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } } });
}

async function refreshData() { await cargarInventario(); await actualizarDashboard(); await cargarHistorialDia(); }
document.addEventListener("DOMContentLoaded", inicializar);
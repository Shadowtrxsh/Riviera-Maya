
let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";
const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const estado = document.querySelector("#estado");

async function cargarExperiencias() {
    try {
        estado.textContent = "Cargando experiencias...";
        const respuesta = await fetch("./data/experiencias.json");
        if (!respuesta.ok) throw new Error("No fue posible cargar las experiencias");
        experiencias = await respuesta.json();
        estado.textContent = `${experiencias.length} experiencias disponibles`;
        actualizarCatalogo();
    } catch (error) {
        estado.textContent = "Error al cargar la información";
        console.error(error);
    }
}

function obtenerResultados() {
    let resultados = [...experiencias];
    if (categoriaActual !== "todas") {
        resultados = resultados.filter(
            experiencia => experiencia.categoria === categoriaActual);
    }
    if (textoBusqueda !== "") {
        resultados = resultados.filter(
            experiencia => experiencia.nombre.toLowerCase().includes(textoBusqueda)
        );
    }
    if (ordenActual === "ascendente") {
        resultados.sort((a, b) => a.precio - b.precio);
    }
    if (ordenActual === "descendente") {
        resultados.sort((a, b) => b.precio - a.precio);
    }
    return resultados;
}
function actualizarCatalogo() {
    const resultados = obtenerResultados();
    if (resultados.length === 0) {
        catalogo.innerHTML = `
 <p class="sin-resultados">No se encontraron experiencias</p>
 `;
        estado.textContent = "0 resultados";
        return;
    }
    catalogo.innerHTML = resultados.map(experiencia => `
 <article class="tarjeta">
 <div class="imagen">${experiencia.icono}</div>
 <div class="informacion">
 <span class="categoria">${experiencia.categoria}</span>
 <h3>${experiencia.nombre}</h3>
 <p>Cupo disponible: ${experiencia.cupo}</p>
 <p class="precio">$${experiencia.precio} MXN</p>
 <label>Personas:
 <input type="number" id="cantidad-${experiencia.id}"
 min="1" max="${experiencia.cupo}" value="1">
 </label>
 <button class="btn-reservar" data-id="${experiencia.id}">
 Agregar
 </button>
 </div>
 </article>
 `).join("");
    estado.textContent = `${resultados.length} resultados`;
    agregarEventosReservar();
}
function agregarEventosReservar() {
    const botonesReservar = document.querySelectorAll(".btn-reservar");
    botonesReservar.forEach(boton => {
        boton.addEventListener("click", () => {
            const id = Number(boton.dataset.id);
            agregarReserva(id);
        });
    });
}
function agregarReserva(id) {
    const experiencia = experiencias.find(elemento => elemento.id === id);
    const entradaCantidad = document.querySelector(`#cantidad-${id}`);
    const cantidad = Number(entradaCantidad.value);
    if (cantidad < 1 || cantidad > experiencia.cupo) {
        alert("Cantidad no válida");
        return;
    }
    const reservaExistente = reservas.find(
        reserva => reserva.experienciaId === id
    );
    if (reservaExistente) {
        const nuevaCantidad = reservaExistente.cantidad + cantidad;
        if (nuevaCantidad > experiencia.cupo) {
            alert("La cantidad supera el cupo disponible");
            return;
        }
        reservaExistente.cantidad = nuevaCantidad;
        reservaExistente.subtotal = nuevaCantidad * experiencia.precio;
    } else {
        reservas.push({
            experienciaId: experiencia.id,
            nombre: experiencia.nombre,
            precio: experiencia.precio,
            cantidad,
            subtotal: experiencia.precio * cantidad
        });
    }
    mostrarReservas();
}
function mostrarReservas() {
    if (reservas.length === 0) {
        listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
        total.textContent = "$0 MXN";
        return;
    }
    listaReservas.innerHTML = reservas.map(reserva => `
 <article class="item-reserva">
 <div>
 <strong>${reserva.nombre}</strong>
 <p>${reserva.cantidad} persona(s) × $${reserva.precio}</p>
 </div>
 <div>
 <strong>$${reserva.subtotal} MXN</strong>
 <button class="btn-eliminar" data-id="${reserva.experienciaId}">
 Eliminar
 </button>
 </div>
 </article>
 `).join("");
    const totalReserva = reservas.reduce(
        (acumulado, reserva) => acumulado + reserva.subtotal, 0
    );
    total.textContent = `$${totalReserva} MXN`;
    agregarEventosEliminar();
}
function agregarEventosEliminar() {
    const botonesEliminar = document.querySelectorAll(".btn-eliminar");
    botonesEliminar.forEach(boton => {
        boton.addEventListener("click", () => {
            const id = Number(boton.dataset.id);
            eliminarReserva(id);
        });
    });
}
function eliminarReserva(id) {
    reservas = reservas.filter(reserva => reserva.experienciaId !== id);
    mostrarReservas();
}
buscador.addEventListener("input", () => {
    textoBusqueda = buscador.value.trim().toLowerCase();
    actualizarCatalogo();
});
filtroCategoria.addEventListener("change", () => {
    categoriaActual = filtroCategoria.value;
    actualizarCatalogo();
});
ordenPrecio.addEventListener("change", () => {
    ordenActual = ordenPrecio.value;
    actualizarCatalogo();
});
cargarExperiencias();


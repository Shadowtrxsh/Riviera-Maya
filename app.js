let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let precioMaximoActual = null;
let ordenActual = "normal";

const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const ordenPrecio = document.querySelector("#ordenPrecio");
const filtroPrecioMax = document.querySelector("#filtroPrecioMax");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const estado = document.querySelector("#estado");
const btnVaciar = document.querySelector("#btnVaciar");
const notificacion = document.querySelector("#notificacion");
const botonesCategoria = document.querySelectorAll(".btn-cat");

let temporizadorNotificacion = null;

// Función para mostrar notificaciones visuales en la página (Punto 14)
function mostrarNotificacion(mensaje, esError = false) {
    if (!notificacion) return;
    notificacion.textContent = mensaje;
    notificacion.className = "notificacion" + (esError ? " error" : "");

    if (temporizadorNotificacion) clearTimeout(temporizadorNotificacion);

    temporizadorNotificacion = setTimeout(() => {
        notificacion.className = "notificacion oculto";
    }, 3000);
}

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
        mostrarNotificacion("Error al cargar la información", true);
    }
}

function obtenerResultados() {
    let resultados = [...experiencias];

    if (categoriaActual !== "todas") {
        resultados = resultados.filter(
            experiencia => experiencia.categoria === categoriaActual
        );
    }

    if (textoBusqueda !== "") {
        resultados = resultados.filter(
            experiencia => experiencia.nombre.toLowerCase().includes(textoBusqueda)
        );
    }

    if (precioMaximoActual !== null && !isNaN(precioMaximoActual)) {
        resultados = resultados.filter(
            experiencia => experiencia.precio <= precioMaximoActual
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
        catalogo.innerHTML = `<p class="sin-resultados">No se encontraron experiencias</p>`;
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
                    <input type="number" id="cantidad-${experiencia.id}" min="1" max="${experiencia.cupo}" value="1">
                </label>
                <button class="btn-reservar" data-id="${experiencia.id}">Agregar</button>
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
        mostrarNotificacion("Cantidad no válida", true);
        return;
    }

    const reservaExistente = reservas.find(reserva => reserva.experienciaId === id);

    if (reservaExistente) {
        const nuevaCantidad = reservaExistente.cantidad + cantidad;
        if (nuevaCantidad > experiencia.cupo) {
            mostrarNotificacion("La cantidad supera el cupo disponible", true);
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

    mostrarNotificacion(`¡${experiencia.nombre} agregada al carrito!`);
    mostrarReservas();
}

function mostrarReservas() {
    if (reservas.length === 0) {
        listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
        total.textContent = "$0 MXN";
        const spanPersonas = document.querySelector("#totalPersonas");
        if (spanPersonas) spanPersonas.textContent = "0";
        if (btnVaciar) btnVaciar.style.display = "none";
        return;
    }

    if (btnVaciar) btnVaciar.style.display = "block";

    listaReservas.innerHTML = reservas.map(reserva => `
        <article class="item-reserva">
            <div>
                <strong>${reserva.nombre}</strong>
                <p>${reserva.cantidad} persona(s) × $${reserva.precio}</p>
                <div class="controles-cantidad">
                    <button class="btn-cantidad" onclick="cambiarCantidad(${reserva.experienciaId}, -1)" type="button">-</button>
                    <span>${reserva.cantidad}</span>
                    <button class="btn-cantidad" onclick="cambiarCantidad(${reserva.experienciaId}, 1)" type="button">+</button>
                </div>
            </div>
            <div>
                <strong>$${reserva.subtotal} MXN</strong>
                <br>
                <button class="btn-eliminar" data-id="${reserva.experienciaId}">Eliminar</button>
            </div>
        </article>
    `).join("");

    const totalReserva = reservas.reduce((acumulado, reserva) => acumulado + reserva.subtotal, 0);
    const personasTotales = reservas.reduce((acumulado, reserva) => acumulado + reserva.cantidad, 0);

    total.textContent = `$${totalReserva} MXN`;
    const spanPersonas = document.querySelector("#totalPersonas");
    if (spanPersonas) spanPersonas.textContent = personasTotales;

    agregarEventosEliminar();
}

window.cambiarCantidad = function(id, cambio) {
    const reserva = reservas.find(r => r.experienciaId === id);
    const experiencia = experiencias.find(e => e.id === id);
    if (!reserva || !experiencia) return;

    const nuevaCantidad = reserva.cantidad + cambio;

    if (nuevaCantidad < 1) {
        eliminarReserva(id);
        return;
    }

    if (nuevaCantidad > experiencia.cupo) {
        mostrarNotificacion(`Se alcanzó el cupo máximo disponible (${experiencia.cupo})`, true);
        return;
    }

    reserva.cantidad = nuevaCantidad;
    reserva.subtotal = nuevaCantidad * reserva.precio;
    mostrarReservas();
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
    mostrarNotificacion("Experiencia eliminada del carrito", true);
}

if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
        const confirmar = confirm("¿Estás seguro de que deseas vaciar toda tu reservación?");
        if (confirmar) {
            reservas = [];
            mostrarReservas();
            mostrarNotificacion("Se ha vaciado la reservación", true);
        }
    });
}

buscador.addEventListener("input", () => {
    textoBusqueda = buscador.value.trim().toLowerCase();
    actualizarCatalogo();
});

ordenPrecio.addEventListener("change", () => {
    ordenActual = ordenPrecio.value;
    actualizarCatalogo();
});

botonesCategoria.forEach(boton => {
    boton.addEventListener("click", () => {
        botonesCategoria.forEach(b => b.classList.remove("activo"));
        boton.classList.add("activo");
        categoriaActual = boton.dataset.categoria;
        actualizarCatalogo();
    });
});

filtroPrecioMax.addEventListener("input", () => {
    const valor = filtroPrecioMax.value.trim();
    precioMaximoActual = valor === "" ? null : Number(valor);
    actualizarCatalogo();
});

cargarExperiencias();
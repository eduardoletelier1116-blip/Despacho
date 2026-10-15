(() => {
  "use strict";

  function iniciarBuscador() {
    const contenedor = document.querySelector("main.container");

    if (!contenedor || document.getElementById("buscador-despachos")) {
      return;
    }

    const seccion = document.createElement("section");
    seccion.id = "buscador-despachos";
    contenedor.prepend(seccion);

    // Mantiene los filtros separados del formulario de despacho.
    const panel = seccion.attachShadow({ mode: "open" });

    panel.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 18px;
          font-family: "Segoe UI", Arial, sans-serif;
          color: #333;
        }

        * { box-sizing: border-box; }

        .tarjeta {
          background: white;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }

        h2 {
          margin: 0 0 10px;
          color: #55851d;
          font-size: 21px;
        }

        .ayuda {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        label {
          display: block;
          margin: 14px 0 6px;
          font-weight: bold;
        }

        input {
          width: 100%;
          min-width: 0;
          padding: 13px;
          border: 1px solid #ccc;
          border-radius: 10px;
          font: inherit;
        }

        .botones {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 15px;
        }

        button, .pdf {
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          background: #55851d;
          color: white;
          font: inherit;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
        }

        .secundario {
          background: #edf2f4;
          color: #35454e;
        }

        button:disabled {
          opacity: .55;
          cursor: default;
        }

        input:focus-visible,
        button:focus-visible,
        a:focus-visible {
          outline: 3px solid #79b82a;
          outline-offset: 3px;
        }

        #mensaje {
          margin-top: 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .error { color: #b31922; }

        article {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
          overflow-wrap: anywhere;
        }

        h3 {
          margin: 0 0 8px;
          color: #35454e;
        }

        article p {
          margin: 7px 0;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .estado {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          background: #edf2f4;
          font-size: 13px;
          font-weight: bold;
        }

        .cumple {
          background: #edf6e5;
          color: #406a17;
        }

        .no-cumple {
          background: #fdebec;
          color: #b31922;
        }

        summary {
          cursor: pointer;
          margin: 12px 0;
          color: #52616a;
        }

        .pdf {
          display: inline-block;
          margin-top: 12px;
        }

        .sin-pdf { color: #8b5a14; }

        #paginacion {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        #paginacion[hidden] { display: none; }

        @media (max-width: 600px) {
          .tarjeta { padding: 16px; }
          .botones button { flex: 1; }
        }
      </style>

      <div class="tarjeta">
        <h2>Buscar despachos</h2>

        <p class="ayuda">
          Busca por día de registro o por cliente, patente,
          número de despacho, folio y otros datos.
        </p>

        <form id="formulario">
          <label for="fecha">Día de registro</label>
          <input id="fecha" type="date">

          <label for="dato">Buscar por dato</label>
          <input
            id="dato"
            type="search"
            placeholder="Ejemplo: Copefrut, LKJH20, DSP-000030"
            maxlength="200"
          >

          <div class="botones">
            <button type="submit">Buscar</button>

            <button id="todas" type="button" class="secundario">
              Todas las fechas
            </button>

            <button id="hoy" type="button" class="secundario">
              Hoy
            </button>
          </div>
        </form>

        <p id="mensaje" role="status" aria-live="polite">
          Selecciona una fecha o escribe un dato y presiona Buscar.
        </p>

        <div id="resultados"></div>

        <nav id="paginacion" aria-label="Páginas de resultados" hidden>
          <button id="anterior" type="button" class="secundario">
            Anterior
          </button>

          <span id="numeroPagina"></span>

          <button id="siguiente" type="button" class="secundario">
            Siguiente
          </button>
        </nav>
      </div>
    `;

    const buscarElemento = selector => panel.querySelector(selector);

    let registros = [];
    let pagina = 0;
    let cargando = false;

    const cantidadPorPagina = 10;

    function normalizar(valor) {
      return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }

    function texto(valor) {
      return valor === null || valor === undefined || valor === ""
        ? "—"
        : String(valor);
    }

    function fechaHoy() {
      const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());

      const obtener = tipo =>
        partes.find(parte => parte.type === tipo).value;

      return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
    }

    function mostrarFecha(valor) {
      if (!valor) return "—";

      const fecha = new Date(valor);

      if (Number.isNaN(fecha.getTime())) {
        return texto(valor);
      }

      return new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(fecha);
    }

    function crearElemento(tipo, contenido, clase) {
      const elemento = document.createElement(tipo);

      if (contenido !== undefined) {
        elemento.textContent = texto(contenido);
      }

      if (clase) elemento.className = clase;

      return elemento;
    }

    function agregarDato(contenedor, etiqueta, valor) {
      const parrafo = document.createElement("p");
      const titulo = crearElemento("strong", etiqueta + ": ");

      parrafo.append(titulo, document.createTextNode(texto(valor)));
      contenedor.appendChild(parrafo);
    }

    function validarEnlacePDF(valor) {
      try {
        const url = new URL(String(valor));

        if (
          url.protocol === "https:" &&
          ["drive.google.com", "docs.google.com"].includes(url.hostname)
        ) {
          return url.href;
        }
      } catch (error) {
        return "";
      }

      return "";
    }

    function mostrarResultados() {
      const lista = buscarElemento("#resultados");
      lista.replaceChildren();

      const inicio = pagina * cantidadPorPagina;
      const visibles = registros.slice(
        inicio,
        inicio + cantidadPorPagina
      );

      visibles.forEach(fila => {
        const tarjeta = document.createElement("article");

        tarjeta.appendChild(crearElemento("h3", fila[1]));

        const estado = normalizar(fila[11]);

        const claseEstado =
          estado === "cumple"
            ? "cumple"
            : estado === "no cumple"
              ? "no-cumple"
              : "";

        tarjeta.appendChild(
          crearElemento(
            "span",
            fila[11] || "Sin estado",
            "estado " + claseEstado
          )
        );

        agregarDato(tarjeta, "Folio", fila[18]);
        agregarDato(tarjeta, "Fecha de registro", mostrarFecha(fila[2]));
        agregarDato(tarjeta, "Cliente / Destino", fila[4]);
        agregarDato(tarjeta, "Transporte / Patente", fila[5]);
        agregarDato(tarjeta, "Responsable", fila[12]);

        const detalles = document.createElement("details");

        detalles.appendChild(
          crearElemento("summary", "Ver más datos")
        );

        agregarDato(detalles, "Formato de caja", fila[6]);
        agregarDato(detalles, "Etiqueta de cajas", fila[7]);
        agregarDato(detalles, "Cantidad de cajas", fila[8]);
        agregarDato(detalles, "Número de pallets", fila[9]);
        agregarDato(detalles, "Observaciones", fila[10]);

        tarjeta.appendChild(detalles);

        const urlPDF = validarEnlacePDF(fila[17]);

        if (urlPDF) {
          const enlace = crearElemento("a", "Abrir PDF", "pdf");

          enlace.href = urlPDF;
          enlace.target = "_blank";
          enlace.rel = "noopener noreferrer";

          tarjeta.appendChild(enlace);
        } else {
          tarjeta.appendChild(
            crearElemento(
              "p",
              "PDF no disponible para este despacho.",
              "sin-pdf"
            )
          );
        }

        lista.appendChild(tarjeta);
      });

      const totalPaginas = Math.ceil(
        registros.length / cantidadPorPagina
      );

      buscarElemento("#paginacion").hidden = totalPaginas <= 1;

      buscarElemento("#numeroPagina").textContent =
        `Página ${pagina + 1} de ${totalPaginas}`;

      buscarElemento("#anterior").disabled = pagina === 0;

      buscarElemento("#siguiente").disabled =
        pagina >= totalPaginas - 1;
    }

    async function buscarDespachos() {
      if (cargando) return;

      const formulario = buscarElemento("#formulario");

      if (!formulario.reportValidity()) return;

      const fecha = buscarElemento("#fecha").value;
      const consulta = normalizar(buscarElemento("#dato").value);
      const mensaje = buscarElemento("#mensaje");

      const controles = [
        ...panel.querySelectorAll("form input, form button")
      ];

      cargando = true;
      controles.forEach(control => control.disabled = true);

      mensaje.className = "";
      mensaje.textContent = "Buscando despachos…";

      buscarElemento("#resultados").replaceChildren();
      buscarElemento("#paginacion").hidden = true;

      const controlador = new AbortController();

      const tiempoLimite = setTimeout(
        () => controlador.abort(),
        60000
      );

      try {
        if (typeof URL_APP === "undefined" || !URL_APP) {
          throw new Error(
            "El archivo buscador.js debe cargarse después de app.js."
          );
        }

        const respuesta = await fetch(URL_APP, {
          method: "POST",
          body: JSON.stringify({
            accion: "buscarDespachos",
            fecha: fecha
          }),
          signal: controlador.signal
        });

        if (!respuesta.ok) {
          throw new Error(
            "Error de conexión: " + respuesta.status
          );
        }

        const datos = await respuesta.json();

        if (datos.ok !== true) {
          throw new Error(
            datos.mensaje || "No se pudo realizar la búsqueda."
          );
        }

        if (
          !Array.isArray(datos.registros) ||
          datos.registros.some(
            fila => !Array.isArray(fila) || fila.length < 19
          )
        ) {
          throw new Error(
            "Los registros recibidos tienen un formato inesperado."
          );
        }

        const palabras = consulta.split(/\s+/).filter(Boolean);

        registros = datos.registros.filter(fila => {
          const contenido = [
            fila[0],
            fila[1],
            mostrarFecha(fila[2]),
            ...fila.slice(4, 13),
            fila[18]
          ].map(normalizar).join(" ");

          return palabras.every(
            palabra => contenido.includes(palabra)
          );
        });

        registros.sort((a, b) => {
          const fechaA = Date.parse(a[2]) || 0;
          const fechaB = Date.parse(b[2]) || 0;

          return fechaB - fechaA ||
            texto(b[1]).localeCompare(texto(a[1]));
        });

        pagina = 0;
        mostrarResultados();

        const periodo = fecha
          ? "del " + fecha.split("-").reverse().join("/")
          : "en todas las fechas";

        mensaje.textContent = registros.length
          ? `${registros.length} despacho(s) encontrado(s) ${periodo}.`
          : `No se encontraron despachos ${periodo} con esos filtros.`;

      } catch (error) {
        registros = [];
        pagina = 0;

        mensaje.className = "error";

        mensaje.textContent =
          error.name === "AbortError"
            ? "La búsqueda tardó demasiado. Intenta nuevamente."
            : "No se pudo buscar: " + error.message;

      } finally {
        clearTimeout(tiempoLimite);
        cargando = false;

        controles.forEach(control => control.disabled = false);
      }
    }

    buscarElemento("#fecha").value = fechaHoy();

    buscarElemento("#formulario").addEventListener(
      "submit",
      evento => {
        evento.preventDefault();
        buscarDespachos();
      }
    );

    buscarElemento("#todas").addEventListener("click", () => {
      buscarElemento("#fecha").value = "";
      buscarDespachos();
    });

    buscarElemento("#hoy").addEventListener("click", () => {
      buscarElemento("#fecha").value = fechaHoy();
      buscarDespachos();
    });

    buscarElemento("#anterior").addEventListener("click", () => {
      if (pagina > 0) {
        pagina--;
        mostrarResultados();
      }
    });

    buscarElemento("#siguiente").addEventListener("click", () => {
      if ((pagina + 1) * cantidadPorPagina < registros.length) {
        pagina++;
        mostrarResultados();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarBuscador);
  } else {
    iniciarBuscador();
  }
})();

// MENÚ SUPERIOR PARA ABRIR EL BUSCADOR
(() => {
  function prepararMenuBuscador() {
    const buscador = document.getElementById("buscador-despachos");

    if (!buscador || document.getElementById("menu-buscador")) {
      return;
    }

    // Ocultar el buscador al ingresar.
    buscador.style.display = "none";

    const menu = document.createElement("div");
    menu.id = "menu-buscador";

    // Estilos separados del resto de la aplicación.
    const raiz = menu.attachShadow({ mode: "open" });

    raiz.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 14px;
          right: 14px;
          z-index: 1000;
          font-family: "Segoe UI", Arial, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        #abrirMenu {
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 12px;
          background: #55851d;
          color: white;
          font-size: 28px;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(0,0,0,.18);
        }

        #opciones {
          position: absolute;
          top: 58px;
          right: 0;
          width: 190px;
          padding: 8px;
          background: white;
          border: 1px solid #e1e7e1;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,.16);
        }

        #opciones[hidden] {
          display: none;
        }

        #irBuscador {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 9px;
          background: white;
          color: #35454e;
          text-align: left;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }

        #irBuscador:hover {
          background: #edf6e5;
          color: #55851d;
        }

        button:focus-visible {
          outline: 3px solid #79b82a;
          outline-offset: 3px;
        }
      </style>

      <button
        id="abrirMenu"
        type="button"
        aria-label="Abrir menú"
        aria-expanded="false"
        aria-controls="opciones"
      >☰</button>

      <div id="opciones" hidden>
        <button id="irBuscador" type="button">
          🔎 Buscador
        </button>
      </div>
    `;

    document.body.appendChild(menu);

    const botonMenu = raiz.getElementById("abrirMenu");
    const opciones = raiz.getElementById("opciones");
    const botonBuscador = raiz.getElementById("irBuscador");

    function cerrarMenu() {
      opciones.hidden = true;
      botonMenu.setAttribute("aria-expanded", "false");
      botonMenu.setAttribute("aria-label", "Abrir menú");
    }

    botonMenu.addEventListener("click", () => {
      const abrir = opciones.hidden;

      opciones.hidden = !abrir;

      botonMenu.setAttribute(
        "aria-expanded",
        String(abrir)
      );

      botonMenu.setAttribute(
        "aria-label",
        abrir ? "Cerrar menú" : "Abrir menú"
      );
    });

    botonBuscador.addEventListener("click", () => {
      buscador.style.display = "block";
      buscador.style.scrollMarginTop = "80px";

      cerrarMenu();

      const primerCampo =
        buscador.shadowRoot?.querySelector("input");

      if (primerCampo) {
        primerCampo.focus({ preventScroll: true });
      }

      buscador.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    // Cerrar el menú al tocar fuera.
    document.addEventListener("click", evento => {
      if (!evento.composedPath().includes(menu)) {
        cerrarMenu();
      }
    });

    // Cerrar el menú con la tecla Escape.
    document.addEventListener("keydown", evento => {
      if (evento.key === "Escape" && !opciones.hidden) {
        cerrarMenu();
        botonMenu.focus();
      }
    });

    // Agregar un botón para volver a ocultar el buscador.
    const interior = buscador.shadowRoot;

    if (interior) {
      const tarjeta = interior.querySelector(".tarjeta, .panel");

      if (tarjeta) {
        const cerrarBuscador = document.createElement("button");

        cerrarBuscador.type = "button";
        cerrarBuscador.textContent = "✕ Cerrar buscador";
        cerrarBuscador.style.cssText = `
          display: block;
          margin: 0 0 14px auto;
          padding: 9px 12px;
          border: none;
          border-radius: 8px;
          background: #edf2f4;
          color: #35454e;
          font-size: 13px;
          cursor: pointer;
        `;

        cerrarBuscador.addEventListener("click", () => {
          buscador.style.display = "none";
          botonMenu.focus({ preventScroll: true });
        });

        tarjeta.prepend(cerrarBuscador);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      prepararMenuBuscador
    );
  } else {
    prepararMenuBuscador();
  }
})();

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

        const acciones = crearElemento("div", undefined, "botones");
        for (const [etiqueta, regenerar] of [["Editar despacho", false], ["Regenerar PDF", true]]) {
          const boton = crearElemento("button", etiqueta, "secundario");
          boton.type = "button";
          boton.addEventListener("click", () => window.abrirEditorDespacho(fila[0], regenerar, buscarDespachos));
          acciones.appendChild(boton);
        }
        tarjeta.appendChild(acciones);
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
// Editor aislado: no interfiere con la firma ni los campos de un despacho nuevo.
(() => {
  let abierto = false;
  async function pedir(datos) {
    const r = await fetch(URL_APP, {method:'POST', body:JSON.stringify(datos)});
    if (!r.ok) throw new Error('No se pudo conectar: ' + r.status);
    const res = await r.json();
    if (res.ok !== true) throw new Error(res.mensaje || 'No se pudo completar la operación.');
    return res;
  }
  function leerImagen(archivo) {
    if (!archivo) return Promise.resolve(null);
    if (!['image/jpeg','image/png','image/webp'].includes(archivo.type)) return Promise.reject(new Error('Seleccione una imagen JPG, PNG o WebP.'));
    return new Promise((resolve,reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.onerror = () => reject(new Error('No se pudo leer la fotografía.'));
      lector.onabort = () => reject(new Error('Se canceló la lectura de la fotografía.'));
      lector.readAsDataURL(archivo);
    });
  }
  window.abrirEditorDespacho = async (id, regenerar, refrescar) => {
    if (abierto) return;
    abierto = true;
    const origen = document.activeElement;
    const host = document.createElement('div');
    document.body.append(host);
    const raiz = host.attachShadow({mode:'open'});
    raiz.innerHTML = `<style>
      *{box-sizing:border-box}dialog{width:min(620px,calc(100% - 20px));max-height:90dvh;margin:auto;padding:18px;border:0;border-radius:16px;color:#24343b;font:16px 'Segoe UI',Arial,sans-serif}
      dialog::backdrop{background:#0008}h2{font-size:20px;color:#55851d;margin:0 0 8px}p{line-height:1.5;font-size:14px}
      fieldset{border:0;padding:0;margin:0}label{display:block;font-weight:600;font-size:14px;margin:12px 0 5px}
      input,textarea,select{font:inherit;width:100%;padding:10px;border:1px solid #ccc;border-radius:8px}textarea{min-height:80px}
      button,a.pdf{font:inherit;cursor:pointer;min-height:44px;padding:10px 12px;border:0;border-radius:8px;background:#55851d;color:white;text-decoration:none}
      button:disabled{opacity:.5;cursor:wait}.acciones{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.secundario{background:#eaf0e5;color:#35454e}
      canvas{width:100%;height:140px;touch-action:none;border:1px dashed #888;border-radius:8px}
      .error{color:#b31922}.ayuda{color:#65747c}input[type=checkbox]{width:auto;margin-right:8px}
      .foto{display:grid;grid-template-columns:1fr 1fr;gap:8px}.archivo{font-size:13px;margin:4px 0}
      :focus-visible{outline:3px solid #79b82a;outline-offset:2px}[hidden]{display:none!important}
    </style><dialog aria-labelledby="titulo"><h2 id="titulo"></h2><p id="info"></p><form><fieldset id="campos"></fieldset><div class="acciones"><button id="guardar" type="submit" hidden></button><button id="cerrar" type="button" class="secundario">Cerrar</button></div></form><p id="mensaje" role="status" aria-live="polite">Cargando despacho…</p></dialog>`;
    const q = s => raiz.querySelector(s);
    const dialogo = q('dialog');
    const mensaje = q('#mensaje');
    let ocupado = true;
    let cambio = false;
    function cerrar() {
      if (ocupado) return;
      dialogo.close();host.remove();abierto=false;
      if (origen && origen.focus) origen.focus();
      if (cambio) refrescar();
    }
    q('#cerrar').onclick = cerrar;
    dialogo.addEventListener('cancel', e => { e.preventDefault();cerrar(); });
    dialogo.showModal();
    q('#titulo').textContent = regenerar ? 'Regenerar PDF' : 'Editar despacho';
    let registro;
    try { registro = await pedir({accion:'obtenerDespachoEdicion',id}); }
    catch(e) { ocupado=false;mensaje.className='error';mensaje.textContent=e.message;return; }
    ocupado=false;
    const fila = registro.fila;
    q('#info').textContent = fila[1] + ' · ' + fila[18] + ' · Disponible hasta ' + new Date(registro.vence).toLocaleString('es-CL',{timeZone:'America/Santiago'});
    const campos = q('#campos');
    const entradas = [];
    const selects = [];
    const fotos = [];
    let firma = null;
    let firmado = false;
    function elemento(tipo,texto,padre) {
      const el=document.createElement(tipo);
      if (texto !== undefined) el.textContent=texto;
      padre.append(el);return el;
    }
    function campo(etiqueta,tipo,valor) {
      const label=elemento('label',etiqueta,campos);
      const input=document.createElement(tipo==='textarea'?'textarea':tipo==='select'?'select':'input');
      input.id='editar-'+entradas.length;
      label.htmlFor=input.id;
      if(tipo!=='textarea'&&tipo!=='select') input.type=tipo;
      if(tipo==='select') for(const opcion of ['','Cumple','No cumple']) {
        const o=elemento('option',opcion||'Sin seleccionar',input);o.value=opcion;
      }
      input.value=valor == null?'':valor;
      if(tipo==='number'){input.min='0';input.step='1';}
      campos.append(input);entradas.push(input);return input;
    }
    if (!regenerar) {
      [['Cliente / Destino','text',4],['Transporte / Patente','text',5],['Formato de caja','text',6],['Etiqueta de cajas','text',7],['Cantidad de cajas','number',8],['Número de pallets','number',9],['Observaciones','textarea',10],['Estado final','select',11],['Responsable','text',12]].forEach(([etiqueta,tipo,col])=>campo(etiqueta,tipo,fila[col]));
      elemento('h3','Checklist',campos);
      registro.checklist.forEach((item,i)=>{
        const label=elemento('label',item.item,campos);
        const select=elemento('select',undefined,campos);select.id='revision-check-'+i;label.htmlFor=select.id;
        [['','Sin validar'],['si','Cumple'],['no','No cumple']].forEach(([v,t])=>{const o=elemento('option',t,select);o.value=v;});
        select.value=item.cumple?'si':item.noCumple?'no':'';selects.push(select);
      });
      elemento('h3','Fotografías',campos);
      elemento('p','Se conservan las fotografías actuales. Selecciona solo las que quieras reemplazar.',campos).className='ayuda';
      for(let i=0;i<3;i++) {
        elemento('label','Foto '+(i+1),campos);
        const input=elemento('input',undefined,campos);input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;
        const opciones=elemento('div',undefined,campos);opciones.className='foto';
        const nombre=elemento('p','Se conserva la foto actual',campos);nombre.className='archivo';
        for(const [t,capturar] of [['📷 Cámara',true],['🖼️ Galería',false]]) {
          const b=elemento('button',t,opciones);b.type='button';
          b.onclick=()=>{if(capturar)input.setAttribute('capture','environment');else input.removeAttribute('capture');input.click();};
        }
        const deshacer=elemento('button','Conservar foto actual',campos);deshacer.type='button';deshacer.className='secundario';deshacer.hidden=true;
        deshacer.onclick=()=>{input.value='';nombre.textContent='Se conserva la foto actual';deshacer.hidden=true;};
        input.onchange=()=>{nombre.textContent=input.files[0]?.name||'Se conserva la foto actual';deshacer.hidden=!input.files.length;};
        fotos.push(input);
      }
      elemento('h3','Firma',campos);
      elemento('p','Se conserva la firma actual. Activa esta opción si necesitas reemplazarla.',campos).className='ayuda';
      const label=elemento('label',undefined,campos);
      const reemplazar=elemento('input',undefined,label);reemplazar.type='checkbox';
      label.append(document.createTextNode('Reemplazar firma'));
      const zona=elemento('div',undefined,campos);zona.hidden=true;
      firma=elemento('canvas',undefined,zona);firma.width=560;firma.height=180;firma.setAttribute('aria-label','Dibuje la nueva firma');
      const limpiar=elemento('button','Limpiar nueva firma',zona);limpiar.type='button';limpiar.className='secundario';
      const ctx=firma.getContext('2d');let puntero=null;
      function punto(e){const r=firma.getBoundingClientRect();return [(e.clientX-r.left)*firma.width/r.width,(e.clientY-r.top)*firma.height/r.height];}
      firma.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;e.preventDefault();puntero=e.pointerId;firma.setPointerCapture(puntero);const [x,y]=punto(e);ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x,y);firmado=true;};
      firma.onpointermove=e=>{if(puntero!==e.pointerId)return;e.preventDefault();ctx.lineTo(...punto(e));ctx.stroke();};
      firma.onpointerup=firma.onpointercancel=firma.onlostpointercapture=()=>{puntero=null;};
      limpiar.onclick=()=>{ctx.clearRect(0,0,firma.width,firma.height);firmado=false;};
      reemplazar.onchange=()=>{zona.hidden=!reemplazar.checked;};
      firma.reemplazar=reemplazar;
    } else {
      elemento('p','Se generará un PDF con los datos actualmente guardados, conservando el número y folio. El buscador mostrará el nuevo PDF.',campos);
    }
    mensaje.textContent='';
    const guardar=q('#guardar');guardar.hidden=false;
    guardar.textContent=regenerar?'Generar PDF':'Guardar cambios y generar PDF';
    q('form').onsubmit=async e=>{
      e.preventDefault();if(ocupado||cambio)return;
      ocupado=true;campos.disabled=true;guardar.disabled=true;q('#cerrar').disabled=true;
      mensaje.className='';mensaje.textContent='Guardando y generando PDF. Mantén esta ventana abierta…';
      try {
        if(firma?.reemplazar.checked&&!firmado) throw new Error('Dibuja la nueva firma o desmarca Reemplazar firma.');
        const datos={accion:regenerar?'regenerarPDF':'editarDespacho',id,version:registro.version};
        if(!regenerar){
          datos.campos=entradas.map(e=>e.value.trim());
          datos.checklist=selects.map(s=>({cumple:s.value==='si',noCumple:s.value==='no'}));
          datos.fotos=await Promise.all(fotos.map(f=>leerImagen(f.files[0])));
          datos.firma=firma.reemplazar.checked?firma.toDataURL('image/png'):null;
        }
        const res=await pedir(datos);
        cambio=true;guardar.hidden=true;mensaje.textContent='✅ '+res.numeroDespacho+' actualizado. ';
        const url=new URL(res.pdfUrl);
        if(url.protocol==='https:'&&url.hostname==='drive.google.com') {
          const a=elemento('a','Abrir PDF actualizado',mensaje);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';
        }
        q('#cerrar').textContent='Cerrar y actualizar buscador';
      } catch(error) {
        mensaje.className='error';mensaje.textContent=error.message+' Si hubo un error de conexión, cierra y consulta el buscador antes de reintentar: la operación podría haberse completado.';
      } finally {
        ocupado=false;campos.disabled=cambio;guardar.disabled=cambio;q('#cerrar').disabled=false;
      }
    };
  };
})();

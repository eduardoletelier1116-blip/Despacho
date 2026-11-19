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

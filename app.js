const URL_APP =
"https://script.google.com/macros/s/AKfycbwJ4nepyKoNJYjlAsF0flRmnBZkrBhkIi2wdZrasUH3agv3vAoqE9qKemQQ4mKzHq8/exec";


const ITEMS = [
"Caja (Tipo y modelo)",
"Etiqueta (Correcta y legible)",
"Código / Lote",
"Pallet en buen estado",
"Film / Zuncho correctamente aplicado",
"Distribución de cajas en pallet",
"Estado del transporte",
"Verificación final y autorización"
];


let checklist = [];

let estadoSeleccionado = "";

let canvas;
let ctx;
let dibujando = false;



window.onload = function(){

    crearChecklist();

    iniciarFirma();


    document
    .getElementById("guardar")
    .addEventListener(
        "click",
        guardarDespacho
    );


    document
    .getElementById("limpiarFirma")
    .addEventListener(
        "click",
        limpiarFirma
    );

};





function crearChecklist(){


    const contenedor =
    document.getElementById("checklist");


    if(!contenedor){
        console.error("No existe checklist");
        return;
    }


    contenedor.innerHTML="";


    ITEMS.forEach((item,index)=>{


        checklist.push({

            item:item,
            cumple:false,
            noCumple:false

        });



        const div =
        document.createElement("div");


        div.className="item-check";


        div.innerHTML = `

        <strong>${item}</strong>

        <div class="opciones">


        <button 
        type="button"
        class="btn-cumple"
        id="cumple${index}">
        ✅ CUMPLE
        </button>


        <button
        type="button"
        class="btn-no-cumple"
        id="nocumple${index}">
        ❌ NO CUMPLE
        </button>


        </div>

        `;


        contenedor.appendChild(div);



        document
        .getElementById("cumple"+index)
        .onclick=function(){

            marcar(index,true,this);

        };


        document
        .getElementById("nocumple"+index)
        .onclick=function(){

            marcar(index,false,this);

        };


    });


}







function marcar(index,valor,boton){


    const padre =
    boton.parentElement;


    padre
    .querySelectorAll("button")
    .forEach(b=>{

        b.classList.remove(
            "seleccionado"
        );

    });


    boton.classList.add(
        "seleccionado"
    );



    checklist[index].cumple =
    valor;


    checklist[index].noCumple =
    !valor;


}








function seleccionarEstado(valor){


    estadoSeleccionado=valor;


    document
    .getElementById("estadoCumple")
    .classList.remove(
        "seleccionado"
    );


    document
    .getElementById("estadoNoCumple")
    .classList.remove(
        "seleccionado"
    );



    if(valor==="Cumple"){


        document
        .getElementById("estadoCumple")
        .classList.add(
            "seleccionado"
        );


    }else{


        document
        .getElementById("estadoNoCumple")
        .classList.add(
            "seleccionado"
        );


    }


}



window.seleccionarEstado =
seleccionarEstado;








async function guardarDespacho() {
    const boton = document.getElementById("guardar");
    const resultado = document.getElementById("resultado");

    boton.disabled = true;
    boton.textContent = "GUARDANDO...";
    resultado.textContent = "Preparando fotos y despacho...";

    try {
        const fotos = await obtenerFotos();

        const datos = {
            accion: "nuevoDespacho",
            cliente: valor("clienteDestino"),
            destino: valor("clienteDestino"),
            transporte: valor("transportePatente"),
            patente: valor("transportePatente"),
            formatoCaja: valor("formatoCaja"),
            etiquetaCajas: valor("etiquetaCajas"),
            cantidadCajas: valor("cantidadCajas"),
            numeroPallets: valor("numeroPallets"),
            estado: estadoSeleccionado,
            observaciones: valor("observaciones"),
            observacionesEstado: "",
            responsable: valor("responsable"),
            firma: canvas.toDataURL("image/png"),
            fotos: fotos,
            checklist: checklist
        };

        resultado.textContent =
            "Guardando despacho y generando PDF. Espere...";

        const respuesta = await fetch(URL_APP, {
            method: "POST",
            body: JSON.stringify(datos)
        });

        if (!respuesta.ok) {
            throw new Error(
                "Error de conexión con el servidor: " +
                respuesta.status
            );
        }

        const res = await respuesta.json();

        if (res.ok !== true) {
            throw new Error(
                res.mensaje ||
                "El servidor no pudo completar el despacho."
            );
        }

        if (!res.pdfUrl) {
            throw new Error(
                "El despacho se guardó, pero el servidor " +
                "no devolvió el enlace del PDF."
            );
        }

        resultado.innerHTML = "";

        const tarjeta = document.createElement("div");
        tarjeta.className = "resultado-exito";

        const titulo = document.createElement("h2");
        titulo.textContent = "✅ DESPACHO Y PDF GENERADOS";

        const numero = document.createElement("p");
        numero.textContent =
            "Número de despacho: " + res.numeroDespacho;

        const folio = document.createElement("p");
        folio.textContent = "Folio: " + res.folio;

        const enlace = document.createElement("a");
        enlace.href = res.pdfUrl;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.textContent = "📄 ABRIR PDF";

        tarjeta.append(titulo, numero, folio, enlace);
        resultado.appendChild(tarjeta);

        limpiarFormulario();

    } catch (error) {
        console.error("Error al guardar el despacho:", error);

        resultado.textContent =
            "❌ No se pudo completar el proceso: " +
            error.message +
            " Revisa la planilla antes de volver a guardar, " +
            "porque los datos podrían haberse registrado.";

    } finally {
        boton.disabled = false;
        boton.textContent = "GUARDAR DESPACHO";
    }
}


function valor(id){


const e =
document.getElementById(id);


return e ? e.value.trim() : "";


}








function obtenerFotos(){


const archivos=[

foto1.files[0],
foto2.files[0],
foto3.files[0]

];



if(archivos.some(f=>!f)){


throw new Error(
"Debe cargar las 3 fotos"
);


}



return Promise.all(

archivos.map(
convertirBase64
)

);


}








function convertirBase64(archivo){


return new Promise(resolve=>{


const lector =
new FileReader();


lector.onload =
()=>resolve(
lector.result
);


lector.readAsDataURL(
archivo
);



});


}







function iniciarFirma() {
    canvas = document.getElementById("firma");
    ctx = canvas.getContext("2d");

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Evita que la pantalla se desplace mientras firmas.
    canvas.style.touchAction = "none";

    // Reconoce mouse, dedo y lápiz táctil.
    canvas.addEventListener("pointerdown", iniciar);
    canvas.addEventListener("pointermove", dibujar);
    canvas.addEventListener("pointerup", terminar);
    canvas.addEventListener("pointercancel", terminar);
    canvas.addEventListener("lostpointercapture", terminar);
}

let punteroFirma = null;

function posicionFirma(evento) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (
            evento.clientX - rect.left - canvas.clientLeft
        ) * canvas.width / canvas.clientWidth,

        y: (
            evento.clientY - rect.top - canvas.clientTop
        ) * canvas.height / canvas.clientHeight
    };
}

function iniciar(evento) {
    if (!evento.isPrimary || evento.button !== 0) return;
    if (punteroFirma !== null) return;

    evento.preventDefault();

    punteroFirma = evento.pointerId;
    dibujando = true;

    canvas.setPointerCapture(evento.pointerId);

    const punto = posicionFirma(evento);

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";

    // Permite registrar también un toque corto.
    ctx.beginPath();
    ctx.arc(punto.x, punto.y, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(punto.x, punto.y);
}

function dibujar(evento) {
    if (!dibujando || evento.pointerId !== punteroFirma) {
        return;
    }

    evento.preventDefault();

    const punto = posicionFirma(evento);

    ctx.lineTo(punto.x, punto.y);
    ctx.stroke();
}

function terminar(evento) {
    if (evento.pointerId !== punteroFirma) return;

    dibujando = false;
    punteroFirma = null;
    ctx.closePath();

    if (canvas.hasPointerCapture(evento.pointerId)) {
        canvas.releasePointerCapture(evento.pointerId);
    }
}


function limpiarFirma(){

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

}

function limpiarFormulario(){



// Limpiar campos de texto

document
.querySelectorAll("input")
.forEach(input=>{


    if(input.type !== "button"){

        input.value="";

    }


});




// Limpiar observaciones

document
.querySelectorAll("textarea")
.forEach(textarea=>{

    textarea.value="";

});




// Limpiar fotos

foto1.value="";
foto2.value="";
foto3.value="";




// Limpiar firma

limpiarFirma();




// Quitar selección estado

estadoSeleccionado="";


document
.getElementById("estadoCumple")
.classList.remove(
"seleccionado"
);


document
.getElementById("estadoNoCumple")
.classList.remove(
"seleccionado"
);




// Reiniciar checklist

checklist=[];

crearChecklist();



}

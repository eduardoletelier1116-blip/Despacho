const URL_APP =
"https://script.google.com/macros/s/AKfycbx-ZRBDpw5Z4HeKgWd50u_1CJ_l6m_FLzlaa9--deC6zOb3nTTFOZ6XErESrwwhuE26/exec";


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







function iniciarFirma(){


canvas =
document.getElementById(
"firma"
);


ctx =
canvas.getContext("2d");


canvas.width =
canvas.offsetWidth;


canvas.height =
canvas.offsetHeight;



canvas.onmousedown=iniciar;

canvas.onmousemove=dibujar;

canvas.onmouseup=terminar;


}



function iniciar(e){

dibujando=true;

ctx.beginPath();

ctx.moveTo(
e.offsetX,
e.offsetY
);

}



function dibujar(e){


if(!dibujando)return;


ctx.lineWidth=3;

ctx.lineCap="round";


ctx.lineTo(
e.offsetX,
e.offsetY
);


ctx.stroke();


}



function terminar(){

dibujando=false;

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

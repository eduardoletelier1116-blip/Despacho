const URL_APP =
"https://script.google.com/macros/s/AKfycbyu9Z44evw1Mg2uvqd6L3CBaPV-5nD7G8TYLWu-6SGqKm-B_wgWc4sHlvs8gkoniqEP/exec";


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








async function guardarDespacho(){



try{


    const fotos =
    await obtenerFotos();



    const datos={


accion:"nuevoDespacho",


cliente:
valor("clienteDestino"),


destino:
valor("clienteDestino"),


transporte:
valor("transportePatente"),


patente:
valor("transportePatente"),


formatoCaja:
valor("formatoCaja"),


etiquetaCajas:
valor("etiquetaCajas"),


cantidadCajas:
valor("cantidadCajas"),


numeroPallets:
valor("numeroPallets"),


estado:
estadoSeleccionado,


observaciones:
valor("observaciones"),


observacionesEstado:
"",


responsable:
valor("responsable"),


firma:
canvas.toDataURL(
"image/png"
),


fotos:fotos,


checklist:checklist


};


    document
    .getElementById("resultado")
    .innerHTML=
    "Guardando...";



    fetch(
        URL_APP,
        {

            method:"POST",

            body:
            JSON.stringify(datos)

        }

    )
    .then(r=>r.json())

    .then(res=>{


document
.getElementById("resultado")
.innerHTML=
`

<div class="resultado-exito">


<h2>
✅ DESPACHO GUARDADO
</h2>


<p>
Número de despacho:
</p>

<h1>
${res.numeroDespacho}
</h1>


<p>
Folio:
</p>

<h2>
${res.folio}
</h2>


</div>

`;



setTimeout(()=>{

    limpiarFormulario();

},3000);



});



}catch(error){

    alert(error.message);

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

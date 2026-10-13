const URL_APP =
"https://script.google.com/macros/s/AKfycbwxwpOyoRHrj4iYMDTte9Nz5jkj283xP8K_DYhFEYx3EnUtuK-WuKK3pMmC48DX6lk8/exec";



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



document.addEventListener(
"DOMContentLoaded",
()=>{


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


});






function crearChecklist(){


const contenedor =
document.getElementById(
"checklist"
);



ITEMS.forEach(
(item,index)=>{


checklist.push({

item:item,
cumple:false,
noCumple:false

});



const div =
document.createElement(
"div"
);


div.className =
"item-check";



div.innerHTML = `

<strong>${item}</strong>


<div class="opciones">


<button 
class="btn-cumple"
onclick="marcar(${index},true,this)">
CUMPLE
</button>


<button
class="btn-no-cumple"
onclick="marcar(${index},false,this)">
NO CUMPLE
</button>


</div>

`;



contenedor.appendChild(div);



});


}





function marcar(index,valor,boton){


const padre =
boton.parentElement;



padre
.querySelectorAll("button")
.forEach(
b=>b.classList.remove(
"seleccionado"
)
);



boton.classList.add(
"seleccionado"
);



checklist[index].cumple =
valor;


checklist[index].noCumple =
!valor;



}







async function guardarDespacho(){



const fotos =
await obtenerFotos();



const firma =
canvas.toDataURL(
"image/png"
);




const datos = {


accion:
"nuevoDespacho",


cliente:
valor("cliente"),


destino:
valor("destino"),


transporte:
valor("transporte"),


patente:
valor("patente"),


formatoCaja:
valor("formatoCaja"),


cantidadCajas:
valor("cantidadCajas"),


numeroPallets:
valor("numeroPallets"),


estado:
valor("estado"),


observaciones:
valor("observaciones"),


responsable:
valor("responsable"),


firma:firma,


fotos:fotos,


checklist:checklist


};





document
.getElementById(
"resultado"
)
.innerHTML =
"Guardando despacho...";





fetch(
URL_APP,
{

method:"POST",

body:
JSON.stringify(datos)

}

)
.then(
r=>r.json()
)
.then(
respuesta=>{


if(respuesta.ok){


document
.getElementById(
"resultado"
)
.innerHTML = `

✅ Despacho guardado

<br><br>

<b>${respuesta.numeroDespacho}</b>

<br>

${respuesta.folio}

`;



}else{


throw new Error(
respuesta.mensaje
);


}



}

)
.catch(
error=>{


document
.getElementById(
"resultado"
)
.innerHTML =
"❌ "+error.message;


});


}








function valor(id){

return document
.getElementById(id)
.value
.trim();

}







function obtenerFotos(){


const archivos=[

document.getElementById("foto1").files[0],

document.getElementById("foto2").files[0],

document.getElementById("foto3").files[0]

];



return Promise.all(

archivos.map(
archivo=>
convertirBase64(archivo)
)

);

}







function convertirBase64(archivo){


return new Promise(
(resolve,reject)=>{


const lector =
new FileReader();


lector.onload =
()=>resolve(
lector.result
);


lector.onerror =
reject;


lector.readAsDataURL(
archivo
);


}

);


}








let canvas;
let ctx;
let dibujando=false;



function iniciarFirma(){


canvas =
document.getElementById(
"firma"
);


ctx =
canvas.getContext(
"2d"
);



canvas.width =
canvas.offsetWidth;

canvas.height =
canvas.offsetHeight;



canvas.addEventListener(
"mousedown",
inicio
);


canvas.addEventListener(
"mousemove",
dibujar
);


canvas.addEventListener(
"mouseup",
fin
);


canvas.addEventListener(
"touchstart",
inicio
);


canvas.addEventListener(
"touchmove",
dibujar
);


canvas.addEventListener(
"touchend",
fin
);



}







function inicio(e){

dibujando=true;

ctx.beginPath();

ctx.moveTo(
e.offsetX,
e.offsetY
);

}




function dibujar(e){

if(!dibujando)
return;


ctx.lineWidth=3;

ctx.lineCap="round";


ctx.lineTo(
e.offsetX,
e.offsetY
);


ctx.stroke();


}



function fin(){

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

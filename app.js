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

let estadoSeleccionado = "";


let canvas;
let ctx;
let dibujando = false;



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
document.getElementById("checklist");


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
class="btn-cumple"
onclick="marcar(${index},true,this)">
✅ CUMPLE
</button>


<button 
class="btn-no-cumple"
onclick="marcar(${index},false,this)">
❌ NO CUMPLE
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
.forEach(btn=>{

btn.classList.remove(
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


estadoSeleccionado = valor;



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







async function guardarDespacho(){


try{


if(!estadoSeleccionado){

alert(
"Seleccione el estado final"
);

return;

}



const fotos =
await obtenerFotos();



const datos = {


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



cantidadCajas:
valor("cantidadCajas"),



numeroPallets:
valor("numeroPallets"),



estado:
estadoSeleccionado,



observaciones:
valor("observaciones"),



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
.then(r=>r.json())

.then(res=>{


if(res.ok){


document
.getElementById("resultado")
.innerHTML =
`
✅ DESPACHO GUARDADO

<br><br>

<b>${res.numeroDespacho}</b>

<br>

${res.folio}

`;



}else{


throw new Error(
res.mensaje
);


}


})

.catch(error=>{


document
.getElementById("resultado")
.innerHTML =
"❌ "+error.message;


});



}catch(error){


console.error(error);


alert(
error.message
);


}


}






function valor(id){


const elemento =
document.getElementById(id);


if(!elemento){

console.error(
"No existe:",
id
);

return "";

}


return elemento.value.trim();


}








function obtenerFotos(){


const archivos=[


document.getElementById("foto1").files[0],

document.getElementById("foto2").files[0],

document.getElementById("foto3").files[0]


];



if(archivos.some(f=>!f)){


throw new Error(
"Debe cargar las 3 fotografías"
);


}



return Promise.all(

archivos.map(
archivo=>convertirBase64(archivo)
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
iniciarTrazo
);


canvas.addEventListener(
"mousemove",
dibujar
);


canvas.addEventListener(
"mouseup",
terminarTrazo
);



canvas.addEventListener(
"touchstart",
iniciarTrazo
);



canvas.addEventListener(
"touchmove",
dibujar
);



canvas.addEventListener(
"touchend",
terminarTrazo
);


}







function posicion(e){


const rect =
canvas.getBoundingClientRect();



return {

x:
(e.touches?
e.touches[0].clientX:
e.clientX)
-rect.left,


y:
(e.touches?
e.touches[0].clientY:
e.clientY)
-rect.top


};


}







function iniciarTrazo(e){


dibujando=true;


const p=
posicion(e);


ctx.beginPath();


ctx.moveTo(
p.x,
p.y
);


}





function dibujar(e){


if(!dibujando)
return;


e.preventDefault();


const p=
posicion(e);



ctx.lineWidth=3;

ctx.lineCap="round";


ctx.lineTo(
p.x,
p.y
);


ctx.stroke();


}




function terminarTrazo(){


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

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
.forEach(
b=>
b.classList.remove(
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



if(!estadoSeleccionado){


alert(
"Seleccione el estado final del despacho"
);


return;


}




const fotos =
await obtenerFotos();




const firma =
canvas.toDataURL(
"image/png"
);





const clienteDestino =
valor(
"clienteDestino"
);



const transportePatente =
valor(
"transportePatente"
);






const datos = {


accion:
"nuevoDespacho",



cliente:
clienteDestino,



destino:
clienteDestino,



transporte:
transportePatente,



patente:
transportePatente,



formatoCaja:
valor(
"formatoCaja"
),



cantidadCajas:
valor(
"cantidadCajas"
),



numeroPallets:
valor(
"numeroPallets"
),



estado:
estadoSeleccionado,



observaciones:
valor(
"observaciones"
),



responsable:
valor(
"responsable"
),



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
mode:"no-cors",
headers:{
"Content-Type":"text/plain"
},
body:
JSON.stringify(datos)
}
)

)
.then(
respuesta =>
respuesta.json()
)
.then(
data=>{


if(data.ok){


document
.getElementById(
"resultado"
)
.innerHTML = `

✅ DESPACHO GENERADO

<br><br>

<b>${data.numeroDespacho}</b>

<br>

${data.folio}

`;



}else{


throw new Error(
data.mensaje
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


document
.getElementById("foto1")
.files[0],


document
.getElementById("foto2")
.files[0],


document
.getElementById("foto3")
.files[0]


];





if(archivos.some(
f=>!f
)){


alert(
"Debe cargar las 3 fotografías"
);


throw new Error(
"Faltan fotografías"
);


}





return Promise.all(

archivos.map(
archivo =>
convertirBase64(
archivo
)

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
inicioFirma
);



canvas.addEventListener(
"mousemove",
dibujarFirma
);



canvas.addEventListener(
"mouseup",
terminarFirma
);



canvas.addEventListener(
"touchstart",
inicioFirma
);



canvas.addEventListener(
"touchmove",
dibujarFirma
);



canvas.addEventListener(
"touchend",
terminarFirma
);



}









function obtenerPosicion(e){


const rect =
canvas.getBoundingClientRect();



if(e.touches){


return {

x:
e.touches[0].clientX -
rect.left,


y:
e.touches[0].clientY -
rect.top

};


}



return {


x:
e.clientX -
rect.left,


y:
e.clientY -
rect.top


};


}









function inicioFirma(e){


dibujando=true;


const pos =
obtenerPosicion(e);


ctx.beginPath();


ctx.moveTo(
pos.x,
pos.y
);


}









function dibujarFirma(e){


if(!dibujando)
return;



e.preventDefault();



const pos =
obtenerPosicion(e);



ctx.lineWidth=3;

ctx.lineCap="round";



ctx.lineTo(
pos.x,
pos.y
);



ctx.stroke();



}








function terminarFirma(){


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

import L from "leaflet";

/* variables varias*/

var maxLoc = 4;
var locActivas = 0;
var infoMarker = [2];
window.infoMarker = infoMarker;
var aLocalidades;

/* añadiendo una ubicación de inicio al mapa */

var map = L.map("map", {
  zoomControl: false,
}).setView([43.0756299, -2.2236667], 8);

/* añadimos un mapa base genérico */

L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  minZoom: 6,
}).addTo(map);

/* movemos de posicion los botones de zoom */

L.control
  .zoom({
    position: "bottomright",
  })
  .addTo(map);

/* añadimos un control de escala */

L.control.scale().addTo(map);

/* creando los iconos */

iconMarker = L.icon({
  iconUrl: "../images/marcador.png",
  iconSize: [41, 41],
});

iconMarkerSelect = L.icon({
  iconUrl: "../images/marcador_select.png",
  iconSize: [41, 41],
});

aLocalidades = GetLocalidadesAPI();

/* fetch que obtiene las localidades almacenadas en la base de datos */

function GetLocalidadesAPI() {

  /* un array temporal para poder devolver los datos recogidos y reutilizarlos */
  let aLoc = [];

  fetch("https://localhost:5001/api/Localidades")
    .then((response) => response.json())
    .then((aMarcadores) => {
      aMarcadores.forEach((poblacion) => {
        aLoc.push(poblacion);
        var marcador = L.marker([poblacion.latitud, poblacion.longitud], { icon: iconMarker }).addTo(map);

        /* limpiando el formato de las localidades para usarlas de id */

        marcador._icon.id = `mark${poblacion.idBaliza}`;

        /* añadiendo la clase de su provincia para utilizarlo en los filtros a futuro */

        marcador._icon.classList.add(poblacion.provincia);

        /* al clicar en un marcador se abrira un aviso para añadir o no la localidad */

        marcador.on("click", (e) => {
          infoMarker[0] = marcador;
          infoMarker[1] = e.target.getPopup().getContent();
          alertLocalidad(infoMarker);
        });

        /* añadiendo popups */

        marcador.bindPopup(`<span>${poblacion.localidad}</span>`, { closeButton: false, maxWidth: "auto", offset: [1, -12] });

        marcador.on("mouseover", function (e) {
          this.openPopup();
        });

        marcador.on("mouseout", function (e) {
          this.closePopup();
        });
      });
    
    
    });
    return aLoc;
}

/* alternar visibilidad del mapa */

$("#c-Visib")
  .find("#bVisib")
  .click(function () {
    $("#c-mapa").toggle();

    if ($(this).parent().attr("id")) {
      $(this).removeClass("btn-light");
      $(this).addClass("btn-dark");
      $("#c-Visib").removeAttr("id");
      $(this).html("+");
    } else {
      $(this).removeClass("btn-dark");
      $(this).addClass("btn-light");
      $(this).parent().attr("id", "c-Visib");
      $(this).html("-");
    }
  });

/* evitando el comportamiento por defecto del contenerdor de los filtros */

$("#c-mapa")
  .find("#c-filtros")
  .on("click", "#drop-filtros", function (e) {
    return false;
  });

/* colocar el núm de máximas localizaciones */

window.addEventListener("load", function (event) {
  document.getElementById("sMaxBalizas").innerText = " " + maxLoc;
});

/* aumentar num max de localizaciones */

$("#dMaxBalizas").on("click", "#MenosBal", function (e) {
  if (locActivas > maxLoc - 1 || maxLoc - 1 <= 0) {
    var sHtml = `<div id="dAnyadirLoc" class="container-fluid d-flex justify-content-center align-items-center position-fixed">
                    <div id="dMensajeAL" class="container-sm d-flex justify-content-center row rounded-3 border border-5 border-dark">
                      <div class="container d-flex justify-content-center mt-5">
                        <span class="fs-6 text-center text-dark">El máximo de localidades no puede ser menor a 0, o que las activas actualmente.</span>
                      </div>
                      <div class="container d-flex row justify-content-center h-auto w-auto my-4">
                        <button type="button" class="btn btn-light mt-3" onclick="CloseAlertLocalidad()">Cerrar</button>
                      </div>
                    </div>
                  </div>    `;

    document.getElementById("header").insertAdjacentHTML("beforebegin", sHtml);
  } else {
    maxLoc--;
    document.getElementById("sMaxBalizas").innerText = " " + maxLoc;
  }
});

$("#dMaxBalizas").on("click", "#PlusBal", function (e) {
  maxLoc++;
  document.getElementById("sMaxBalizas").innerText = " " + maxLoc;
});

/* aviso para añadir localidad */

function alertLocalidad(marcador) {
  var sHtml = `<div id="dAnyadirLoc" class="container-fluid d-flex justify-content-center align-items-center position-fixed">
        <div id="dMensajeAL" class="container-sm d-flex justify-content-center row rounded-3 border border-5 border-dark">
            <div class="container d-flex justify-content-center mt-3">
                <span class="fs-6 text-center text-dark">¿Desea ver el temporal de ${marcador[1]}?</span>
            </div>
            <div class="container d-flex row justify-content-center h-50 mt-3">
                <button type="button" class="btn btn-secondary" onclick="addLocalidad(infoMarker)">Aceptar</button>
                <button type="button" class="btn btn-light mt-3" onclick="CloseAlertLocalidad()">Cancelar</button>
            </div>
        </div>
    </div>`;

  document.getElementById("header").insertAdjacentHTML("beforebegin", sHtml);
}

/* añadir localidad */

function addLocalidad(marcador) {
  if (locActivas >= maxLoc) {
    document
      .getElementById("dMensajeAL")
      .querySelectorAll("*")
      .forEach((n) => n.remove());
    document.getElementById("dMensajeAL").innerHTML = `
    <div class="container d-flex justify-content-center mt-5">
      <span class="fs-6 text-center text-dark">Ha sobrepasado el límite de localizaciones, elimine alguna de las seleccionadas.</span>
    </div>
    <div class="container d-flex row justify-content-center h-auto w-auto my-4">
      <button type="button" class="btn btn-light mt-3" onclick="CloseAlertLocalidad()">Cerrar</button>
    </div>    
    `;
  } else if ($("#lista-loc-activas").find(`#${marcador[0]._icon.id}`).length) {
    document
      .getElementById("dMensajeAL")
      .querySelectorAll("*")
      .forEach((n) => n.remove());
    document.getElementById("dMensajeAL").innerHTML = `
    <div class="container d-flex justify-content-center mt-5">
      <span class="fs-6 text-center text-dark">Ya ha obtenido los datos de esta localidad, por favor escoja de nuevo.</span>
    </div>
    <div class="container d-flex row justify-content-center h-auto w-auto my-4">
      <button type="button" class="btn btn-light mt-3" onclick="CloseAlertLocalidad()">Cerrar</button>
    </div>    
    `;
  } else {
    CloseAlertLocalidad();

    var cartaTiempo = `<div id="d${(marcador[0]._icon.id).substring(4)}" class="card c-baliza mt-3 ${(marcador[0]._icon.id).substring(4)}">
                    <div class="card-header text-center text-light bg-dark">
                        ${marcador[1]}
                    </div>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item bg-info"></li>
                        <div id="lEstado" class="list-group-item d-flex flex-column justify-content-center align-items-center text-center bg-info"><img class="img-fluid iEstado al" src="" alt=""><span class="sHora"></span></div>
                        <li class="list-group-item bg-info"></li>
                        <div id="lTemperatura" class="container position-relative list-group-item bg-info d-flex justify-content-center px-0 py-2 mx-0 ocultable"><div class="container d-flex px-3 justify-content-left"><img class="img-fluid cITemperatura ps-1 pt-1 pe-2" src="images/temperatura.png" alt=""><span class="fs-6 w-auto align-self-left pe-4">Temperatura:</span><span class="fs-6 w-auto align-self-left sTemperatura"></span></div><div class="container d-flex position-absolute bg-danger h-100 w-auto top-0 end-0 text-light d-none dCerrar"><span class="align-self-center">x</span></div></div>
                        <div id="lHumedad" class="container position-relative list-group-item bg-info d-flex justify-content-center px-0 py-2 mx-0 ocultable"><div class="container d-flex px-3 justify-content-left"><img class="img-fluid cIHumedad pt-1 pe-1" src="images/humedad.png" alt=""><span class="fs-6 w-auto align-self-left pe-4">Humedad:</span><span class="fs-6 w-auto align-self-left ps-3 sHumedad"></span></div><div class="container d-flex position-absolute bg-danger h-100 w-auto top-0 end-0 text-light d-none dCerrar"><span class="align-self-center">x</span></div></div>
                        <div id="lViento" class="container position-relative list-group-item bg-info d-flex justify-content-center px-0 py-2 mx-0 ocultable d-none"><div class="container d-flex px-3 justify-content-left"><img class="img-fluid cIViento pt-1 pe-2" src="images/viento.png" alt=""><span class="fs-6 w-auto align-self-left pe-5">Viento:</span><span  class="fs-6 w-auto align-self-left ps-3 sViento"></span></div><div class="container d-flex position-absolute bg-danger h-100 w-auto top-0 end-0 text-light d-none dCerrar"><span class="align-self-center">x</span></div></div>

                    </ul>
                    <div class="card-footer bg-dark"></div>
                </div>
                `;

    var itemListaLoc = `<li><div class="dropdown-item container d-flex justify-content-center mx-0 px-0 py-0 position-relative" ><div class="container d-flex justify-content-center"><span class="fs-6 w-auto align-self-center">${marcador[1]}</span></div><div id="${(marcador[0]._icon.id).substring(4)}" class="container position-absolute bg-danger w-auto end-0 text-light d-none dCerrar"><span>x</span></div></div></li>
  `;

    $("#fichas-tiempo").append(cartaTiempo);
    $("#lista-loc-activas").append(itemListaLoc);

    nowHora((marcador[0]._icon.id).substring(4));
    GetMediciones((marcador[0]._icon.id).substring(4));

    marcador[0].setIcon(iconMarkerSelect);
    locActivas++;
  }
}

window.addLocalidad = addLocalidad;

/* función que observa si hay localidades activas y las actualiza */

/* Función que recoge los datos de la baliza seleccionada */

function GetMediciones(string) {
  fetch(`https://localhost:5001/api/TemporalLocalidades/${string}`)
    .then((response) => response.json())
    .then((aMediciones) => {

      $("#fichas-tiempo").find(`#d${string}`).find("ul").find("#lEstado").find(".iEstado").attr('src', `images/${aMediciones.estado}.png`)
      $("#fichas-tiempo").find(`#d${string}`).find("ul").find("#lTemperatura").find(".px-3").find(".sTemperatura").html(`${aMediciones.temperatura} ºC`);
      $("#fichas-tiempo").find(`#d${string}`).find("ul").find("#lHumedad").find(".px-3").find(".sHumedad").html(`${aMediciones.humedad} %`);
      $("#fichas-tiempo").find(`#d${string}`).find("ul").find("#lViento").find(".px-3").find(".sViento").html(`${aMediciones.velViento} m/s`);
    });
}

/* función que devuelve la hora actual */

function nowHora(localidad) {
  let date = new Date(); 
  let hh = date.getHours();
  let mm = date.getMinutes();
  let ss = date.getSeconds();

   hh = (hh < 10) ? "0" + hh : hh;
   mm = (mm < 10) ? "0" + mm : mm;
   ss = (ss < 10) ? "0" + ss : ss;
    
   let hora = hh + ":" + mm + ":" + ss;

   $("#fichas-tiempo").find(`#d${localidad}`).find("ul").find("#lEstado").find(".sHora").html(`${hora}`); 
  let t = setTimeout(function(){ nowHora(localidad) }, 1000);
}

/* cerrar aviso añadir localidad */

function CloseAlertLocalidad() {
  $("#dAnyadirLoc").remove();
}

window.CloseAlertLocalidad = CloseAlertLocalidad;

/* comportamiendos dinámicos lista localidades */

$("#c-loc-activas").on("click", ".dropdown-item", function (e) {
  return false;
});

$("#c-loc-activas").on("mouseenter", ".dropdown-item", function () {
  $(this).find(".dCerrar").hide("slide", { direction: "left" }, 1);
  $(this).find(".dCerrar").removeClass("d-none").show("slide", { direction: "right" }, 250);
});

$("#c-loc-activas").on("mouseleave", ".dropdown-item", function () {
  $(this).find(".dCerrar").addClass("d-none").hide("slide", { direction: "left" }, 1);
});

/* función dinámica para eliminar las localidades escogidas */

$("#c-loc-activas").on("click", ".dCerrar", function () {
  locActivas--;

  var idLocali = $(this).attr("id");

  $(this).closest("li").remove();
  $("#fichas-tiempo").find(`#d${idLocali}`).remove();

  map.eachLayer(function (layer) {

    if ($(layer._icon).attr("id") == `mark${idLocali}`) {
      $(layer._icon).attr("src", "../images/marcador.png"); //asefdsrgtyhjuyhgdfasadfghyjgfds hola ando de mañana usa d-none para ocultar cositas con los filtros
    }
  });
});

/* drag & drop */

$("#iTemperatura").draggable({
  containment: "#cDragZone",
  helper: "clone",
  revert: false,
});
$("#iHumedad").draggable({
  containment: "#cDragZone",
  helper: "clone",
  revert: false,
});
$("#iViento").draggable({
  containment: "#cDragZone",
  helper: "clone",
  revert: false,
});

$("#fichas-tiempo").on("DOMNodeInserted", ".c-baliza", function () {
  $(this).droppable({
    drop: function (event, ui) {
      let parametro = ui.draggable.attr("id");

      switch (parametro) {
        case "iTemperatura":
          $(this).find("ul").find("#lTemperatura").removeClass("d-none");
          break;
        case "iHumedad":
          $(this).find("ul").find("#lHumedad").removeClass("d-none");
          break;
        case "iViento":
          $(this).find("ul").find("#lViento").removeClass("d-none");
          break;
      }
    },
  });

  /* animación */

  $(this).on("mouseenter", ".ocultable", function () {
    $(this).find(".dCerrar").addClass("d-none").css("left", "0px");
    $(this).find(".dCerrar").removeClass("d-none").animate({ left: "230px" }, 150);
  });

  $(this).on("mouseleave", ".ocultable", function () {
    $(this).find(".dCerrar").addClass("d-none").css("left", "");
  });

  /* ocultar parámetro */
  $(this)
    .find(".ocultable")
    .on("click", ".dCerrar", function () {
      $(this).parent().addClass("d-none");
    });
});

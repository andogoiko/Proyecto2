import L from "leaflet";

/* variables varias*/

var infoMarker = [2];
window.infoMarker = infoMarker;

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

/** añadiendo marcadores */

var aMarcadores = [
  { sPoblacion: "IRUN", douLatitud: 43.3383, douLongitud: -1.78921 },
  { sPoblacion: "ERRENTERIA", douLatitud: 43.3128, douLongitud: -1.89963 },
  {
    sPoblacion: "DONOSTIA/SAN SEBASTIÁN",
    douLatitud: 43.31283,
    douLongitud: -1.97499,
  },
  { sPoblacion: "HONDARRIBIA", douLatitud: 43.3625, douLongitud: -1.7915 },
];

aMarcadores.forEach((poblacion) => {
  var marcador = L.marker([poblacion.douLatitud, poblacion.douLongitud], { icon: iconMarker }).addTo(map);

  /* limpiando el formato de las localidades para usarlas de id */

  marcador._icon.id = `mark${poblacion.sPoblacion
    .replace(/\s+/g, "")
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")}`;

  /* al clicar en un marcador se abrira un aviso para añadir o no la localidad */

  marcador.on("click", (e) => {
    infoMarker[0] = marcador;
    infoMarker[1] = e.target.getPopup().getContent();
    alertLocalidad(infoMarker);
  });

  /* añadiendo popups */

  marcador.bindPopup(`<span>${poblacion.sPoblacion}</span>`, { closeButton: false, maxWidth: "auto", offset: [1, -12] });

  marcador.on("mouseover", function (e) {
    this.openPopup();
  });

  marcador.on("mouseout", function (e) {
    this.closePopup();
  });
});

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
      $("#footer").addClass("fixed-bottom");
    } else {
      $(this).removeClass("btn-dark");
      $(this).addClass("btn-light");
      $(this).parent().attr("id", "c-Visib");
      $(this).html("-");
      $("#footer").removeClass("fixed-bottom");
    }
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
  CloseAlertLocalidad();

  var cartaTiempo = `<div id="d${marcador[0]._icon.id}" class="card c-baliza mt-3 ${marcador[0]._icon.id}">
                    <div class="card-header text-center">
                        Featured
                    </div>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item"></li>
                        <li class="list-group-item">Temperatura</li>
                        <li class="list-group-item">Humedad</li>
                    </ul>
                </div>`;

  var itemListaLoc = `<li><a id="li${marcador[0]._icon.id}" class="dropdown-item ${marcador[0]._icon.id}" href="#">${marcador[1]}</a></li>`;

  $("#fichas-tiempo").append(cartaTiempo);
  $("#lista-loc-activas").append(itemListaLoc);

  marcador[0].setIcon(iconMarkerSelect);
}

window.addLocalidad = addLocalidad;

/* cerrar aviso añadir localidad */

function CloseAlertLocalidad() {
  $("#dAnyadirLoc").remove();
}

window.CloseAlertLocalidad = CloseAlertLocalidad;

/*drag & drop */

$("#iTemperatura").draggable({ containment: "#cDragZone", revert: true });
$("#iHumedad").draggable({ containment: "#cDragZone", revert: true });
$("#iPrecipi").draggable({ containment: "#cDragZone", revert: true });
$("#iViento").draggable({ containment: "#cDragZone", revert: true });

$(".c-baliza").droppable({
  drop: function (event, ui) {
    let parametro = ui.draggable.attr("id");
    console.log(parametro);
    $(this).find("ul").append(`<li class="list-group-item"></li>`);
  },
});

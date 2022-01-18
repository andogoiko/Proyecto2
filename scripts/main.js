import L from "leaflet";
//const L = require('leaflet');

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

/* facilitar la ubicación actual */

/*document.getElementById("bPermitir").addEventListener("click", () => {
  //Pedir activación de ubicación
  if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        //Si es aceptada guardamos lo latitud y longitud
        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
      },
      function (error) {
        //Si es rechazada enviamos de error por consola
        console.log("permiso denegado");
      }
    );
});
*/

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

  marcador._icon.id = `mark${poblacion.sPoblacion
    .replace(/\s+/g, "")
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")}`;

  marcador.on("click", () => {
    marcador.setIcon(iconMarkerSelect);
  });
  marcador.bindPopup(poblacion.sPoblacion, { closeButton: false, maxWidth: "auto", offset: [1, -12] });

  marcador.on("mouseover", function (e) {
    this.openPopup();
  });

  marcador.on("mouseout", function (e) {
    this.closePopup();
  });
});

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

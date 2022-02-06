import L from "leaflet";

/* variables varias*/

var aLocalBalizas = new Array();
var maxLoc = 4;
var locActivas = 0;
var fProvincia = "";
var fLocalidad = "";
var infoMarker = [2];
window.infoMarker = infoMarker;

/* añadiendo una ubicación de inicio al mapa */

var map = L.map("dMap", {
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

var iconMarker = L.icon({
  iconUrl: "images/marcador.png",
  iconSize: [41, 41],
});

var iconMarkerSelect = L.icon({
  iconUrl: "images/marcador_select.png",
  iconSize: [41, 41],
});

/* tenemos ocultos los marcadores (simulando el autorization, ya que no habrían cargado aún) */

$(".leaflet-marker-pane").addClass("d-none");

/* si nos hemos logueado, se nos mostrarán los marcadores y posibles localidades guardadas (simulamos autorization)*/

function showContent() {
  $("#dFormLogin").addClass("position-absolute").animate({ bottom: 0 }, 350).fadeOut({ queue: false });

  $("#dFormLogin")
    .promise()
    .done(function () {
      $("#dLogin").remove();
      $(".leaflet-marker-pane").removeClass("d-none");
      $("#dFichasTiempo").removeClass("d-none");
    });
}

window.showContent = showContent;

/* mostramos el panel de registrarse (simulando aladir usuario para autorization) */

function showRegistrar() {
  $("#dFormLogin").fadeIn("fast");
  $("#dFormLogin").addClass("d-none");
  var divRegistrar = $(`
  <div id="dFormRegistrar" class="container-sm d-flex flex-column justify-content-center rounded-3 border border-1 border-dark divEmergente">
          <div id="dRegTitulo" class="container d-flex flex-column mt-2 mb-auto">
            <div class="input-group-prepend position-absolute mt-1">
              <span id="sAtras" class="input-group-text dIcono text-light bg-dark" onclick="backToLogin()"><i class="fas fa-reply"></i></span>
            </div>
            <span class="fs-3 text-light border-bottom align-items-center mx-auto">Regístrate</span>
          </div>
            <form class="d-flex flex-column mb-auto h-75">
              <div class="input-group form-group mb-4">
                <div class="input-group-prepend">
                  <span class="input-group-text dIcono text-light bg-dark"><i class="fas fa-user-circle"></i></span>
                </div>
                <input type="text" class="form-control" placeholder="Nombre" />
                <input type="text" class="form-control" placeholder="Apellidos" />
              </div>
              <div class="input-group form-group mt-2 mb-4">
                <div class="input-group-prepend">
                  <span class="input-group-text dIcono text-light bg-dark"><i class="fas fa-at"></i></span>
                </div>
                <input type="text" class="form-control" placeholder="Correo electrónico" />
              </div>
              <div class="input-group form-group mt-2 mb-4">
                <div class="input-group-prepend">
                  <span class="input-group-text dIcono text-light bg-dark"><i class="fas fa-user"></i></span>
                </div>
                <input type="text" class="form-control" placeholder="Usuario" />
              </div>
              <div class="input-group form-group mt-2 mb-4">
                <div class="input-group-prepend">
                  <span class="input-group-text dIcono text-light bg-dark"><i class="fas fa-key"></i></span>
                </div>
                <input type="password" class="form-control" placeholder="Contraseña" />
              </div>
              <div class="input-group form-group mt-2 mb-4">
                <input type="password" class="form-control" placeholder="Confirmar contraseña" />
              </div>
              <div class="form-group align-self-center mt-2">
                <button type="button" class="btn btn-light text-dark" onclick="backToLogin()">Registrarse</button>
              </div>
            </form>
      </div>
  `)
    .appendTo("#dLogin")
    .animate({ height: 500 }, 200);
}

window.showRegistrar = showRegistrar;

function backToLogin() {
  $("#dFormRegistrar").fadeIn({ queue: false }, "fast").animate({ height: 350 }, 200);
  $("#dFormRegistrar")
    .promise()
    .done(function () {
      $("#dFormRegistrar").remove();
      $("#dFormLogin").removeClass("d-none");
    });
}

window.backToLogin = backToLogin;

/* recogemos posibles valores guardados en el localstorage */

if (localStorage.Balizas == undefined) {
  localStorage.Balizas = [];
  aLocalBalizas = [];
} else {
  if (localStorage.getItem("Balizas").length != 0) {
    aLocalBalizas = JSON.parse(localStorage.Balizas);
    if (aLocalBalizas.length > maxLoc) {
      maxLoc = aLocalBalizas.length;
    }
  }
}
/* creamos todos los marcadores de localidades */

GetLocalidadesAPI();

/* fetch que obtiene las localidades almacenadas en la base de datos */

function GetLocalidadesAPI() {
  /* un array temporal para poder devolver los datos recogidos y reutilizarlos */
  
  var setProvincias = new Set();
//192.168.0.15
  fetch("http://10.10.17.109:5000/api/Localidades")
    .then((response) => response.json())
    .then((aMarcadores) => {
      aMarcadores.forEach((poblacion) => {
        var marcador = L.marker([poblacion.latitud, poblacion.longitud], { icon: iconMarker }).addTo(map);

        /* limpiando el formato de las localidades para usarlas de id */

        marcador._icon.id = `mark${poblacion.idBaliza}`;

        /* añadiendo la clase de su provincia para utilizarlo en los filtros a futuro */

        let pobLimpia = poblacion.localidad
          .replace(/\s+/g, "")
          .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        marcador._icon.classList.add(poblacion.provincia);
        marcador._icon.classList.add(`${pobLimpia}`);

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

        /* añadiendo los las provincias y pueblos a los filtros */

        if (!setProvincias.has(poblacion.provincia)) {
          setProvincias.add(poblacion.provincia);
          $(`#sProvincias`).append(`<option value="${poblacion.provincia}">${poblacion.provincia}</option>`);
        }

        $(`#sLocalidades`).append(`<option class="${poblacion.provincia}" value="${poblacion.localidad}">${poblacion.localidad}</option>`);

        /* si hay alguna localidad en el localstorage colocamos la carta del tiempo */

        infoMarker[0] = marcador;
        infoMarker[1] = poblacion.localidad;

        if (localStorage.getItem("Balizas").length != 0) {
          localstrgLocalidades(infoMarker);
        }
      });
    });
}

/* si teníamos algún dato en el localstorage se volverán a crear las cartas del tiempo */

function localstrgLocalidades(marcador) {
  var memoryMarcadores = JSON.parse(localStorage.Balizas);
  var isStored = false;

  memoryMarcadores.forEach((baliza) => {
    if (baliza[0] == marcador[0]._icon.id.substring(4)) {
      isStored = true;
    }
  });

  if (isStored) {
    addLocalidad(marcador);
  }
}

/* funcionamiento de los filtros */

/* evitando el comportamiento por defecto del contenerdor de los filtros */

$("#dMapa")
  .find("#dFiltros")
  .on("click", "#dDropFiltros", function (e) {
    return false;
  });

/* filtros provincias */

$(`#sProvincias`).on("change", function (e) {
  let provincia = this.value;
  fProvincia = provincia;

  /* volvemos a activar todos por si se habia tocado un filtro */

  $("#sLocalidades")
    .find("option")
    .each(function () {
      $(this).removeClass("d-none");
    });

  if (provincia.length != 0) {
    $("#sLocalidades")
      .find("option")
      .each(function () {
        if (!$(this).hasClass(provincia)) {
          $(this).addClass("d-none");
        }
      });
  }
});

/* filtros localidades */

$(`#sLocalidades`).on("change", function (e) {
  let localidad = this.value;
  fLocalidad = localidad
    .replace(/\s+/g, "")
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
});

/* Botón de filtrado */

$(`#bFiltrado`).on("click", function (e) {
  /* volvemos a activar todos por si se habia tocado un filtro */

  $("#dMap")
    .find(".leaflet-map-pane")
    .find(".leaflet-marker-pane")
    .find("img")
    .each(function () {
      $(this).removeClass("d-none");
    });

  /* priorizamos el más restrictivo a la hora de filtrar */

  if (fLocalidad.length != 0) {
    $("#dMap")
      .find(".leaflet-map-pane")
      .find(".leaflet-marker-pane")
      .find("img")
      .each(function () {
        if (!$(this).hasClass(fLocalidad)) {
          $(this).addClass("d-none");
        }
      });
  } else {
    if (fProvincia.length != 0) {
      $("#dMap")
        .find(".leaflet-map-pane")
        .find(".leaflet-marker-pane")
        .find("img")
        .each(function () {
          if (!$(this).hasClass(fProvincia)) {
            $(this).addClass("d-none");
          }
        });
    }
  }
});

/* alternar visibilidad del mapa */

$("#dVisib")
  .find("#bVisib")
  .click(function () {
    /* procurando un fallo visual */

    if ($("#bVisib").html() == "+") {
      $("#bVisib").parent().attr("id", "dVisib");
    }

    $("#dMapa")
      .slideToggle()
      .promise()
      .done(function () {
        if ($("#bVisib").parent().attr("id") && $("#bVisib").html() != "+") {
          $("#bVisib").removeClass("btn-light");
          $("#bVisib").addClass("btn-dark");
          $("#dVisib").removeAttr("id");
          $("#bVisib").html("+");
        } else {
          $("#bVisib").removeClass("btn-dark");
          $("#bVisib").addClass("btn-light");
          $("#bVisib").html("-");
        }
      });
  });

/* colocar el núm de máximas localizaciones */

window.addEventListener("load", function (event) {
  document.getElementById("sMaxBalizas").innerText = " " + maxLoc;
});

/* aumentar num max de localizaciones */

$("#dMaxBalizas").on("click", "#bMenosBal", function (e) {
  if (locActivas > maxLoc - 1 || maxLoc - 1 <= 0) {
    var sHtml = `<div id="dAnyadirLoc" class="container-fluid d-flex justify-content-center align-items-center position-fixed fondoEmergente">
                    <div id="dMensajeAL" class="container-sm d-flex justify-content-center row rounded-3 border border-1 border-dark divEmergente">
                      <div class="container d-flex justify-content-center mt-5">
                        <span class="fs-4 text-center text-light">El máximo de localidades no puede ser 0, o menor a las que están activas actualmente.</span>
                      </div>
                      <div class="container d-flex row justify-content-center h-auto w-auto my-4">
                        <button type="button" class="btn btn-light mb-2" onclick="CloseAlertLocalidad()">Cerrar</button>
                      </div>
                    </div>
                  </div>    `;

    document.getElementById("dHeader").insertAdjacentHTML("beforebegin", sHtml);
  } else {
    maxLoc--;
    document.getElementById("sMaxBalizas").innerText = " " + maxLoc;
  }
});

$("#dMaxBalizas").on("click", "#bPlusBal", function (e) {
  maxLoc++;
  document.getElementById("sMaxBalizas").innerText = " " + maxLoc;
});

/* aviso para añadir localidad */

function alertLocalidad(marcador) {
  var sHtml = `<div id="dAnyadirLoc" class="container-fluid d-flex justify-content-center align-items-center position-fixed fondoEmergente">
        <div id="dMensajeAL" class="container-sm d-flex justify-content-center row rounded-3 border border-1 border-dark divEmergente">
            <div class="container d-flex justify-content-center mt-2">
                <span class="fs-4 text-center text-light">¿Desea ver el temporal de ${marcador[1]}?</span>
            </div>
            <div class="container d-flex row justify-content-center h-50 mt-3">
                <button type="button" class="btn btn-secondary" onclick="tryAddLocalidad(infoMarker)">Aceptar</button>
                <button type="button" class="btn btn-light mt-3" onclick="CloseAlertLocalidad()">Cancelar</button>
            </div>
        </div>
    </div>`;

  document.getElementById("dHeader").insertAdjacentHTML("beforebegin", sHtml);
}

/* función que compruba que se pueda añadir una localidad */

function tryAddLocalidad(marcador) {
  if (locActivas >= maxLoc) {
    document
      .getElementById("dMensajeAL")
      .querySelectorAll("*")
      .forEach((n) => n.remove());
    document.getElementById("dMensajeAL").innerHTML = `
    <div class="container d-flex justify-content-center mt-4">
      <span class="fs-4 text-center text-light">Ha sobrepasado el límite de localizaciones, elimine alguna de las seleccionadas.</span>
    </div>
    <div class="container d-flex row justify-content-center h-auto w-auto my-4">
      <button type="button" class="btn btn-light mt-3" onclick="CloseAlertLocalidad()">Cerrar</button>
    </div>    
    `;
  } else if ($("#ulLocActivas").find(`#dList${marcador[0]._icon.id.substring(4)}`).length) {
    document
      .getElementById("dMensajeAL")
      .querySelectorAll("*")
      .forEach((n) => n.remove());
    document.getElementById("dMensajeAL").innerHTML = `
    <div class="container d-flex justify-content-center mt-4">
      <span class="fs-4 text-center text-light">Ya ha obtenido los datos de esta localidad, por favor escoja de nuevo.</span>
    </div>
    <div class="container d-flex row justify-content-center h-auto w-auto my-4">
      <button type="button" class="btn btn-light mt-3" onclick="CloseAlertLocalidad()">Cerrar</button>
    </div>    
    `;
  } else {
    CloseAlertLocalidad();

    addLocalidad(marcador);
  }
}

/* función que agrega las localidades */

function addLocalidad(marcador) {
  var cartaTiempo = `<div id="d${marcador[0]._icon.id.substring(4)}" class="card c-baliza mt-3 ${marcador[0]._icon.id.substring(4)}">
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

  var itemListaLoc = `<li><div class="dropdown-item container d-flex justify-content-center mx-0 px-0 py-0 position-relative" ><div class="container d-flex justify-content-center"><span class="fs-6 w-auto align-self-center">${
    marcador[1]
  }</span></div><div id="dList${marcador[0]._icon.id.substring(4)}" class="container position-absolute bg-danger w-auto end-0 text-light d-none dCerrar"><span>x</span></div></div></li>
  `;

  $("#dFichasTiempo").append(cartaTiempo);
  $("#ulLocActivas").append(itemListaLoc);

  nowHora(marcador[0]._icon.id.substring(4));
  GetMediciones(marcador[0]._icon.id.substring(4));

  /* obtenemos las clases que tiene, ya que al cambiar el icono las pierde y las necesitamos para el filtrado */

  var classList = $(`#${marcador[0]._icon.id}`).attr("class").split(/\s+/);

  /* cambiamos el icono */

  marcador[0].setIcon(iconMarkerSelect);

  /* eliminamos las clases nuevas */

  $(`#${marcador[0]._icon.id}`).removeClass();

  /* le colocamos las antiguas clases */

  for (var i = 0; i < classList.length; i++) {
    $(`#${marcador[0]._icon.id}`).addClass(classList[i]);
  }

  locActivas++;

  /* reactivando antiguos parámetros */

  var isStored = false;

  aLocalBalizas.forEach((baliza) => {
    if (baliza[0] == marcador[0]._icon.id.substring(4)) {
      isStored = true;

      for (let i = 1; i < baliza.length; i++) {
        if (baliza[i] == true) {
          $(`#d${marcador[0]._icon.id.substring(4)}`)
            .find("ul")
            .children()
            .eq(i + 2)
            .removeClass("d-none");
        } else {
          $(`#d${marcador[0]._icon.id.substring(4)}`)
            .find("ul")
            .children()
            .eq(i + 2)
            .addClass("d-none");
        }
      }
    }
  });

  if (!isStored) {
    aLocalBalizas.push([marcador[0]._icon.id.substring(4), true, true, false]);
    localStorage.Balizas = JSON.stringify(aLocalBalizas);
  }
}

window.tryAddLocalidad = tryAddLocalidad;

/* intervalo que llama a la función para actualizar las balizas cada minuto */

setInterval(listenFichasDatos, 60000);

/* función que observa si hay localidades activas y las actualiza */

function listenFichasDatos() {
  if ($("#dFichasTiempo").find("div.card").length != 0) {
    $("#dFichasTiempo")
      .find(".card")
      .each(function () {
        GetMediciones($(this).attr("id").substring(1));
      });
  }
}

/* Función que recoge los datos de la baliza seleccionada */

function GetMediciones(string) {
  //192.168.0.15
  fetch(`http://10.10.17.109:5000/api/TemporalLocalidades/${string}`)
    .then((response) => response.json())
    .then((aMediciones) => {
      $("#dFichasTiempo").find(`#d${string}`).find("ul").find("#lEstado").find(".iEstado").attr("src", `images/${aMediciones.estado}.png`);
      $("#dFichasTiempo").find(`#d${string}`).find("ul").find("#lTemperatura").find(".px-3").find(".sTemperatura").html(`${aMediciones.temperatura} ºC`);
      $("#dFichasTiempo").find(`#d${string}`).find("ul").find("#lHumedad").find(".px-3").find(".sHumedad").html(`${aMediciones.humedad} %`);
      $("#dFichasTiempo").find(`#d${string}`).find("ul").find("#lViento").find(".px-3").find(".sViento").html(`${aMediciones.velViento} m/s`);
    });
}

/* función que devuelve la hora actual */

function nowHora(localidad) {
  let date = new Date();
  let hh = date.getHours();
  let mm = date.getMinutes();
  let ss = date.getSeconds();

  hh = hh < 10 ? "0" + hh : hh;
  mm = mm < 10 ? "0" + mm : mm;
  ss = ss < 10 ? "0" + ss : ss;

  let hora = hh + ":" + mm + ":" + ss;

  $("#dFichasTiempo").find(`#d${localidad}`).find("ul").find("#lEstado").find(".sHora").html(`${hora}`);
  let t = setTimeout(function () {
    nowHora(localidad);
  }, 125);
}

/* cerrar aviso añadir localidad */

function CloseAlertLocalidad() {
  $("#dAnyadirLoc").remove();
}

window.CloseAlertLocalidad = CloseAlertLocalidad;

/* comportamiendos dinámicos lista localidades */

$("#dLocActivas").on("click", ".dropdown-item", function (e) {
  return false;
});

$("#dLocActivas").on("mouseenter", ".dropdown-item", function () {
  $(this).find(".dCerrar").hide("slide", { direction: "left" }, 1);
  $(this).find(".dCerrar").removeClass("d-none").show("slide", { direction: "right" }, 250);
});

$("#dLocActivas").on("mouseleave", ".dropdown-item", function () {
  $(this).find(".dCerrar").addClass("d-none").hide("slide", { direction: "left" }, 1);
});

/* función dinámica para eliminar las localidades escogidas */

$("#dLocActivas").on("click", ".dCerrar", function () {
  locActivas--;

  var idLocali = $(this).attr("id");
  var height = $("#dFichasTiempo").height();

  idLocali = idLocali.substring(5);

  $(this).closest("li").remove();
  $("#dFichasTiempo")
    .find(`#d${idLocali}`)
    .addClass("position-absolute")
    .animate({ bottom: 0 }, 350)
    .fadeOut({ queue: false })
    .promise()
    .done(function () {
      $("#dFichasTiempo").css("height", 333);
      $(this).remove();
    })
    .promise()
    .done(function () {
      if (!$("#dFichasTiempo").children().length) {

        $("#dFichasTiempo").css("height", "");
      }
    });

  map.eachLayer(function (layer) {
    if ($(layer._icon).attr("id") == `mark${idLocali}`) {
      $(layer._icon).attr("src", "images/marcador.png");
    }
  });

  aLocalBalizas = aLocalBalizas.filter((Baliza) => Baliza[0] !== idLocali);
  localStorage.Balizas = JSON.stringify(aLocalBalizas);
});

/* tooltips imágenes parámetros */

$('[data-toggle="tooltip"]').tooltip();
/* drag & drop */

$("#iTemperatura").draggable({
  containment: "#dDragZone",
  helper: "clone",
  revert: false,
  zIndex: "5000",
});
$("#iHumedad").draggable({
  containment: "#dDragZone",
  helper: "clone",
  revert: false,
  zIndex: "5000",
});
$("#iViento").draggable({
  containment: "#dDragZone",
  helper: "clone",
  revert: false,
  zIndex: "5000",
});

$("#dFichasTiempo").on("DOMNodeInserted", ".c-baliza", function () {
  $(this).droppable({
    drop: function (event, ui) {
      let parametro = ui.draggable.attr("id");

      switch (parametro) {
        case "iTemperatura":
          $(this).find("ul").find("#lTemperatura").removeClass("d-none");

          /* guardando el dato en localstorage */

          aLocalBalizas.forEach((baliza) => {
            if (baliza[0] == $(this).attr("id").substring(1)) {
              baliza[1] = true;
            }
          });

          break;
        case "iHumedad":
          $(this).find("ul").find("#lHumedad").removeClass("d-none");

          /* guardando el dato en localstorage */

          aLocalBalizas.forEach((baliza) => {
            if (baliza[0] == $(this).attr("id").substring(1)) {
              baliza[2] = true;
            }
          });

          break;
        case "iViento":
          $(this).find("ul").find("#lViento").removeClass("d-none");

          /* guardando el dato en localstorage */

          aLocalBalizas.forEach((baliza) => {
            if (baliza[0] == $(this).attr("id").substring(1)) {
              baliza[3] = true;
            }
          });

          break;
      }
      localStorage.Balizas = JSON.stringify(aLocalBalizas);
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

      /* guardando el dato en localstorage */

      aLocalBalizas.forEach((baliza) => {
        if (baliza[0] == $(this).parent().parent().parent().attr("id").substring(1)) {
          switch ($(this).parent().attr("id")) {
            case "lTemperatura":
              baliza[1] = false;
              break;

            case "lHumedad":
              baliza[2] = false;
              break;

            case "lViento":
              baliza[3] = false;
              break;
          }
        }
      });

      localStorage.Balizas = JSON.stringify(aLocalBalizas);
    });
});

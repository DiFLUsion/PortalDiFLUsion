require([
  "esri/Map",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/widgets/TimeSlider",
  "esri/geometry/Extent",
  "esri/request",
  "esri/symbols/SimpleFillSymbol",
  "esri/renderers/SimpleRenderer",
  "esri/widgets/TimeSlider/TimeSliderViewModel",
  "esri/widgets/Expand",
  "esri/widgets/Legend",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Home",
  "esri/widgets/ScaleBar",
  "esri/widgets/Search",
  "esri/Graphic"
],

function(Map,
    MapView, //Solo si uso el 2D
    SceneView,
    FeatureLayer,
    TimeSlider,
    Extent,
    esriRequest,
    SimpleFillSymbol,
    SimpleRenderer,
    TimeSliderVM,
    Expand,
    Legend,
    BasemapGallery,
    Home,
    ScaleBar,
    Search,
    Graphic
) {



/***********************************************
 *         MOSTRAR CAMPOS DE LAS LAYERS
 ***********************************************/



// var query = featureLayerBrotes.createQuery();
// query.returnGeometry = false;
// query.outFields = ["*"];

// featureLayerBrotes.queryFeatures(query).then(function(result) {
//   console.log(result.fields);
// });








  // Crear el mapa y la vista de escena
  var map = new Map({
    basemap: "dark-gray-vector", // Basemap actualizado
    ground: "world-elevation"
  });

// Create the SceneView and set initial camera
  const view = new SceneView({
    container: "viewDiv",
    map: map,
    camera: {
      position: {
        latitude: 40.5,
        longitude: -3.7,
        z: 3500000
      },
      tilt: 0,
      heading: 1
    },


    highlightOptions: {
      color: "cyan"
    }
  });


// VISOR EN 2D
// const view = new MapView({
//   container: "viewDiv",
//   map: map,
//   zoom: 5, // Ajusta el zoom para un nivel adecuado de detalle
//   center: [-3.7038, 40.4168] // Coordenadas de Madrid, España (longitud, latitud)
// });




/***********************************************
 *              SIMBOLOGIA BROTES
 ***********************************************/

const colorsBrotes = [[255, 255, 0, 0.6], [255, 255, 255, 0.6], [255, 127, 127, 0.6]];

const commonPropertiesBrotes = {
  type: "simple-marker",
  size: "10px",
  style: "circle",
  outline: null,
};

const CaptiveSym = {
  ...commonPropertiesBrotes,
  color: colorsBrotes[0]
};

const DomesticSym = {
  ...commonPropertiesBrotes,
  color: colorsBrotes[1]
};

const WildSym = {
  ...commonPropertiesBrotes,
  color: colorsBrotes[2]
}



const brotesRenderer = {
  type: "unique-value",
  legendOptions: {
    title: "Especies"
  },
  field: "is_wild",

  uniqueValueInfos: [
    {
      value: "Wild",
      symbol: WildSym,
      label: "Wild"
    },
    {
      value: "Domestic",
      symbol: DomesticSym,
      label: "Domestic"
    },
    {
      value: "Captive",
      symbol: CaptiveSym,
      label: "Captive"
    }
  ]
};


/***********************************************
 *      SIMBOLOGIA ALERTAS - COMARCAS
 ***********************************************/
const transparentRenderer = {
  type: "simple",  // Aplicar un renderizado simple
  symbol: {
    type: "polygon-3d",  // Polígonos en 3D
    symbolLayers: [{
      type: "fill",  // Tipo de relleno
      material: { color: [0, 0, 0, 0] },  // Transparente
      outline: { color: [237, 237, 237, 0.5] }  // Sin contorno
    }]
  }
};

  // Función para obtener el color basado en el valor de alerta
  function getColorBasedOnAlert(alerta) {
    alerta = alerta.trim();
        // Verificar el valor de alerta
    if (alerta === "A5") {
        return "#d73027"; // Rojo oscuro
    } else if (alerta === "A4") {
        return "#fc8d59"; // Rojo claro
    } else if (alerta === "A3") {
        return "#fee08b"; // Amarillo
    } else if (alerta === "A2") {
        return "#d9ef8b"; // Amarillo verdoso
    } else if (alerta === "A1") {
        return "#91cf60"; // Verde claro
    } else if (alerta === "A0" || alerta === "NO ALERTA") {
        return [0, 0, 0, 0]; // Transparente
    } else {
        return [0, 0, 0, 0]; // Transparente
    }
  }

// El resto de la simbología (type = polígono pintado etc.) aparece más abajo



/***********************************************
 *              SIMBOLOGIA RUTAS
 ***********************************************/



var lineSymbolMigrations = {
  type: "line-3d",
  symbolLayers: [{
      type: "line",
      material: { color: [237, 237, 237, 0.3] },
      size: 0.3
    }]
};


var rendererMigrations = new SimpleRenderer({

  symbol: lineSymbolMigrations

});







/***********************************************
 *              CAPA BROTES
 ***********************************************/
let layerViewBrotes;
const featureLayerBrotes = new FeatureLayer({
  url: "https://gis.inia.es/server/rest/services/CISA/brotes_IA_sql/MapServer/0",
  copyright: "Grupo de Epidemiología y Sanidad Ambiental (EYSA) - CISA/INIA/CSIC",
  title: "Brotes",
  outFields: ['*'],
  returnGeometry: false,
  visible: true,
  timeInfo: {
    startField: "report_date",
    interval: {
      unit: "months",
      value: 1
    }
  },
  renderer: brotesRenderer,



  popupTemplate: {
    title: "Pais: {country}",
    content: getInfoBrotes,
    visible: false,
    returnGeometry: true,
    fieldInfos: [
      {
        fieldName: 'reporting_date',
        format: {
          dateFormat: 'short-date'
        }
      }
    ],
  },
});


function getInfoBrotes(feature) {
  content = "<p>Fuente: <b>{diagnosis_source}</b> " +
    "<ul><li>Localización: {city}, {country}.</li>" +
    "<li>Fecha del reporte: {report_date}.</li>" +
    "<li>Fecha del observación: {observation_date}.</li>" +
    "<li>Especie: {species}.</li>" +
    "<li>Serotipo: {serotype}.</li>" +
    "<li>Más información: <a href='http://empres-i.fao.org/eipws3g/2/obd?idOutbreak={event_id}'> Enlace</a></li>";

  return content;

}
/***********************************************
 *              CAPA COMARCAS
 ***********************************************/

  var featureLayerComarcas = new FeatureLayer({
      url: "https://services-eu1.arcgis.com/WCEIifo5j3luTcRc/arcgis/rest/services/cisa_gis_OWNER_CISA_ComarcasGanaderas_prov/FeatureServer/0",
      outFields: ["*"],

      // popupTemplate: {
      //   title: "Comarca: {ComarcasGanaderas_com_sgsa_n}" +
      //   "<br> " +
      //   "<br>Provincia: {provincias_rotulo}",
      //   content: getInfoComarcas,
      //   visible: false,
      //   returnGeometry: true,

      // },
  });


/***********************************************
 *              CAPA RUTAS
 ***********************************************/


const featureLayerRutas = new FeatureLayer({
  url: "https://services-eu1.arcgis.com/WCEIifo5j3luTcRc/arcgis/rest/services/anillamientos_EU/FeatureServer/0",
  copyright: "CISA-INIA-CSIC",
  title: "Movements",
  outFields: ["*"],
  renderer: rendererMigrations,
  popupTemplate: {
    title: "Specie: {Especie }",
    content: [
        {
            type: "fields",
            fieldInfos: [
                {
                    fieldName: "ID_RUTA",
                    label: "ID RUTA",
                    visible: true
                },
            {
                fieldName: "NAME_A",
                label: "Location Europe",
                visible: true
            },

            {
              fieldName: "CNTR_A",
              label: "Country Europe",
              visible: true
          },

          {
            fieldName: "com_sgsa_n",
            label: "Comarca España",
            visible: true
        },
            ]
        }
    ]
  },
  visible: false,
  availableFields: true,

});


const currentElevationInfo = {
  mode: "on-the-ground"}

featureLayerRutas.elevationInfo = currentElevationInfo;



/***********************************************
 *          CARGO LAS RUTAS ACTIVADAS
 ***********************************************/
/***********************************************
 *          PARSEO DEL CSV
 ***********************************************/


 /*************  CSV ALERTAS  **********************/

 function parseCSV(csvText) {
  const rows = csvText.split("\n").map(row => row.trim()); // Eliminar espacios innecesarios
  const headers = rows[0].split(";").map(header => header.trim()); // Obtener los encabezados y eliminar espacios

  // Mapear los encabezados a los índices que necesitamos
  const indexId = headers.indexOf("comarca_sg");
  const indexFecha = headers.indexOf("date");
  const indexAlerta = headers.indexOf("riesgo");
  const indexValor = headers.indexOf("valor");
  const indexNumeracion = headers.indexOf("numeracion");
  const indexIdA = headers.indexOf("idA");

  return rows.slice(1).map(row => {
      const columns = row.split(";").map(item => item.trim()); // Dividir por punto y coma
      return {
          comarca_sg: columns[indexId],
          fecha: new Date(columns[indexFecha]),
          alerta: columns[indexAlerta],
          valor: columns[indexValor],
          numeracion: columns[indexNumeracion],
          IdA: columns[indexIdA]
      };
  });
};

/*************  Parseo las rutas activadas  **********************/

function parseCSVrutas(csvRUTAS) {
  const rows = csvRUTAS.split("\n").map(row => row.trim()); // Eliminar espacios innecesarios
  const headers = rows[0].split(";").map(header => header.trim()); // Obtener los encabezados y eliminar espacios

  // Mapear los encabezados a los índices que necesitamos

  const indexIdArutas = headers.indexOf("idA");
  const indexIdRuta = headers.indexOf("idRuta");
  return rows.slice(1).map(row => {
      const columns = row.split(";").map(item => item.trim()); // Dividir por punto y coma
      return {
          IdArutas: columns[indexIdArutas],
          IdRuta: columns[indexIdRuta]

      };
  });
};

/*************  Cargo las rutas activadas  **********************/

// Función para cargar el CSV de rutas activadas
function cargarCsvRutas() {
  return esriRequest("js/data/a.rutas_todas2.csv", {
    responseType: "text"
  }).then(function(response) {
    console.log("CSV de rutas cargado con éxito.");
    return parseCSVrutas(response.data); // Devolver el resultado del CSV parseado
  }).catch(function(error) {
    console.error("Error al cargar el archivo CSV de rutas:", error);
  });
}

// Función para cargar el CSV de alertas
function cargarCsvAlertas() {
  return esriRequest("https://sgaicsic.maps.arcgis.com/sharing/rest/content/items/435bfed5528d49f987330765de7a4ee4/data", {
    responseType: "text"
  }).then(function(response) {
    console.log("CSV de alertas cargado con éxito.");
    return parseCSV(response.data); // Devolver el resultado del CSV parseado
  }).catch(function(error) {
    console.error("Error al cargar el archivo CSV de alertas:", error);
  });
}

// Función principal para cargar ambos CSVs
  async function cargarDatos() {
  try {
    const [csvDataRutas, csvData] = await Promise.all([cargarCsvRutas(), cargarCsvAlertas()]);
    console.log("Rutas y alertas cargadas correctamente.");
    // Aquí csvDataRutas y csvData contienen los datos de rutas y alertas cargados y parseados
    inicializarAplicacion(csvDataRutas, csvData);
  } catch (error) {
    console.error("Error al cargar los datos:", error);
  }

};



/*************  INICIALIZAR APLICACIÓN  **********************/
const currentDate = new Date(); // Fecha actual
const sundayOfCurrentWeek = new Date(currentDate.setDate(currentDate.getDate() + (7 - currentDate.getDay())));
// Función para inicializar la aplicación después de cargar las rutas y alertas
function inicializarAplicacion(csvDataRutas, csvData) {

/***********************************************
 *             VARIABLES TIMESLIDER ALERTAS
 ***********************************************/

  // Obtener el elemento del mensaje de alertas
  const alertMessageElement = document.getElementById('alertMessage');


  // Dejo que los timeslider terminen (marcador de la derecha) en el domingo de la semana en la que estamos




    let startAlertas = new Date(sundayOfCurrentWeek);
    startAlertas.setFullYear(startAlertas.getFullYear() - 1); // Ahora es 19 de agosto de 2023

    // Ahora ajustamos startAlertas para que sea el siguiente lunes
    const dayOfWeek = startAlertas.getDay(); // Obtiene el día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)

    // Si el día no es lunes (1), calculamos la diferencia para llegar al siguiente lunes
    const daysUntilNextMonday = (8 - dayOfWeek) % 7;
    startAlertas.setDate(startAlertas.getDate() + daysUntilNextMonday);

// Función para obtener el lunes de la semana actual
function getMondayOfCurrentWeek() {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay(); // Día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
  const difference = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Si es domingo, retroceder a lunes
  currentDate.setDate(currentDate.getDate() - difference); // Restar la diferencia para obtener el lunes
  return currentDate; // Devolver la fecha del lunes
}

// Crear y configurar el TimeSlider para que se inicie en el lunes de la semana actual
var timeSliderAlertas = new TimeSlider({
  container: "timeSliderAlertas",
  mode: "instant", // Selecciona una fecha a la vez
  fullTimeExtent: {
    start: startAlertas,  // Extensión completa de tiempo
    end: sundayOfCurrentWeek // Hasta el domingo de la semana actual
  },
  stops: {
    interval: {
      value: 7,
      unit: "days"
    }
  }
});

view.ui.add(timeSliderAlertas, "manual");

// Configurar el timeExtent predeterminado para que comience el lunes de la semana actual
const mondayOfCurrentWeek = getMondayOfCurrentWeek(); // Obtener el lunes actual
timeSliderAlertas.timeExtent = {
  start: mondayOfCurrentWeek,
  end: mondayOfCurrentWeek // Al ser "instant", usamos el mismo valor para el inicio y el fin
};


let globalSelectedDate = null;

// Aplicar el filtro de comarcas al iniciar el visor
view.whenLayerView(featureLayerComarcas).then(function(layerViewComarcas) {
  // Asegurarse de que la capa esté completamente cargada
  featureLayerComarcas.when(() => {
    const selectedDate = timeSliderAlertas.timeExtent.end;
    globalSelectedDate = timeSliderAlertas.timeExtent.end;
    // Filtrar el CSV para obtener los elementos correspondientes a la fecha seleccionada
    const filteredData = csvData.filter(row => {
      return new Date(row.fecha).toDateString() === selectedDate.toDateString();
    });


    const formattedDate = selectedDate.toLocaleDateString('es-ES', {
      weekday: 'long', // día de la semana (opcional)
      year: 'numeric', // año completo
      month: 'long', // mes completo
      day: 'numeric' // día del mes
    });


    // Si hay datos correspondientes a esa fecha, actualizar simbología
    if (filteredData.length > 0) {
      updateLayerSymbology(filteredData);

      alertMessageElement.innerHTML = `Mostrando alertas disponibles para el ${formattedDate}`;
    } else {
      // No hay datos, se pintan todas las comarcas en transparente
      featureLayerComarcas.renderer = transparentRenderer;

      // Forzar una actualización de la vista para asegurar que el renderer se aplique
      featureLayerComarcas.refresh();
      alertMessageElement.innerHTML = `No hay alertas disponibles para el ${formattedDate}`;
    }
  });

      // Después de definir la función, asignar el popupTemplate a la capa de comarcas
      featureLayerComarcas.popupTemplate = {
        title: "Comarca: {ComarcasGanaderas_com_sgsa_n}",
        content: function(feature) {
          return getInfoComarcas(feature, globalSelectedDate); // Pasar selectedDate como argumento
        }
      };
});

// Actualizar la simbología con los datos del CSV para la semana seleccionada al iniciar
timeSliderAlertas.watch("timeExtent", function(timeExtent) {
  const selectedDate = timeSliderAlertas.timeExtent.end;
  globalSelectedDate = timeSliderAlertas.timeExtent.end;

  // Filtrar el CSV para obtener los elementos correspondientes a la fecha seleccionada
  const filteredData = csvData.filter(row => {
    return new Date(row.fecha).toDateString() === selectedDate.toDateString();
  });


  const formattedDate = selectedDate.toLocaleDateString('es-ES', {
    weekday: 'long', // día de la semana (opcional)
    year: 'numeric', // año completo
    month: 'long', // mes completo
    day: 'numeric' // día del mes
  });



  // Si hay datos correspondientes a esa fecha, actualizar simbología
  if (filteredData.length > 0) {
    updateLayerSymbology(filteredData);
    alertMessageElement.innerHTML = `Mostrando alertas disponibles para el ${formattedDate}`;
  } else {
     // No hay datos, se pintan todas las comarcas en transparente


    // Asignar el renderer transparente a la capa de comarcas
    featureLayerComarcas.renderer = transparentRenderer;
    alertMessageElement.innerHTML = `No hay alertas disponibles para el ${formattedDate}`;
  };


        // Después de definir la función, asignar el popupTemplate a la capa de comarcas
        featureLayerComarcas.popupTemplate = {
          title: "Comarca: {ComarcasGanaderas_com_sgsa_n}",
          content: function(feature) {
            return getInfoComarcas(feature, globalSelectedDate); // Pasar selectedDate como argumento
          }
        };


});


/***********************************************
 *          POPUP - COMARCAS
 ***********************************************/



    function getInfoComarcas(feature, selectedDate) {
      var graphic, attributes;

      graphic = feature.graphic;
      attributes = graphic.attributes;
      comarcaId = attributes.ComarcasGanaderas_comarca_sg


      /*************  CARGA RUTAS **********************/
      var urlRutas = 'https://raw.githubusercontent.com/DFS2Capa/Formas/main/anillamientos_EU.geojson';
      var request = new XMLHttpRequest();
      request.open("GET", urlRutas, false);
      request.send(null);
      let rutas = JSON.parse(request.responseText);






      /*************  CARGA ALERTAS -- POPUP **********************/


      // Filtrar el CSV
      const filteredDataAux = csvData.filter(row => {
        // Comparar la fecha del CSV con la fecha seleccionada
        const rowDate = new Date(row.fecha).toDateString();

        const selectedDateStr = new Date(selectedDate).toDateString(); // Convertir selectedDate a string
        // Verificar si la fecha y la comarca coinciden
        return rowDate === selectedDateStr && row.comarca_sg === comarcaId;
      });

        let csvInfo = "";
        if (filteredDataAux.length > 0) {
          const data = filteredDataAux[0];
          csvInfo = `
            <ul>
              <li><b>Riesgo:</b> ${data.alerta}</li>
              <li><b>Valor:</b> ${data.valor}</li>
              <li><b>Fecha:</b> ${new Date(data.fecha).toLocaleDateString()}</li>
            </ul>
          `;
        } else {
          csvInfo = "<p>No hay datos de alertas disponibles para esta comarca en la fecha seleccionada.</p>";
        };



     // Filtrar el CSV de rutas por IDA

     const IDALERTA = filteredDataAux[0].IdA;

     const RutasFiltradas = csvDataRutas.filter(row => {

      return row.IdArutas === IDALERTA;
    });



// Extraer solo los valores de 'IdRuta' y quitar vacíos

    const listaIdRutas = RutasFiltradas.map(ruta => ruta.IdRuta).filter(idRuta => idRuta);

  // Eliminar duplicados de IdRuta

  const listaDeIdRutasUnicas = [...new Set(listaIdRutas)];

  console.log('Rutas que han activado la comarca:', listaDeIdRutasUnicas)


        for (let index = 0; index < rutas.features.length; index++) {
          const element = rutas.features[index];
          // Condicional de misma comarca ganadera
          // element.properties.idComarca == attributes.ComarcasGanaderas_comarca_sg &&
          // Condicional de que el id de Ruta del archivo de todas rutas esté en las rutas
          // que han activado la comarca
           if ( listaDeIdRutasUnicas.includes(element.properties.idRuta)) {
            var polyline = {
              type: "polyline",
              paths: element.geometry.coordinates
            };
            var lineSymbol = {
              type: "simple-line",
              color: [51, 200, 200],
              width: 1
            };
            var polylineGraphic = new Graphic({
              geometry: polyline,
              symbol: lineSymbol,
              popupTemplate: {
                title: "Especie: " + element.properties.NombreEspecie,
                content: `<li>Location Europe: ${element.properties.NombreOrigen}
                          <li>Country Europe: ${element.properties.PaisOrigen}
                          <li>Spanish Livestock region: ${element.properties.NombreComarca}
                          ${csvInfo}`,
                visible: false,
                returnGeometry: true
              },
            });
            view.graphics.add(polylineGraphic);
          }
        }

        view.on("hold", function (e) {
          view.graphics.removeAll(polylineGraphic);
          console.log("Remove");
        });

        return csvInfo;

    };









/***********************************************
 *    ACTUALIZAR SIMBOLOGÍA DE LAS COMARCAS
 ***********************************************/



// Función para actualizar la simbología en la capa
function updateLayerSymbology(data) {
  const uniqueValues = data.map(function(element) {
      return {
          value: element.comarca_sg,  // Campo que relaciona el CSV con los polígonos en la capa
          symbol: {
              type: "polygon-3d",  // Símbolo 3D para polígonos
              symbolLayers: [{
                  type: "fill",  // Tipo de relleno
                  material: {color: getColorBasedOnAlert(element.alerta)},  // Color basado en alerta
                  outline: { color: "grey" }  // Contorno
              }]
          }
      };
  });


  const ComarcaRenderer = {

    type: "unique-value",
    field: "ComarcasGanaderas_comarca_sg",
    uniqueValueInfos: uniqueValues,

};

  // Asignar el renderer a la capa
  featureLayerComarcas.renderer = ComarcaRenderer;
}








/***********************************************
 *          BOTÓN FILTRO DE ALERTAS
 ***********************************************/




   // Función para aplicar el filtro basado en el nivel de riesgo seleccionado
    function filterByRiesgo(event) {
    const selectedRiesgo = event.target.getAttribute("data-Riesgo");

    // Filtrar la capa de comarcas ganaderas según el nivel de riesgo seleccionado
    const filteredComarcas = csvData.filter(row => {
      return row.alerta === selectedRiesgo && new Date(row.fecha).toDateString() === globalSelectedDate.toDateString();

    });

    // Actualizar la simbología de la capa de comarcas con las comarcas filtradas
    updateLayerSymbology(filteredComarcas);


}

// Obtener el elemento del filtro de Riesgos después de cargar el DOM
const RiesgosElement = document.getElementById("Riesgos-filter");

// Verifica que el elemento exista
if (RiesgosElement) {
    // Manejar el evento de click en el filtro
    RiesgosElement.addEventListener("click", filterByRiesgo);
} else {
    console.error("No se encontró el elemento con ID 'Riesgos-filter'.");
}





    // set up UI items
    RiesgosElement.style.visibility = "visible";
    const RiesgosExpand = new Expand({
      view: view,
      expandTooltip: "Nivel de riesgo",
      content: RiesgosElement,
      expandIconClass: "esri-icon-filter",
      group: "top-right"
    });

    // clear the filters when user closes the expand widget
    RiesgosExpand.watch("expanded", () => {
      if (!RiesgosExpand.expanded) {
        console.log('Filtro cerrado')
        const filteredComarcas = csvData.filter(row => {
          return new Date(row.fecha).toDateString() === globalSelectedDate.toDateString();

        });
        updateLayerSymbology(filteredComarcas);
      }
    });


    view.ui.add(RiesgosExpand, "top-right");










}; //Cierra la funcion inicizalizarAplicacion

  /***********************************************
 *              TIMESLIDER BROTES
 ***********************************************/



   // Aquí ya empiezo con el timeslider

  const timeSliderBrotes = new TimeSlider({
    container: "timeSliderBrotes",
    playRate: 100,
    mode: "time-window",
    stops: {
      interval: {
        value: 1,
        unit: "weeks"
      }
    }
  });

  view.ui.add(timeSliderBrotes, "manual");


  // Configuración del rango de tiempo para brotes al iniciar el visor
view.whenLayerView(featureLayerBrotes).then(function (layerViewBrotes) {
  const startBrotes = new Date(2022, 0, 1); // Fecha de inicio para brotes

  timeSliderBrotes.fullTimeExtent = {
    start: startBrotes,
    end: sundayOfCurrentWeek
  };

  // Configurar el intervalo de tiempo predeterminado para mostrar los brotes de las últimas semanas
  const endBrotes = new Date(sundayOfCurrentWeek);
  endBrotes.setDate(endBrotes.getDate() - 91); // Mostrar la última semana por defecto

  timeSliderBrotes.timeExtent = {
    start: endBrotes,
    end: sundayOfCurrentWeek
  };

  // Filtrar los brotes para la semana predeterminada
  featureLayerBrotes.definitionExpression = `report_date >= '${endBrotes.toISOString()}' AND report_date <= '${sundayOfCurrentWeek.toISOString()}'`;

  // Observar el cambio en el rango de tiempo y actualizar el filtro de brotes
  timeSliderBrotes.watch("timeExtent", function (value) {
    featureLayerBrotes.definitionExpression = `report_date >= '${value.start.toISOString()}' AND report_date <= '${value.end.toISOString()}'`;
  });
});



cargarDatos();
/***********************************************
 *              CARGO CAPAS AL MAPA
 ***********************************************/
map.add(featureLayerBrotes);
map.add(featureLayerComarcas);
map.add(featureLayerRutas);







/***********************************************
 *              BOTÓN TODAS RUTAS
 ***********************************************/


window.onload = function () {
  document.getElementById("migrations").addEventListener("click", activarMigrations);

  view.ui.add(migrations, "top-right");

}


function activarMigrations(feature) {
  if (featureLayerRutas.visible === false) {
    return featureLayerRutas.visible = true;
  } else {
    return featureLayerRutas.visible = false;
  }

}








/***********************************************
 *              RESTO DE WIDGETS
 ***********************************************/


  // Agregar la leyenda

  var legendExpand = new Expand({
    view: view, // La vista del mapa
    content: document.getElementById("customLegend"), // El contenido de la leyenda personalizada
    expandIconClass: "esri-icon-legend", // Ícono de leyenda para el botón de expansión
    expandTooltip: "Leyenda", // Texto que aparece al pasar el cursor
    expanded: false // Se inicia contraído
  });



  // SCALEBAR

  var scaleBar = new ScaleBar({
    view: view,
    unit: "metric",
    estilo: "line",
  });



  /// SEARCH WIDGET
  var searchWidget = new Search({
    view: view
  });


  /// WIDGET DE MAPAS BASES

  var basemapGallery = new BasemapGallery({
    view: view,
    container: document.createElement("div")
  });

  /// Info App Web

  const infoExpand = new Expand({
    collapsedIconClass: "esri-icon-description",
    expandIconClass: "esri-icon-description",
    expandTooltip: "Info App Web",
    view: view,
    content: info,
    expanded: false
  });


  /// BASEMAP GALLERY

  var bgExpand = new Expand({
    collapsedIconClass: "esri-icon-basemap",
    expandIconClass: "esri-icon-basemap",
    expandTooltip: "Mapas",
    content: basemapGallery,
    view: view
  });

  // close the expand whenever a basemap is selected
  basemapGallery.watch("activeBasemap", function () {
    var mobileSize =
      view.heightBreakpoint === "xsmall" ||
      view.widthBreakpoint === "xsmall";

    if (mobileSize) {
      bgExpand.collapse();
    }
  });

    /// WIDGET DE HOME PARA LA VISTA INICIAL
    var homeBtn = new Home({
      view: view,

    });



    /// AÑADE TODOS LOS WIDGET

    // Widget de mapa a la izquierda y widget de procesmiento a la derecha



  view.ui.add(searchWidget, "top-right");
  view.ui.add(legendExpand, "top-right");
  view.ui.add(infoExpand, "top-right");
// El widget FILTRO DE RIESGOS  tiene que ir dentro del entorno en el que se define

  // view.ui.add(scaleBar, "bottom-right");

  view.ui.move("zoom", "top-left");
  view.ui.move("compass", "top-left");
  view.ui.move("navigation-toggle", "top-left");
  view.ui.add(bgExpand, "top-left");
  view.ui.add(homeBtn, "top-left");







/***********************************************
 *         FINAL DEL CÓDIGO OBLIGATORIO !!!!!
 ***********************************************/

  }); // LLAVES DEL FIN DEL CODIGO





/***********************************************
 *        BOTONES OCULTAR TIMESLIDER
 ***********************************************/

// Estos botones tienen que ir fuera de la llave del final del código (no sé por qué)

// /BOTÓN DE BROTES
$("#myButtonBrotes").remove();

function ShowHideTimeSliderBrotes() {
  let text = " ";

  if ($("#myButtonBrotes").text() === 'Brotes') {
    $("#timeSliderBrotes").show();
    text = '<i class="esri-icon-non-visible" ></i>';
  }
  else {
    $("#timeSliderBrotes").hide();
    text = 'Brotes';
  }
  $("#myButtonBrotes").html(text);
}

// / BOTÓN DE ALERTAS
$("#timeSliderAlertas").remove();

function ShowHideTimeSliderAlertas() {
  let text = " ";

  if ($("#myButtonAlerta").text() === "Alertas") {
    $("#timeSliderAlertas").show();
    text = '<i class="esri-icon-non-visible" ></i>';
  }
  else {
    $("#timeSliderAlertas").hide();
    text = "Alertas";
  }
  $("#myButtonAlerta").html(text);
}

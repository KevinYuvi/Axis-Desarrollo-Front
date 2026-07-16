// Generador del mapa de ubicación con Leaflet (OpenStreetMap) para renderizar
// dentro de un WebView. Es la misma lógica que usaba la sección de aulas
// (RutaClaseScreen): se extrajo aquí para reutilizarla también en la sección
// de bibliotecas sin duplicar código.

/**
 * Construye el documento HTML de un mapa Leaflet con el destino marcado en
 * rojo y, si se conoce, la ubicación actual del usuario en azul unida por
 * una línea punteada.
 * @param {Object} params
 * @param {{latitude: number, longitude: number}|null} params.origen - Ubicación actual del usuario (opcional)
 * @param {{latitude: number, longitude: number}} params.destino - Coordenadas del lugar de destino
 * @param {string} params.nombreDestino - Título del popup del destino
 * @param {string} params.descripcionDestino - Texto secundario del popup del destino
 * @returns {string} HTML listo para usar como source de un WebView
 */
export function construirMapaHtml({ origen, destino, nombreDestino, descripcionDestino }) {
    const centerLat = origen?.latitude || destino.latitude;
    const centerLng = origen?.longitude || destino.longitude;

    const origenJs = origen
        ? `{ lat: ${origen.latitude}, lng: ${origen.longitude} }`
        : 'null';

    const nombreSeguro = limpiarTextoHtml(nombreDestino);
    const descripcionSegura = limpiarTextoHtml(descripcionDestino);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background: #F8FAFC;
    }

    .leaflet-control-attribution {
      font-size: 10px;
    }

    .popup-title {
      font-weight: 700;
      font-size: 14px;
      color: #111827;
      margin-bottom: 2px;
    }

    .popup-text {
      font-size: 12px;
      color: #4B5563;
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script>
    const destino = {
      lat: ${destino.latitude},
      lng: ${destino.longitude}
    };

    const origen = ${origenJs};

    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([${centerLat}, ${centerLng}], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const destinoIcon = L.divIcon({
      html: '<div style="width:22px;height:22px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35);"></div>',
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const origenIcon = L.divIcon({
      html: '<div style="width:20px;height:20px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35);"></div>',
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const destinoMarker = L.marker([destino.lat, destino.lng], {
      icon: destinoIcon
    }).addTo(map);

    destinoMarker.bindPopup(
      '<div class="popup-title">${nombreSeguro}</div>' +
      '<div class="popup-text">${descripcionSegura}</div>'
    );

    if (origen) {
      const origenMarker = L.marker([origen.lat, origen.lng], {
        icon: origenIcon
      }).addTo(map);

      origenMarker.bindPopup(
        '<div class="popup-title">Tu ubicación</div>' +
        '<div class="popup-text">Punto aproximado actual</div>'
      );

      const polyline = L.polyline(
        [
          [origen.lat, origen.lng],
          [destino.lat, destino.lng]
        ],
        {
          color: '#2563EB',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8'
        }
      ).addTo(map);

      map.fitBounds(polyline.getBounds(), {
        padding: [40, 40]
      });
    } else {
      map.setView([destino.lat, destino.lng], 18);
      destinoMarker.openPopup();
    }
  </script>
</body>
</html>
`;
}

/**
 * Escapa caracteres especiales de HTML para insertar texto de forma segura
 * dentro de los popups del mapa.
 * @param {string} texto - Texto libre a sanitizar
 * @returns {string} Texto seguro para HTML
 */
function limpiarTextoHtml(texto) {
    return String(texto || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

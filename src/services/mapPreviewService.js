import { leafletJs, leafletCss } from "../vendor/leafletAssets";
import { validCoordinates, validLocation } from "../utils/validation";

export function mapPreviewHtml(start, destination, coordinates) {
  if (
    !validLocation(start) ||
    !validLocation(destination) ||
    !validCoordinates(coordinates)
  )
    throw new Error("Invalid map preview coordinates.");
  const data = JSON.stringify({
    start: [start.lat, start.lon],
    destination: [destination.lat, destination.lon],
    coordinates,
  });
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${leafletCss}\nhtml,body,#map{height:100%;margin:0;padding:0;background:#edf2ef}</style></head><body><div id="map"></div><script>${leafletJs}</script><script>
    const started = Date.now();
    function notify(type) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({type,elapsedMs:Date.now()-started})); }
    try {
      const data = ${data};
      const map = L.map('map', { preferCanvas: true });
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, updateWhenIdle: true, keepBuffer: 1,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      });
      let tileErrors = false;
      tiles.on('loading', () => { tileErrors = false; notify('tiles-loading'); });
      tiles.on('tileerror', () => { tileErrors = true; notify('tiles-error'); });
      tiles.on('load', () => { notify(tileErrors ? 'tiles-error' : 'tiles-ready'); });
      tiles.addTo(map);
      L.circleMarker(data.start, {radius:7,color:'#14634b',fillColor:'#fff',fillOpacity:1,weight:3}).addTo(map).bindPopup('Start');
      L.circleMarker(data.destination, {radius:7,color:'#974329',fillColor:'#fff',fillOpacity:1,weight:3}).addTo(map).bindPopup('Destination');
      const line = L.polyline(data.coordinates, {color:'#14634b',weight:4}).addTo(map);
      map.fitBounds(line.getBounds(), {padding:[25,25]});
      notify('map-ready');
    } catch (_) { notify('map-error'); }
  </script></body></html>`;
}

import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import colors from "../theme/colors";

export default function MapViewWeb({ start, destination, routeCoordinates }) {
  if (!start || !destination || !routeCoordinates?.length) {
    return null;
  }

  const routeJson = JSON.stringify(routeCoordinates);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script>
          const route = ${routeJson};

          const map = L.map('map');

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          const start = [${start.lat}, ${start.lon}];
          const destination = [${destination.lat}, ${destination.lon}];

          L.marker(start).addTo(map).bindPopup('Start');
          L.marker(destination).addTo(map).bindPopup('Destination');

          const polyline = L.polyline(route, {
            color: '#1B5E20',
            weight: 5
          }).addTo(map);

          map.fitBounds(polyline.getBounds(), {
            padding: [30, 30]
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView originWhitelist={["*"]} source={{ html }} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 10,
  },
  webview: {
    flex: 1,
  },
});
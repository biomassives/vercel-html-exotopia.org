// PM2.5 overlay
const pm25Bounds = [[35.6, -115.8], [36.8, -114.3]];
L.imageOverlay('overlays/pm25-lasvegas.png', pm25Bounds, {
  opacity: 0.5,
  interactive: false
}).addTo(map);

// Ozone overlay
L.imageOverlay('overlays/ozone-lasvegas.png', pm25Bounds, {
  opacity: 0.5,
  interactive: false
}).addTo(map);

const map = L.map('map').setView([43.232, -78.206], 8);

// Base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// PM2.5 image overlay from Earth.Nullschool screenshot (manually exported)
const pm25Bounds = [[42.0, -80.5], [44.5, -75.5]]; // approx bounds around Buffalo, NY
const pm25Overlay = L.imageOverlay('overlays/pm25-overlay.png', pm25Bounds, {
  opacity: 0.5,
  interactive: false
}).addTo(map);

// County boundaries (GeoJSON)
fetch('https://raw.githubusercontent.com/deldersveld/topojson/master/countries/us-states/NY-36-new-york-counties.json')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: "#ff6600", weight: 1 }
    }).addTo(map);
  });

// Simple river lines (can be upgraded with Natural Earth data)
fetch('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/buffalo.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: "blue", weight: 0.5 }
    }).addTo(map);
  });

// Town markers
const towns = [
  { name: "Buffalo", coords: [42.8864, -78.8784] },
  { name: "Rochester", coords: [43.1566, -77.6088] },
  { name: "Niagara Falls", coords: [43.0962, -79.0377] }
];

towns.forEach(town => {
  L.marker(town.coords).addTo(map)
    .bindPopup(town.name);
});

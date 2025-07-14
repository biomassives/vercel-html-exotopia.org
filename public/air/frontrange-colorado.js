const map = L.map('map').setView([39.65, -104.9], 8); // Denver-area center

// Base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// PM2.5 overlay image (manually captured and cropped from Earth.Nullschool)
const pm25Bounds = [[38.5, -106.5], [40.7, -103.0]]; // Approx Front Range bounding box
const pm25Overlay = L.imageOverlay('overlays/pm25-frontrange.png', pm25Bounds, {
  opacity: 0.5,
  interactive: false
}).addTo(map);

// County boundaries for Colorado
fetch('https://raw.githubusercontent.com/deldersveld/topojson/master/countries/us-states/CO-08-colorado-counties.json')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: "#cc0000", weight: 1 }
    }).addTo(map);
  });

// Rivers (simple or stylized — swap with more detailed source if needed)
fetch('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/denver.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: "blue", weight: 0.5 }
    }).addTo(map);
  });

// Major Front Range cities/towns
const towns = [
  { name: "Denver", coords: [39.7392, -104.9903] },
  { name: "Boulder", coords: [40.015, -105.2705] },
  { name: "Fort Collins", coords: [40.5853, -105.0844] },
  { name: "Colorado Springs", coords: [38.8339, -104.8214] },
  { name: "Loveland", coords: [40.3978, -105.0749] },
  { name: "Longmont", coords: [40.1672, -105.1019] }
];

towns.forEach(town => {
  L.marker(town.coords).addTo(map)
    .bindPopup(town.name);
});

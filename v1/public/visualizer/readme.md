const neuronGraph = generateGraphFromPoints(points);
const activeNeurons = new Set([initialIndex]);

function propagateNeurons() {
  const next = new Set();
  for (let index of activeNeurons) {
    const neighbors = neuronGraph[index];
    neighbors.forEach(n => {
      if (Math.random() < 0.5) next.add(n);
    });
  }
  activeNeurons.clear();
  next.forEach(n => activeNeurons.add(n));
}


function generateGoldenAnglePoints(n) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = i * goldenAngle;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}



    let scene, camera, renderer, controls;
    let raycaster, INTERSECTED;
    const regions = [];
    const fileNames = ['quadrant_1.json', 'quadrant_2.json', 'quadrant_3.json', 'quadrant_4.json', 'quadrant_5.json', 'quadrant_6.json', 'quadrant_7.json', 'quadrant_8.json'];
    document.addEventListener('DOMContentLoaded', function () {
        init();
        loadExoplanetData(fileNames);  // Specify your data source here
        animate();
        setupHammerJS();
        setupMouseEvents();
    });
    function init() {
        const container = document.getElementById('container');
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 100;
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Add damping for smooth panning
        controls.dampingFactor = 0.25; // Adjust damping factor as needed
        controls.rotateSpeed = 2.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.enableZoom = true;
        controls.maxDistance = 500; // Maximum distance camera can zoom out
        controls.minDistance = 100; // Minimum distance camera can zoom in
        raycaster = new THREE.Raycaster();
        window.addEventListener('resize', onWindowResize, false);
    }
    let currentIntersect;
    function onMouseMove(event) {
        event.preventDefault();
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(regions);
        if (intersects.length > 0) {
            if (currentIntersect !== intersects[0].object) {
                restoreOriginalColor(currentIntersect);
                currentIntersect = intersects[0].object;
                highlightObject(currentIntersect);
            }
            document.getElementById('infobox').style.display = 'block';
            document.getElementById('infobox').style.left = `${event.clientX + 5}px`;
            document.getElementById('infobox').style.top = `${event.clientY + 5}px`;
            document.getElementById('infobox').innerHTML = currentIntersect.userData.description || 'No additional information';
        } else {
            restoreOriginalColor(currentIntersect);
            currentIntersect = null;
            document.getElementById('infobox').style.display = 'none';
        }
    }
    function onClick(event) {
        event.preventDefault();
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(regions);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const targetDistance = calculateTargetDistance(intersect.object);
            const targetPosition = intersect.object.position.clone();
            targetPosition.z += targetDistance; // Move target position closer
            gsap.to(camera.position, {duration: 1.5, x: targetPosition.x, y: targetPosition.y, z: targetPosition.z});
            controls.target = intersect.object.position.clone(); // Center the clicked planet
        }
    }
    function onTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const mouse = new THREE.Vector2(
            (touch.clientX / window.innerWidth) * 2 - 1,
            -(touch.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(regions);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            currentIntersect = intersect.object;
            highlightObject(currentIntersect);
            displayExoplanetInfo(currentIntersect);
            // Recentering logic
            const targetDistance = calculateTargetDistance(currentIntersect);
            const targetPosition = currentIntersect.position.clone();
            targetPosition.z += targetDistance; // Move target position closer
            gsap.to(camera.position, {duration: 1.5, x: targetPosition.x, y: targetPosition.y, z: targetPosition.z});
            controls.target = currentIntersect.position.clone(); // Center the clicked planet
        }
    }
    function onTouchEnd(event) {
        if (currentIntersect) {
            const touch = event.changedTouches[0];
            const mouse = new THREE.Vector2(
                (touch.clientX / window.innerWidth) * 2 - 1,
                -(touch.clientY / window.innerHeight) * 2 + 1
            );
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(regions);
            if (intersects.length > 0) {
                const intersect = intersects[0];
                if (intersect.object === currentIntersect) {
                    // Restore the original color of the currentIntersect object
                    restoreOriginalColor(currentIntersect);
                }
            }
            // Reset the currentIntersect variable
            currentIntersect = null;
        }
    }
    function loadExoplanetData(fileNames) {
        let combinedData = [];
        function loadFile(index) {
            if (index < fileNames.length) {
                fetch(fileNames[index])
                    .then(response => response.json())
                    .then(data => {
                        combinedData = combinedData.concat(data);
                        loadFile(index + 1);
                    })
                    .catch(err => console.error('Failed to load data:', err));
            } else {
                createExoplanetVisuals(combinedData);
            }
        }
        loadFile(0);
    }
    function createExoplanetVisuals(data) {
        data.forEach(planet => {
            if (planet.hasOwnProperty('pl_name')) {
                const name = planet.pl_name;
                let temperature = 'N/A';
                let radius = 5;
                if (planet.hasOwnProperty('pl_eqt') && planet.pl_eqt !== '') {
                    temperature = planet.pl_eqt;
                }
                if (planet.hasOwnProperty('pl_rade')) {
                    radius = planet.pl_rade;
                }
                const geometry = new THREE.SphereGeometry(radius, 32, 32);
                const color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
                const material = new THREE.MeshStandardMaterial({color, emissive: color});
                const exoplanet = new THREE.Mesh(geometry, material);
                exoplanet.position.set(
                    Math.random() * 800 - 400,
                    Math.random() * 800 - 400,
                    Math.random() * 800 - 400
                );
                exoplanet.userData = {
                    description: `Name: ${name}, Temp: ${temperature}K`
                };
                exoplanet.originalColor = color.clone(); // Store original color
                scene.add(exoplanet);
                regions.push(exoplanet);
            } else {
                console.warn('Missing properties in planet object:', planet);
            }
        });
    }
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    function highlightObject(object) {
        if (object.material.emissive) {
            object.currentHex = object.material.emissive.getHex();
            object.material.emissive.setHex(0xff0000); // Turn red on mouseover
        }
    }
    function restoreOriginalColor(object) {
        if (object && object.material.emissive) {
            object.material.emissive.setHex(object.currentHex);
        }
    }
    function calculateTargetDistance(object) {
        const objectSize = object.geometry.parameters.radius;
        const cameraDistance = controls.object.position.distanceTo(object.position);
        const scaleFactor = 2.5; // Adjust this value as needed
        let targetDistance = objectSize * scaleFactor;
        // Limit the zoom level
        const minZoom = 20; // Minimum zoom level in scene units
        const maxZoom = 300; // Maximum zoom level in scene units
        if (targetDistance < minZoom) {
            targetDistance = minZoom;
        } else if (targetDistance > maxZoom) {
            targetDistance = maxZoom;
        }
        return targetDistance;
    }
    // Hammer.js setup
    function setupHammerJS() {
        const hammer = new Hammer(document.getElementById('container'));
        hammer.on('tap', function (event) {
            const mouse = new THREE.Vector2(
                (event.center.x / window.innerWidth) * 2 - 1,
                -(event.center.y / window.innerHeight) * 2 + 1
            );
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(regions);
            if (intersects.length > 0) {
                const intersect = intersects[0];
                const targetDistance = calculateTargetDistance(intersect.object);
                const targetPosition = intersect.object.position.clone();
                targetPosition.z += targetDistance; // Move target position closer
                gsap.to(camera.position, {duration: 1.5, x: targetPosition.x, y: targetPosition.y, z: targetPosition.z});
                controls.target = intersect.object.position.clone(); // Center the clicked planet
            }
        });
    }
    // Mouse event setup
    function setupMouseEvents() {
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('click', onClick, false);
        document.addEventListener('touchstart', onTouchStart, false);
        document.addEventListener('touchend', onTouchEnd, false);
    }


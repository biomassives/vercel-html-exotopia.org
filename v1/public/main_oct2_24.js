// main.js

(function() {
    let scene, camera, renderer, controls;
    let raycaster, INTERSECTED;
    const regions = [];
    const fileNames = [
        'quadrant_1.json', 'quadrant_2.json',
        'quadrant_3.json', 'quadrant_4.json',
        'quadrant_5.json', 'quadrant_6.json',
        'quadrant_7.json', 'quadrant_8.json'
    ];

    // Initialize the application
    init();
    loadExoplanetData(fileNames);
    animate();

    // Initialize the Three.js scene, camera, renderer, and controls
    function init() {
        const container = document.getElementById('container');
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 2000
        );
        camera.position.z = 500;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.enableZoom = true;
        controls.maxDistance = 1000;
        controls.minDistance = 10;

        raycaster = new THREE.Raycaster();
        window.addEventListener('resize', onWindowResize, false);

        // Add ambient and directional lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        setupEventListeners();
        setupHammerJS();
    }

    // Load exoplanet data using async/await
    async function loadExoplanetData(fileNames) {
        try {
            const dataPromises = fileNames.map(fileName =>
                fetch(fileName).then(response => response.json())
            );
            const allData = await Promise.all(dataPromises);
            const combinedData = allData.flat();
            createExoplanetVisuals(combinedData);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    }

    // Create exoplanet visuals
    function createExoplanetVisuals(data) {
        const maxRadius = 1000;
        const minRadius = 100;
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        const materials = {};

        data.forEach(planet => {
            if (planet.pl_name && planet.ra && planet.dec) {
                const name = planet.pl_name;
                const temperature = planet.pl_eqt ? parseFloat(planet.pl_eqt) : 'N/A';
                const radius = planet.pl_rade ? parseFloat(planet.pl_rade) : 1;

                // Scale radius for visualization
                const scaleFactor = 2;
                const visualRadius = Math.max(0.5, Math.min(5, radius * scaleFactor));

                // Reuse materials based on temperature category
                const tempCategory = temperature !== 'N/A' ? Math.floor(temperature / 100) * 100 : 'unknown';
                if (!materials[tempCategory]) {
                    const hue = temperature !== 'N/A' ? (temperature % 360) / 360 : 0.5;
                    const color = new THREE.Color().setHSL(hue, 1, 0.5);
                    materials[tempCategory] = new THREE.MeshStandardMaterial({
                        color,
                        emissive: color
                    });
                }
                const material = materials[tempCategory];

                const exoplanet = new THREE.Mesh(sphereGeometry, material);
                exoplanet.scale.set(visualRadius, visualRadius, visualRadius);

                // Calculate position using RA and Dec
                const ra = parseFloat(planet.ra);
                const dec = parseFloat(planet.dec);
                if (isNaN(ra) || isNaN(dec)) {
                    console.warn(`Invalid RA or Dec for planet ${name}`);
                    return;
                }
                const phi = THREE.MathUtils.degToRad(90 - dec);
                const theta = THREE.MathUtils.degToRad(ra);

                // Use logarithmic scale for distance
                const distance =
                    minRadius + (maxRadius - minRadius) * Math.log(1 + Math.random()) / Math.log(2);

                exoplanet.position.set(
                    distance * Math.sin(phi) * Math.cos(theta),
                    distance * Math.cos(phi),
                    distance * Math.sin(phi) * Math.sin(theta)
                );

                exoplanet.userData = {
                    description: `Name: ${name}, Temp: ${temperature}K, Radius: ${radius} Earth radii`
                };
                exoplanet.originalColor = material.color.clone();
                scene.add(exoplanet);
                regions.push(exoplanet);
            }
        });

        if (regions.length === 0) {
            console.warn('No exoplanets with valid RA and Dec were found in the data.');
        } else {
            console.log(`Created ${regions.length} exoplanets.`);
        }
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    // Handle window resize
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Setup event listeners
    function setupEventListeners() {
        const container = document.getElementById('container');
        container.addEventListener('mousemove', throttle(onMouseMove, 100), false);
        container.addEventListener('click', onClick, false);
    }

    // Mouse move event handler with throttling
    function onMouseMove(event) {
        event.preventDefault();
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(regions);

        if (intersects.length > 0) {
            if (INTERSECTED !== intersects[0].object) {
                if (INTERSECTED) restoreOriginalColor(INTERSECTED);
                INTERSECTED = intersects[0].object;
                highlightObject(INTERSECTED);
            }
            const infobox = document.getElementById('infobox');
            infobox.style.display = 'block';
            infobox.style.left = `${event.clientX + 5}px`;
            infobox.style.top = `${event.clientY + 5}px`;
            infobox.innerHTML = INTERSECTED.userData.description || 'No additional information';
        } else {
            if (INTERSECTED) restoreOriginalColor(INTERSECTED);
            INTERSECTED = null;
            document.getElementById('infobox').style.display = 'none';
        }
    }

    // Click event handler
    function onClick(event) {
        event.preventDefault();
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(regions);

        if (intersects.length > 0) {
            zoomToObject(intersects[0].object);
        }
    }

    // Zoom to object
    function zoomToObject(object) {
        const objectSize = object.geometry.boundingSphere.radius;
        const targetDistance = objectSize * 10;
        const targetPosition = object.position.clone();

        gsap.to(camera.position, {
            duration: 1.5,
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z + targetDistance,
            onUpdate: function() {
                camera.lookAt(targetPosition);
            }
        });

        gsap.to(controls.target, {
            duration: 1.5,
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z
        });
    }

    // Highlight object on hover
    function highlightObject(object) {
        if (object && object.material.emissive) {
            object.currentHex = object.material.emissive.getHex();
            object.material.emissive.setHex(0xff0000);
        }
    }

    // Restore original color
    function restoreOriginalColor(object) {
        if (object && object.material.emissive) {
            object.material.emissive.setHex(object.currentHex);
        }
    }

    // Throttle function to limit event frequency
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    // Setup Hammer.js for touch events
    function setupHammerJS() {
        const container = document.getElementById('container');
        const hammer = new Hammer(container);
        hammer.on('tap', function(event) {
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.center.x - rect.left) / rect.width) * 2 - 1,
                -((event.center.y - rect.top) / rect.height) * 2 + 1
            );

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(regions);

            if (intersects.length > 0) {
                zoomToObject(intersects[0].object);
            }
        });
    }
})();

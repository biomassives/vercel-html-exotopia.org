// ── Script loader ──────────────────────────────────────────────────────────
function loadScript(url, callback) {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = url;
    s.onload = callback;
    document.head.appendChild(s);
}

loadScript('https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.min.js', function () {
    loadScript('https://cdn.jsdelivr.net/npm/three@0.125.2/examples/js/controls/OrbitControls.js', function () {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.5.1/gsap.min.js', function () {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js', initApp);
        });
    });
});

// ── App ────────────────────────────────────────────────────────────────────
function initApp() {

    // ── Scene globals ─────────────────────────────────────────────────────
    var scene, camera, renderer, controls, raycaster;

    // ── State ─────────────────────────────────────────────────────────────
    var mode           = 'galaxy';   // 'galaxy' | 'system'
    var galaxyMarkers  = [];         // one Mesh per star system
    var systemObjects  = [];         // all objects in current system view
    var animObjects    = [];         // objects that move each frame
    var systemsMap     = {};         // hostname → system data
    var currentHovered = null;

    // ── DOM refs ──────────────────────────────────────────────────────────
    var infoEl, infoboxEl, backBtnEl;

    init();
    loadData();
    animate();
    setupEvents();

    // ─────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────
    function init() {
        var container = document.getElementById('container');

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        camera.position.set(0, 0, 600);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping  = true;
        controls.dampingFactor  = 0.12;
        controls.rotateSpeed    = 0.4;
        controls.zoomSpeed      = 1.2;
        controls.maxDistance    = 2500;
        controls.minDistance    = 4;

        raycaster = new THREE.Raycaster();
        raycaster.params.Mesh = {};

        // Lights
        scene.add(new THREE.AmbientLight(0x222233));
        var dir = new THREE.DirectionalLight(0xffffff, 0.35);
        dir.position.set(1, 1, 1);
        scene.add(dir);

        window.addEventListener('resize', function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // DOM overlays
        infoEl    = document.getElementById('info');
        infoboxEl = document.getElementById('infobox');

        // Back button
        backBtnEl = document.createElement('button');
        backBtnEl.id = 'back-btn';
        backBtnEl.textContent = '\u2190 Galaxy view';
        backBtnEl.style.cssText = [
            'position:absolute', 'top:14px', 'right:14px', 'display:none',
            'padding:8px 18px',
            'background:rgba(0,60,140,0.82)', 'color:#e8f0ff',
            'border:1px solid rgba(100,160,255,0.45)', 'border-radius:5px',
            'cursor:pointer', 'font-size:14px', 'font-family:monospace',
            'z-index:100',
        ].join(';');
        backBtnEl.addEventListener('click', function () { exitSystemView(true); });
        document.body.appendChild(backBtnEl);

        addLegend();

        infoEl.textContent = 'Loading star systems\u2026';
    }

    // ─────────────────────────────────────────────────────────────────────
    // DATA
    // ─────────────────────────────────────────────────────────────────────
    function loadData() {
        fetch('exoplanets-viz.json')
            .then(function (r) { return r.json(); })
            .then(function (planets) {
                systemsMap = buildSystemsMap(planets);
                createGalaxyView();
                infoEl.textContent =
                    Object.keys(systemsMap).length + ' star systems \u2014 click to explore';
            })
            .catch(function (err) {
                console.error('Failed to load exoplanet data:', err);
                infoEl.textContent = 'Error loading exoplanets-viz.json';
            });
    }

    function buildSystemsMap(planets) {
        var map = {};
        planets.forEach(function (p) {
            var host = p.hostname || p.pl_name;
            if (!host) return;
            if (!map[host]) {
                map[host] = {
                    hostname:    host,
                    ra:          p.ra,
                    dec:         p.dec,
                    sy_dist:     p.sy_dist,
                    glon:        p.glon,
                    glat:        p.glat,
                    st_teff:     p.st_teff,
                    st_spectype: p.st_spectype,
                    sy_snum:     p.sy_snum,
                    sy_pnum:     p.sy_pnum,
                    sy_mnum:     p.sy_mnum || 0,
                    disc_method: p.discoverymethod,
                    planets:     [],
                };
            }
            // Keep the highest moon count seen across rows
            if (p.sy_mnum && p.sy_mnum > map[host].sy_mnum) {
                map[host].sy_mnum = p.sy_mnum;
            }
            map[host].planets.push(p);
        });
        return map;
    }

    // ─────────────────────────────────────────────────────────────────────
    // GALAXY VIEW  – one sphere per star system
    // ─────────────────────────────────────────────────────────────────────
    function createGalaxyView() {
        Object.values(systemsMap).forEach(function (sys) {
            if (sys.ra == null || sys.dec == null) return;

            var vizDist = distToViz(sys.sy_dist);
            var pos     = raDecToVec3(sys.ra, sys.dec, vizDist);
            var col     = starColorFromTeff(sys.st_teff);

            // Slightly larger for multi-planet systems
            var r   = 0.45 + Math.min(1.8, sys.planets.length * 0.25);
            var geo = new THREE.SphereGeometry(r, 8, 8);
            var mat = new THREE.MeshStandardMaterial({
                color: col, emissive: col, emissiveIntensity: 0.7
            });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            mesh.userData = {
                type:          'star_system',
                system:        sys,
                originalColor: col.clone(),
            };

            scene.add(mesh);
            galaxyMarkers.push(mesh);
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // SYSTEM VIEW  – star + orbiting planets + moons
    // ─────────────────────────────────────────────────────────────────────
    function enterSystemView(sys) {
        if (mode === 'system') exitSystemView(false);
        mode = 'system';

        // Dim all galaxy markers except this system's marker
        var marker = null;
        galaxyMarkers.forEach(function (m) {
            if (m.userData.system.hostname === sys.hostname) {
                marker = m;
            } else {
                m.visible = false;
            }
        });

        var starPos = marker ? marker.position.clone() : new THREE.Vector3(0, 0, 0);

        buildSystemScene(sys, starPos);
        moveCameraToSystem(starPos, sys.planets.length);

        backBtnEl.style.display = 'block';
        infoEl.textContent =
            sys.hostname +
            (sys.st_spectype ? ' \u00b7 ' + sys.st_spectype : '') +
            ' \u00b7 ' + sys.planets.length + ' planet' + (sys.planets.length !== 1 ? 's' : '') +
            (sys.sy_mnum > 0 ? ' \u00b7 ' + sys.sy_mnum + ' moon' + (sys.sy_mnum !== 1 ? 's' : '') : '') +
            (sys.sy_dist ? ' \u00b7 ' + sys.sy_dist.toFixed(1) + ' pc' : '');
    }

    function buildSystemScene(sys, starPos) {
        // ── Star ──────────────────────────────────────────────────────────
        var starCol  = starColorFromTeff(sys.st_teff);
        var starMesh = new THREE.Mesh(
            new THREE.SphereGeometry(9, 32, 32),
            new THREE.MeshStandardMaterial({
                color: starCol, emissive: starCol, emissiveIntensity: 1.0
            })
        );
        starMesh.position.copy(starPos);
        starMesh.userData = {
            type: 'star',
            system: sys,
            description:
                '\u2605 ' + sys.hostname +
                (sys.st_spectype ? '  [' + sys.st_spectype + ']' : '') +
                (sys.st_teff     ? '  ' + Math.round(sys.st_teff) + ' K' : '') +
                (sys.sy_snum > 1 ? '  \u00b7 binary system' : '') +
                (sys.sy_dist     ? '  \u00b7 ' + sys.sy_dist.toFixed(1) + ' pc' : ''),
        };
        scene.add(starMesh);
        systemObjects.push(starMesh);

        // Point light from the star
        var starLight = new THREE.PointLight(starCol, 3, 900);
        starLight.position.copy(starPos);
        scene.add(starLight);
        systemObjects.push(starLight);

        // ── Planets ───────────────────────────────────────────────────────
        // Sort by orbital distance; estimate spacing for unknowns
        var sorted = sys.planets.slice().sort(function (a, b) {
            return (a.pl_orbsmax != null ? a.pl_orbsmax : 999 + sys.planets.indexOf(a)) -
                   (b.pl_orbsmax != null ? b.pl_orbsmax : 999 + sys.planets.indexOf(b));
        });

        sorted.forEach(function (planet, i) {
            var orbAU  = planet.pl_orbsmax != null ? planet.pl_orbsmax : fallbackAU(i, sorted.length);
            var orbR   = auToViz(orbAU);

            // Orbital ring
            var ring = new THREE.Mesh(
                new THREE.RingGeometry(orbR - 0.3, orbR + 0.3, 80),
                new THREE.MeshBasicMaterial({
                    color: 0x1a2f45, side: THREE.DoubleSide,
                    transparent: true, opacity: 0.55,
                })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.copy(starPos);
            ring.userData = { type: 'orbit_ring' };
            scene.add(ring);
            systemObjects.push(ring);

            // Planet sphere
            var pR    = Math.max(0.9, Math.min(5, (planet.pl_rade != null ? planet.pl_rade : 2.0) * 0.42));
            var pCol  = planetColor(planet.pl_eqt, orbAU);
            var pMesh = new THREE.Mesh(
                new THREE.SphereGeometry(pR, 20, 20),
                new THREE.MeshStandardMaterial({
                    color: pCol, emissive: pCol, emissiveIntensity: 0.18
                })
            );

            var initAngle = (i / sorted.length) * Math.PI * 2;
            pMesh.position.set(
                starPos.x + orbR * Math.cos(initAngle),
                starPos.y,
                starPos.z + orbR * Math.sin(initAngle)
            );

            // Orbital speed: relative to Earth year, scaled for visibility
            var periodDays = planet.pl_orbper != null ? planet.pl_orbper : 365;
            var angularSpeed = (2 * Math.PI * 365) / (periodDays * 60); // 60× slower than real

            pMesh.userData = {
                type:        'planet',
                planet:      planet,
                starPos:     starPos,
                orbR:        orbR,
                orbAngle:    initAngle,
                angSpeed:    angularSpeed,
                description: describePlanet(planet),
                originalColor: pCol.clone(),
            };

            scene.add(pMesh);
            systemObjects.push(pMesh);
            animObjects.push(pMesh);

            // Attach moons to the outermost planet if sy_mnum > 0
            if (sys.sy_mnum > 0 && i === sorted.length - 1) {
                spawnMoons(pMesh, Math.min(sys.sy_mnum, 4), pR);
            }
        });
    }

    function spawnMoons(parentMesh, count, parentRadius) {
        for (var m = 0; m < count; m++) {
            var moonOrbR = parentRadius + 3.5 + m * 2.8;

            // Moon orbit ring — position updated each frame to follow parent
            var mRing = new THREE.Mesh(
                new THREE.RingGeometry(moonOrbR - 0.18, moonOrbR + 0.18, 48),
                new THREE.MeshBasicMaterial({
                    color: 0x334455, side: THREE.DoubleSide,
                    transparent: true, opacity: 0.4,
                })
            );
            mRing.rotation.x = Math.PI / 2;
            scene.add(mRing);
            systemObjects.push(mRing);

            var moonMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.38 + m * 0.08, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x9999aa, emissive: 0x1a1a2a })
            );

            var initAngle = (m / count) * Math.PI * 2;
            moonMesh.userData = {
                type:        'moon',
                parent:      parentMesh,
                ring:        mRing,
                moonOrbR:    moonOrbR,
                moonAngle:   initAngle,
                moonSpeed:   (2.0 + m * 0.7) / 60,
                description: 'Moon of ' + (parentMesh.userData.planet
                    ? parentMesh.userData.planet.pl_name : 'planet') + ' (proposed)',
            };

            scene.add(moonMesh);
            systemObjects.push(moonMesh);
            animObjects.push(moonMesh);
        }
    }

    function exitSystemView(doAnimate) {
        systemObjects.forEach(function (o) { scene.remove(o); });
        systemObjects = [];
        animObjects   = [];

        galaxyMarkers.forEach(function (m) { m.visible = true; });
        mode = 'galaxy';

        if (doAnimate) {
            gsap.to(camera.position, { duration: 1.4, x: 0, y: 0, z: 600,
                onUpdate: function () { controls.update(); } });
            gsap.to(controls.target, { duration: 1.4, x: 0, y: 0, z: 0,
                onUpdate: function () { controls.update(); } });
        }

        backBtnEl.style.display  = 'none';
        infoboxEl.style.display  = 'none';
        infoEl.textContent =
            Object.keys(systemsMap).length + ' star systems \u2014 click to explore';
    }

    function moveCameraToSystem(starPos, planetCount) {
        // Camera offset: further back for large systems
        var zOffset = 180 + planetCount * 20;
        gsap.to(camera.position, {
            duration: 1.5,
            x: starPos.x,
            y: starPos.y + 55,
            z: starPos.z + zOffset,
            onUpdate: function () { controls.update(); },
        });
        gsap.to(controls.target, {
            duration: 1.5,
            x: starPos.x, y: starPos.y, z: starPos.z,
            onUpdate: function () { controls.update(); },
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // ANIMATION LOOP
    // ─────────────────────────────────────────────────────────────────────
    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        if (mode === 'system') {
            animObjects.forEach(function (obj) {
                var d = obj.userData;
                if (d.type === 'planet') {
                    d.orbAngle += d.angSpeed;
                    obj.position.set(
                        d.starPos.x + d.orbR * Math.cos(d.orbAngle),
                        d.starPos.y,
                        d.starPos.z + d.orbR * Math.sin(d.orbAngle)
                    );
                } else if (d.type === 'moon') {
                    d.moonAngle += d.moonSpeed;
                    var px = d.parent.position;
                    obj.position.set(
                        px.x + d.moonOrbR * Math.cos(d.moonAngle),
                        px.y,
                        px.z + d.moonOrbR * Math.sin(d.moonAngle)
                    );
                    // Keep moon orbit ring centered on parent
                    d.ring.position.copy(px);
                }
            });
        }

        renderer.render(scene, camera);
    }

    // ─────────────────────────────────────────────────────────────────────
    // INTERACTION
    // ─────────────────────────────────────────────────────────────────────
    function setupEvents() {
        var hammer = new Hammer(document.getElementById('container'));
        hammer.on('tap', function (e) { handleClick(e.center.x, e.center.y); });

        document.addEventListener('mousemove', function (e) { handleHover(e.clientX, e.clientY); });
        document.addEventListener('click',     function (e) { handleClick(e.clientX, e.clientY); });
    }

    function ndcFromXY(x, y) {
        return new THREE.Vector2(
             (x / window.innerWidth)  * 2 - 1,
            -(y / window.innerHeight) * 2 + 1
        );
    }

    function getHitTargets() {
        if (mode === 'galaxy') return galaxyMarkers;
        return systemObjects.filter(function (o) {
            return o.isMesh && o.userData.type !== 'orbit_ring';
        });
    }

    function raycast(x, y) {
        raycaster.setFromCamera(ndcFromXY(x, y), camera);
        return raycaster.intersectObjects(getHitTargets());
    }

    function handleHover(x, y) {
        // Restore previous hover
        if (currentHovered) {
            restoreColor(currentHovered);
            currentHovered = null;
        }

        var hits = raycast(x, y);
        if (hits.length === 0) {
            infoboxEl.style.display = 'none';
            return;
        }

        var obj = hits[0].object;
        if (!obj.userData.type || obj.userData.type === 'orbit_ring') return;

        currentHovered = obj;
        highlightColor(obj);

        infoboxEl.style.display = 'block';
        infoboxEl.style.left    = (x + 12) + 'px';
        infoboxEl.style.top     = (y + 12) + 'px';
        infoboxEl.textContent   =
            obj.userData.description ||
            obj.userData.system && obj.userData.system.hostname ||
            obj.userData.type;
    }

    function handleClick(x, y) {
        var hits = raycast(x, y);
        if (hits.length === 0) return;

        var obj = hits[0].object;
        var t   = obj.userData.type;

        if (mode === 'galaxy' && t === 'star_system') {
            enterSystemView(obj.userData.system);
        } else if (mode === 'system' && (t === 'planet' || t === 'moon' || t === 'star')) {
            // Pin the infobox on click
            infoboxEl.style.display = 'block';
            infoboxEl.style.left    = (x + 12) + 'px';
            infoboxEl.style.top     = (y + 12) + 'px';
            infoboxEl.textContent   = obj.userData.description || t;
        }
    }

    function highlightColor(obj) {
        if (obj.material && obj.material.emissive) {
            obj._savedHex       = obj.material.emissive.getHex();
            obj._savedIntensity = obj.material.emissiveIntensity;
            obj.material.emissive.setHex(0xffffff);
            obj.material.emissiveIntensity = 0.85;
        }
    }

    function restoreColor(obj) {
        if (obj.material && obj.material.emissive && obj._savedHex !== undefined) {
            obj.material.emissive.setHex(obj._savedHex);
            obj.material.emissiveIntensity = obj._savedIntensity;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // LEGEND
    // ─────────────────────────────────────────────────────────────────────
    function addLegend() {
        var el = document.createElement('div');
        el.style.cssText = [
            'position:absolute', 'bottom:18px', 'left:16px',
            'background:rgba(0,0,0,0.68)', 'color:#ccc',
            'padding:12px 16px', 'border-radius:6px',
            'font:12px/2.0 monospace', 'pointer-events:none',
            'z-index:100',
        ].join(';');
        el.innerHTML =
            '<div style="color:#fff;font-weight:bold;margin-bottom:4px">EXOTOPIA</div>' +
            '<b style="color:#aaa;font-size:11px">STAR TYPE</b><br>' +
            '<span style="color:#8ab0ff">\u25cf</span> O/B (blue-white, &gt;10 000 K)<br>' +
            '<span style="color:#ffffff">\u25cf</span> A (white, 7 500\u201310 000 K)<br>' +
            '<span style="color:#ffffa0">\u25cf</span> F/G (yellow-white, Sun-like)<br>' +
            '<span style="color:#ffa040">\u25cf</span> K (orange, 3 700\u20135 200 K)<br>' +
            '<span style="color:#ff5020">\u25cf</span> M (red dwarf, &lt;3 700 K)<br>' +
            '<div style="margin-top:6px;border-top:1px solid #333;padding-top:6px">' +
            '<b style="color:#aaa;font-size:11px">PLANET TEMPERATURE</b><br>' +
            '<span style="color:#ff3300">\u25cf</span> Ultra-hot  (&gt;2 000 K)<br>' +
            '<span style="color:#ff9900">\u25cf</span> Hot        (1 000\u20132 000 K)<br>' +
            '<span style="color:#44cc44">\u25cf</span> Temperate  (200\u2013500 K)<br>' +
            '<span style="color:#4488ff">\u25cf</span> Cold / icy (&lt;200 K)<br>' +
            '<span style="color:#9999bb">\u25cf</span> Moon (proposed)' +
            '</div>';
        document.body.appendChild(el);
    }

    // ─────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────

    /** Map real distance (parsecs) → Three.js scene units */
    function distToViz(pc) {
        if (pc == null) return 150 + Math.random() * 250;
        var d = parseFloat(pc);
        if (isNaN(d) || d <= 0) return 150 + Math.random() * 250;
        // log scale: 1 pc → ~81,  100 pc → ~290,  1000 pc → ~700
        return 80 + 620 * Math.log10(1 + d) / Math.log10(1001);
    }

    /** Spherical RA/Dec → Three.js Vector3 */
    function raDecToVec3(ra, dec, dist) {
        var phi   = THREE.MathUtils.degToRad(90 - dec);
        var theta = THREE.MathUtils.degToRad(ra);
        return new THREE.Vector3(
            dist * Math.sin(phi) * Math.cos(theta),
            dist * Math.cos(phi),
            dist * Math.sin(phi) * Math.sin(theta)
        );
    }

    /** Map orbital semi-major axis (AU) → orbit ring radius in scene units */
    function auToViz(au) {
        // 0.02 AU → ~14   0.1 AU → ~28   1 AU → ~75   10 AU → ~185
        return 14 + 171 * Math.log10(1 + au * 6) / Math.log10(61);
    }

    /** Evenly space planets with unknown orbital distance on a log scale */
    function fallbackAU(index, total) {
        return 0.15 * Math.pow(80, index / Math.max(total - 1, 1));
    }

    /** Star color from effective temperature */
    function starColorFromTeff(teff) {
        if (!teff) return new THREE.Color(1.0, 1.0, 0.80);
        if (teff > 30000) return new THREE.Color(0.67, 0.78, 1.00); // O
        if (teff > 10000) return new THREE.Color(0.80, 0.90, 1.00); // B
        if (teff >  7500) return new THREE.Color(1.00, 1.00, 1.00); // A
        if (teff >  6000) return new THREE.Color(1.00, 1.00, 0.75); // F
        if (teff >  5200) return new THREE.Color(1.00, 0.88, 0.48); // G
        if (teff >  3700) return new THREE.Color(1.00, 0.58, 0.18); // K
        return                    new THREE.Color(1.00, 0.28, 0.08); // M
    }

    /** Planet color from equilibrium temperature; fall back to orbital distance */
    function planetColor(eqt, orbAU) {
        if (eqt != null) {
            if (eqt > 2000) return new THREE.Color(1.00, 0.18, 0.00);
            if (eqt > 1000) return new THREE.Color(1.00, 0.58, 0.08);
            if (eqt >  500) return new THREE.Color(1.00, 0.88, 0.36);
            if (eqt >  200) return new THREE.Color(0.38, 0.78, 0.38);
            return                  new THREE.Color(0.38, 0.58, 1.00);
        }
        if (orbAU < 0.10) return new THREE.Color(1.00, 0.18, 0.00);
        if (orbAU < 0.50) return new THREE.Color(1.00, 0.58, 0.08);
        if (orbAU < 1.80) return new THREE.Color(0.38, 0.78, 0.38);
        if (orbAU < 5.00) return new THREE.Color(0.56, 0.68, 1.00);
        return                   new THREE.Color(0.48, 0.62, 1.00);
    }

    /** Build hover/click description string for a planet */
    function describePlanet(p) {
        var parts = [p.pl_name];
        if (p.pl_rade  != null) parts.push(p.pl_rade.toFixed(2)  + ' R\u2295');
        if (p.pl_masse != null) parts.push(p.pl_masse.toFixed(1)  + ' M\u2295');
        if (p.pl_eqt   != null) parts.push(Math.round(p.pl_eqt)   + ' K');
        if (p.pl_insol != null) parts.push(p.pl_insol.toFixed(2)  + ' S\u2295');
        if (p.pl_orbsmax != null) parts.push(p.pl_orbsmax.toFixed(3) + ' AU');
        if (p.pl_orbper  != null) parts.push(p.pl_orbper.toFixed(1)  + ' d');
        return parts.join(' \u00b7 ');
    }

} // end initApp

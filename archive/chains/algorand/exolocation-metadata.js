/**
 * algorand/exolocation-metadata.js
 *
 * Builds and validates Algorand NFT metadata for Exotopia virtual real estate
 * under the PON INK protocol.  Outputs both:
 *
 *   ARC-3  — full JSON for IPFS upload (referenced by assetURL in the ASA)
 *   ARC-69 — compact JSON for the on-chain transaction note field (≤ 1 KB)
 *
 * Works in Node.js (CommonJS) and browser (global ExolocationMetadata).
 *
 * Usage (Node):
 *   const em = require('./exolocation-metadata');
 *   const meta = em.buildARC3(em.EXAMPLES['exo-surface-v1']);
 *
 * Usage (browser):
 *   <script src="algorand/exolocation-metadata.js"></script>
 *   const meta = ExolocationMetadata.buildARC3(params);
 */

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.ExolocationMetadata = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ── Coordinate system registry ────────────────────────────────────────

    var COORDINATE_SYSTEMS = {
        'exo-surface-v1': {
            label:        'Exoplanet Surface Colony / Settlement',
            unit_name:    'EXOSURF',
            boundary_type: 'polygon',
            ref_body_type: 'exoplanet',
            required_ref:  ['type', 'pl_name', 'host_star', 'ra_deg', 'dec_deg'],
            required_boundary: ['type', 'coordinate_units', 'coordinates'],
        },
        'exo-orbital-v1': {
            label:        'Exoplanet Orbital Zone',
            unit_name:    'EXOORB',
            boundary_type: 'orbital_zone',
            ref_body_type: 'exoplanet',
            required_ref:  ['type', 'pl_name', 'host_star', 'ra_deg', 'dec_deg'],
            required_boundary: ['type', 'altitude_km_min', 'altitude_km_max', 'inclination_deg'],
        },
        'exo-lunar-orbital-v1': {
            label:        'Exoplanet Moon Orbital Zone',
            unit_name:    'EXOLUN',
            boundary_type: 'orbital_zone',
            ref_body_type: 'exoplanet_moon',
            required_ref:  ['type', 'moon_name', 'parent_planet', 'host_star', 'ra_deg', 'dec_deg'],
            required_boundary: ['type', 'altitude_km_min', 'altitude_km_max', 'inclination_deg'],
        },
        'exo-stellar-orbital-v1': {
            label:        'Stellar / Binary System Orbital Zone',
            unit_name:    'EXOSTAR',
            boundary_type: 'orbital_zone',
            ref_body_type: 'star | binary_star_system',
            required_ref:  ['type', 'system_name', 'primary_star', 'ra_deg', 'dec_deg'],
            required_boundary: ['type', 'orbital_radius_au_min', 'orbital_radius_au_max', 'inclination_deg'],
        },
    };

    // ── Ready-made examples for each type ────────────────────────────────

    var EXAMPLES = {
        'exo-surface-v1': {
            coordinate_system: 'exo-surface-v1',
            region_name:       'Aurora Basin',
            owner_group:       'Eco Warriors',
            assignment_date:   '2026-04-13',
            image_cid:         null,
            description:       'Settlement zone on the temperate northern continent of Kepler-452b.',
            reference_body: {
                type:            'exoplanet',
                pl_name:         'Kepler-452b',
                host_star:       'Kepler-452',
                ra_deg:          296.0037,
                dec_deg:         44.2776,
                sy_dist_pc:      430,
                nasa_archive_id: 'Kepler-452 b',
            },
            boundary: {
                type:             'polygon',
                coordinate_units: 'degrees_surface_lat_long',
                coordinates: [
                    [14.5, -23.1],
                    [14.5, -22.0],
                    [15.8, -22.0],
                    [15.8, -23.1],
                    [14.5, -23.1],
                ],
                area_km2: null,
            },
        },

        'exo-orbital-v1': {
            coordinate_system: 'exo-orbital-v1',
            region_name:       'Sector 4 Low Orbit Band',
            owner_group:       'Nature Protectors',
            assignment_date:   '2026-04-13',
            image_cid:         null,
            description:       'Low-orbit research zone around Proxima Centauri b.',
            reference_body: {
                type:            'exoplanet',
                pl_name:         'Proxima Cen b',
                host_star:       'Proxima Centauri',
                ra_deg:          217.4289,
                dec_deg:         -62.6796,
                sy_dist_pc:      1.3,
                nasa_archive_id: 'Proxima Cen b',
            },
            boundary: {
                type:             'orbital_zone',
                altitude_km_min:  200,
                altitude_km_max:  500,
                inclination_deg:  30,
                longitude_of_ascending_node_deg: 120,
            },
        },

        'exo-lunar-orbital-v1': {
            coordinate_system: 'exo-lunar-orbital-v1',
            region_name:       'Relay Arc Alpha',
            owner_group:       'Green Thumbs',
            assignment_date:   '2026-04-13',
            image_cid:         null,
            description:       'Communication relay zone in orbit around TRAPPIST-1e Moon I.',
            reference_body: {
                type:            'exoplanet_moon',
                moon_name:       'TRAPPIST-1e Moon I',
                parent_planet:   'TRAPPIST-1e',
                host_star:       'TRAPPIST-1',
                ra_deg:          346.6225,
                dec_deg:         -5.0414,
                sy_dist_pc:      12.1,
                nasa_archive_id: 'TRAPPIST-1 e',
            },
            boundary: {
                type:             'orbital_zone',
                altitude_km_min:  50,
                altitude_km_max:  100,
                inclination_deg:  0,
                longitude_of_ascending_node_deg: null,
            },
        },

        'exo-stellar-orbital-v1': {
            coordinate_system: 'exo-stellar-orbital-v1',
            region_name:       'Habitable Zone Waypoint Delta',
            owner_group:       'Nature Protectors',
            assignment_date:   '2026-04-13',
            image_cid:         null,
            description:       'Waypoint zone in the habitable belt of the Alpha Centauri binary system.',
            reference_body: {
                type:           'binary_star_system',
                system_name:    'Alpha Centauri',
                primary_star:   'Alpha Centauri A',
                secondary_star: 'Alpha Centauri B',
                ra_deg:         219.9021,
                dec_deg:        -60.8339,
                sy_dist_pc:     1.34,
            },
            boundary: {
                type:                    'orbital_zone',
                orbital_radius_au_min:   1.1,
                orbital_radius_au_max:   1.3,
                inclination_deg:         0,
            },
        },
    };

    // ── Validation ────────────────────────────────────────────────────────

    /**
     * Validate an exolocation params object.
     * Returns { valid: true } or { valid: false, errors: string[] }.
     */
    function validate(params) {
        var errors = [];
        var cs = params.coordinate_system;

        if (!cs) {
            errors.push('coordinate_system is required.');
        } else if (!COORDINATE_SYSTEMS[cs]) {
            errors.push(
                'Unknown coordinate_system "' + cs + '". ' +
                'Must be one of: ' + Object.keys(COORDINATE_SYSTEMS).join(', ')
            );
        }

        if (!params.region_name || !params.region_name.trim()) {
            errors.push('region_name is required.');
        }

        if (errors.length) return { valid: false, errors: errors };

        var spec = COORDINATE_SYSTEMS[cs];
        var rb   = params.reference_body || {};
        var bnd  = params.boundary       || {};

        // Check required reference_body fields
        spec.required_ref.forEach(function (field) {
            if (rb[field] == null || rb[field] === '') {
                errors.push('reference_body.' + field + ' is required for ' + cs + '.');
            }
        });

        // Check required boundary fields
        spec.required_boundary.forEach(function (field) {
            if (bnd[field] == null || bnd[field] === '') {
                errors.push('boundary.' + field + ' is required for ' + cs + '.');
            }
        });

        // Polygon-specific: coordinates must close back to first point
        if (spec.boundary_type === 'polygon' && Array.isArray(bnd.coordinates)) {
            var coords = bnd.coordinates;
            if (coords.length < 4) {
                errors.push('boundary.coordinates must have at least 4 points (including closing point).');
            } else {
                var first = coords[0];
                var last  = coords[coords.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    errors.push('boundary.coordinates must close: last point must equal first point.');
                }
            }
        }

        // Orbital zone: min must be less than max
        if (spec.boundary_type === 'orbital_zone') {
            if (bnd.altitude_km_min != null && bnd.altitude_km_max != null) {
                if (bnd.altitude_km_min >= bnd.altitude_km_max) {
                    errors.push('boundary.altitude_km_min must be less than altitude_km_max.');
                }
            }
            if (bnd.orbital_radius_au_min != null && bnd.orbital_radius_au_max != null) {
                if (bnd.orbital_radius_au_min >= bnd.orbital_radius_au_max) {
                    errors.push('boundary.orbital_radius_au_min must be less than orbital_radius_au_max.');
                }
            }
        }

        return errors.length ? { valid: false, errors: errors } : { valid: true };
    }

    // ── ARC-3 builder ─────────────────────────────────────────────────────

    /**
     * Build a complete ARC-3 compatible metadata object ready to upload to IPFS.
     *
     * @param {object} params - exolocation params (see EXAMPLES for structure)
     * @returns {object} ARC-3 metadata JSON object
     * @throws {Error} if validation fails
     */
    function buildARC3(params) {
        var result = validate(params);
        if (!result.valid) {
            throw new Error('Invalid exolocation params:\n  ' + result.errors.join('\n  '));
        }

        var cs   = COORDINATE_SYSTEMS[params.coordinate_system];
        var rb   = params.reference_body;
        var name = params.region_name;

        var exolocation = {
            schema_version:    '1.0',
            coordinate_system: params.coordinate_system,
            reference_body:    rb,
            region_name:       name,
            owner_group:       params.owner_group   || null,
            assignment_date:   params.assignment_date || today(),
            boundary:          params.boundary,
        };

        return {
            name:           name,
            description:    params.description ||
                            'Exotopia virtual property (' + cs.label + '): ' + name,
            image:          params.image_cid ? 'ipfs://' + params.image_cid : '',
            image_mimetype: 'image/png',
            external_url:   'https://exotopia.org',
            properties: {
                standard:    'exotopia-pon-ink-v1.0',
                exolocation: exolocation,
            },
            attributes: buildAttributes(params, exolocation),
        };
    }

    /**
     * Build an ARC-69 transaction note object (compact, ≤ 1 KB on-chain).
     * Encode the returned object as JSON and pass as the transaction note.
     *
     * @param {object} params - exolocation params
     * @returns {object} ARC-69 note object
     */
    function buildARC69Note(params) {
        var result = validate(params);
        if (!result.valid) {
            throw new Error('Invalid exolocation params:\n  ' + result.errors.join('\n  '));
        }

        var rb = params.reference_body;

        // Derive a short body key from whichever reference body type is present
        var bodyKey =
            rb.pl_name    ||
            rb.moon_name  ||
            rb.system_name ||
            rb.primary_star ||
            'unknown';

        var note = {
            standard:     'arc69',
            description:  'Exotopia virtual property',
            external_url: 'https://exotopia.org',
            properties: {
                protocol:           'pon-ink-v1.0',
                coordinate_system:  params.coordinate_system,
                region_name:        params.region_name,
                reference_body_key: bodyKey,
                ra_deg:             rb.ra_deg  != null ? rb.ra_deg  : null,
                dec_deg:            rb.dec_deg != null ? rb.dec_deg : null,
                sy_dist_pc:         rb.sy_dist_pc != null ? rb.sy_dist_pc : null,
                assignment_date:    params.assignment_date || today(),
            },
        };

        var noteJSON = JSON.stringify(note);
        if (noteJSON.length > 1024) {
            // Trim optional fields to fit in 1 KB
            delete note.properties.sy_dist_pc;
            delete note.properties.ra_deg;
            delete note.properties.dec_deg;
            noteJSON = JSON.stringify(note);
        }

        return note;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    function buildAttributes(params, exolocation) {
        var rb    = exolocation.reference_body;
        var attrs = [
            { trait_type: 'Coordinate System', value: exolocation.coordinate_system },
            { trait_type: 'Region Name',       value: exolocation.region_name },
            { trait_type: 'Protocol',          value: 'PON INK v1.0' },
            { trait_type: 'Assignment Date',   value: exolocation.assignment_date },
        ];

        if (rb) {
            if (rb.pl_name)     attrs.push({ trait_type: 'Exoplanet',      value: rb.pl_name });
            if (rb.moon_name)   attrs.push({ trait_type: 'Moon',           value: rb.moon_name });
            if (rb.parent_planet) attrs.push({ trait_type: 'Parent Planet', value: rb.parent_planet });
            if (rb.system_name) attrs.push({ trait_type: 'Star System',    value: rb.system_name });
            if (rb.host_star)   attrs.push({ trait_type: 'Host Star',      value: rb.host_star });
            if (rb.primary_star) attrs.push({ trait_type: 'Primary Star',  value: rb.primary_star });
            if (rb.sy_dist_pc != null)
                attrs.push({ trait_type: 'Distance (pc)', value: String(rb.sy_dist_pc) });
        }

        if (params.owner_group) {
            attrs.push({ trait_type: 'Owner Group', value: params.owner_group });
        }

        return attrs;
    }

    function today() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Return the default Algorand unit name for a given coordinate system.
     * Max 8 characters as required by ASA spec.
     */
    function unitNameFor(coordinateSystem) {
        var cs = COORDINATE_SYSTEMS[coordinateSystem];
        return cs ? cs.unit_name : 'EXOPROP';
    }

    /**
     * Truncate a string to fit Algorand's ASA assetName field (max 32 chars).
     */
    function assetNameFor(regionName) {
        return regionName.length <= 32 ? regionName : regionName.substring(0, 32);
    }

    // ── Public API ────────────────────────────────────────────────────────

    return {
        COORDINATE_SYSTEMS: COORDINATE_SYSTEMS,
        EXAMPLES:           EXAMPLES,
        validate:           validate,
        buildARC3:          buildARC3,
        buildARC69Note:     buildARC69Note,
        unitNameFor:        unitNameFor,
        assetNameFor:       assetNameFor,
    };

}));

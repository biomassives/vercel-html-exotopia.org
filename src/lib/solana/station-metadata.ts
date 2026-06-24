/**
 * solana/station-metadata.ts
 *
 * Builds Metaplex-compatible off-chain NFT metadata for the three Exotopia
 * Orbital Station NFT tiers:
 *
 *   StationCore      — one per exolocation; holds the exolocation record and
 *                      a map of installed module mint addresses
 *   StationModule    — one per functional zone (gallery / watsan / energy /
 *                      shelter / healthcare / food / command)
 *   EcocitySolution  — an installable sustainable DIY solution from ecocity.com
 *
 * All three produce JSON that can be uploaded to IPFS or Arweave and referenced
 * by the Metaplex `uri` field in the on-chain cNFT metadata.
 *
 * Usage (Node):
 *   import { buildStationCoreMeta, buildModuleMeta, buildSolutionMeta } from './station-metadata';
 *
 * Usage (CLI — dry run):
 *   npx ts-node station-metadata.ts
 */

'use strict';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoordinateSystem =
    | 'exo-surface-v1'
    | 'exo-orbital-v1'
    | 'exo-lunar-orbital-v1'
    | 'exo-stellar-orbital-v1'
    // ── Moon-relative trophic levels L4–L6 (see src/lib/moon-settlement.ts) ─
    | 'exo-moon-surface-v1'     // L4 SUBLUNARY — settlement on moon surface
    | 'exo-moon-lagrange-v1'    // L5 SYZYGY    — L1/L2/L4/L5 trojan/gateway
    | 'exo-moon-interface-v1'   // L6 LIMINAL   — Hill sphere / Roche / tidal-lock
    ;

export type ModuleType =
    | 'gallery'
    | 'watsan'
    | 'energy'
    | 'shelter'
    | 'healthcare'
    | 'food'
    | 'command';

export type SolutionCategory = 'watsan' | 'energy' | 'shelter' | 'healthcare' | 'food';

export interface ReferenceBody {
    type:            string;
    pl_name?:        string;
    moon_name?:      string;
    parent_planet?:  string;
    system_name?:    string;
    primary_star?:   string;
    secondary_star?: string;
    host_star?:      string;
    ra_deg:          number;
    dec_deg:         number;
    sy_dist_pc?:     number | null;
    nasa_archive_id?: string;
}

export interface OrbitalZoneBoundary {
    type:                              'orbital_zone';
    altitude_km_min?:                  number;
    altitude_km_max?:                  number;
    orbital_radius_au_min?:            number;
    orbital_radius_au_max?:            number;
    inclination_deg:                   number;
    longitude_of_ascending_node_deg?:  number | null;
}

export interface PolygonBoundary {
    type:             'polygon';
    coordinate_units: string;
    coordinates:      [number, number][];
    area_km2?:        number | null;
}

export interface Exolocation {
    coordinate_system:  CoordinateSystem;
    region_name:        string;
    reference_body:     ReferenceBody;
    boundary:           OrbitalZoneBoundary | PolygonBoundary;
    owner_group?:       string | null;
    assignment_date?:   string;
}

export interface StationCapacity {
    crew:       number;
    volume_m3?: number;
}

export interface StationCoreParams {
    station_id:          string;
    station_name:        string;
    owner:               string;
    commissioned_date:   string;
    exolocation:         Exolocation;
    capacity:            StationCapacity;
    image_uri?:          string;   // IPFS/Arweave URI for station artwork
    description?:        string;
    installed_modules?:  Partial<Record<ModuleType, string | string[] | null>>;
}

export interface StationModuleParams {
    module_id:             string;
    module_type:           ModuleType;
    module_name:           string;
    station_mint:          string;
    owner:                 string;
    image_uri?:            string;
    description?:          string;
    installed_solutions?:  string[];   // EcocitySolution mint addresses
    // type-specific extra fields
    extra_attributes?:     Array<{ trait_type: string; value: string }>;
}

export interface MaterialItem {
    item: string;
    qty:  string;
}

export interface SolutionImpact {
    beneficiaries?:       number;
    water_L_day?:         number;
    kwh_day?:             number;
    co2_kg_saved_day?:    number;
    food_kg_month?:       number;
    floor_area_m2?:       number;
    treatments_per_month?: number;
}

export interface EcocitySolutionParams {
    solution_id:         string;
    solution_name:       string;
    category:            SolutionCategory;
    description:         string;
    difficulty:          1 | 2 | 3 | 4 | 5;
    build_time_days:     number;
    materials:           MaterialItem[];
    impact:              SolutionImpact;
    compatible_modules:  ModuleType[];
    ecocity_url?:        string;
    schematic_uri?:      string | null;   // IPFS/Arweave URI for schematic image
    image_uri?:          string;
    owner?:              string;
}

// Metaplex off-chain metadata shape
export interface MetaplexMetadata {
    name:                   string;
    symbol:                 string;
    description:            string;
    image:                  string;
    external_url:           string;
    attributes:             Array<{ trait_type: string; value: string }>;
    properties: {
        files:     Array<{ uri: string; type: string }>;
        category:  string;
        creators?: Array<{ address: string; share: number }>;
        [key: string]: unknown;
    };
}

// ── Module label map ──────────────────────────────────────────────────────────

const MODULE_LABELS: Record<ModuleType, string> = {
    gallery:    'Orbital Gallery',
    watsan:     'Water & Sanitation',
    energy:     'Renewable Energy',
    shelter:    'Habitat & Shelter',
    healthcare: 'Sustainable Healthcare',
    food:       'Food Production',
    command:    'Command & Communications',
};

const MODULE_SYMBOLS: Record<ModuleType, string> = {
    gallery:    'GALMOD',
    watsan:     'WTSMOD',
    energy:     'ENGMOD',
    shelter:    'SHTMOD',
    healthcare: 'HLTHMOD',
    food:       'FOODMOD',
    command:    'CMDMOD',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
    return new Date().toISOString().split('T')[0];
}

function bodyKey(rb: ReferenceBody): string {
    return rb.pl_name || rb.moon_name || rb.system_name || rb.primary_star || 'unknown';
}

// ── Builder: StationCore ──────────────────────────────────────────────────────

/**
 * Build Metaplex off-chain metadata for a StationCore NFT.
 *
 * @param params  - StationCoreParams object
 * @returns       Metaplex metadata JSON object ready for IPFS/Arweave upload
 */
export function buildStationCoreMeta(params: StationCoreParams): MetaplexMetadata {
    const { exolocation: exo, station_name, capacity } = params;
    const rb  = exo.reference_body;
    const bk  = bodyKey(rb);

    const attributes: Array<{ trait_type: string; value: string }> = [
        { trait_type: 'NFT Tier',            value: 'Station Core' },
        { trait_type: 'Station ID',          value: params.station_id },
        { trait_type: 'Coordinate System',   value: exo.coordinate_system },
        { trait_type: 'Region Name',         value: exo.region_name },
        { trait_type: 'Reference Body',      value: bk },
        { trait_type: 'RA (deg)',            value: String(rb.ra_deg) },
        { trait_type: 'Dec (deg)',           value: String(rb.dec_deg) },
        { trait_type: 'Protocol',            value: 'PON INK v1.0' },
        { trait_type: 'Crew Capacity',       value: String(capacity.crew) },
        { trait_type: 'Commissioned Date',   value: params.commissioned_date },
        { trait_type: 'Owner',               value: params.owner },
    ];

    if (rb.sy_dist_pc != null) {
        attributes.push({ trait_type: 'Distance (pc)', value: String(rb.sy_dist_pc) });
    }
    if (rb.host_star) {
        attributes.push({ trait_type: 'Host Star', value: rb.host_star });
    }
    if (rb.system_name) {
        attributes.push({ trait_type: 'Star System', value: rb.system_name });
    }

    const description = params.description ||
        `Exotopia orbital station "${station_name}" at ${exo.region_name} ` +
        `(${exo.coordinate_system}) near ${bk}.`;

    const imageUri = params.image_uri || '';

    return {
        name:         station_name,
        symbol:       'EXOSTATION',
        description,
        image:        imageUri,
        external_url: 'https://exotopia.org',
        attributes,
        properties: {
            files:    imageUri ? [{ uri: imageUri, type: 'image/png' }] : [],
            category: 'image',
            station: {
                station_id:        params.station_id,
                commissioned_date: params.commissioned_date,
                capacity,
                installed_modules: params.installed_modules || {},
            },
            exolocation: {
                schema_version:    '1.0',
                coordinate_system: exo.coordinate_system,
                region_name:       exo.region_name,
                owner_group:       exo.owner_group   || null,
                assignment_date:   exo.assignment_date || today(),
                reference_body:    rb,
                boundary:          exo.boundary,
            },
        },
    };
}

// ── Builder: StationModule ────────────────────────────────────────────────────

/**
 * Build Metaplex off-chain metadata for a StationModule NFT.
 *
 * @param params  - StationModuleParams object
 * @returns       Metaplex metadata JSON object
 */
export function buildModuleMeta(params: StationModuleParams): MetaplexMetadata {
    const label  = MODULE_LABELS[params.module_type];
    const symbol = MODULE_SYMBOLS[params.module_type];

    const attributes: Array<{ trait_type: string; value: string }> = [
        { trait_type: 'NFT Tier',    value: 'Station Module' },
        { trait_type: 'Module ID',   value: params.module_id },
        { trait_type: 'Module Type', value: params.module_type },
        { trait_type: 'Module Name', value: params.module_name },
        { trait_type: 'Station',     value: params.station_mint },
        { trait_type: 'Owner',       value: params.owner },
        { trait_type: 'Protocol',    value: 'PON INK v1.0' },
    ];

    if (params.extra_attributes) {
        attributes.push(...params.extra_attributes);
    }

    const description = params.description ||
        `${label} module "${params.module_name}" installed on station ${params.station_mint}.`;

    const imageUri = params.image_uri || '';

    return {
        name:         params.module_name,
        symbol,
        description,
        image:        imageUri,
        external_url: 'https://exotopia.org',
        attributes,
        properties: {
            files:    imageUri ? [{ uri: imageUri, type: 'image/png' }] : [],
            category: 'image',
            module: {
                module_id:            params.module_id,
                module_type:          params.module_type,
                station_mint:         params.station_mint,
                installed_solutions:  params.installed_solutions || [],
            },
        },
    };
}

// ── Builder: EcocitySolution ──────────────────────────────────────────────────

/**
 * Build Metaplex off-chain metadata for an EcocitySolution NFT.
 *
 * @param params  - EcocitySolutionParams object
 * @returns       Metaplex metadata JSON object
 */
export function buildSolutionMeta(params: EcocitySolutionParams): MetaplexMetadata {
    const difficultyLabels: Record<number, string> = {
        1: 'Beginner',
        2: 'Intermediate',
        3: 'Advanced',
        4: 'Expert',
        5: 'Team build',
    };

    const attributes: Array<{ trait_type: string; value: string }> = [
        { trait_type: 'NFT Tier',      value: 'Ecocity Solution' },
        { trait_type: 'Solution ID',   value: params.solution_id },
        { trait_type: 'Category',      value: params.category },
        { trait_type: 'Difficulty',    value: `${params.difficulty} — ${difficultyLabels[params.difficulty]}` },
        { trait_type: 'Build Time',    value: `${params.build_time_days} day${params.build_time_days !== 1 ? 's' : ''}` },
        { trait_type: 'Compatible',    value: params.compatible_modules.join(', ') },
        { trait_type: 'Protocol',      value: 'PON INK v1.0' },
    ];

    const imp = params.impact;
    if (imp.beneficiaries != null)
        attributes.push({ trait_type: 'Beneficiaries',         value: String(imp.beneficiaries) });
    if (imp.water_L_day != null)
        attributes.push({ trait_type: 'Water (L/day)',          value: String(imp.water_L_day) });
    if (imp.kwh_day != null)
        attributes.push({ trait_type: 'Energy (kWh/day)',       value: String(imp.kwh_day) });
    if (imp.co2_kg_saved_day != null)
        attributes.push({ trait_type: 'CO₂ Saved (kg/day)',     value: String(imp.co2_kg_saved_day) });
    if (imp.food_kg_month != null)
        attributes.push({ trait_type: 'Food Output (kg/month)', value: String(imp.food_kg_month) });
    if (imp.floor_area_m2 != null)
        attributes.push({ trait_type: 'Floor Area (m²)',        value: String(imp.floor_area_m2) });

    if (params.owner) {
        attributes.push({ trait_type: 'Owner', value: params.owner });
    }

    const imageUri   = params.image_uri    || '';
    const schematic  = params.schematic_uri || '';

    const files: Array<{ uri: string; type: string }> = [];
    if (imageUri)  files.push({ uri: imageUri,  type: 'image/png' });
    if (schematic) files.push({ uri: schematic, type: 'image/png' });

    return {
        name:         params.solution_name,
        symbol:       'ECOSOL',
        description:  params.description,
        image:        imageUri,
        external_url: params.ecocity_url || 'https://ecocity.com',
        attributes,
        properties: {
            files,
            category: 'image',
            solution: {
                solution_id:        params.solution_id,
                category:           params.category,
                difficulty:         params.difficulty,
                build_time_days:    params.build_time_days,
                materials:          params.materials,
                impact:             params.impact,
                compatible_modules: params.compatible_modules,
                ecocity_url:        params.ecocity_url   || null,
                schematic_uri:      params.schematic_uri || null,
            },
        },
    };
}

// ── CLI smoke test ────────────────────────────────────────────────────────────

if (require.main === module) {
    const coreParams: StationCoreParams = {
        station_id:        'STA-0001',
        station_name:      'Proxima Outpost Alpha',
        owner:             'NatureProtectors',
        commissioned_date: '2026-04-13',
        capacity:          { crew: 12, volume_m3: 2400 },
        exolocation: {
            coordinate_system: 'exo-orbital-v1',
            region_name:       'Sector 4 Low Orbit Band',
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
                type:            'orbital_zone',
                altitude_km_min: 200,
                altitude_km_max: 500,
                inclination_deg: 30,
                longitude_of_ascending_node_deg: 120,
            },
        },
    };

    const moduleParams: StationModuleParams = {
        module_id:   'MOD-GAL-0001',
        module_type: 'gallery',
        module_name: 'Aurora Gallery',
        station_mint: 'STA-0001-MINT-PLACEHOLDER',
        owner:        'NatureProtectors',
        extra_attributes: [
            { trait_type: 'Exhibit Capacity', value: '48' },
            { trait_type: 'Display Format',   value: '3D immersive' },
        ],
    };

    const solutionParams: EcocitySolutionParams = {
        solution_id:     'ibc-aquaponics',
        solution_name:   'IBC Tote Aquaponics System',
        category:        'food',
        description:     '1000 L IBC tote split into fish tank + grow bed. Tilapia fertilise leafy greens through a gravel media bed.',
        difficulty:      3,
        build_time_days: 7,
        materials: [
            { item: '1000 L IBC tote',              qty: '1' },
            { item: 'gravel grow media 20 mm',       qty: '100 L' },
            { item: 'submersible pump 2000 L/h',     qty: '1' },
            { item: 'air pump + airstone',           qty: '1' },
            { item: 'fingerlings (tilapia)',          qty: '20' },
        ],
        impact: {
            beneficiaries:   4,
            food_kg_month:   12,
            water_L_day:     5,
            co2_kg_saved_day: 0.3,
        },
        compatible_modules: ['food', 'watsan'],
        ecocity_url:  'https://ecocity.com/solutions/ibc-aquaponics',
    };

    const coreMeta     = buildStationCoreMeta(coreParams);
    const moduleMeta   = buildModuleMeta(moduleParams);
    const solutionMeta = buildSolutionMeta(solutionParams);

    console.log('\n── Station Core ─────────────────────────────────────────');
    console.log('  name    :', coreMeta.name);
    console.log('  symbol  :', coreMeta.symbol);
    console.log('  attrs   :', coreMeta.attributes.length, 'traits');
    console.log('  JSON len:', JSON.stringify(coreMeta).length, 'bytes');

    console.log('\n── Station Module ───────────────────────────────────────');
    console.log('  name    :', moduleMeta.name);
    console.log('  symbol  :', moduleMeta.symbol);
    console.log('  attrs   :', moduleMeta.attributes.length, 'traits');

    console.log('\n── Ecocity Solution ─────────────────────────────────────');
    console.log('  name    :', solutionMeta.name);
    console.log('  symbol  :', solutionMeta.symbol);
    console.log('  attrs   :', solutionMeta.attributes.length, 'traits');
    console.log('  JSON len:', JSON.stringify(solutionMeta).length, 'bytes');

    console.log('\nAll three metadata objects built successfully.');
}

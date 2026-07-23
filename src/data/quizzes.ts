/**
 * src/data/quizzes.ts
 * Knowledge quiz content for core SCD Hub domains.
 * Each area produces a badge on completion.
 */
import { FINANCE_LITERACY_AREAS } from './finance-literacy-quiz'

export interface QuizQuestion {
  question:    string
  options:     string[]
  correct:     number   // index into options
  explanation: string
}

export interface QuizArea {
  id:            string
  title:         string
  emoji:         string
  description:   string
  difficulty:    'beginner' | 'intermediate' | 'advanced'
  color:         string
  badge:         string
  questionCount: number
  questions:     QuizQuestion[]
}

export const QUIZ_AREAS: QuizArea[] = [

  // ── WATER QUALITY ──────────────────────────────────────────────────────────

  {
    id: 'water', title: 'Water Quality', emoji: '💧',
    description: 'Measurement, assessment, and community monitoring of safe water sources. Covers pH, turbidity, and field protocols.',
    difficulty: 'beginner', color: 'rgba(60,180,255,0.80)',
    badge: 'Water Guardian', questionCount: 6,
    questions: [
      {
        question: 'What pH range is generally considered safe for drinking water?',
        options: ['4.0 – 6.0', '6.5 – 8.5', '9.0 – 11.0', '3.0 – 5.0'],
        correct: 1,
        explanation: 'WHO guidelines recommend pH 6.5–8.5 for drinking water. Values outside this range indicate acidity or alkalinity that can affect taste and health.',
      },
      {
        question: 'Turbidity measures which quality of water?',
        options: ['Temperature', 'Chemical contamination', 'Cloudiness / suspended particles', 'Dissolved oxygen'],
        correct: 2,
        explanation: 'Turbidity is the measure of water clarity — how much light is scattered by suspended particles (sediment, bacteria, algae). It is measured in NTU (Nephelometric Turbidity Units).',
      },
      {
        question: 'Which unit is used to measure electrical conductivity in water?',
        options: ['NTU', 'mg/L', 'µS/cm', 'CFU/100mL'],
        correct: 2,
        explanation: 'Electrical conductivity is measured in microsiemens per centimetre (µS/cm). High conductivity can indicate dissolved salts, metals, or sewage contamination.',
      },
      {
        question: 'What does CFU/100mL measure in water quality?',
        options: ['Fluoride concentration', 'Coliform bacteria count', 'Calcium hardness', 'Chlorine residual'],
        correct: 1,
        explanation: 'Colony Forming Units per 100 mL (CFU/100mL) measures the density of coliform bacteria. Zero CFU is the target for safe drinking water.',
      },
      {
        question: 'In a WATSAN field reading, which parameter most directly indicates faecal contamination?',
        options: ['pH', 'Turbidity', 'Nitrate', 'E. coli / coliform count'],
        correct: 3,
        explanation: 'E. coli is a specific indicator of faecal contamination. Its presence means the water has been in contact with animal or human waste and should not be consumed untreated.',
      },
      {
        question: 'What is the primary purpose of logging GPS coordinates with a water quality reading?',
        options: ['Artistic documentation', 'Tamper-evident on-chain provenance and spatial analysis', 'Satisfying app requirements', 'Estimating travel time'],
        correct: 1,
        explanation: 'GPS-tagged readings allow community water maps to be built over time, identify contamination sources spatially, and provide tamper-evident proof of on-the-ground measurement for the on-chain Water Quality Certificate.',
      },
    ],
  },

  // ── SUSTAINABLE FARMING ────────────────────────────────────────────────────

  {
    id: 'farming', title: 'Sustainable Farming', emoji: '🌾',
    description: 'Soil health, composting, crop rotation, and community food production. Foundation for the Food System settlement pathway.',
    difficulty: 'beginner', color: 'rgba(100,200,80,0.80)',
    badge: 'Soil Steward', questionCount: 5,
    questions: [
      {
        question: 'What does "composting" primarily produce?',
        options: ['Synthetic fertiliser', 'Organic matter that improves soil structure and nutrient content', 'Pesticides', 'Irrigation water'],
        correct: 1,
        explanation: 'Composting decomposes organic waste (food scraps, plant material) into humus — a rich organic matter that improves soil structure, water retention, and provides nutrients to plants without synthetic chemicals.',
      },
      {
        question: 'Why is crop rotation important?',
        options: ['It is purely traditional practice', 'It prevents soil nutrient depletion and breaks pest cycles', 'It requires less water', 'It reduces the number of crops needed'],
        correct: 1,
        explanation: 'Different crops use and return different nutrients. Legumes fix nitrogen; others deplete it. Rotation prevents the build-up of crop-specific pests and diseases while maintaining soil fertility.',
      },
      {
        question: 'In permaculture design, what does "stacking functions" mean?',
        options: ['Building multiple-storey structures', 'Each element serves multiple roles in the system', 'Layering compost in a pile', 'Scheduling crops in time order'],
        correct: 1,
        explanation: 'Stacking functions means designing so each element (a tree, a pond, a chicken) performs multiple roles — shade, food production, pest control, water catchment — reducing overall system inputs.',
      },
      {
        question: 'Which soil pH range is ideal for most vegetable crops?',
        options: ['4.0 – 5.5', '6.0 – 7.0', '8.0 – 9.0', '3.0 – 4.0'],
        correct: 1,
        explanation: 'Most vegetables grow best in slightly acidic to neutral soil (pH 6.0–7.0). At this range, nutrients are most available. Outside this range, essential minerals become locked up and unavailable to plants.',
      },
      {
        question: 'What is "food sovereignty"?',
        options: ['Government control of food supply', "People's right to define their own food systems and policies", 'Exporting all food for economic gain', 'Restricting food imports'],
        correct: 1,
        explanation: 'Food sovereignty is the right of peoples to healthy and culturally appropriate food produced through ecologically sound and sustainable methods, and their right to define their own food and agriculture systems.',
      },
    ],
  },

  // ── ECO-OPS PROTOCOL ───────────────────────────────────────────────────────

  {
    id: 'ecoops', title: 'Eco-Ops Protocol', emoji: '◈',
    description: 'The SCD Hub field check-in system — activity types, on-chain logging, and the WATSAN verification workflow.',
    difficulty: 'intermediate', color: 'rgba(0,200,160,0.80)',
    badge: 'Field Operator', questionCount: 5,
    questions: [
      {
        question: 'Which eco-ops activity type records the source location of a community water supply?',
        options: ['garbageMap', 'sourceMap', 'storageMap', 'transportMap'],
        correct: 1,
        explanation: 'sourceMap records GPS-tagged water source locations — springs, boreholes, rivers, or rain collection points. This feeds the community water quality mapping system.',
      },
      {
        question: 'What makes an eco-ops field reading "tamper-evident"?',
        options: ['It is stored on paper', 'GPS + timestamp + on-chain hash create a verifiable record that cannot be changed retroactively', 'Admin approval', 'Photograph attachment'],
        correct: 1,
        explanation: 'When a reading is submitted, a hash of its data (GPS, timestamp, measurement values) is stored on-chain. Any change to the data would produce a different hash, revealing tampering.',
      },
      {
        question: 'In the Exotopia ecosystem, what does a Water Quality Certificate NFT represent?',
        options: ['Ownership of a water source', 'On-chain proof of a specific field measurement at a specific GPS location and time', 'A water subscription', 'A government permit'],
        correct: 1,
        explanation: 'The Water Quality Certificate NFT encodes pH, turbidity, conductivity, nitrate, and coliform readings with GPS coordinates and timestamp — a permanent, tamper-evident record stored on Polygon.',
      },
      {
        question: 'Which eco-ops activity type would a community use to log a waste collection event?',
        options: ['wqMap', 'farmMap', 'garbageMap', 'cleaningMap'],
        correct: 2,
        explanation: 'garbageMap records waste collection and disposal activities. This feeds community sanitation tracking and contributes to the eco-ops settlement score.',
      },
      {
        question: 'Why does the Eco-Ops protocol require offline-capable data entry?',
        options: ['To reduce server costs', 'Many field locations have unreliable or no internet connectivity', 'Blockchain requires offline data', 'For privacy reasons'],
        correct: 1,
        explanation: 'Field workers in rural areas (borehole sites, farms, remote waterways) often have no internet access. The app queues readings locally and syncs to the chain when connectivity is available.',
      },
    ],
  },

  // ── BLOCKCHAIN BASICS ──────────────────────────────────────────────────────

  {
    id: 'blockchain', title: 'Blockchain Basics', emoji: '🔗',
    description: 'NFTs, wallets, smart contracts, and the on-chain primitives used by PON INK and Exotopia.',
    difficulty: 'beginner', color: 'rgba(160,100,255,0.80)',
    badge: 'Chain Literate', questionCount: 5,
    questions: [
      {
        question: 'What is an NFT?',
        options: ['A type of cryptocurrency you can spend', 'A unique on-chain token proving ownership or provenance of a specific item', 'A banking product', 'A server-side database entry'],
        correct: 1,
        explanation: 'A Non-Fungible Token (NFT) is a unique on-chain record. Unlike fungible tokens (each unit is identical), each NFT is distinct. It can represent art, property rights, certificates, or any unique asset.',
      },
      {
        question: 'What does "minting" an NFT mean?',
        options: ['Designing the artwork', 'Creating the token on-chain for the first time', 'Buying an existing NFT', 'Printing a physical copy'],
        correct: 1,
        explanation: 'Minting is the act of writing a new NFT to the blockchain for the first time — registering it on-chain with its metadata, owner address, and token ID. After minting it can be transferred or traded.',
      },
      {
        question: 'What does "gas" mean in the context of blockchain transactions?',
        options: ['The fuel in a physical server', 'The fee paid to validators for processing a transaction', 'The speed of the network', 'The storage space of a wallet'],
        correct: 1,
        explanation: 'Gas is the computational cost of executing a transaction on a blockchain. Validators (miners/stakers) receive gas fees as compensation for including your transaction in a block.',
      },
      {
        question: 'In the Exotopia ecosystem, what is the Resonance Split?',
        options: ['A sound design feature', '100% to creator — platform is free', 'Equal shares to all participants', 'A 50/50 creator/platform fee'],
        correct: 1,
        explanation: 'The Resonance Split governs how mint-time contributions are allocated: the large majority to the original creator, a slice to the Community Fund (WATSAN/mapping infrastructure), and a small platform-maintenance share — computed independently, never combined. There is no Exotopia-hosted resale market for these tokens.',
      },
      {
        question: 'What is a "compressed NFT" (cNFT) and why does it matter?',
        options: ['A lower-quality image NFT', 'An NFT stored in a Merkle tree that reduces mint cost from ~$0.01 to ~$0.000005', 'A zipped file attachment', 'A mobile-only format'],
        correct: 1,
        explanation: 'Solana Metaplex Bubblegum cNFTs store token data in a Merkle tree rather than individual accounts. This reduces mint cost by ~1000×, making large-scale community airdrops economically viable.',
      },
    ],
  },

  // ── COMMUNITY GOVERNANCE ───────────────────────────────────────────────────

  {
    id: 'governance', title: 'Community Governance', emoji: '⭕',
    description: 'Ecommunity DAO, consensus methods, the circle format, and collective decision-making in the SCD Hub network.',
    difficulty: 'intermediate', color: 'rgba(255,170,50,0.80)',
    badge: 'Circle Keeper', questionCount: 5,
    questions: [
      {
        question: 'What is the core principle of the "circle" meeting format?',
        options: ['One leader makes all decisions', 'Every person faces every other person; voice is equally distributed', 'Silent consensus by email', 'Majority vote overrides all'],
        correct: 1,
        explanation: 'The circle is one of humanity\'s oldest governance technologies. By having everyone face each other, no single person dominates the visual field. Speaking rights rotate. The form itself enforces equity.',
      },
      {
        question: 'In a DAO (Decentralised Autonomous Organisation), what replaces central management?',
        options: ['A hired CEO', 'Smart contracts and token-weighted governance by community members', 'Government oversight', 'One founding member\'s decisions'],
        correct: 1,
        explanation: 'DAOs use on-chain smart contracts to encode rules. Token holders vote on proposals; the contracts execute outcomes automatically. No single entity can override the coded rules without community consensus.',
      },
      {
        question: 'What is "consent-based decision making" as practised in sociocracy?',
        options: ['Everyone must love the idea', 'A decision passes if no member has a paramount objection that would harm the organisation', 'The loudest voice wins', 'Decisions are always deferred'],
        correct: 1,
        explanation: 'Consent is not "I agree this is the best option" but "I can live with this and it won\'t harm us." This lowers the bar for moving forward while still protecting against serious harm — much faster than full consensus.',
      },
      {
        question: 'In the Ecommunity DAO, how do members earn governance tokens?',
        options: ['By purchasing them on an exchange', 'Through participation, facilitation, and mentorship within the community', 'Automatically at registration', 'Only through financial investment'],
        correct: 1,
        explanation: 'Governance tokens in the Ecommunity DAO are earned through active contribution — attending circles, facilitating sessions, mentoring new members — not purchased. This aligns voting power with actual engagement.',
      },
      {
        question: 'What distinguishes a "mentor network" from a conventional training programme?',
        options: ['It uses virtual reality', 'Knowledge flows both ways and long-term relationships replace one-time instruction', 'It is shorter', 'It requires no qualification'],
        correct: 1,
        explanation: 'The SCD Hub mentor network model creates ongoing, reciprocal relationships. Mentors learn from mentees\' local knowledge; mentees gain technical skills. Both gain as the relationship deepens over time — unlike one-time workshops.',
      },
    ],
  },

  // ── PERSONAL FINANCE LITERACY (P-Fin) ────────────────────────────────────
  ...FINANCE_LITERACY_AREAS,

]

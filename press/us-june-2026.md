# PRESS RELEASE — US EDITION

**FOR IMMEDIATE RELEASE**  
**Contact: Greg Willson, SCD Hub — acmeideal@gmail.com**

---

## Colorado Open-Source Project Turns NASA Exoplanet Data Into a Privacy-First Identity Platform — and Is Fighting the Laws That Would Shut It Down

**SCD Hub (Boulder, CO) launches a mathematically novel zero-knowledge proof system protecting field workers in Kenya, Costa Rica, and Southeast Asia — while lobbying Congress against the Kids Online Safety Act provision that would require the same platform to surveil its own users**

---

**BOULDER, Colorado — June 30, 2026** — A Colorado-based open-source nonprofit has quietly built something unusual: a navigable virtual universe constructed from real astronomical data — NASA's Exoplanet Archive, the HYG stellar catalog, XMM-Newton galaxy cluster surveys — where each star system corresponds to a real exoplanet, and where "settling" a virtual world is tied to verified real-world environmental work.

The platform is Exotopia.org, operated by SCD Hub. The environmental credential layer uses an E8 lattice zero-knowledge proof — believed to be the first deployed application of the 240-root E8 exceptional Lie group to a real-world credential issuance system — that proves field work happened without revealing who did it. The payment layer triggers M-Pesa disbursements in Kenya via Cloudflare Workers, with no personal financial data transiting any server SCD Hub controls.

This week, SCD Hub is releasing four regional press editions announcing the platform's expanded launch, and simultaneously notifying its Congressional contacts — specifically Rep. Joe Neguse (D-CO-02, Boulder/Fort Collins) — that the Kids Online Safety Act (KOSA) in its current Senate-passed form would make the platform's privacy-by-default design legally untenable in the United States.

**The technical innovation:**

The E8 root system is an eight-dimensional mathematical structure with exactly 240 symmetry vectors. SCD Hub uses these vectors as cryptographic identity slots — each field contributor holds one slot, and the composite identity of a collaboration is a weighted sum of the contributors' slots, modulo the E8 lattice. The system generates a visual output: a geometric mandala derived from the Coxeter plane projection of the composite vector, unique to every collaboration, verifiable by human eyes without any cryptographic tooling, and also verifiable by a companion machine-scanner library. The proof is anchored on the Algorand blockchain at approximately one thousandth of a cent per verification.

The zero-knowledge proof layer uses halo2 PLONK — an approach that, unlike earlier ZK systems, requires no trusted setup ceremony, making it viable for communities in politically sensitive environments where a ceremony would itself be a target.

For groups larger than eight, the system bridges to the Leech lattice — a 24-dimensional mathematical structure whose optimality was proved by Maryna Viazovska, who received the Fields Medal in 2022 — allowing up to 24 independent organisations to co-sign a joint environmental record with a single on-chain proof.

"The reason we chose E8 is that the mathematics, the visual beauty, and the cryptographic properties are all present at once," said Greg Willson, founder of SCD Hub. "A field monitor in Lamu County can look at their certificate and see something unique. Anyone with a scanner can verify it without contacting our servers. That's a property you can't get from a database record."

**The platform:**

Exotopia.org is navigable: users move through a rendered cosmic web, zoom into galaxy clusters, fly through star systems, and arrive at the surface of a named exoplanet — rendered using surface topology parameters derived from confirmed NASA archive data. Each virtual settlement corresponds to a real astronomical object. Settling a world requires contributing verified environmental work via the Eco-Ledger field tool, completing vocational learning tracks (water and sanitation, solar energy, citizen science), or being granted residency by an active settler.

The platform is free to use. All code is GPL v3.

**The legal conflict:**

SCD Hub's commentary system — a private, green-light mutual-connection messaging tool allowing community members to communicate only with people they have explicitly accepted — is potentially non-compliant with the Kids Online Safety Act (KOSA) as passed by the US Senate 91-3 in July 2024, and not yet enacted into law as of this release.

The relevant KOSA provision imposes a duty-of-care on platforms with features including "comments, reactions, and interactive functionality." SCD Hub's system meets that technical definition. Compliance, under KOSA's current framework, would likely require the platform to surveil or algorithmically audit communications — directly contradicting its design philosophy of private communications visible only to mutually consenting parties.

SCD Hub, as a Colorado organisation, is targeting Rep. Joe Neguse (D-CO-02) as a primary Congressional contact. Rep. Neguse represents the Boulder-Fort Collins corridor and sits on the House Judiciary Committee, which would hold jurisdiction over the relevant surveillance law provisions.

"Our position is that the CSAM detection requirement — hash-matching against the NCMEC database — is a requirement we comply with, because that is about detecting known criminal material, not surveilling communications," Willson said. "What we oppose is the portion of KOSA that could require algorithmic review of the content of private consented communications between adults. That is a surveillance infrastructure mandate dressed as a child protection measure."

SCD Hub supports COPPA 2.0 as the preferred alternative legislative framework, alongside an age-gate approach that does not require scanning the content of consented private communications.

Rep. Neguse's Boulder district office is located at 1644 Walnut St, Boulder, CO 80302. His DC office is at 1419 Longworth House Office Building, Washington, DC 20515.

**Deployment status:**

The proof system is in active deployment in Mpeketoni, Lamu County, Kenya, where Muirithi Jariffe leads the community group piloting the Eco-Ledger integration. A Costa Rica deployment is in planning with SINAC partner contacts. Three vocational learning tracks (WATSAN, Solar, Citizen Science) are complete and issuing W3C Verifiable Credentials 2.0 / Open Badges 3.0 certificates. A seven-person private commentary test group — including members in the US, Africa, and Central America — is testing the Supabase-backed green-light commentary system.

The full technical specification for the ZK proof layer is available at `SPEC_ZK_E8_PLONK.md` in the public repository. The full compliance and online safety risk assessment is at `compliance/SOCIAL-COMMENTARY-ONLINE-SAFETY.md`.

---

**Suggested US media targets:**

*Technology / Crypto / Privacy:*  
Wired · The Verge · Ars Technica · TechCrunch · EFF Deeplinks (eff.org/deeplinks) · Decrypt · CoinDesk · The Block · MIT Technology Review

*Colorado regional:*  
Colorado Sun · Denver Post · Boulder Daily Camera · Colorado Public Radio (CPR News) · Westword · KUNC (Northern Colorado NPR affiliate)

*Policy / Academic:*  
Lawfare · Just Security · Columbia Journalism Review (media-and-tech coverage) · Science News

---

**Background contacts:**

- **Technical questions / E8 proof architecture:** Greg Willson, SCD Hub — acmeideal@gmail.com
- **Policy questions / KOSA lobbying effort:** Greg Willson, SCD Hub
- **Rep. Neguse's office (Boulder):** 1644 Walnut St, Boulder, CO 80302 — (303) 335-1045
- **Rep. Neguse's DC office:** 1419 Longworth HOB — (202) 225-2161
- **Independent ZK proof review:** University of Colorado Boulder Dept. of Computer Science (lattice cryptography research group); Colorado State University Dept. of Mathematics

---

**About SCD Hub / Exotopia.org**  
SCD Hub is a Colorado-based open-source sustainable community development organisation. Exotopia.org is a navigable virtual universe built on confirmed exoplanet and astronomical data, where virtual settlement is tied to real environmental field work. Community data remains with the communities that generate it. Platform code is GPL v3.

**Website:** exotopia.org  
**Technical repository:** github.com/biomassives/vercel-html-exotopia.org  
**ZK proof specification:** SPEC_ZK_E8_PLONK.md (in repository)  
**Compliance and online safety assessment:** compliance/SOCIAL-COMMENTARY-ONLINE-SAFETY.md (in repository)  
**Contact:** Greg Willson — acmeideal@gmail.com

###

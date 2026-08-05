# What Dark Matter Actually Looks Like

## The DK.MAT button recolors a wormhole purple. Here's what the clusters we already have data for would show if it didn't.

*SCD Hub / Exotopia.org — August 2026*

---

Exotopia's cosmic view has three toggles: NAT, X-RAY, and DK.MAT. Look at what they actually do and the honest description is: NAT is the default render; X-RAY recolors the wormhole conduit meshes orange; DK.MAT recolors them purple, scales them up, and shows a text panel about "void-edge conduit networks." None of the three touch a single galaxy cluster's actual data. X-ray mode doesn't show anything about X-ray temperature, and dark matter mode doesn't show anything about mass. This post is the case for why that's worth fixing, using data this app already has sitting in its own `public/clusters/*.json` files — and the companion spec, [SPEC_DARK_MATTER_VIEW.md](https://github.com/biomassives/vercel-html-exotopia.org/blob/main/SPEC_DARK_MATTER_VIEW.md), is the plan to actually fix it.

---

## The evidence isn't exotic — it's arithmetic

Dark matter isn't inferred from anything more exotic than adding up mass twice and getting two different answers. Count the light — stars, gas, everything that glows — and you get one number. Measure the actual gravity — how fast things orbit, how much a cluster bends the light behind it — and you get a much bigger one. The gap between those two numbers, repeated in every galaxy and cluster ever measured carefully enough to check, is dark matter. That's it. No particle has ever been directly detected; the case rests entirely on gravity doing more than the visible mass can explain, over and over, independently, at every scale from a single galaxy's rotation curve to the largest structures in the universe.

Three of the clusters Exotopia already features carry that evidence directly, and we have real, cited numbers for them from a research pass earlier this project ran on cluster calibration constants ([SPEC_XCLUSTER_STARSYSTEMS.md](https://github.com/biomassives/vercel-html-exotopia.org/blob/main/SPEC_XCLUSTER_STARSYSTEMS.md) §5 has the full citation trail):

**Coma Cluster** is where this started. In 1933, Fritz Zwicky measured the velocity dispersion of just seven galaxies in Coma and used the virial theorem to back out the cluster's total mass — and got a number about ten times larger than the visible starlight could account for. He called the missing mass *dunkle Materie*. Ninety years and roughly a thousand times more redshift measurements later, Coma's velocity dispersion (1,082 km/s, Colless & Dunn 1996) is essentially unchanged from Zwicky's original estimate, and the newest mass measurement — Subaru/HSC weak gravitational lensing, published in 2026 — puts Coma's total mass at 8.2×10¹⁴ solar masses. The stars in Coma's ~1,000 bright galaxies account for a small fraction of that.

**The Bullet Cluster** (1E 0657-56) is the direct proof, not an inference. Two galaxy clusters collided about 150 million years ago. Their hot gas — which is most of each cluster's normal, baryonic matter — collided too, and got dragged behind, the way air resistance slows a runner more than their shadow. But when astronomers mapped where the *mass* actually is, using how the collision bends light from galaxies behind it (gravitational lensing), the mass didn't stay with the gas — it kept moving with the galaxies, projected roughly 450,000 and 320,000 light-years ahead of where the gas ended up (Clowe et al. 2006). Something with mass had passed straight through the collision, unaffected by it, while the normal matter got left behind. That something is 76–82% of the cluster's total mass. This is the textbook image for a reason: it's not a fit to a model, it's two different mass tracers physically disagreeing about where the mass is, in the same collision, at the same time.

**NGC 1407**, the anchor galaxy of the Eridanus Supergroup — one of Exotopia's fifteen featured clusters — is a quieter but stranger case. Its mass-to-light ratio is 311 (±60) times the Sun's, an extreme outlier for a galaxy of its visible luminosity (Zhang et al. 2007). Follow-up work using globular cluster kinematics out to 60 kiloparsecs (Romanowsky et al. 2009) found the baryon fraction — the share of NGC 1407's mass that's actually made of normal matter — is around 0.4%. Almost the entire halo is dark.

## What Exotopia's own cluster data already supports

Every named cluster this app features ships a real `M200_1e14` figure (total mass, in units of 10¹⁴ solar masses) and `rvir_mpc` (virial radius) in its own `public/clusters/*-members.json` file — the same numbers the recent calibration research pass checked against current literature. That's already enough to draw something real: a halo isn't a shape anyone can see, but its *extent* is a real, cited number, and it's dramatically larger than the visible galaxy distribution the current render shows. Virgo's ~250 rendered member galaxies fit inside roughly a tenth of a megaparsec of visible structure; its real virial radius is over a megaparsec. The dark matter isn't a texture to add — it's most of the volume the visible galaxies are sitting inside of.

That's the difference between "DK.MAT recolors a decorative wormhole" and an actual dark matter view: one is set dressing, the other is a real, sourced number this app is already loading and just isn't drawing.

## What this doesn't mean

Two things worth being upfront about, since this project is careful about the line between real and generated (see [Counting the Universe](/blog/counting-the-universe)): a halo-extent overlay drawn from real M200/r_vir values is real astrophysics, but it's not a *map* — nobody has measured the 3D shape of any cluster's dark matter distribution the way a weak-lensing study measures a 2D projected mass sheet for one specific, well-studied system like the Bullet Cluster. A generic "here's roughly how big and how massive this halo is" overlay for all fifteen named clusters is honest; pretending it's a resolved dark matter *map* for all of them would not be. The spec keeps that distinction explicit — real halo extent everywhere, the one real resolved offset image only where it's actually been measured (the Bullet Cluster, and nowhere else).

Read the implementation plan: [SPEC_DARK_MATTER_VIEW.md](https://github.com/biomassives/vercel-html-exotopia.org/blob/main/SPEC_DARK_MATTER_VIEW.md).

## Sources

1. Zwicky, F. 1933, "Die Rotverschiebung von extragalaktischen Nebeln," *Helvetica Physica Acta*, 6, 110.
2. Colless, M. & Dunn, A. M. 1996, *ApJ*, 458, 435 — Coma velocity dispersion.
3. HyeongHan, K., Finner, K., Jee, M. J., et al. 2026, arXiv:2606.12523 — Subaru/HSC weak-lensing mass of Coma.
4. Clowe, D., et al. 2006, "A Direct Empirical Proof of the Existence of Dark Matter," *ApJ*, 648, L109.
5. Kokorev, V., et al. 2025/2026, arXiv:2512.03150 — revised Bullet Cluster mass ratio and dark matter fraction.
6. Zhang, Z., Xu, H., Wang, Y., et al. 2007, *ApJ* (arXiv:astro-ph/0610934) — NGC 1407 group mass-to-light ratio.
7. Romanowsky, A. J., Strader, J., Spitler, L. R., et al. 2009, *AJ*, 137, 4956 — NGC 1407 baryon fraction.

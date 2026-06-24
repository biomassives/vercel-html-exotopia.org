# SPEC_FEE_ISOLATION.md — Ledger Separation, Auditability & Computational Reference

### Strict Separation of Protocol Operational Maintenance Fees from Grassroots Community Payouts

*SCD Hub · exotopia.org · pon.ink · ecocity.com · GPL v3 · Living Document — May 2026*

---

## 0. Context, Philosophy & The Mandate

Within the Exotopia and SCD Hub development framework, a core engineering directive dictates the following mandate:

> **Isolate Fees from Payout Computations:** *Maintain a strict separation between protocol maintenance fees and raw community payouts on developer dashboard visualizers. Ensure that field agents can accurately audit their localized earnings without confusing network fees with their own compensation.*

When grassroots mutual-aid initiatives—such as the **Mpeketoni Table Banking Group** or coastal **Recycler/Collector Environmental Collectives**—interact with distributed public networks, any obfuscation of financial telemetry degrades systemic trust. Network gas fluctuations (e.g., Solana lamport spikes, compression tree execution fees) or protocol maintenance deductions must never be combined with, or subtracted implicitly from, the raw volume calculated for a worker's real-world labor.

This document serves as the authoritative, living operational specification and computational manual for junior engineers to ensure absolute structural isolation between operational overhead and localized compensation.

---

## 1. General Working Assumptions & Core Principles

To eliminate ambiguity across our Rust engines, embedded C layers, and TypeScript dashboard interfaces, all modules must abide by the following programmatic assumptions:

1. **The Principle of Two Streams:** A transaction payload is processed as two non-interlocking mathematical streams: the **Community Livelihood Stream ($S_c$)** and the **Protocol Maintenance Stream ($S_m$)**. They may be bound inside the same atomic block, but they must never share a common variable register during execution.
2. **No Floating-Point Representation:** All financial metrics must be handled inside code blocks exclusively using integer math (e.g., minor currency units or basis points). For Kenyan Shillings ($KES$), values are tracked as **Cents** ($1 \text{ KES} = 100 \text{ Cents}$). For network transactions, values are tracked as raw **Lamports** ($1 \text{ SOL} = 1,000,000,000 \text{ Lamports}$). Floating-point drift is a direct security vulnerability and is disallowed.
3. **The Base-Asset Anchoring Principle:** The community payout calculation is anchored directly to physical telemetry (e.g., exact net weight of ocean-bound plastics gathered or community-audited capital pool reserves) or fixed royalty metrics. It remains invariant regardless of the underlying network's congestion state or fee environment.
4. **Asynchronous Local Buffer:** In line with our multi-timescale privacy grid, if network gas costs exceed a dynamic local threshold due to public congestion, the transaction must be cached locally within the **Operational Horizon** layer rather than drawing down on the worker's net payout to cover the difference.

---

## 2. Mathematical & Computational Model

Let $W$ be the raw material telemetry input logged at a field terminal (e.g., total weight in grams of collected PET plastic), and let $R_{\text{base}}$ be the structurally guaranteed community base-rate per unit.

The **Gross Community Payout ($P_{\text{gross}}$)** is defined strictly as:

$$P_{\text{gross}} = W \times R_{\text{base}}$$

Let $F_{\text{gas}}$ be the raw network computation fee, $F_{\text{tree}}$ be the concurrent Merkle tree storage modification fee, and $F_{\text{dao}}$ be the protocol operational maintenance buffer configured by the governance layer. The **Total Operational Fee ($F_{\text{total}}$)** is calculated independently:

$$F_{\text{total}} = F_{\text{gas}} + F_{\text{tree}} + F_{\text{dao}}$$

Under no circumstances is the network settlement value or the visual display calculated via an un-isolated net equation such as $\text{Payout} = P_{\text{gross}} - F_{\text{total}}$. Instead, the financial router populates two distinct payment instructions within the runtime framework. The protocol maintenance stream ($F_{\text{total}}$) is drawn explicitly from a dedicated **DAO Operational Gas Treasury Account**, keeping the **Community Livelihood Stream** untouched.

---

## 3. Reference Implementations

### 3.1 Rust Module: Strict Isolated Transaction Construction

This implementation handles the creation of isolated state transformations, using separate tracking variables to completely eliminate compilation or runtime cross-contamination.

```rust
// src/financials/fee_isolation.rs

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LocalizedCurrency {
    pub cents: u64, // Tracked strictly in minor currency units (e.g., 100 Cents = 1 KES)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NetworkLamports {
    pub value: u64,
}

pub struct TelemetryReceipt {
    pub plastic_grams: u64,
    pub base_rate_cents_per_kilo: u64,
}

pub struct SplitSettlement {
    pub raw_community_payout: LocalizedCurrency,
    pub protocol_maintenance_fee: LocalizedCurrency,
    pub underlying_gas_cost: NetworkLamports,
}

pub struct SettlementRouter;

impl SettlementRouter {
    /// Constructs a fully segregated settlement profile.
    /// Guarantees that community payouts are mathematically isolated from protocol fees.
    pub fn compute_isolated_settlement(
        receipt: &TelemetryReceipt,
        fixed_dao_fee_cents: u64,
        current_gas: NetworkLamports,
    ) -> SplitSettlement {
        // Step 1: Calculate raw community payout based entirely on physical telemetry
        let kilo_factor = 1000;
        let community_payout_cents = (receipt.plastic_grams * receipt.base_rate_cents_per_kilo) / kilo_factor;
        
        // Step 2: Calculate operational fees completely independent of the worker's payout stream
        let protocol_fee_cents = fixed_dao_fee_cents;

        // Step 3: Populate the segregated data architecture
        SplitSettlement {
            raw_community_payout: LocalizedCurrency { cents: community_payout_cents },
            protocol_maintenance_fee: LocalizedCurrency { cents: protocol_fee_cents },
            underlying_gas_cost: current_gas,
        }
    }
}

```

### 3.2 TypeScript Dashboard Controller: Auditable Visual UI Binding

This controller guarantees that the frontend data presentation layer mirrors the strict isolation maintained by the backend engine. It prevents developers from accidentally grouping metrics inside user components.

```typescript
// src/financials/dashboardBinder.ts

interface RenderablePayoutData {
    collectorId: string;
    grossCommunityPayoutCents: number;
    protocolMaintenanceFeeCents: number;
    networkGasLamports: number;
}

export class SecurityAuditorDashboard {
    /**
     * Binds isolated transaction streams safely to the visual presentation interface.
     * Enforces strict UI separation to empower clear, independent field auditing.
     */
    public renderAuditableTelemetryMetrics(elementId: string, data: RenderablePayoutData): void {
        const targetContainer = document.getElementById(elementId);
        if (!targetContainer) {
            throw new Error(`Target UI node with ID [${elementId}] not found in DOM.`);
        }

        const rawKeshPayout = (data.grossCommunityPayoutCents / 100).toFixed(2);
        const protocolFeeKesh = (data.protocolMaintenanceFeeCents / 100).toFixed(2);
        const networkGasSol = (data.networkGasLamports / 1_000_000_000).toFixed(9);

        // Build HTML template utilizing completely separate semantic containers
        targetContainer.innerHTML = `
            <div class="audit-card-wrapper" style="border: 1px solid rgba(0, 229, 255, 0.2); padding: 12px; background: #010c16;">
                <div class="worker-compensation-panel" style="margin-bottom: 10px; border-left: 3px solid #00e5ff; padding-left: 8px;">
                    <span style="color: #88a0b0; font-size: 11px; text-transform: uppercase;">Guaranteed Community Payout</span>
                    <h2 style="color: #00e5ff; margin: 2px 0;" id="ui-worker-net-yield">KES ${rawKeshPayout}</h2>
                    <small style="color: rgba(0, 229, 255, 0.6);">Direct compensation for recorded field environmental telemetry.</small>
                </div>

                <div class="platform-overhead-panel" style="border-top: 1px solid rgba(136, 160, 176, 0.15); padding-top: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #88a0b0;">
                        <span>System Operational Fee:</span>
                        <span style="color: #ff3c8c; font-family: monospace;">KES ${protocolFeeKesh}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #88a0b0; margin-top: 4px;">
                        <span>On-Chain Computing Gas:</span>
                        <span style="color: #ff3c8c; font-family: monospace;">${networkGasSol} SOL</span>
                    </div>
                </div>
                
                <div class="audit-status" style="margin-top: 8px; text-align: right;">
                    <span style="font-size: 9px; background: rgba(0, 229, 255, 0.1); color: #00e5ff; padding: 2px 6px; border-radius: 2px;">
                        ✓ AUDIT STATUS: ISOLATION CONFIRMED
                    </span>
                </div>
            </div>
        `;
    }
}

```

---

## 4. UI Layout Specifications (The Visual Strip Standard)

Junior developers working on dashboard templates or terminal layouts must adhere to this visual layout. It enforces distinct spatial boundaries for each calculation stack:

```
+-----------------------------------------------------------------------+
|  [ HUB VERIFICATION IDENTIFIER: LOCAL_COOP_NODE_MPEK_4019 ]           |
+-----------------------------------------------------------------------+
|                                                                       |
|   🌾 RAW WORKER COMPENSATION STREAM (100% Isolated)                   |
|   ==================================================                  |
|   NET PAYOUT FOR REAL LABOR:  [ KES 1,420.00 ]                        |
|   (Calculated directly from telemetry metrics: 11.83 Kg Cleaned)      |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|   ⚙️ SYSTEM OPERATIONAL OVERHEAD TRACK (Subsidized Pool Log)          |
|   ==========================================================          |
|   Protocol Maintenance Draw:  [ KES 15.00 ]                           |
|   Solana Execution Compute:   [ 0.000005420 SOL ]                     |
|                                                                       |
+-----------------------------------------------------------------------+
|   [!] STATUS: Field agent earnings match physical ledger balances.    |
+-----------------------------------------------------------------------+

```

---

## 5. Security & Verification Directives for Auditing

1. **The Inverse Verification Principle:** Any security test suite built for our financial layers must include tests that artificially manipulate the `current_gas` variable up to extreme simulation parameters. The test suite must assert that the output value of `raw_community_payout` remains mathematically unchanged.
2. **Mandatory Dashboard Code Reviews:** No code changes targeting dashboards or visual interfaces may be merged if they mix, condense, or subtract overhead variables directly inside the text presentation components.
3. **Open Audit Trail:** The calculation tracking modules must remain open-source and auditable under **GPL v3**. Local user groups retain absolute authority over their underlying data structures and financial reporting templates.

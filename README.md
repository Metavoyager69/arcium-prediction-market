# ðŸ”’ Oracle Nexus â€” Private Prediction Markets on Solana Ã— Arcium

> **Arcium RTG Bounty Submission** â€” Prediction/Opinion Markets track

Prediction markets aggregate collective intelligence â€” but only when participants reveal their genuine beliefs. On traditional platforms, **public stakes create herding**: users copy popular positions rather than contributing independent analysis, distorting prices and defeating the entire purpose.

**Oracle Nexus** solves this with Arcium's Multi-Party Computation (MPC). Stakes, votes, and resolution inputs remain **fully encrypted on-chain** until settlement. Outcomes are revealed honestly, restoring incentive-compatible participation.

---

## ðŸŽ¯ What This Project Does

Oracle Nexus is a fully functional decentralised prediction market where:

| Feature | Traditional Market | Oracle Nexus (Arcium) |
|---|---|---|
| Stake amount visible | âœ… Anyone can see | âŒ Encrypted (ElGamal) |
| Vote direction visible | âœ… YES/NO on-chain | âŒ Ciphertext on-chain |
| Real-time odds | âœ… Manipulatable | âŒ Hidden until settlement |
| Resolution input | âœ… Oracle can be front-run | âŒ Encrypted until MPC tally |
| Settlement | Simple summation | Threshold MPC decryption |

---

## ðŸ” How Arcium Is Used

### 1. Client-Side Encryption (Before Submission)

When a user places a position, their browser:

1. Fetches the **Arcium cluster's public key** from the on-chain registry
2. Generates fresh randomness `r`
3. Encrypts stake amount `m` as an **ElGamal ciphertext**:
   ```
   C1 = r Â· G          (ephemeral public key)
   C2 = m Â· G + r Â· PK  (blinded message)
   ```
4. Encrypts YES/NO choice with the same scheme
5. Only the ciphertexts `(C1, C2)` are submitted to Solana

**The plaintext never touches the blockchain.**

### 2. Homomorphic Accumulation (During Market)

Arcium nodes monitor the Solana program for `PositionSubmitted` events. As positions arrive, they homomorphically accumulate ciphertexts:

```
Î£(C1) = Î£(r_i) Â· G
Î£(C2) = Î£(m_i) Â· G + Î£(r_i) Â· PK
```

This is valid because ElGamal encryption over Ristretto255 is **additively homomorphic** â€” encrypted values can be summed without decryption.

### 3. Threshold MPC Decryption (At Settlement)

After `resolution_timestamp`, anyone triggers `request_tally()`. The Arcium cluster:

1. Each of `n` MPC nodes holds a **key share** `sk_i` such that `Î£ sk_i = sk`
2. A threshold `t` of nodes compute partial decryptions: `D_i = sk_i Â· C1`
3. The partial decryptions are combined: `m Â· G = C2 - Î£ D_i`
4. The result is posted on-chain via the Arcium relayer

**No single node can decrypt alone.** Quorum is required. This prevents the market operator, Arcium employees, or any single party from learning the tally before settlement.

### 4. Per-Position Reveal

After market settlement, individual positions are also decrypted by the Arcium cluster, enabling proportional payout calculation. Each user's stake and choice are revealed only at claim time.

---

## ðŸ—ï¸ Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    SOLANA ON-CHAIN                       â”‚
â”‚                                                         â”‚
â”‚  MarketRegistry â”€â”€â–º Market â”€â”€â–º Position (per user)      â”‚
â”‚       â”‚               â”‚             â”‚                   â”‚
â”‚  arcium_cluster    vault PDA    encrypted_stake (C1,C2) â”‚
â”‚                               encrypted_choice (C1,C2)  â”‚
â”‚                                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                           â”‚ Events / CPI
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                 ARCIUM MXE CLUSTER                       â”‚
â”‚                                                         â”‚
â”‚  Node 1 (sk_1) â”€â”                                       â”‚
â”‚  Node 2 (sk_2) â”€â”¼â”€â”€â–º Threshold MPC â”€â”€â–º Decrypt Result  â”‚
â”‚  Node N (sk_N) â”€â”˜                          â”‚            â”‚
â”‚                                            â–¼            â”‚
â”‚                                      Arcium Relayer     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                           â”‚ settle_market() CPI
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              SETTLEMENT ON-CHAIN                         â”‚
â”‚  revealed_yes_stake, revealed_no_stake, outcome          â”‚
â”‚  â†’ Winners claim proportional payouts from vault         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ“ Project Structure

```
oracle-nexus/
â”œâ”€â”€ programs/
â”‚   â””â”€â”€ prediction-market/
â”‚       â””â”€â”€ src/
â”‚           â””â”€â”€ lib.rs          # Anchor smart contract (Solana program)
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ Navbar.tsx
â”‚   â”‚   â””â”€â”€ MarketCard.tsx
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ index.tsx           # Market listing
â”‚   â”‚   â”œâ”€â”€ market/[id].tsx     # Market detail + position submission
â”‚   â”‚   â”œâ”€â”€ create/index.tsx    # Create new market
â”‚   â”‚   â””â”€â”€ how-it-works/      # Arcium flow explainer
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â”œâ”€â”€ arcium.ts           # Client-side encryption utilities
â”‚   â”‚   â””â”€â”€ program.ts          # Anchor client helpers & PDAs
â”‚   â””â”€â”€ styles/globals.css
â”œâ”€â”€ tests/
â”‚   â””â”€â”€ prediction-market.ts   # Anchor integration tests
â”œâ”€â”€ scripts/
â”‚   â””â”€â”€ setup.sh               # One-command full setup
â”œâ”€â”€ Anchor.toml
â””â”€â”€ README.md
```

---

## ðŸš€ Quick Start (From Scratch)

### Prerequisites

The setup script installs everything automatically:

```bash
git clone https://github.com/YOUR_USERNAME/oracle-nexus
cd oracle-nexus
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This installs: Rust, Solana CLI, Anchor CLI, Node.js, and configures a devnet wallet with an SOL airdrop.

### Manual Setup

If you prefer to install manually:

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.22/install)"
solana config set --url https://api.devnet.solana.com

# 3. Create wallet & airdrop
solana-keygen new
solana airdrop 4

# 4. Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1 && avm use 0.30.1

# 5. Build & deploy
anchor build
anchor deploy

# 6. Start frontend
cd app
npm install
npm run dev
```

### Connect Phantom Wallet

1. Install [Phantom](https://phantom.app)
2. Settings â†’ Developer Settings â†’ **Change Network â†’ Devnet**
3. Visit `http://localhost:3000` and connect

---

## ðŸ§ª Running Tests

```bash
anchor test
```

Tests cover:
- Protocol initialisation with Arcium cluster assignment
- Market creation with future resolution timestamp
- Encrypted position submission (ciphertexts stored, not plaintext)
- Tally request and settlement flow

---

## ðŸ”‘ Key Program Instructions

| Instruction | Description |
|---|---|
| `initialize` | Deploy registry, assign Arcium cluster |
| `create_market` | Create a new prediction market |
| `submit_position` | Submit encrypted (stake, choice) ciphertexts |
| `request_tally` | Lock market, emit Arcium MPC job request |
| `settle_market` | Receive MPC result, reveal outcome |
| `reveal_position` | Arcium reveals per-position decryption |
| `claim_winnings` | Winner claims proportional payout from vault |

---

## ðŸŒ Privacy Benefits Summary

1. **No Herding** â€” Users can't see others' positions, eliminating copycat behaviour
2. **No Frontrunning** â€” Resolution inputs are encrypted; oracles cannot manipulate settlement
3. **No Market Manipulation** â€” Whale positions are invisible; no one can trigger liquidations by tracking large stakes
4. **Genuine Price Discovery** â€” Odds are hidden until settlement, forcing participants to submit based on true beliefs
5. **Non-custodial** â€” All funds in Solana PDAs; only the program logic can release them

---

## ðŸ“„ License

MIT â€” Open Source

---

## ðŸ™ Credits

- [Arcium](https://arcium.com) â€” MPC privacy layer
- [Anchor](https://www.anchor-lang.com) â€” Solana smart contract framework
- [Solana](https://solana.com) â€” High-throughput blockchain

*Built for the Arcium RTG Bounty â€” Prediction Markets track*


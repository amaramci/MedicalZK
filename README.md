# MedicalZK - Cold Chain Verification

A system for proving cold chain integrity using Zero-Knowledge proofs. Carriers can prove that a drug **was never exposed to out-of-range temperatures** during transport, without revealing the actual sensor readings.

The Groth16 proof is verified directly on-chain — no trusted intermediary required.

## Running the project

**1. Compile contracts and start a local chain**
```bash
cd contracts
anvil --host 127.0.0.1 --port 8545 &

forge create src/Verifier.sol:Groth16Verifier \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

forge create src/ColdChainVerifier.sol:ColdChainVerifier \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --constructor-args <VERIFIER_ADDR> \
  --broadcast
```

**2. Install dependencies**
```bash
cd backend  && npm install
cd frontend && npm install
cd circuits && npm install circomlib
```

**3. Compile the ZK circuit** (first time only)
```bash
bash scripts/setup-circuit.sh
```

**4. Start backend and frontend**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

App is available at [http://localhost:5173](http://localhost:5173)

## Temperature ranges

| Drug | Min | Max |
|------|-----|-----|
| Insulin, refrigerated vaccines | 2°C | 8°C |
| Frozen vaccines (MMR) | -20°C | -15°C |
| Ambient drugs | 15°C | 25°C |

The system accepts values in the range **-40°C to +50°C**.

## Sequence diagram

```
Sensors          Backend              ZK Circuit          Blockchain
   |                |                     |                    |
   |  temperature   |                     |                    |
   |--------------->|                     |                    |
   |                |                     |                    |
   |                |  readings + range   |                    |
   |                |-------------------->|                    |
   |                |                     |                    |
   |                |  Poseidon hash      |                    |
   |                |<--------------------|                    |
   |                |                     |                    |
   |                |  groth16.fullProve  |                    |
   |                |-------------------->|                    |
   |                |                     |                    |
   |                |  {pi_a,pi_b,pi_c}   |                    |
   |                |<--------------------|                    |
   |                |                     |                    |
   |                |  submitProof(pA,pB,pC,pubSignals)        |
   |                |----------------------------------------->|
   |                |                     |                    |
   |                |                     |   verifyProof()    |
   |                |                     |   pairing check    |
   |                |                     |<------------------>|
   |                |                     |                    |
   |                |  {txHash, verified} |                    |
   |                |<-----------------------------------------|
   |                |                     |                    |
  Client          REST                                      Solidity
   |                |                     |                    |
   |  GET /proof    |                     |                    |
   |--------------->|                     |                    |
   |  verified+tx   |                     |                    |
   |<---------------|                     |                    |
```

## Stack

| Layer | Technology |
|-------|-----------|
| ZK proofs | Circom 2.0, Groth16, snarkjs |
| Hash | Poseidon (circomlibjs) |
| Backend | Node.js, Express, SQLite |
| Frontend | React 18, Vite, Recharts |
| Chain | Solidity 0.8.20, Foundry, Anvil |
| Cryptography | BN128 elliptic curve |

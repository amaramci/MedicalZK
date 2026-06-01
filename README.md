# MedicalZK — Cold Chain Verification

Sustav za dokazivanje integriteta lanca hladnjače koristeći Zero-Knowledge dokaze. Transporteri mogu dokazati da lijek **nije bio izložen nedozvoljenim temperaturama** tokom transporta, bez otkrivanja stvarnih vrijednosti mjerenja.

Groth16 dokaz se verificira direktno na blockchainu — nema povjerenja u posrednika.

## Pokretanje

**1. Kompajlirati ugovor i pokrenuti lokalni chain**
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

**2. Instalirati zavisnosti**
```bash
cd backend  && npm install
cd frontend && npm install
cd circuits && npm install circomlib
```

**3. Kompajlirati ZK circuit** (samo prvi put)
```bash
bash scripts/setup-circuit.sh
```

**4. Pokrenuti backend i frontend**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Aplikacija je dostupna na [http://localhost:5173](http://localhost:5173)

## Temperaturni opsezi

| Lijek | Min | Max |
|-------|-----|-----|
| Insulin, vakcine (rashladne) | 2°C | 8°C |
| Zamrznute vakcine (MMR) | -20°C | -15°C |
| Ambijentalni lijekovi | 15°C | 25°C |

Sistem prihvata vrijednosti u rasponu **-40°C do +50°C**.

## Sequence dijagram

```
Senzori          Backend              ZK Circuit          Blockchain
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
 Korisnik         REST                                      Solidity
   |                |                     |                    |
   |  GET /proof    |                     |                    |
   |--------------->|                     |                    |
   |  verified+tx   |                     |                    |
   |<---------------|                     |                    |
```

## Tehnologije

| Sloj | Tehnologija |
|------|------------|
| ZK dokazi | Circom 2.0, Groth16, snarkjs |
| Hash | Poseidon (circomlibjs) |
| Backend | Node.js, Express, SQLite |
| Frontend | React 18, Vite, Recharts |
| Chain | Solidity 0.8.20, Foundry, Anvil |
| Kriptografija | BN128 eliptička krivulja |

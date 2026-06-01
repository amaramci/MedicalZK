const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log("Groth16Verifier:", verifierAddr);

  const ColdChain = await hre.ethers.getContractFactory("ColdChainVerifier");
  const coldChain = await ColdChain.deploy(verifierAddr);
  await coldChain.waitForDeployment();
  const coldChainAddr = await coldChain.getAddress();
  console.log("ColdChainVerifier:", coldChainAddr);

  // Write addresses to a file the backend reads
  const deployment = {
    network: hre.network.name,
    Groth16Verifier: verifierAddr,
    ColdChainVerifier: coldChainAddr,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.resolve(__dirname, "../../backend/src/contracts/deployment.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log("Deployment info written to backend/src/contracts/deployment.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

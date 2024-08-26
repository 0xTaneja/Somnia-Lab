const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking wallet configuration...");
  
  const [deployer] = await ethers.getSigners();
  
  console.log(`📍 Deployer Address: ${deployer.address}`);
  
  // Check if we have a private key in env
  if (process.env.PRIVATE_KEY) {
    console.log(`🔑 Private key found in .env: ${process.env.PRIVATE_KEY.substring(0, 10)}...`);
    
    // Create wallet directly from private key to verify
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    console.log(`🆔 Address from private key: ${wallet.address}`);
    
    if (wallet.address !== deployer.address) {
      console.log("❌ MISMATCH: Hardhat is using different address than expected!");
    } else {
      console.log("✅ Address matches private key");
    }
  } else {
    console.log("❌ No PRIVATE_KEY found in .env file");
    console.log("🔄 Hardhat is using default test account");
  }
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} STT`);
  
  console.log("\n🎯 Expected: ~1.49987 STT");
  console.log(`🔍 Actual: ${ethers.formatEther(balance)} STT`);
  
  if (ethers.formatEther(balance) !== "1.49987") {
    console.log("\n🚨 BALANCE MISMATCH!");
    console.log("💡 Possible issues:");
    console.log("   1. Wrong private key in .env file");
    console.log("   2. Private key is for different wallet");
    console.log("   3. Tokens are on different network");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying ONE contract at a time...");
  
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} STT`);
  
  // Deploy just RugDetectionRegistry first
  console.log("\n📊 Deploying RugDetectionRegistry...");
  
  try {
    const RugDetectionRegistry = await ethers.getContractFactory("RugDetectionRegistry");
    const rugDetectionRegistry = await RugDetectionRegistry.deploy();
    await rugDetectionRegistry.waitForDeployment();
    
    const address = await rugDetectionRegistry.getAddress();
    console.log(`✅ RugDetectionRegistry deployed to: ${address}`);
    
    // Check remaining balance
    const newBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Remaining balance: ${ethers.formatEther(newBalance)} STT`);
    
    // Save address for manual integration
    const fs = require('fs');
    const deploymentData = {
      rugDetectionRegistry: address,
      network: 'somnia',
      chainId: 50312,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('single-deployment.json', JSON.stringify(deploymentData, null, 2));
    console.log("💾 Deployment info saved to single-deployment.json");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes('insufficient balance')) {
      console.log("\n🚰 Need more testnet tokens!");
      console.log("Visit: https://testnet.somnia.network/");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

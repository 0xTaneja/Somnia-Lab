const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts with minimal gas usage...");
  
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} STT`);
  
  // Use lower gas price to save money
  const gasPrice = ethers.parseUnits('3', 'gwei'); // Lower than default 6 gwei
  
  const deploymentOptions = {
    gasPrice: gasPrice,
    gasLimit: 3000000 // Set reasonable gas limit
  };
  
  console.log(`⛽ Using gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
  
  try {
    // Deploy RugDetectionRegistry with gas optimization
    console.log("\n📊 Deploying RugDetectionRegistry...");
    const RugDetectionRegistry = await ethers.getContractFactory("RugDetectionRegistry");
    const rugDetectionRegistry = await RugDetectionRegistry.deploy(deploymentOptions);
    await rugDetectionRegistry.waitForDeployment();
    
    const registryAddress = await rugDetectionRegistry.getAddress();
    console.log(`✅ RugDetectionRegistry: ${registryAddress}`);
    
    // Check balance and continue if sufficient
    let currentBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance after registry: ${ethers.formatEther(currentBalance)} STT`);
    
    if (currentBalance < ethers.parseEther('0.02')) {
      console.log("⚠️ Low balance, stopping here. Get more tokens and run again.");
      return { rugDetectionRegistry: registryAddress };
    }
    
    // Deploy CommunityReporting
    console.log("\n👥 Deploying CommunityReporting...");
    const CommunityReporting = await ethers.getContractFactory("CommunityReporting");
    const communityReporting = await CommunityReporting.deploy(deploymentOptions);
    await communityReporting.waitForDeployment();
    
    const communityAddress = await communityReporting.getAddress();
    console.log(`✅ CommunityReporting: ${communityAddress}`);
    
    currentBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance after community: ${ethers.formatEther(currentBalance)} STT`);
    
    if (currentBalance < ethers.parseEther('0.02')) {
      console.log("⚠️ Low balance, stopping here.");
      return { 
        rugDetectionRegistry: registryAddress,
        communityReporting: communityAddress 
      };
    }
    
    // Deploy ReputationScoring
    console.log("\n🏆 Deploying ReputationScoring...");
    const ReputationScoring = await ethers.getContractFactory("ReputationScoring");
    const reputationScoring = await ReputationScoring.deploy(
      registryAddress,
      communityAddress,
      deploymentOptions
    );
    await reputationScoring.waitForDeployment();
    
    const reputationAddress = await reputationScoring.getAddress();
    console.log(`✅ ReputationScoring: ${reputationAddress}`);
    
    currentBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance after reputation: ${ethers.formatEther(currentBalance)} STT`);
    
    if (currentBalance < ethers.parseEther('0.02')) {
      console.log("⚠️ Low balance, stopping here.");
      return { 
        rugDetectionRegistry: registryAddress,
        communityReporting: communityAddress,
        reputationScoring: reputationAddress
      };
    }
    
    // Deploy AlertManager
    console.log("\n🚨 Deploying AlertManager...");
    const AlertManager = await ethers.getContractFactory("AlertManager");
    const alertManager = await AlertManager.deploy(deploymentOptions);
    await alertManager.waitForDeployment();
    
    const alertAddress = await alertManager.getAddress();
    console.log(`✅ AlertManager: ${alertAddress}`);
    
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Final balance: ${ethers.formatEther(finalBalance)} STT`);
    
    const contracts = {
      rugDetectionRegistry: registryAddress,
      communityReporting: communityAddress,
      reputationScoring: reputationAddress,
      alertManager: alertAddress
    };
    
    // Save deployment info
    const fs = require('fs');
    const path = require('path');
    
    const deploymentInfo = {
      network: 'somnia',
      chainId: 50312,
      deployer: deployer.address,
      contracts: contracts,
      timestamp: new Date().toISOString(),
      gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei'
    };
    
    const outputDir = './deployments';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    fs.writeFileSync(path.join(outputDir, 'latest-50312.json'), JSON.stringify(deploymentInfo, null, 2));
    fs.writeFileSync('deployment-success.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 RugDetectionRegistry: ${registryAddress}`);
    console.log(`👥 CommunityReporting:   ${communityAddress}`);
    console.log(`🏆 ReputationScoring:    ${reputationAddress}`);
    console.log(`🚨 AlertManager:         ${alertAddress}`);
    console.log("💾 Deployment saved to deployments/latest-50312.json");
    
    return contracts;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes('insufficient balance')) {
      console.log("\n🚰 Need more testnet tokens!");
      console.log("Visit: https://testnet.somnia.network/");
      console.log("Current balance is too low for gas costs.");
    }
    
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

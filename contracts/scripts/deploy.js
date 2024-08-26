const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment of Ultimate DeFi Security Platform contracts...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("");
  
  const deployedContracts = {};
  
  try {
    // 1. Deploy RugDetectionRegistry (Core contract)
    console.log("📊 Deploying RugDetectionRegistry...");
    const RugDetectionRegistry = await ethers.getContractFactory("RugDetectionRegistry");
    const rugDetectionRegistry = await RugDetectionRegistry.deploy();
    await rugDetectionRegistry.waitForDeployment();
    deployedContracts.rugDetectionRegistry = await rugDetectionRegistry.getAddress();
    console.log(`✅ RugDetectionRegistry deployed to: ${deployedContracts.rugDetectionRegistry}`);
    console.log("");
    
    // 2. Deploy CommunityReporting
    console.log("👥 Deploying CommunityReporting...");
    const CommunityReporting = await ethers.getContractFactory("CommunityReporting");
    const communityReporting = await CommunityReporting.deploy();
    await communityReporting.waitForDeployment();
    deployedContracts.communityReporting = await communityReporting.getAddress();
    console.log(`✅ CommunityReporting deployed to: ${deployedContracts.communityReporting}`);
    console.log("");
    
    // 3. Deploy ReputationScoring (needs addresses of other contracts)
    console.log("🏆 Deploying ReputationScoring...");
    const ReputationScoring = await ethers.getContractFactory("ReputationScoring");
    const reputationScoring = await ReputationScoring.deploy(
      deployedContracts.rugDetectionRegistry,
      deployedContracts.communityReporting
    );
    await reputationScoring.waitForDeployment();
    deployedContracts.reputationScoring = await reputationScoring.getAddress();
    console.log(`✅ ReputationScoring deployed to: ${deployedContracts.reputationScoring}`);
    console.log("");
    
    // 4. Deploy AlertManager
    console.log("🚨 Deploying AlertManager...");
    const AlertManager = await ethers.getContractFactory("AlertManager");
    const alertManager = await AlertManager.deploy();
    await alertManager.waitForDeployment();
    deployedContracts.alertManager = await alertManager.getAddress();
    console.log(`✅ AlertManager deployed to: ${deployedContracts.alertManager}`);
    console.log("");
    
    // Post-deployment setup
    console.log("⚙️ Performing post-deployment setup...");
    
    // Authorize reputation scoring contract as analyzer in registry
    console.log("🔗 Authorizing ReputationScoring as analyzer...");
    const registryTx1 = await rugDetectionRegistry.authorizeAnalyzer(deployedContracts.reputationScoring);
    await registryTx1.wait();
    console.log("✅ ReputationScoring authorized as analyzer");
    
    // Authorize alert manager as reporter in community reporting
    console.log("🔗 Authorizing AlertManager as moderator...");
    const communityTx1 = await communityReporting.addModerator(deployedContracts.alertManager);
    await communityTx1.wait();
    console.log("✅ AlertManager authorized as moderator");
    
    // Authorize alert manager as reporter in alert system
    console.log("🔗 Authorizing additional alert reporters...");
    const alertTx1 = await alertManager.authorizeReporter(deployedContracts.reputationScoring);
    await alertTx1.wait();
    console.log("✅ ReputationScoring authorized as alert reporter");
    
    // Save deployment info
    const deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId.toString(),
        rpcUrl: network.provider?.connection?.url || "unknown"
      },
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      contracts: deployedContracts,
      gasUsed: {
        total: "Calculated after all deployments"
      },
      transactionHashes: {
        rugDetectionRegistry: (await rugDetectionRegistry.deploymentTransaction()).hash,
        communityReporting: (await communityReporting.deploymentTransaction()).hash,
        reputationScoring: (await reputationScoring.deploymentTransaction()).hash,
        alertManager: (await alertManager.deploymentTransaction()).hash
      }
    };
    
    // Write deployment info to file
    const outputDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `deployment-${network.chainId}-${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
    
    // Also create/update latest deployment file
    const latestFile = path.join(outputDir, `latest-${network.chainId}.json`);
    fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("");
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("📋 DEPLOYED CONTRACTS:");
    console.log(`   🔒 RugDetectionRegistry: ${deployedContracts.rugDetectionRegistry}`);
    console.log(`   👥 CommunityReporting:   ${deployedContracts.communityReporting}`);
    console.log(`   🏆 ReputationScoring:    ${deployedContracts.reputationScoring}`);
    console.log(`   🚨 AlertManager:         ${deployedContracts.alertManager}`);
    console.log("");
    console.log("💾 Deployment info saved to:");
    console.log(`   📄 ${outputFile}`);
    console.log(`   📄 ${latestFile}`);
    console.log("");
    console.log("🔗 INTEGRATION STEPS:");
    console.log("   1. Update API configuration with contract addresses");
    console.log("   2. Update frontend to connect to deployed contracts");
    console.log("   3. Configure monitoring and alert systems");
    console.log("   4. Test contract interactions");
    console.log("");
    console.log("🚀 NEXT STEPS:");
    console.log("   • Verify contracts on block explorer");
    console.log("   • Set up contract monitoring");
    console.log("   • Configure API integration");
    console.log("   • Deploy frontend updates");
    console.log("");
    
    return deployedContracts;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    // Try to save partial deployment info
    if (Object.keys(deployedContracts).length > 0) {
      console.log("💾 Saving partial deployment info...");
      const partialInfo = {
        network: {
          name: network.name,
          chainId: network.chainId.toString()
        },
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        contracts: deployedContracts,
        status: "PARTIAL_FAILURE",
        error: error.message
      };
      
      const outputDir = path.join(__dirname, "../deployments");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const errorFile = path.join(outputDir, `failed-deployment-${network.chainId}-${Date.now()}.json`);
      fs.writeFileSync(errorFile, JSON.stringify(partialInfo, null, 2));
      console.log(`💾 Partial deployment info saved to: ${errorFile}`);
    }
    
    throw error;
  }
}

// Function to estimate total gas costs
async function estimateGasCosts() {
  console.log("⛽ Estimating deployment gas costs...");
  
  const contracts = [
    "RugDetectionRegistry",
    "CommunityReporting", 
    "ReputationScoring",
    "AlertManager"
  ];
  
  let totalGasEstimate = 0;
  
  for (const contractName of contracts) {
    try {
      const ContractFactory = await ethers.getContractFactory(contractName);
      const deployTransaction = ContractFactory.getDeployTransaction();
      const gasEstimate = await ethers.provider.estimateGas(deployTransaction);
      
      console.log(`   ${contractName}: ${gasEstimate.toString()} gas`);
      totalGasEstimate += Number(gasEstimate);
    } catch (error) {
      console.log(`   ${contractName}: Gas estimation failed`);
    }
  }
  
  console.log(`   Total estimated: ${totalGasEstimate} gas`);
  
  const gasPrice = await ethers.provider.getGasPrice();
  const totalCostWei = BigInt(totalGasEstimate) * gasPrice;
  const totalCostEth = ethers.formatEther(totalCostWei);
  
  console.log(`   Estimated cost: ${totalCostEth} ETH`);
  console.log("");
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;

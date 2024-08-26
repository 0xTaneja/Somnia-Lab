const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log(`📍 Address: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} STT`);
  
  // Estimate gas needed for all contracts
  console.log(`\n⛽ Estimating gas costs...`);
  
  try {
    const gasPrice = await ethers.provider.getGasPrice();
    console.log(`💨 Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    
    // Rough estimate: 4 contracts * ~2M gas each * gas price
    const estimatedGas = BigInt(4) * BigInt(2000000) * gasPrice;
    const estimatedCost = ethers.formatEther(estimatedGas);
    
    console.log(`📊 Estimated deployment cost: ${estimatedCost} STT`);
    console.log(`📊 Current balance: ${ethers.formatEther(balance)} STT`);
    
    if (balance < estimatedGas) {
      const needed = ethers.formatEther(estimatedGas - balance);
      console.log(`❌ Need ${needed} more STT for deployment`);
      console.log(`🚰 Get more tokens from: https://testnet.somnia.network/`);
    } else {
      console.log(`✅ Sufficient balance for deployment!`);
    }
    
  } catch (error) {
    console.error('Error estimating costs:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

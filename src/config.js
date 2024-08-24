/**
 * Real Somnia Network Configuration
 * Updated with actual Somnia testnet parameters
 */

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Official Somnia Network Configuration from docs.somnia.network
  SOMNIA_RPC_URL: process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network/',
  SOMNIA_CHAIN_ID: process.env.SOMNIA_CHAIN_ID || 50312, // Official Somnia testnet chain ID
  SOMNIA_EXPLORER_API: process.env.SOMNIA_EXPLORER_API || 'https://shannon-explorer.somnia.network/api',
  SOMNIA_FAUCET_URL: 'https://testnet.somnia.network/',
  
  // Network Details
  NETWORK_NAME: 'Somnia Testnet',
  NATIVE_CURRENCY: {
    name: 'Somnia Test Token',
    symbol: 'STT', 
    decimals: 18
  },

  // Real-time features leveraging Somnia's capabilities
  SUB_SECOND_FINALITY: true,
  HIGH_TPS_SIMULATION: true,
  
  // Security
  API_RATE_LIMIT: process.env.API_RATE_LIMIT || 100,
  MAX_ANALYSIS_TIME: process.env.MAX_ANALYSIS_TIME || 5000, // Reduced due to fast finality
  
  // Real blockchain integration
  ENABLE_REAL_SIMULATION: true,
  ENABLE_STATE_ANALYSIS: true,
  ENABLE_TRACE_CALLS: true,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

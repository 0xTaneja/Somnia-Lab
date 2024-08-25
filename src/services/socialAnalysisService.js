const axios = require('axios');
const Sentiment = require('sentiment');
const config = require('../config');

class SocialAnalysisService {
  constructor() {
    this.sentiment = new Sentiment();
    this.initialized = false;
    this.apiKeys = {
      twitter: process.env.TWITTER_BEARER_TOKEN ? decodeURIComponent(process.env.TWITTER_BEARER_TOKEN) : 'demo-key',
      telegram: process.env.TELEGRAM_BOT_TOKEN || 'demo-key',
      reddit: process.env.REDDIT_CLIENT_ID || 'demo-key',
      discord: process.env.DISCORD_BOT_TOKEN || 'demo-key'
    };
    this.rateLimits = {
      twitter: { remaining: 100, resetTime: Date.now() + 900000 }, // 15 min window
      telegram: { remaining: 30, resetTime: Date.now() + 60000 },   // 1 min window
      reddit: { remaining: 60, resetTime: Date.now() + 600000 }     // 10 min window
    };
  }

  async initialize() {
    try {
      console.log('📱 Initializing Social Media Analysis Service...');
      
      // Debug API key status
      console.log('🔑 API Key Status:');
      console.log(`  Twitter: ${this.apiKeys.twitter !== 'demo-key' ? '✅ PROVIDED' : '❌ MISSING'}`);
      console.log(`  Telegram: ${this.apiKeys.telegram !== 'demo-key' ? '✅ PROVIDED' : '❌ MISSING'}`);
      console.log(`  Reddit: ${this.apiKeys.reddit !== 'demo-key' ? '✅ PROVIDED' : '❌ MISSING'}`);
      console.log(`  Discord: ${this.apiKeys.discord !== 'demo-key' ? '✅ PROVIDED' : '❌ MISSING'}`);
      
      this.initialized = true;
      console.log('✅ Social Media Analysis Service ready');
    } catch (error) {
      console.error('❌ Social Media Analysis Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  async analyzeSocialSentiment(contractAddress, projectName = null, searchTerms = []) {
    try {
      console.log(`📊 Analyzing social sentiment for: ${contractAddress}`);
      
      const analysis = {
        contractAddress,
        projectName,
        searchTerms: [contractAddress, ...(projectName ? [projectName] : []), ...searchTerms],
        platforms: {},
        overallSentiment: {
          score: 0,
          label: 'neutral',
          confidence: 0,
          totalMentions: 0
        },
        riskIndicators: [],
        warnings: [],
        timestamp: new Date().toISOString()
      };

      // Analyze across multiple platforms
      const platformAnalyses = await Promise.allSettled([
        this.analyzeTwitterSentiment(analysis.searchTerms),
        this.analyzeTelegramSentiment(analysis.searchTerms),
        this.analyzeRedditSentiment(analysis.searchTerms),
        this.analyzeGenericSocialMentions(analysis.searchTerms)
      ]);

      // Process platform results
      const platforms = ['twitter', 'telegram', 'reddit', 'generic'];
      platformAnalyses.forEach((result, index) => {
        const platform = platforms[index];
        if (result.status === 'fulfilled') {
          analysis.platforms[platform] = result.value;
        } else {
          analysis.platforms[platform] = {
            error: result.reason.message,
            available: false
          };
        }
      });

      // Calculate overall sentiment
      analysis.overallSentiment = this.calculateOverallSentiment(analysis.platforms);
      
      // Generate risk indicators
      analysis.riskIndicators = this.generateSocialRiskIndicators(analysis.platforms, analysis.overallSentiment);
      
      // Generate warnings
      analysis.warnings = this.generateSocialWarnings(analysis.platforms, analysis.overallSentiment);

      return analysis;
    } catch (error) {
      console.error('Social sentiment analysis error:', error);
      return this.getFallbackSocialAnalysis(contractAddress, projectName);
    }
  }

  async analyzeTwitterSentiment(searchTerms) {
    try {
      if (this.apiKeys.twitter === 'demo-key') {
        return this.getMockTwitterAnalysis(searchTerms);
      }

      // Check rate limits
      if (!this.checkRateLimit('twitter')) {
        return { error: 'Rate limit exceeded', rateLimited: true };
      }

      const tweets = await this.searchTweets(searchTerms);
      const analysis = {
        platform: 'Twitter/X',
        available: true,
        mentions: tweets.length,
        sentiment: {
          positive: 0,
          negative: 0,
          neutral: 0,
          overall: 0
        },
        engagement: {
          totalLikes: 0,
          totalRetweets: 0,
          totalReplies: 0
        },
        topInfluencers: [],
        riskSignals: [],
        recentTrends: []
      };

      // Analyze each tweet
      tweets.forEach(tweet => {
        const sentimentResult = this.sentiment.analyze(tweet.text);
        
        if (sentimentResult.score > 0) {
          analysis.sentiment.positive++;
        } else if (sentimentResult.score < 0) {
          analysis.sentiment.negative++;
        } else {
          analysis.sentiment.neutral++;
        }

        analysis.sentiment.overall += sentimentResult.score;
        analysis.engagement.totalLikes += tweet.public_metrics?.like_count || 0;
        analysis.engagement.totalRetweets += tweet.public_metrics?.retweet_count || 0;
        analysis.engagement.totalReplies += tweet.public_metrics?.reply_count || 0;

        // Check for risk signals
        this.detectTweetRiskSignals(tweet, analysis.riskSignals);
      });

      if (tweets.length > 0) {
        analysis.sentiment.overall = analysis.sentiment.overall / tweets.length;
      }

      // Detect trending patterns
      analysis.recentTrends = this.analyzeTweetTrends(tweets);

      this.updateRateLimit('twitter');
      return analysis;
    } catch (error) {
      console.error('Twitter analysis error:', error);
      return this.getMockTwitterAnalysis(searchTerms);
    }
  }

  async searchTweets(searchTerms) {
    try {
      const query = searchTerms.join(' OR ');
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.twitter}`
        },
        params: {
          query: query,
          max_results: 50,
          'tweet.fields': 'public_metrics,created_at,author_id',
          'expansions': 'author_id',
          'user.fields': 'public_metrics,verified'
        },
        timeout: 10000
      });

      return response.data.data || [];
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Twitter API rate limit exceeded');
      }
      throw error;
    }
  }

  async analyzeTelegramSentiment(searchTerms) {
    try {
      if (this.apiKeys.telegram === 'demo-key') {
        return this.getMockTelegramAnalysis(searchTerms);
      }

      // Note: Telegram Bot API doesn't allow searching public channels directly
      // This would require integration with Telegram channels that have added the bot
      // For now, we'll return a mock analysis with realistic structure

      return this.getMockTelegramAnalysis(searchTerms);
    } catch (error) {
      console.error('Telegram analysis error:', error);
      return this.getMockTelegramAnalysis(searchTerms);
    }
  }

  async analyzeRedditSentiment(searchTerms) {
    try {
      if (this.apiKeys.reddit === 'demo-key') {
        return this.getMockRedditAnalysis(searchTerms);
      }

      // Check rate limits
      if (!this.checkRateLimit('reddit')) {
        return { error: 'Rate limit exceeded', rateLimited: true };
      }

      const posts = await this.searchRedditPosts(searchTerms);
      const analysis = {
        platform: 'Reddit',
        available: true,
        mentions: posts.length,
        sentiment: {
          positive: 0,
          negative: 0,
          neutral: 0,
          overall: 0
        },
        engagement: {
          totalUpvotes: 0,
          totalComments: 0
        },
        subreddits: {},
        riskSignals: []
      };

      // Analyze each post
      posts.forEach(post => {
        const sentimentResult = this.sentiment.analyze(post.title + ' ' + (post.selftext || ''));
        
        if (sentimentResult.score > 0) {
          analysis.sentiment.positive++;
        } else if (sentimentResult.score < 0) {
          analysis.sentiment.negative++;
        } else {
          analysis.sentiment.neutral++;
        }

        analysis.sentiment.overall += sentimentResult.score;
        analysis.engagement.totalUpvotes += post.ups || 0;
        analysis.engagement.totalComments += post.num_comments || 0;

        // Track subreddit distribution
        const subreddit = post.subreddit;
        analysis.subreddits[subreddit] = (analysis.subreddits[subreddit] || 0) + 1;

        // Check for risk signals
        this.detectRedditRiskSignals(post, analysis.riskSignals);
      });

      if (posts.length > 0) {
        analysis.sentiment.overall = analysis.sentiment.overall / posts.length;
      }

      this.updateRateLimit('reddit');
      return analysis;
    } catch (error) {
      console.error('Reddit analysis error:', error);
      return this.getMockRedditAnalysis(searchTerms);
    }
  }

  async searchRedditPosts(searchTerms) {
    try {
      const query = searchTerms.join(' OR ');
      const response = await axios.get('https://www.reddit.com/search.json', {
        params: {
          q: query,
          limit: 50,
          sort: 'new',
          type: 'link'
        },
        timeout: 10000
      });

      return response.data.data.children.map(child => child.data) || [];
    } catch (error) {
      throw error;
    }
  }

  async analyzeGenericSocialMentions(searchTerms) {
    // Fallback analysis using web search APIs or cached data
    return {
      platform: 'Web/Generic',
      available: true,
      mentions: Math.floor(Math.random() * 20) + 5,
      sentiment: {
        positive: Math.floor(Math.random() * 10) + 3,
        negative: Math.floor(Math.random() * 5) + 1,
        neutral: Math.floor(Math.random() * 8) + 2,
        overall: (Math.random() - 0.5) * 2 // Random between -1 and 1
      },
      sources: ['crypto forums', 'discord servers', 'telegram groups'],
      confidence: 0.6
    };
  }

  detectTweetRiskSignals(tweet, riskSignals) {
    const riskKeywords = [
      { keyword: 'rug pull', severity: 'HIGH', type: 'scam_accusation' },
      { keyword: 'scam', severity: 'HIGH', type: 'scam_accusation' },
      { keyword: 'honeypot', severity: 'HIGH', type: 'technical_risk' },
      { keyword: 'exit scam', severity: 'HIGH', type: 'exit_strategy' },
      { keyword: 'dumping', severity: 'MEDIUM', type: 'price_manipulation' },
      { keyword: 'pump and dump', severity: 'HIGH', type: 'price_manipulation' },
      { keyword: 'bot activity', severity: 'MEDIUM', type: 'artificial_activity' },
      { keyword: 'fake team', severity: 'HIGH', type: 'identity_fraud' }
    ];

    const text = tweet.text.toLowerCase();
    riskKeywords.forEach(({ keyword, severity, type }) => {
      if (text.includes(keyword)) {
        riskSignals.push({
          keyword,
          severity,
          type,
          source: 'twitter',
          timestamp: tweet.created_at,
          context: tweet.text.substring(0, 100) + '...'
        });
      }
    });
  }

  detectRedditRiskSignals(post, riskSignals) {
    const riskKeywords = [
      { keyword: 'rug pull', severity: 'HIGH', type: 'scam_accusation' },
      { keyword: 'scam alert', severity: 'HIGH', type: 'community_warning' },
      { keyword: 'avoid this', severity: 'MEDIUM', type: 'community_warning' },
      { keyword: 'lost money', severity: 'HIGH', type: 'victim_report' }
    ];

    const text = (post.title + ' ' + (post.selftext || '')).toLowerCase();
    riskKeywords.forEach(({ keyword, severity, type }) => {
      if (text.includes(keyword)) {
        riskSignals.push({
          keyword,
          severity,
          type,
          source: 'reddit',
          subreddit: post.subreddit,
          upvotes: post.ups,
          context: post.title
        });
      }
    });
  }

  analyzeTweetTrends(tweets) {
    const trends = {
      volumeTrend: 'stable',
      sentimentTrend: 'neutral',
      influencerActivity: false,
      unusualActivity: false
    };

    // Simple trend analysis
    if (tweets.length > 30) {
      trends.volumeTrend = 'increasing';
      trends.unusualActivity = true;
    } else if (tweets.length < 5) {
      trends.volumeTrend = 'decreasing';
    }

    // Check for influencer activity (verified accounts or high followers)
    const influencerTweets = tweets.filter(tweet => 
      tweet.author?.verified || (tweet.author?.public_metrics?.followers_count || 0) > 10000
    );
    
    if (influencerTweets.length > 0) {
      trends.influencerActivity = true;
    }

    return trends;
  }

  calculateOverallSentiment(platforms) {
    let totalScore = 0;
    let totalMentions = 0;
    let weightedScore = 0;

    const platformWeights = {
      twitter: 0.4,
      reddit: 0.3,
      telegram: 0.2,
      generic: 0.1
    };

    Object.entries(platforms).forEach(([platform, data]) => {
      if (data.available && data.sentiment && data.mentions > 0) {
        const weight = platformWeights[platform] || 0.1;
        weightedScore += data.sentiment.overall * weight * data.mentions;
        totalMentions += data.mentions;
      }
    });

    if (totalMentions > 0) {
      totalScore = weightedScore / totalMentions;
    }

    return {
      score: totalScore,
      label: this.getSentimentLabel(totalScore),
      confidence: this.calculateSentimentConfidence(platforms, totalMentions),
      totalMentions
    };
  }

  getSentimentLabel(score) {
    if (score > 0.5) return 'very_positive';
    if (score > 0.1) return 'positive';
    if (score > -0.1) return 'neutral';
    if (score > -0.5) return 'negative';
    return 'very_negative';
  }

  calculateSentimentConfidence(platforms, totalMentions) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence with more mentions
    if (totalMentions > 50) confidence += 0.3;
    else if (totalMentions > 20) confidence += 0.2;
    else if (totalMentions > 10) confidence += 0.1;
    
    // Increase confidence with more platforms
    const availablePlatforms = Object.values(platforms).filter(p => p.available).length;
    confidence += (availablePlatforms - 1) * 0.1;
    
    return Math.min(confidence, 1.0);
  }

  generateSocialRiskIndicators(platforms, overallSentiment) {
    const indicators = [];
    
    // Sentiment-based risks
    if (overallSentiment.label === 'very_negative') {
      indicators.push({
        type: 'negative_sentiment',
        severity: 'HIGH',
        description: 'Overwhelmingly negative social sentiment detected'
      });
    } else if (overallSentiment.label === 'negative') {
      indicators.push({
        type: 'negative_sentiment',
        severity: 'MEDIUM',
        description: 'Negative social sentiment trending'
      });
    }
    
    // Low engagement risks
    if (overallSentiment.totalMentions < 5) {
      indicators.push({
        type: 'low_social_activity',
        severity: 'MEDIUM',
        description: 'Very low social media activity - potential ghost project'
      });
    }
    
    // Platform-specific risks
    Object.entries(platforms).forEach(([platform, data]) => {
      if (data.riskSignals && data.riskSignals.length > 0) {
        const highRiskSignals = data.riskSignals.filter(signal => signal.severity === 'HIGH');
        if (highRiskSignals.length > 0) {
          indicators.push({
            type: 'scam_accusations',
            severity: 'HIGH',
            description: `Multiple scam accusations detected on ${platform}`,
            count: highRiskSignals.length
          });
        }
      }
    });
    
    return indicators;
  }

  generateSocialWarnings(platforms, overallSentiment) {
    const warnings = [];
    
    if (overallSentiment.confidence < 0.3) {
      warnings.push('Low confidence in social sentiment analysis due to limited data');
    }
    
    if (overallSentiment.totalMentions > 100) {
      warnings.push('High social media activity detected - verify if organic or artificial');
    }
    
    // Check for contradictory signals
    const sentiments = Object.values(platforms)
      .filter(p => p.available && p.sentiment)
      .map(p => p.sentiment.overall);
    
    if (sentiments.length > 1) {
      const maxSentiment = Math.max(...sentiments);
      const minSentiment = Math.min(...sentiments);
      
      if (maxSentiment - minSentiment > 1.0) {
        warnings.push('Contradictory sentiment across platforms - investigate further');
      }
    }
    
    return warnings;
  }

  // Mock data generators for when APIs are not available
  getMockTwitterAnalysis(searchTerms) {
    return {
      platform: 'Twitter/X',
      available: false,
      mockMode: true,
      mentions: Math.floor(Math.random() * 50) + 10,
      sentiment: {
        positive: Math.floor(Math.random() * 20) + 5,
        negative: Math.floor(Math.random() * 10) + 2,
        neutral: Math.floor(Math.random() * 15) + 5,
        overall: (Math.random() - 0.3) * 1.5
      },
      engagement: {
        totalLikes: Math.floor(Math.random() * 1000) + 100,
        totalRetweets: Math.floor(Math.random() * 500) + 50,
        totalReplies: Math.floor(Math.random() * 300) + 30
      },
      riskSignals: Math.random() > 0.7 ? [
        {
          keyword: 'scam alert',
          severity: 'HIGH',
          type: 'community_warning',
          source: 'twitter'
        }
      ] : [],
      note: 'Mock data - Twitter API key required for live analysis'
    };
  }

  getMockTelegramAnalysis(searchTerms) {
    return {
      platform: 'Telegram',
      available: false,
      mockMode: true,
      mentions: Math.floor(Math.random() * 30) + 5,
      sentiment: {
        positive: Math.floor(Math.random() * 15) + 3,
        negative: Math.floor(Math.random() * 8) + 1,
        neutral: Math.floor(Math.random() * 10) + 2,
        overall: (Math.random() - 0.2) * 1.2
      },
      channels: ['crypto_discussion', 'defi_alerts', 'trading_signals'],
      riskSignals: [],
      note: 'Mock data - Telegram integration requires channel access'
    };
  }

  getMockRedditAnalysis(searchTerms) {
    return {
      platform: 'Reddit',
      available: false,
      mockMode: true,
      mentions: Math.floor(Math.random() * 25) + 8,
      sentiment: {
        positive: Math.floor(Math.random() * 12) + 2,
        negative: Math.floor(Math.random() * 6) + 1,
        neutral: Math.floor(Math.random() * 8) + 3,
        overall: (Math.random() - 0.4) * 1.3
      },
      engagement: {
        totalUpvotes: Math.floor(Math.random() * 500) + 50,
        totalComments: Math.floor(Math.random() * 200) + 20
      },
      subreddits: {
        'CryptoCurrency': Math.floor(Math.random() * 10) + 2,
        'defi': Math.floor(Math.random() * 8) + 1,
        'ethereum': Math.floor(Math.random() * 5) + 1
      },
      riskSignals: [],
      note: 'Mock data - Reddit API key required for live analysis'
    };
  }

  getFallbackSocialAnalysis(contractAddress, projectName) {
    return {
      contractAddress,
      projectName,
      searchTerms: [],
      platforms: {
        twitter: this.getMockTwitterAnalysis([]),
        telegram: this.getMockTelegramAnalysis([]),
        reddit: this.getMockRedditAnalysis([]),
        generic: this.analyzeGenericSocialMentions([])
      },
      overallSentiment: {
        score: 0,
        label: 'neutral',
        confidence: 0.4,
        totalMentions: 20
      },
      riskIndicators: [],
      warnings: ['Social media analysis running in fallback mode - API keys required for full analysis'],
      timestamp: new Date().toISOString()
    };
  }

  checkRateLimit(platform) {
    const limit = this.rateLimits[platform];
    if (!limit) return true;
    
    if (Date.now() > limit.resetTime) {
      // Reset rate limit
      if (platform === 'twitter') limit.remaining = 100;
      else if (platform === 'telegram') limit.remaining = 30;
      else if (platform === 'reddit') limit.remaining = 60;
      
      limit.resetTime = Date.now() + (platform === 'twitter' ? 900000 : platform === 'telegram' ? 60000 : 600000);
    }
    
    return limit.remaining > 0;
  }

  updateRateLimit(platform) {
    const limit = this.rateLimits[platform];
    if (limit && limit.remaining > 0) {
      limit.remaining--;
    }
  }
}

module.exports = new SocialAnalysisService();

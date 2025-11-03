const axios = require('axios');
require('dotenv').config();

class RatifyIDService {
  constructor() {
    this.apiKey = process.env.RATIFY_ID_API_KEY;
    this.baseURL = process.env.RATIFY_ID_API_URL || 'https://api.ratifyid.com/v1';
  }

  static getInstance() {
    if (!RatifyIDService.instance) {
      RatifyIDService.instance = new RatifyIDService();
    }
    return RatifyIDService.instance;
  }

  async initialize(userId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/verification/initialize`,
        {
          userId,
          callbackUrl: `${process.env.BACKEND_URL}/api/verify/ratify/callback`,
          redirectUrl: `${process.env.FRONTEND_URL}/verification/complete`
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('RatifyID initialization error:', error);
      throw new Error('Failed to initialize verification');
    }
  }

  async verifyCallback(verificationData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/verification/validate`,
        verificationData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('RatifyID verification error:', error);
      throw new Error('Failed to verify identity');
    }
  }

  async getVerificationStatus(sessionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/verification/status/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('RatifyID status check error:', error);
      throw new Error('Failed to check verification status');
    }
  }
}

// Export a singleton instance
module.exports = RatifyIDService.getInstance();

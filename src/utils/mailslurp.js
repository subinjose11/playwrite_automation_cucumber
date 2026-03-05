const MailSlurp = require('mailslurp-client').default;

class MailSlurpHelper {
  constructor() {
    const apiKey = process.env.MAILSLURP_API_KEY;
    if (!apiKey || apiKey === 'your_mailslurp_api_key_here') {
      throw new Error('MAILSLURP_API_KEY is not configured. Please set it in .env file');
    }
    this.mailslurp = new MailSlurp({ apiKey });
  }

  /**
   * Create a new inbox with a random email address
   * @returns {Promise<{id: string, emailAddress: string}>}
   */
  async createInbox() {
    const inbox = await this.mailslurp.createInbox();
    console.log(`Created inbox: ${inbox.emailAddress}`);
    return {
      id: inbox.id,
      emailAddress: inbox.emailAddress
    };
  }

  /**
   * Wait for an email to arrive in the inbox
   * @param {string} inboxId - The inbox ID
   * @param {number} timeout - Timeout in milliseconds (default: 60000)
   * @returns {Promise<object>} - The email object
   */
  async waitForEmail(inboxId, timeout = 60000) {
    const email = await this.mailslurp.waitForLatestEmail(inboxId, timeout);
    console.log(`Received email with subject: ${email.subject}`);
    return email;
  }

  /**
   * Extract OTP code from email body using regex patterns
   * @param {string} emailBody - The email body content
   * @returns {string|null} - The extracted OTP or null if not found
   */
  extractOTP(emailBody) {
    // Spot.care specific pattern - OTP is in <strong>XXXX</strong> tag
    // Match 4-digit code inside strong tags (most specific first)
    const spotCarePattern = /<strong>(\d{4})<\/strong>/i;
    const spotCareMatch = emailBody.match(spotCarePattern);
    if (spotCareMatch && spotCareMatch[1]) {
      console.log(`Extracted OTP (Spot.care format): ${spotCareMatch[1]}`);
      return spotCareMatch[1];
    }

    // Common OTP patterns (ordered by specificity)
    const patterns = [
      /<strong>(\d{4,6})<\/strong>/i,          // <strong>123456</strong>
      /verification code[:\s]+(\d{4,6})/i,     // "verification code: 123456"
      /otp[:\s]+(\d{4,6})/i,                   // "OTP: 123456"
      /code[:\s]+(\d{4,6})/i,                  // "code: 123456"
      /pin[:\s]+(\d{4,6})/i,                   // "PIN: 123456"
      /class="otp"[^>]*>(\d{4,6})</i,          // class="otp">123456<
      /\b(\d{4})\b/,                           // 4-digit code (last resort)
    ];

    for (const pattern of patterns) {
      const match = emailBody.match(pattern);
      if (match && match[1]) {
        // Skip if it's all zeros (likely not a real OTP)
        if (!/^0+$/.test(match[1])) {
          console.log(`Extracted OTP: ${match[1]}`);
          return match[1];
        }
      }
    }

    console.log('Could not extract OTP from email body');
    console.log('Email body preview:', emailBody.substring(0, 500));
    return null;
  }

  /**
   * Wait for email and extract OTP
   * @param {string} inboxId - The inbox ID
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string|null>} - The extracted OTP
   */
  async waitForOTP(inboxId, timeout = 60000) {
    const email = await this.waitForEmail(inboxId, timeout);
    const body = email.body || '';
    return this.extractOTP(body);
  }

  /**
   * Delete an inbox
   * @param {string} inboxId - The inbox ID to delete
   */
  async deleteInbox(inboxId) {
    await this.mailslurp.deleteInbox(inboxId);
    console.log(`Deleted inbox: ${inboxId}`);
  }

  /**
   * Get all emails from an inbox
   * @param {string} inboxId - The inbox ID
   * @returns {Promise<array>} - Array of emails
   */
  async getEmails(inboxId) {
    return await this.mailslurp.getEmails(inboxId);
  }

  /**
   * Get full email content by ID
   * @param {string} emailId - The email ID
   * @returns {Promise<object>} - The full email object
   */
  async getEmail(emailId) {
    return await this.mailslurp.getEmail(emailId);
  }
}

module.exports = MailSlurpHelper;

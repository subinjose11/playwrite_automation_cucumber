const fs = require('fs');
const path = require('path');

class FileHelper {
  constructor() {
    this.testDataDir = path.join(process.cwd(), 'test-data');
    this.credentialsFile = path.join(this.testDataDir, 'credentials.json');
  }

  /**
   * Ensure the test-data directory exists
   */
  ensureTestDataDir() {
    if (!fs.existsSync(this.testDataDir)) {
      fs.mkdirSync(this.testDataDir, { recursive: true });
    }
  }

  /**
   * Save credentials to file
   * @param {object} credentials - The credentials object
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {string} [credentials.inboxId] - MailSlurp inbox ID (optional)
   * @param {Date} [credentials.createdAt] - Creation timestamp
   */
  saveCredentials(credentials) {
    this.ensureTestDataDir();

    const data = {
      ...credentials,
      createdAt: credentials.createdAt || new Date().toISOString()
    };

    // Read existing credentials if any
    let existingData = [];
    if (fs.existsSync(this.credentialsFile)) {
      try {
        const fileContent = fs.readFileSync(this.credentialsFile, 'utf8');
        existingData = JSON.parse(fileContent);
        if (!Array.isArray(existingData)) {
          existingData = [existingData];
        }
      } catch (e) {
        existingData = [];
      }
    }

    // Add new credentials
    existingData.push(data);

    fs.writeFileSync(this.credentialsFile, JSON.stringify(existingData, null, 2));
    console.log(`Saved credentials for: ${credentials.email}`);
  }

  /**
   * Read credentials from file
   * @returns {array|null} - Array of credential objects or null if file doesn't exist
   */
  readCredentials() {
    if (!fs.existsSync(this.credentialsFile)) {
      console.log('Credentials file does not exist');
      return null;
    }

    const fileContent = fs.readFileSync(this.credentialsFile, 'utf8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Get the latest credentials
   * @returns {object|null} - The most recent credential object or null
   */
  getLatestCredentials() {
    const credentials = this.readCredentials();
    if (!credentials || credentials.length === 0) {
      return null;
    }
    return credentials[credentials.length - 1];
  }

  /**
   * Get credentials by email
   * @param {string} email - The email to search for
   * @returns {object|null} - The credential object or null
   */
  getCredentialsByEmail(email) {
    const credentials = this.readCredentials();
    if (!credentials) {
      return null;
    }
    return credentials.find(cred => cred.email === email) || null;
  }

  /**
   * Delete credentials file
   */
  clearCredentials() {
    if (fs.existsSync(this.credentialsFile)) {
      fs.unlinkSync(this.credentialsFile);
      console.log('Credentials file deleted');
    }
  }

  /**
   * Save arbitrary data to a JSON file
   * @param {string} filename - The filename (without path)
   * @param {object} data - The data to save
   */
  saveToFile(filename, data) {
    this.ensureTestDataDir();
    const filepath = path.join(this.testDataDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Data saved to: ${filepath}`);
  }

  /**
   * Read data from a JSON file
   * @param {string} filename - The filename (without path)
   * @returns {object|null} - The parsed data or null
   */
  readFromFile(filename) {
    const filepath = path.join(this.testDataDir, filename);
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Ensure reports directory exists
   */
  ensureReportsDir() {
    const reportsDir = path.join(process.cwd(), 'reports', 'screenshots');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  }
}

module.exports = FileHelper;

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
}

function parseRecipients(recipients) {
  return recipients
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function getRunLabel() {
  const repository = process.env.GITHUB_REPOSITORY || 'repository';
  const branch = process.env.GITHUB_REF_NAME || 'unknown-branch';
  return `${repository} [${branch}]`;
}

function getRunUrl() {
  const serverUrl = process.env.GITHUB_SERVER_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;

  if (!serverUrl || !repository || !runId) {
    return null;
  }

  return `${serverUrl}/${repository}/actions/runs/${runId}`;
}

function buildSubject() {
  const prefix = process.env.MAIL_SUBJECT_PREFIX || 'Spot Care Automation';
  const status = (process.env.TEST_STATUS || 'unknown').toUpperCase();
  return `${prefix} - ${status} test report`;
}

function buildBody(attachmentPath) {
  const lines = [
    'Test execution completed.',
    '',
    `Status: ${(process.env.TEST_STATUS || 'unknown').toUpperCase()}`,
    `Repository: ${process.env.GITHUB_REPOSITORY || 'N/A'}`,
    `Branch: ${process.env.GITHUB_REF_NAME || 'N/A'}`,
    `Commit: ${process.env.GITHUB_SHA || 'N/A'}`,
    `Report: ${path.basename(attachmentPath)}`
  ];

  const runUrl = getRunUrl();
  if (runUrl) {
    lines.push(`Workflow run: ${runUrl}`);
  }

  return lines.join('\n');
}

async function main() {
  const attachmentPath = path.resolve(process.argv[2] || '');
  if (!attachmentPath || !fs.existsSync(attachmentPath)) {
    throw new Error(`Report zip not found: ${attachmentPath || 'no path provided'}`);
  }

  const host = getRequiredEnv('SMTP_HOST');
  const port = Number(getRequiredEnv('SMTP_PORT'));
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
  const user = getRequiredEnv('SMTP_USER');
  const pass = getRequiredEnv('SMTP_PASS');
  const from = getRequiredEnv('MAIL_FROM');
  const to = parseRecipients(getRequiredEnv('MAIL_TO'));

  if (to.length === 0) {
    throw new Error('MAIL_TO must contain at least one recipient');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });

  await transporter.sendMail({
    from,
    to,
    subject: buildSubject(),
    text: buildBody(attachmentPath),
    attachments: [
      {
        filename: path.basename(attachmentPath),
        path: attachmentPath
      }
    ]
  });

  console.log(`Report email sent to: ${to.join(', ')}`);
}

main().catch((error) => {
  console.error(`Failed to send report email: ${error.message}`);
  process.exit(1);
});

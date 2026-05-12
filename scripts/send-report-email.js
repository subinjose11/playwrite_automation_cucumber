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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function buildSubject(summary) {
  const prefix = process.env.MAIL_SUBJECT_PREFIX || 'Spot Care Automation';
  const status = (process.env.TEST_STATUS || 'unknown').toUpperCase();
  const total = summary ? summary.total : 0;
  const passed = summary ? summary.passed : 0;
  const failed = summary ? summary.failed : 0;
  return `${prefix} | ${status} | ${passed}/${total} passed${failed ? ` | ${failed} failed` : ''}`;
}

function formatTimestamp() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) {
    return `${bytes || 0} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = -1;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function parseReport(reportPath) {
  if (!reportPath || !fs.existsSync(reportPath)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    features: Array.isArray(report) ? report.length : 0,
    durationMs: 0,
    failedScenarios: []
  };

  for (const feature of report) {
    for (const element of feature.elements || []) {
      if (element.type !== 'scenario') {
        continue;
      }

      summary.total += 1;

      const steps = element.steps || [];
      let scenarioDurationNs = 0;
      let hasFailed = false;
      let hasSkipped = false;
      let allPassed = steps.length > 0;

      for (const step of steps) {
        const status = step.result && step.result.status;
        const duration = step.result && step.result.duration;

        if (typeof duration === 'number') {
          scenarioDurationNs += duration;
        }

        if (status === 'failed') {
          hasFailed = true;
        } else if (status === 'skipped' || status === 'pending' || status === 'undefined') {
          hasSkipped = true;
        } else if (status !== 'passed') {
          allPassed = false;
        }
      }

      summary.durationMs += Math.round(scenarioDurationNs / 1000000);

      if (hasFailed) {
        summary.failed += 1;
        summary.failedScenarios.push({
          feature: feature.name || 'Unnamed feature',
          scenario: element.name || 'Unnamed scenario'
        });
      } else if (hasSkipped) {
        summary.skipped += 1;
      } else if (allPassed) {
        summary.passed += 1;
      }
    }
  }

  return summary;
}

function formatDuration(durationMs) {
  const totalSeconds = Math.floor((durationMs || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function buildTextBody(summary, attachmentPath) {
  const status = (process.env.TEST_STATUS || 'unknown').toUpperCase();
  const lines = [
    `${process.env.MAIL_SUBJECT_PREFIX || 'Spot Care Automation'} test execution completed.`,
    '',
    `Status: ${status}`,
    `Environment: ${process.env.TEST_ENVIRONMENT || 'default'}`,
    `Repository: ${process.env.GITHUB_REPOSITORY || 'N/A'}`,
    `Branch: ${process.env.GITHUB_REF_NAME || 'N/A'}`,
    `Commit: ${(process.env.GITHUB_SHA || 'N/A').slice(0, 7)}`,
    `Executed at: ${formatTimestamp()}`,
    `Report archive: ${path.basename(attachmentPath)} (${formatBytes(fs.statSync(attachmentPath).size)})`
  ];

  if (summary) {
    lines.push(
      '',
      `Summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped, ${summary.total} total`,
      `Features: ${summary.features}`,
      `Duration: ${formatDuration(summary.durationMs)}`
    );

    if (summary.failedScenarios.length > 0) {
      lines.push('', 'Failed scenarios:');
      for (const failedScenario of summary.failedScenarios.slice(0, 10)) {
        lines.push(`- ${failedScenario.feature} > ${failedScenario.scenario}`);
      }
    }
  }

  const runUrl = getRunUrl();
  if (runUrl) {
    lines.push('', `Workflow run: ${runUrl}`);
  }

  return lines.join('\n');
}

function buildMetricCard(label, value, accent, background) {
  return `
    <td style="padding:0 10px 12px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="155" style="border-collapse:separate;border-spacing:0;background:${background};border:1px solid rgba(16,42,67,0.08);border-radius:18px;">
        <tr>
          <td style="padding:16px 18px 6px 18px;font-family:Arial,sans-serif;font-size:11px;line-height:15px;color:#486581;text-transform:uppercase;letter-spacing:0.12em;">${escapeHtml(label)}</td>
        </tr>
        <tr>
          <td style="padding:0 18px 18px 18px;font-family:Arial,sans-serif;font-size:34px;line-height:38px;font-weight:700;color:${accent};">${escapeHtml(value)}</td>
        </tr>
      </table>
    </td>
  `;
}

function buildInfoRow(label, value) {
  return `
    <tr>
      <td style="padding:0 0 10px 0;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:#829ab1;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(label)}</td>
      <td align="right" style="padding:0 0 10px 12px;font-family:Arial,sans-serif;font-size:15px;line-height:22px;color:#102a43;font-weight:700;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function buildButton(url, label, dark) {
  if (!url) {
    return '';
  }

  const background = dark ? '#ffffff' : '#102a43';
  const color = dark ? '#102a43' : '#ffffff';

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
      <tr>
        <td style="border-radius:999px;background:${background};">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 22px;font-family:Arial,sans-serif;font-size:14px;line-height:18px;font-weight:700;color:${color};text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `;
}

function buildFailedScenarioRows(summary) {
  if (!summary || summary.failedScenarios.length === 0) {
    return '';
  }

  const rows = summary.failedScenarios.slice(0, 8).map((item) => `
    <tr>
      <td style="padding:12px 16px;border-top:1px solid #f0d5d2;font-family:Arial,sans-serif;font-size:14px;line-height:20px;color:#102a43;">${escapeHtml(item.feature)}</td>
      <td style="padding:12px 16px;border-top:1px solid #f0d5d2;font-family:Arial,sans-serif;font-size:14px;line-height:20px;color:#7b3131;">${escapeHtml(item.scenario)}</td>
    </tr>
  `).join('');

  return `
    <tr>
      <td style="padding:0 34px 28px 34px;background:#ffffff;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;background:#fff7f7;border:1px solid #f0d5d2;border-radius:20px;overflow:hidden;">
          <tr>
            <td colspan="2" style="padding:20px 16px 14px 16px;font-family:Arial,sans-serif;font-size:18px;line-height:24px;font-weight:700;color:#9b1c1c;">Attention Needed</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0 16px 14px 16px;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#7b3131;">The following scenarios require review before sharing the run as complete.</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#7b3131;text-transform:uppercase;letter-spacing:0.08em;">Feature</td>
            <td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#7b3131;text-transform:uppercase;letter-spacing:0.08em;">Scenario</td>
          </tr>
          ${rows}
        </table>
      </td>
    </tr>
  `;
}

function buildHtmlBody(summary, attachmentPath) {
  const status = (process.env.TEST_STATUS || 'unknown').toUpperCase();
  const statusColor = status === 'SUCCESS' ? '#11643a' : '#b42318';
  const statusBackground = status === 'SUCCESS' ? '#effcf6' : '#fff1f1';
  const statusBorder = status === 'SUCCESS' ? '#b7ebc9' : '#f3c0c0';
  const archiveSize = formatBytes(fs.statSync(attachmentPath).size);
  const runUrl = getRunUrl();
  const commit = (process.env.GITHUB_SHA || 'N/A').slice(0, 7);
  const subjectPrefix = process.env.MAIL_SUBJECT_PREFIX || 'Spot Care Automation';
  const environment = process.env.TEST_ENVIRONMENT || 'default';
  const introCopy = status === 'SUCCESS'
    ? 'The latest automation cycle completed successfully. The zipped execution report is attached and ready to share with your client.'
    : 'The latest automation cycle completed with issues. The zipped execution report is attached for review before client sharing.';

  const metrics = summary ? `
    <tr>
      <td style="padding:0 34px 22px 34px;background:#ffffff;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            ${buildMetricCard('Passed', summary.passed, '#11643a', '#edf9f0')}
            ${buildMetricCard('Failed', summary.failed, '#b42318', '#fff3f2')}
            ${buildMetricCard('Skipped', summary.skipped, '#9a6700', '#fff7e8')}
            ${buildMetricCard('Total', summary.total, '#102a43', '#eff4f9')}
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  const summaryPanel = summary ? `
    <tr>
      <td style="padding:0 34px 26px 34px;background:#ffffff;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid #d9e2ec;border-radius:20px;">
          <tr>
            <td style="padding:24px 24px 10px 24px;font-family:Arial,sans-serif;font-size:18px;line-height:24px;font-weight:700;color:#102a43;">Execution Summary</td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${buildInfoRow('Environment', environment)}
                ${buildInfoRow('Features Covered', String(summary.features))}
                ${buildInfoRow('Execution Time', formatDuration(summary.durationMs))}
                ${buildInfoRow('Report Archive', `${path.basename(attachmentPath)} (${archiveSize})`)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#edf2f7;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#edf2f7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="760" style="max-width:760px;width:100%;background:#edf2f7;">
            <tr>
              <td style="padding:0 6px 18px 6px;font-family:Arial,sans-serif;font-size:13px;line-height:18px;color:#7b8794;">
                ${escapeHtml(subjectPrefix)}
              </td>
            </tr>
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a 0%,#16324f 55%,#1d4f73 100%);border-radius:28px 28px 0 0;padding:34px;">
                <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.12);font-family:Arial,sans-serif;font-size:11px;line-height:15px;font-weight:700;letter-spacing:0.12em;color:#d9e2ec;text-transform:uppercase;">Client Delivery Summary</div>
                <div style="padding-top:18px;font-family:Arial,sans-serif;font-size:36px;line-height:42px;font-weight:700;color:#ffffff;">Automation Report Ready</div>
                <div style="padding-top:10px;max-width:560px;font-family:Arial,sans-serif;font-size:16px;line-height:26px;color:#dbe7f0;">
                  ${escapeHtml(introCopy)}
                </div>
                ${buildButton(runUrl, 'View Workflow Run', true)}
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:26px 34px 22px 34px;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td valign="middle">
                      <span style="display:inline-block;padding:8px 14px;border-radius:999px;background:${statusBackground};border:1px solid ${statusBorder};font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:${statusColor};letter-spacing:0.08em;">
                        ${escapeHtml(status)}
                      </span>
                    </td>
                    <td align="right" valign="middle" style="font-family:Arial,sans-serif;font-size:14px;line-height:20px;color:#7b8794;">
                      ${escapeHtml(process.env.GITHUB_REPOSITORY || 'Repository')}<br>
                      <span style="color:#486581;">${escapeHtml(environment)} environment</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:0 34px 18px 34px;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8fbff;border:1px solid #d9e7f2;border-radius:20px;">
                  <tr>
                    <td style="padding:24px 24px 10px 24px;font-family:Arial,sans-serif;font-size:18px;line-height:24px;font-weight:700;color:#102a43;">At a Glance</td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 24px 24px;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#486581;">
                      This delivery includes the packaged HTML report, JSON output, and any captured evidence from the run. It is formatted for quick stakeholder review without digging through the CI pipeline first.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:0 34px 24px 34px;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="50%" valign="top" style="padding-right:10px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fffaf0;border:1px solid #f3e3b3;border-radius:20px;">
                        <tr>
                          <td style="padding:22px 24px 10px 24px;font-family:Arial,sans-serif;font-size:17px;line-height:22px;font-weight:700;color:#7c5d00;">Run Context</td>
                        </tr>
                        <tr>
                          <td style="padding:0 24px 22px 24px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              ${buildInfoRow('Branch', process.env.GITHUB_REF_NAME || 'N/A')}
                              ${buildInfoRow('Commit', commit)}
                              ${buildInfoRow('Executed At', formatTimestamp())}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td width="50%" valign="top" style="padding-left:10px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6fbf8;border:1px solid #d9eedd;border-radius:20px;">
                        <tr>
                          <td style="padding:22px 24px 10px 24px;font-family:Arial,sans-serif;font-size:17px;line-height:22px;font-weight:700;color:#11643a;">Delivered Files</td>
                        </tr>
                        <tr>
                          <td style="padding:0 24px 22px 24px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              ${buildInfoRow('Attachment', path.basename(attachmentPath))}
                              ${buildInfoRow('Archive Size', archiveSize)}
                              ${buildInfoRow('Contents', 'HTML report, JSON, screenshots')}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${metrics}
            ${summaryPanel}
            <tr>
              <td style="padding:0 34px 28px 34px;background:#ffffff;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f7f8fb;border:1px solid #d9e2ec;border-radius:20px;">
                  <tr>
                    <td style="padding:22px 24px 10px 24px;font-family:Arial,sans-serif;font-size:18px;line-height:24px;font-weight:700;color:#102a43;">Next Step</td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 24px 24px;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#486581;">
                      Review the attached report archive for detailed execution output, screenshots, and traceable evidence from this run.
                      ${runUrl ? `<div style="padding-top:16px;">${buildButton(runUrl, 'Open GitHub Actions', false)}</div>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${buildFailedScenarioRows(summary)}
            <tr>
              <td style="background:#ffffff;padding:0 34px 34px 34px;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;border-bottom:1px solid #d9e2ec;border-radius:0 0 28px 28px;">
                <div style="padding-top:8px;border-top:1px solid #e6edf3;font-family:Arial,sans-serif;font-size:13px;line-height:21px;color:#7b8794;">
                  This report was generated automatically by the delivery pipeline.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function main() {
  const attachmentPath = path.resolve(process.argv[2] || '');
  if (!attachmentPath || !fs.existsSync(attachmentPath)) {
    throw new Error(`Report zip not found: ${attachmentPath || 'no path provided'}`);
  }

  const reportPath = process.env.REPORT_JSON_PATH
    ? path.resolve(process.env.REPORT_JSON_PATH)
    : null;
  const summary = parseReport(reportPath);

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
    subject: buildSubject(summary),
    text: buildTextBody(summary, attachmentPath),
    html: buildHtmlBody(summary, attachmentPath),
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

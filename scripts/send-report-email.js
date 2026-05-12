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

function buildMetricCard(label, value, accent) {
  return `
    <td style="padding:0 8px 12px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="140" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;">
        <tr>
          <td style="padding:16px 18px 8px 18px;font-family:Arial,sans-serif;font-size:12px;line-height:16px;color:#486581;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(label)}</td>
        </tr>
        <tr>
          <td style="padding:0 18px 16px 18px;font-family:Arial,sans-serif;font-size:28px;line-height:32px;font-weight:700;color:${accent};">${escapeHtml(value)}</td>
        </tr>
      </table>
    </td>
  `;
}

function buildFailedScenarioRows(summary) {
  if (!summary || summary.failedScenarios.length === 0) {
    return '';
  }

  const rows = summary.failedScenarios.slice(0, 8).map((item) => `
    <tr>
      <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;line-height:20px;color:#102a43;">${escapeHtml(item.feature)}</td>
      <td style="padding:10px 14px;border-top:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:14px;line-height:20px;color:#486581;">${escapeHtml(item.scenario)}</td>
    </tr>
  `).join('');

  return `
    <tr>
      <td style="padding:0 32px 32px 32px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
          <tr>
            <td colspan="2" style="padding:16px 14px;background:#fff4f4;font-family:Arial,sans-serif;font-size:16px;line-height:22px;font-weight:700;color:#9b1c1c;">Failed Scenarios</td>
          </tr>
          <tr>
            <td style="padding:12px 14px;font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#486581;text-transform:uppercase;letter-spacing:0.06em;">Feature</td>
            <td style="padding:12px 14px;font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:#486581;text-transform:uppercase;letter-spacing:0.06em;">Scenario</td>
          </tr>
          ${rows}
        </table>
      </td>
    </tr>
  `;
}

function buildHtmlBody(summary, attachmentPath) {
  const status = (process.env.TEST_STATUS || 'unknown').toUpperCase();
  const statusColor = status === 'SUCCESS' ? '#137333' : '#b42318';
  const archiveSize = formatBytes(fs.statSync(attachmentPath).size);
  const runUrl = getRunUrl();
  const commit = (process.env.GITHUB_SHA || 'N/A').slice(0, 7);

  const metrics = summary ? `
    <tr>
      <td style="padding:0 32px 20px 32px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            ${buildMetricCard('Passed', summary.passed, '#137333')}
            ${buildMetricCard('Failed', summary.failed, '#b42318')}
            ${buildMetricCard('Skipped', summary.skipped, '#9a6b16')}
            ${buildMetricCard('Total', summary.total, '#102a43')}
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  const summaryPanel = summary ? `
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;">
          <tr>
            <td style="padding:18px 20px 8px 20px;font-family:Arial,sans-serif;font-size:16px;line-height:22px;font-weight:700;color:#102a43;">Execution Summary</td>
          </tr>
          <tr>
            <td style="padding:0 20px 18px 20px;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#486581;">
              Features: <strong style="color:#102a43;">${summary.features}</strong><br>
              Duration: <strong style="color:#102a43;">${escapeHtml(formatDuration(summary.durationMs))}</strong><br>
              Report archive: <strong style="color:#102a43;">${escapeHtml(path.basename(attachmentPath))}</strong> (${escapeHtml(archiveSize)})
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f7fb;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f7fb;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="720" style="max-width:720px;width:100%;background:#f4f7fb;">
            <tr>
              <td style="padding-bottom:18px;font-family:Arial,sans-serif;font-size:13px;line-height:18px;color:#7b8794;">
                ${escapeHtml(process.env.MAIL_SUBJECT_PREFIX || 'Spot Care Automation')}
              </td>
            </tr>
            <tr>
              <td style="background:#102a43;border-radius:18px 18px 0 0;padding:28px 32px;">
                <div style="font-family:Arial,sans-serif;font-size:28px;line-height:34px;font-weight:700;color:#ffffff;">Automation Test Report</div>
                <div style="padding-top:8px;font-family:Arial,sans-serif;font-size:15px;line-height:22px;color:#d9e2ec;">
                  ${escapeHtml(process.env.GITHUB_REPOSITORY || 'Repository')} • ${escapeHtml(process.env.TEST_ENVIRONMENT || 'default')} environment
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:24px 32px 18px 32px;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
                <span style="display:inline-block;padding:7px 12px;border-radius:999px;background:#f0fdf4;border:1px solid #ccebd7;font-family:Arial,sans-serif;font-size:12px;line-height:16px;font-weight:700;color:${statusColor};">
                  ${escapeHtml(status)}
                </span>
                <div style="padding-top:16px;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#486581;">
                  The automated regression run has completed successfully. The zipped report is attached for review.
                </div>
              </td>
            </tr>
            ${metrics}
            ${summaryPanel}
            <tr>
              <td style="padding:0 32px 24px 32px;background:#ffffff;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #d9e2ec;border-radius:12px;">
                  <tr>
                    <td style="padding:18px 20px;font-family:Arial,sans-serif;font-size:14px;line-height:24px;color:#486581;">
                      Branch: <strong style="color:#102a43;">${escapeHtml(process.env.GITHUB_REF_NAME || 'N/A')}</strong><br>
                      Commit: <strong style="color:#102a43;">${escapeHtml(commit)}</strong><br>
                      Executed at: <strong style="color:#102a43;">${escapeHtml(formatTimestamp())}</strong><br>
                      ${runUrl ? `Workflow run: <a href="${escapeHtml(runUrl)}" style="color:#0b69ff;text-decoration:none;">Open in GitHub Actions</a>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${buildFailedScenarioRows(summary)}
            <tr>
              <td style="background:#ffffff;padding:0 32px 32px 32px;border-left:1px solid #d9e2ec;border-right:1px solid #d9e2ec;border-bottom:1px solid #d9e2ec;border-radius:0 0 18px 18px;">
                <div style="font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#7b8794;">
                  This message was generated automatically by the CI pipeline.
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

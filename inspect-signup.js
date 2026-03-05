const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://staging.spot.care');
  await page.locator('button:has-text("Sign Up Free")').click();
  await page.waitForTimeout(2000);

  // Get the modal/form container HTML structure
  console.log('=== FORM STRUCTURE ANALYSIS ===\n');

  // Find form fields with their parent label text
  const result = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]') || document.querySelector('form');
    const fields = [];

    // Get all labels that contain inputs
    const labels = document.querySelectorAll('label');
    labels.forEach((label, idx) => {
      const input = label.querySelector('input');
      if (input && input.offsetParent !== null) { // visible
        const labelSpan = label.querySelector('span');
        fields.push({
          labelText: labelSpan?.textContent?.trim() || label.textContent?.trim().slice(0, 30),
          inputName: input.name || null,
          inputType: input.type,
          inputClass: input.className.slice(0, 60),
          suggestedSelector: input.name
            ? `input[name="${input.name}"]`
            : input.type === 'password'
              ? 'input[type="password"]'
              : null
        });
      }
    });

    // Find the submit button
    const submitBtn = document.querySelector('button[type="submit"]:not([class*="search"])');
    const submitInfo = submitBtn ? {
      text: submitBtn.textContent?.trim(),
      className: submitBtn.className.slice(0, 80)
    } : null;

    return { fields, submitInfo };
  });

  console.log('Form Fields:');
  result.fields.forEach((f, i) => {
    console.log(`${i + 1}. ${f.labelText}`);
    console.log(`   Type: ${f.inputType}, Name: ${f.inputName || 'none'}`);
    console.log(`   Selector: ${f.suggestedSelector || 'needs custom selector'}`);
    console.log('');
  });

  console.log('Submit Button:', result.submitInfo);

  // Test specific selectors
  console.log('\n=== TESTING SELECTORS ===');

  const selectors = {
    firstName: 'input[name="firstName"]',
    lastName: 'input[name="lastName"]',
    phone: 'input[name="phone"], input.react-international-phone-input',
    password: 'input[type="password"]',
    submitBtn: 'button[type="submit"]:has-text("Create account")'
  };

  for (const [name, selector] of Object.entries(selectors)) {
    const count = await page.locator(selector).count();
    const visible = count > 0 ? await page.locator(selector).first().isVisible() : false;
    console.log(`${name}: "${selector}" -> Found: ${count}, Visible: ${visible}`);
  }

  // Find the email field - it's likely between lastName and phone
  console.log('\n=== FINDING EMAIL FIELD ===');

  // Get all text inputs in the form modal area
  const textInputs = await page.locator('input[type="text"]:visible').all();
  console.log(`Found ${textInputs.length} visible text inputs`);

  for (let i = 0; i < textInputs.length; i++) {
    const input = textInputs[i];
    const info = await input.evaluate(el => {
      const parent = el.closest('label');
      const allSpans = parent ? parent.querySelectorAll('span') : [];
      const labelText = Array.from(allSpans).map(s => s.textContent?.trim()).filter(t => t && t.length > 1).join(' ');
      return {
        name: el.name,
        placeholder: el.placeholder,
        labelText: labelText || 'no label',
        parentClass: parent?.className?.slice(0, 50) || 'no parent'
      };
    });
    console.log(`Input ${i}:`, JSON.stringify(info));
  }

  // Try to find email by label text or proximity
  const emailByLabel = await page.locator('label:has-text("Email") input').count();
  const emailByPlaceholder = await page.locator('input[placeholder*="email" i]').count();
  console.log(`\nEmail by label: ${emailByLabel}, by placeholder: ${emailByPlaceholder}`);

  // Look at the full label structure for the email field
  console.log('\n=== EMAIL FIELD LABEL ANALYSIS ===');

  const emailLabelInfo = await page.evaluate(() => {
    // Get all labels in the page
    const labels = document.querySelectorAll('label');
    const results = [];

    labels.forEach(label => {
      const input = label.querySelector('input[type="text"]:not([name])');
      if (input && input.offsetParent !== null) {
        // Get all text content from span children
        const spans = label.querySelectorAll('span');
        const spanTexts = Array.from(spans).map(s => ({
          text: s.textContent?.trim(),
          class: s.className
        }));

        results.push({
          hasNoNameInput: true,
          labelHTML: label.innerHTML.slice(0, 200),
          spanTexts: spanTexts,
          inputClass: input.className.slice(0, 60)
        });
      }
    });

    return results;
  });

  console.log('Labels with unnamed inputs:');
  emailLabelInfo.forEach((info, i) => {
    console.log(`\n${i + 1}. Spans:`, info.spanTexts);
  });

  // Try different selector approaches
  console.log('\n=== TESTING EMAIL SELECTORS ===');

  const emailSelectors = [
    'label:has(span:text("Email")) input',
    'input[type="text"]:not([name])',
    'label >> nth=2 >> input',
    'input:below(input[name="lastName"]):above(input[name="phone"])'
  ];

  for (const sel of emailSelectors) {
    try {
      const count = await page.locator(sel).count();
      console.log(`"${sel}" -> ${count} matches`);
    } catch (e) {
      console.log(`"${sel}" -> Error: ${e.message.slice(0, 50)}`);
    }
  }

  console.log('\nBrowser stays open for 15 seconds...');
  await page.waitForTimeout(15000);
  await browser.close();
})();

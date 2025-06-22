const puppeteer = require('puppeteer');

describe('NameCol integration (jsTree UI)', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new', // or true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    // Serve your app locally and replace the URL below with the correct one
    await page.goto('http://localhost:5000'); // <-- Change to your dev server URL
  });

  afterAll(async () => {
    await browser.close();
  });

  test('jsTree renders NameCol and responds to click', async () => {
    // Wait for the names column container to appear
    await page.waitForSelector('#names-col-container-scroll');

    await page.click('#wiki');
    // Wait for jsTree to render at least one node
    // await page.waitForSelector('#names-col-container-scroll li > a');

    console.log('asdasd');

    // Check that at least one signal is rendered
    // Wait for the jsTree 'ready.jstree' event to fire
    await page.waitForFunction('() => {\
      return window.waveTable.nameCol.ready;\
    }'
    );


    const signalNames = await page.$$eval('#names-col-container-scroll li > a', els =>
      els.map(e => e.textContent.trim())
    );
    expect(signalNames.length).toBe(7);

    // Click the first signal
    await page.click('#names-col-container-scroll li > a');

    // Optionally, check if the row is selected (jsTree adds .jstree-clicked)
    const selected = await page.$eval(
      '#names-col-container-scroll li > a.jstree-clicked',
      el => !!el
    );
    expect(selected).toBe(true);
  });
});
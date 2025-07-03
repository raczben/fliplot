const puppeteer = require('puppeteer');

describe('NameCol integration (jsTree UI)', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new', // or true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });

    page
      .on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
      .on('pageerror', ({ message }) => console.log(message))
      // .on('response', response =>
      //   console.log(`${response.status()} ${response.url()}`))
      .on('requestfailed', request =>
        console.log(`${request.failure().errorText} ${request.url()}`))

    // Serve your app locally and replace the URL below with the correct one
    await page.goto('http://localhost:5173'); // <-- Change to your dev server URL
  }, 10000);

  afterAll(async () => {
    await browser.close();
  });

  test('jsTree renders NameCol and responds to click', async () => {
    // Wait for the names column container to appear
    await page.waitForSelector('#names-col-container-scroll');


    // await page.screenshot({path: 'screenshots/empty_page.png'});
    
    await page.click('#wiki');
    console.log('TEST1');

    // await page.screenshot({path: 'screenshots/loading.png'});
    // await page.waitForFunction('window.waveTable.nameCol.isLoaded');

    // await page.screenshot({path: 'screenshots/loaded.png'});
    // TODO: Workaround: waiting the last element in the js tree to be loaded.
    await page.waitForSelector('#signal-name-wfr-14');
    console.log('TEST2');

    const signalNames = await page.$$eval('#names-col-container-scroll li > a', els =>
      els.map(e => e.textContent.trim())
    );
    console.log('TEST3');

    expect(signalNames.length).toBe(7);

    // Click the first signal
    await page.click('#names-col-container-scroll li > a');

    // Optionally, check if the row is selected (jsTree adds .jstree-clicked)
    const selected = await page.$eval(
      '#names-col-container-scroll li > a.jstree-clicked',
      el => !!el
    );
    expect(selected).toBe(true);
  }, 10000);
});
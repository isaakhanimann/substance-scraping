const puppeteer = require('puppeteer')

async function scrapeProduct(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const [el] = await page.$x('//*[@id="imgBlkFront"]');
    const src = await el.getProperty('src')
    const srcTxt = await src.jsonValue()
    console.log({srcTxt})
    await browser.close();
}

scrapeProduct('https://www.amazon.com/Black-Swan-Improbable-Robustness-Fragility/dp/081297381X/ref=sr_1_2')
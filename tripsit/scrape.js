const puppeteer = require('puppeteer')

async function scrapeSubstances(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    for (pageNum = 1; pageNum < 20; pageNum++) {
        await scrapePage(page)
        console.log("----------------------")
        await page.$eval( '#DataTables_Table_0_next > a', form => form.click() );
    }
    await browser.close()
}

async function scrapePage(page) {
    for (i = 1; i < 31; i++) {
        var element = await page.waitForSelector("#DataTables_Table_0 > tbody > tr:nth-child(" + i + ") > td.ttext.all.sorting_1 > a")
        var text = await page.evaluate(element => element.textContent, element)
        console.log(text)
    }
}

scrapeSubstances('https://drugs.tripsit.me')
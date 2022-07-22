const puppeteer = require('puppeteer')
const fs = require('fs');

async function scrapeSubstances(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    let substances = [];
    for (pageNum = 1; pageNum < 20; pageNum++) {
        const substancesOnPage = await getSubstancesFromPage(page)
        substances = substances.concat(substancesOnPage)
        await page.$eval('#DataTables_Table_0_next > a', form => form.click());
    }
    saveInFile(substances)
    await browser.close()
}

async function getSubstancesFromPage(page) {
    const substancesOnPage = []
    for (i = 1; i < 31; i++) {
        try {
            const element = await page.waitForSelector("#DataTables_Table_0 > tbody > tr:nth-child(" + i + ") > td.ttext.all.sorting_1 > a", {timeout: 5000})
            const text = await page.evaluate(element => element.textContent, element)
            substancesOnPage[i - 1] = text
        } catch (e) {
            break
        }

    }
    return substancesOnPage
}

function saveInFile(substances) {
    fs.writeFile(
        "tripsit_substances.json",
        JSON.stringify(substances, null, 2),
        'utf8',
        function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The data has been scraped and saved successfully! View it at './data.json'");
        }
    );
}

scrapeSubstances('https://drugs.tripsit.me')
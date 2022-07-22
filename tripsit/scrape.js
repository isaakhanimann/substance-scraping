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
            let substance = {};
            const nameElement = await page.waitForSelector("#DataTables_Table_0 > tbody > tr:nth-child(" + i + ") > td.ttext.all.sorting_1 > a", {timeout: 5000})
            const name = await page.evaluate(element => element.textContent, nameElement)
            substance['name'] = name.trim()
            substancesOnPage[i - 1] = substance
        } catch (e) {
            break
        }

    }
    return substancesOnPage
}

function saveInFile(substances) {
    const fileName = "tripsit_substances.json"
    fs.writeFile(
        fileName,
        JSON.stringify(substances, null, 2),
        'utf8',
        function (err) {
            if (err) {
                return console.log(err);
            }
            console.log(`The data has been scraped and saved successfully! View it at './${fileName}'`);
        }
    );
}

scrapeSubstances('https://drugs.tripsit.me')
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
    return await page.evaluate(() => {
        let rows = Array.from(document.querySelectorAll("#DataTables_Table_0 > tbody > tr"));
        const substances = rows.map(row => {
                const name = row.querySelector("td.ttext.all.sorting_1 > a").textContent.trim();
                const categories = Array.from(row.querySelectorAll("td.min-tablet > a")).map(e => e.textContent);
                const summary = row.querySelector("td.ttext.desktop").textContent.trim();
                return {name: name, categories: categories, summary: summary};
            }
        )
        return substances;
    });
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
            console.log(`${substances.length} substances been scraped and saved successfully! View them at './${fileName}'`);
        }
    );
}

scrapeSubstances('https://drugs.tripsit.me')
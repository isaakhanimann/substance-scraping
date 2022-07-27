const puppeteer = require('puppeteer')
const fs = require('fs');

const url = 'https://drugs.tripsit.me'

async function scrapeSubstances() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const substancesWithLittleData = await getAllSubstancesWithLittleData(page)
    const substances = await getAllSubstancesWithInteractions(substancesWithLittleData, page)
    saveInFile(substances)
    await browser.close()
}

async function getAllSubstancesWithLittleData(page) {
    let allSubstancesWithCategoriesAndSummaries = [];
    for (let pageNum = 1; pageNum < 20; pageNum++) {
        const substancesWithCategoriesAndSummaryFromPage = await getSubstancesWithNamesCategoriesAndSummaryFromPage(page)
        allSubstancesWithCategoriesAndSummaries = allSubstancesWithCategoriesAndSummaries.concat(substancesWithCategoriesAndSummaryFromPage)
        await page.$eval('#DataTables_Table_0_next > a', form => form.click());
    }
    return allSubstancesWithCategoriesAndSummaries;
}

async function getSubstancesWithNamesCategoriesAndSummaryFromPage(page) {
    return await page.evaluate(() => {
        let rows = Array.from(document.querySelectorAll("#DataTables_Table_0 > tbody > tr"));
        return rows.map(row => {
                const name = row.querySelector("td.ttext.all.sorting_1 > a").textContent.trim();
                const categories = Array.from(row.querySelectorAll("td.min-tablet > a")).map(e => e.textContent);
                const summary = row.querySelector("td.ttext.desktop").textContent.trim();
                return {name: name, categories: categories, summary: summary};
            }
        )
    });
}

async function getAllSubstancesWithInteractions(substancesWithLittleData, page) {
    let allSubstances = [];
    for (let i = 0; i < substancesWithLittleData.length; i++) {
        const substanceLittle = substancesWithLittleData[i];
        const substanceName = substanceLittle.name
        if (substanceName !== "MDMA") {
            continue;
        }
        console.log(`Parsing ${substanceName}`)
        const encodedName = encodeURIComponent(substanceName.toLowerCase())
        const substanceURL = url + "/" + encodedName
        await page.goto(substanceURL);
        const interactions = await getInteractionsFromSubstancePage(page)
        allSubstances.push({
            name: substanceName,
            summary: substanceLittle.summary,
            categories: substanceLittle.categories,
            interactions: interactions
        })
    }
    return allSubstances
}

async function getInteractionsFromSubstancePage(page) {
    return await page.evaluate(() => {
        let dangerousInteractionsElements = Array.from(document.querySelectorAll("div.bs-callout.bs-callout-dangerous > ul > li"));
        let dangerousInteractions = dangerousInteractionsElements.map(element => {
            let name = element.querySelector("a").textContent
            let explanations = Array.from(element.querySelectorAll("ul > li")).map(e => e.textContent);
            return {name: name, explanations: explanations};
        })
        let cautionInteractionsElements = Array.from(document.querySelectorAll("div.bs-callout.bs-callout-caution > ul > li"));
        let cautionInteractions = cautionInteractionsElements.map(element => {
            let name = element.querySelector("a").textContent
            let explanations = Array.from(element.querySelectorAll("ul > li")).map(e => e.textContent);
            return {name: name, explanations: explanations};
        })
        let unsafeInteractionsElements = Array.from(document.querySelectorAll("div.bs-callout.bs-callout-unsafe > ul > li"));
        let unsafeInteractions = unsafeInteractionsElements.map(element => {
            let name = element.querySelector("a").textContent
            let explanations = Array.from(element.querySelectorAll("ul > li")).map(e => e.textContent);
            return {name: name, explanations: explanations};
        })
        let lowRiskIncreasedEffectsInteractionsElements = Array.from(document.querySelectorAll("div.bs-callout.bs-callout-lowinc > ul > li"));
        let lowRiskIncreasedEffectsInteractions = lowRiskIncreasedEffectsInteractionsElements.map(element => {
            let name = element.querySelector("a").textContent
            let explanations = Array.from(element.querySelectorAll("ul > li")).map(e => e.textContent);
            return {name: name, explanations: explanations};
        })
        let lowRiskNoIncreasedEffectsInteractionsElements = Array.from(document.querySelectorAll("div.bs-callout.bs-callout-lowno > ul > li"));
        let lowRiskNoIncreasedEffectsInteractions = lowRiskNoIncreasedEffectsInteractionsElements.map(element => {
            let name = element.querySelector("a").textContent
            let explanations = Array.from(element.querySelectorAll("ul > li")).map(e => e.textContent);
            return {name: name, explanations: explanations};
        })
        let lowRiskDecreasedEffectsInteractionsElements = Array.from(document.querySelectorAll("div.bs-callout.bs-callout-lowdec > ul > li"));
        let lowRiskDecreasedEffectsInteractions = lowRiskDecreasedEffectsInteractionsElements.map(element => {
            let name = element.querySelector("a").textContent
            let explanations = Array.from(element.querySelectorAll("ul > li")).map(e => e.textContent);
            return {name: name, explanations: explanations};
        })
        return {
            dangerousInteractions: dangerousInteractions,
            cautionInteractions: cautionInteractions,
            unsafeInteractions: unsafeInteractions,
            lowRiskIncreasedEffectsInteractions: lowRiskIncreasedEffectsInteractions,
            lowRiskNoIncreasedEffectsInteractions: lowRiskNoIncreasedEffectsInteractions,
            lowRiskDecreasedEffectsInteractions: lowRiskDecreasedEffectsInteractions
        };
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

scrapeSubstances()
const puppeteer = require('puppeteer')
const fs = require('fs');

const url = 'https://drugs.tripsit.me'

async function scrapeSubstances() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const substancesWithLittleData = await getAllSubstancesWithLittleData(page)
    console.log(`Done fetching substances with name, summary and category`)
    const substances = await getAllSubstancesWithInteractions(substancesWithLittleData, page)
    saveInFile(substances)
    await browser.close()
}

async function getAllSubstancesWithLittleData(page) {
    let allSubstancesWithCategoriesAndSummaries = [];
    for (let pageNum = 1; pageNum < 20; pageNum++) {
        const substancesWithCategoriesAndSummaryFromPage = await getSubstancesWithNamesCategoriesAndSummaryFromPage(page)
        allSubstancesWithCategoriesAndSummaries = allSubstancesWithCategoriesAndSummaries.concat(substancesWithCategoriesAndSummaryFromPage)
        await page.$eval('#DataTables_Table_0_next > a', form => form.click()); // #DataTables_Table_0_next is to reference an element with the id DataTables_Table_0_next
    }
    return allSubstancesWithCategoriesAndSummaries;
}

async function getSubstancesWithNamesCategoriesAndSummaryFromPage(page) {
    return await page.evaluate(() => {
        let rows = Array.from(document.querySelectorAll("#DataTables_Table_0 > tbody > tr"));
        return rows.map(row => {
                const name = row.querySelector("td.ttext.all.sorting_1 > a").textContent.trim(); //td means the element, .ttext, .all and .sorting_1 are classes of the element, > means go exactly one level down and a is another element
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
        console.log(`Getting ${substanceName} interactions`)
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
        function getInteractions(label) {
            let elements = Array.from(document.querySelectorAll(`div.bs-callout.bs-callout-${label} > ul > li`));
            return elements.map(element => {
                let name = element.querySelector("a").textContent
                let explanations = Array.from(element.querySelectorAll("ul > li")).map(e => e.textContent);
                return {name: name, explanations: explanations};
            })
        }

        return {
            dangerousInteractions: getInteractions("dangerous"),
            cautionInteractions: getInteractions("caution"),
            unsafeInteractions: getInteractions("unsafe"),
            lowRiskIncreasedEffectsInteractions: getInteractions("lowinc"),
            lowRiskNoIncreasedEffectsInteractions: getInteractions("lowno"),
            lowRiskDecreasedEffectsInteractions: getInteractions("lowdec")
        };
    });
}

function saveInFile(substances) {
    const fileName = "tripsit-substances.json"
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
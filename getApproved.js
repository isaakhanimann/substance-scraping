const puppeteer = require('puppeteer')
const fs = require('fs');
const {promises: fsPromises} = require("fs");

(async () => {
    let psychonautWikiContent = await fsPromises.readFile('./input/psychonautwiki.json', 'utf-8');
    let psychonautWikiSubstances = JSON.parse(psychonautWikiContent)['data']['substances'];
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const searchText = "approvedRevs-approved"
    let newSubstances = [];
    for (let i = 0; i < psychonautWikiSubstances.length; i++) {
        const psychonautWikiSubstance = psychonautWikiSubstances[i];
        try {
            const url = psychonautWikiSubstance.url;
            await page.goto(url);
            const pageText = await page.content();
            const isApprovedValue = pageText.includes(searchText);
            let newSubstance = {name: psychonautWikiSubstance.name, isApproved: isApprovedValue};
            newSubstances.push(newSubstance)
            console.log(`${newSubstance.name} ${isApprovedValue}!`)
        } catch(err) {
            let newSubstance = {name: psychonautWikiSubstance.name, isApproved: false};
            newSubstances.push(newSubstance)
            console.log(`${newSubstance.name} false!`)
        }
    }
    await browser.close();
    saveInFile(newSubstances);
})();

function saveInFile(substances) {
    const fileName = "input/approved.json"
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

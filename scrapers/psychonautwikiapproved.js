const puppeteer = require('puppeteer')
const fs = require('fs');
const {promises: fsPromises} = require("fs");

(async () => {
    let oldFileContent = await fsPromises.readFile('./psychonautwiki.json', 'utf-8');
    let oldSubstances = JSON.parse(oldFileContent);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const searchText = "approvedRevs-approved"
    let newSubstances = [];
    for (let i = 0; i < oldSubstances.length; i++) {
        const oneSubstance = oldSubstances[i];
        try {
            const url = oneSubstance.url;
            await page.goto(url);
            const pageText = await page.content();
            const isApproved = pageText.includes(searchText);
            oneSubstance['isApproved'] = isApproved;
            newSubstances.push(oneSubstance)
            console.log(`${oneSubstance.name} ${isApproved}!`)
        } catch(err) {
            oneSubstance['isApproved'] = false;
            newSubstances.push(oneSubstance)
            console.log(`${oneSubstance.name} false!`)
        }
    }
    await browser.close();
    saveInFile(newSubstances);
})();

function saveInFile(substances) {
    const fileName = "psychonautwikiapproved.json"
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

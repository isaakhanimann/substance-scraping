const {promises: fsPromises} = require('fs');

async function compose() {
    let psychContent = await fsPromises.readFile('./psychonautwiki.json', 'utf-8');
    let psychonautWikiSubstances = JSON.parse(psychContent);
    let saferContent = await fsPromises.readFile('./saferparty.json', 'utf-8');
    let saferpartySubstances = JSON.parse(saferContent);
    let tripsitContent = await fsPromises.readFile('./tripsit.json', 'utf-8');
    let tripsitSubstances = JSON.parse(tripsitContent);
    console.log("Success")
}

compose()
const {promises: fsPromises} = require('fs');
const fs = require("fs");

async function compose() {
    let psychContent = await fsPromises.readFile('./psychonautwiki.json', 'utf-8');
    let psychonautWikiSubstances = JSON.parse(psychContent);
    let saferContent = await fsPromises.readFile('./saferparty.json', 'utf-8');
    let saferpartySubstances = JSON.parse(saferContent);
    let tripsitContent = await fsPromises.readFile('./tripsit.json', 'utf-8');
    let tripsitSubstances = JSON.parse(tripsitContent);
    let substances = combinePsychoWithSafer(psychonautWikiSubstances, saferpartySubstances);
    saveInFile(substances)
}

function combinePsychoWithSafer(psychonautWikiSubstances, saferpartySubstances) {
    let unusedSaferpartyNames = new Set(saferpartySubstances.map(sub => sub.name));
    let combinedSubstances = psychonautWikiSubstances.map(psychSub => {
            let saferpartySub = saferpartySubstances.find(safer => safer.name === psychSub.name);
            if (saferpartySub !== undefined) {
                unusedSaferpartyNames.delete(psychSub.name);
                return combineOnePsychoWithOneSafer(psychSub, saferpartySub);
            } else {
                return psychSub;
            }

        }
    )
    console.log(`Unused saferparty substances are: ${Array.from(unusedSaferpartyNames.values())}`);
    return combinedSubstances;
}

function combineOnePsychoWithOneSafer(psycho, safer) {
    psycho['effects'] = safer.effects;
    psycho['dosageRemark'] = safer.dosageRemark;
    psycho['generalRisks'] = safer.generalRisks;
    psycho['longtermRisks'] = safer.longtermRisks;
    psycho['saferUse'] = safer.saferUse;
    psycho['extenderText'] = safer.extenderText;
    psycho['extenders'] = safer.extenders;
    return psycho;
}

function saveInFile(substances) {
    const fileName = "substances.json"
    fs.writeFile(
        fileName,
        JSON.stringify(substances, null, 2),
        'utf8',
        function (err) {
            if (err) {
                return console.log(err);
            }
            console.log(`${substances.length} substances been saved successfully! View them at './${fileName}'`);
        }
    );
}

compose()
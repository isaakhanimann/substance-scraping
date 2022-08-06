const {promises: fsPromises} = require('fs');
const fs = require("fs");

(async () => {
    let psychContent = await fsPromises.readFile('./psychonautwiki.json', 'utf-8');
    let psychonautWikiSubstances = cleanupPsychonautWikiSubstances(JSON.parse(psychContent));
    let saferContent = await fsPromises.readFile('./saferparty.json', 'utf-8');
    let saferpartySubstances = JSON.parse(saferContent);
    let tripsitContent = await fsPromises.readFile('./tripsit.json', 'utf-8');
    let tripsitSubstances = JSON.parse(tripsitContent);
    let finalSubstances = getFinalSubstances(psychonautWikiSubstances, saferpartySubstances, tripsitSubstances);
    saveInFile(finalSubstances);
})();


function cleanupPsychonautWikiSubstances(psychonautWikiSubstances) {
    let namesToRemove = new Set([
        "2C-T-X",
        "2C-X",
        "25X-Nbome",
        "Amphetamine (Disambiguation)",
        "Antihistamine",
        "Antipsychotic",
        "Cannabinoid",
        "Datura (Botany)",
        "Deliriant",
        "Depressant",
        "Dox",
        "Harmala Alkaloid",
        "Hyoscyamus Niger (Botany)",
        "Hypnotic",
        "Iso-LSD",
        "List Of Prodrugs",
        "Mandragora Officinarum (Botany)",
        "Nbx",
        "Nootropic",
        "Phenethylamine (Compound)",
        "Piper Nigrum (Botany)",
        "RIMA",
        "Selective Serotonin Reuptake Inhibitor",
        "Serotonin",
        "Serotonin-Norepinephrine Reuptake Inhibitor",
        "Synthetic Cannabinoid",
        "Tabernanthe Iboga (Botany)",
        "Tryptamine (Compound)",
        "Cake",
        "Inhalants",
        "MAOI",
        "Opioids",
        "Benzodiazepines",
        "Classic Psychedelics",
        "Psychedelics",
        "Serotonergic Psychedelic",
        "25x-NBOH",
        "Antidepressants",
        "Barbiturates",
        "Substituted Aminorexes",
        "Substituted Amphetamines",
        "Substituted Cathinones",
        "Substituted Morphinans",
        "Substituted Phenethylamines",
        "Substituted Phenidates",
        "Substituted Tryptamines",
        "Classical Psychedelics",
        "Diarylethylamines",
        "Dissociatives",
        "Entactogens",
        "Gabapentinoids",
        "Hallucinogens",
        "Lysergamides",
        "Thienodiazepines",
        "Xanthines",
        "Arylcyclohexylamines",
        "Entheogen",
        "Racetams",
        "Sedative",
        "Stimulants",
        "Eugeroics"
    ].map(name => name.toLowerCase()));

    function isNameOk(substance) {
        return !substance.name.toLowerCase().includes("experience") && !namesToRemove.has(substance.name.toLowerCase());
    }

    return psychonautWikiSubstances.filter(isNameOk)
}

function getFinalSubstances(psychonautWikiSubstances, saferpartySubstances, tripsitSubstances) {
    let unusedSaferpartyNames = new Set(saferpartySubstances.map(sub => sub.name));
    let unusedTripsitNames = new Set(tripsitSubstances.map(sub => sub.name));
    let psychonautWikiSubstancesWithoutMatch = new Set();
    let finalSubstances = psychonautWikiSubstances.map(onePsychonautWikiSubstance => {
            let name = onePsychonautWikiSubstance.name;
            let saferpartyOptional = saferpartySubstances.find(safer => safer.name === name);
            let tripsitOptional = tripsitSubstances.find(tripsit => tripsit.name === name);
            if (saferpartyOptional !== undefined) {
                unusedSaferpartyNames.delete(name);
            }
            if (tripsitOptional !== undefined) {
                unusedTripsitNames.delete(name);
            } else {
                psychonautWikiSubstancesWithoutMatch.add(name);
            }
            let interactions = {
                dangerous: onePsychonautWikiSubstance.dangerousInteractions,
                unsafe: onePsychonautWikiSubstance.unsafeInteractions,
                uncertain: onePsychonautWikiSubstance.uncertainInteractions
            };
            return {
                name: name,
                commonNames: onePsychonautWikiSubstance.commonNames,
                url: onePsychonautWikiSubstance.url,
                tolerance: onePsychonautWikiSubstance.tolerance,
                crossTolerances: onePsychonautWikiSubstance.crossTolerances,
                roas: onePsychonautWikiSubstance.roas,
                addictionPotential: onePsychonautWikiSubstance.addictionPotential,
                categories: tripsitOptional?.categories,
                summary: tripsitOptional?.summary,
                interactions: interactions,
                effectsSummary: saferpartyOptional?.effects,
                dosageRemark: saferpartyOptional?.dosageRemark,
                generalRisks: saferpartyOptional?.generalRisks,
                longtermRisks: saferpartyOptional?.longtermRisks,
                saferUse: saferpartyOptional?.saferUse
            };
        }
    )
    console.log(`Unused tripsit substances: ${JSON.stringify(Array.from(unusedTripsitNames), null, 2)}`);
    console.log(`PsychonautWiki substances without a tripsit match: ${JSON.stringify(Array.from(psychonautWikiSubstancesWithoutMatch), null, 2)}`);
    console.log(`Unused saferparty substances are: ${JSON.stringify(Array.from(unusedSaferpartyNames), null, 2)}`);
    return finalSubstances;
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
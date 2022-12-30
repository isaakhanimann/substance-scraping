const {promises: fsPromises} = require('fs');
const fs = require("fs");
const assert = require("assert");

(async () => {
    let psychonautWikiContent = await fsPromises.readFile('./psychonautwiki.json', 'utf-8');
    let psychonautWikiSubstances = cleanupPsychonautWikiSubstances(JSON.parse(psychonautWikiContent)['data']['substances']);
    for (let i = 0; i < psychonautWikiSubstances.length; i++) {
        const substance = psychonautWikiSubstances[i];
        checkSubstance(substance)
    }
    console.log(`${substanceCount} substances have incomplete durations`);
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
        "Eugeroics",
        "Sertraline",
        "Zaleplon",
        "Salvia Divinorum",
        "Banisteriopsis caapi",
        "Peganum harmala"
    ].map(name => name.toLowerCase()));
    function isNameOk(substance) {
        return !substance.name.toLowerCase().includes("experience") && !namesToRemove.has(substance.name.toLowerCase());
    }
    return psychonautWikiSubstances.filter(isNameOk)
}

let substanceCount = 0

function checkSubstance(substance) {
    const numRoas = substance.roas.length
    if (numRoas === 0) {
        substanceCount++;
        console.log(`${substance.name} has no administration route`);
    } else {
        let isSubstanceOk = true
        for (let i = 0; i < numRoas; i++) {
            const roa = substance.roas[i];
            let missingRoutes = ''
            if (!isDurationRangeFullyDefined(roa.onset)) {
                missingRoutes += ' onset'
            }
            if (!isDurationRangeFullyDefined(roa.comeup)) {
                missingRoutes += ' comeup'
            }
            if (!isDurationRangeFullyDefined(roa.peak)) {
                missingRoutes += ' peak'
            }
            if (!isDurationRangeFullyDefined(roa.offset)) {
                missingRoutes += ' offset'
            }
            if (missingRoutes !== '') {
                isSubstanceOk = false
                console.log(`${substance.name} ${roa.name} missing${missingRoutes}`)
            }
        }
        substanceCount++;
    }
}

function isDurationRangeFullyDefined(range) {
    return range !== undefined && range.min !== undefined && range.max !== undefined && (range.units === "minutes" || range.units === "seconds" || range.units === "hours" || range.units === "days")
}
const {promises: fsPromises} = require('fs');
const fs = require("fs");
const assert = require("assert");

(async () => {
    let psychContent = await fsPromises.readFile('./psychonautwikiapproved.json', 'utf-8');
    let psychonautWikiSubstances = cleanupPsychonautWikiSubstances(JSON.parse(psychContent));
    let saferContent = await fsPromises.readFile('./saferparty.json', 'utf-8');
    let saferpartySubstances = JSON.parse(saferContent);
    let tripsitContent = await fsPromises.readFile('./tripsit.json', 'utf-8');
    let tripsitSubstances = cleanupTripsitSubstances(JSON.parse(tripsitContent));
    let finalSubstances = getFinalSubstances(psychonautWikiSubstances, saferpartySubstances, tripsitSubstances);
    let categoriesContent = await fsPromises.readFile('./categories.json', 'utf-8');
    let categories = JSON.parse(categoriesContent);
    let inferredCategoryNames = getAllCategoriesOfSubstances(finalSubstances);
    let explicitCategoryNames = categories.map(i => i.name);
    let diff1 = inferredCategoryNames.filter(i => !explicitCategoryNames.includes(i));
    let diff2 = explicitCategoryNames.filter(i => !inferredCategoryNames.includes(i));
    assert(diff1.length === 0, `${diff1} were inferred but not inside explicit categories`)
    assert(diff2.length === 0, `${diff1} were provided explicitly but not inferred`)
    let fileOutput = {
            categories: categories,
            substances: finalSubstances
        }
    ;
    saveInFile(fileOutput);
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

    let substances = psychonautWikiSubstances.filter(isNameOk)
    substances.forEach(substance => {
        if (substance.class != undefined) {
            substance.class.psychoactive = (substance?.class?.psychoactive ?? []).map(element => {
                if (element === "Selective serotonin reuptake inhibitor") {
                    return "SSRIs"
                } else {
                    return element
                }
            });
        }
        replaceInteractions(substance?.dangerousInteractions ?? []);
        replaceInteractions(substance?.unsafeInteractions ?? []);
        replaceInteractions(substance?.uncertainInteractions ?? []);
    })
    return substances
}

function cleanupTripsitSubstances(tripsitSubstances) {
    return tripsitSubstances.map(substance => {
        let newCategories = substance.categories.map(catName => {
            if (catName === "empathogen") {
                return "entactogen";
            } else {
                return catName
            }
        });
        substance.categories = newCategories.filter(name => name !== "supplement")
        return substance
    });
}

function replaceInteractions(array) {
    return array.map(element => {
        if (element.name === "Selective serotonin reuptake inhibitor") {
            element.name = "SSRIs"
        }
        if (element.name === "Serotonin") {
            element.name = "Serotonin releasers"
        }
        return element
    });
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
                dangerous: onePsychonautWikiSubstance?.dangerousInteractions,
                unsafe: onePsychonautWikiSubstance?.unsafeInteractions,
                uncertain: onePsychonautWikiSubstance?.uncertainInteractions
            };
            return {
                name: name,
                commonNames: onePsychonautWikiSubstance.commonNames,
                url: onePsychonautWikiSubstance.url,
                isApproved: onePsychonautWikiSubstance.isApproved,
                tolerance: onePsychonautWikiSubstance.tolerance,
                crossTolerances: onePsychonautWikiSubstance.crossTolerances,
                addictionPotential: onePsychonautWikiSubstance.addictionPotential,
                toxicities: onePsychonautWikiSubstance.toxicity,
                categories: getCategoriesOfSubstance(name, onePsychonautWikiSubstance.class?.psychoactive ?? [], tripsitOptional?.categories ?? []),
                summary: tripsitOptional?.summary,
                effectsSummary: saferpartyOptional?.effects,
                dosageRemark: saferpartyOptional?.dosageRemark,
                generalRisks: saferpartyOptional?.generalRisks,
                longtermRisks: saferpartyOptional?.longtermRisks,
                saferUse: saferpartyOptional?.saferUse,
                interactions: interactions,
                roas: onePsychonautWikiSubstance.roas
            };
        }
    )
    console.log(`Unused tripsit substances: ${JSON.stringify(Array.from(unusedTripsitNames), null, 2)}`);
    console.log(`PsychonautWiki substances without a tripsit match: ${JSON.stringify(Array.from(psychonautWikiSubstancesWithoutMatch), null, 2)}`);
    console.log(`Unused saferparty substances are: ${JSON.stringify(Array.from(unusedSaferpartyNames), null, 2)}`);
    return finalSubstances;
}

function getCategoriesOfSubstance(substanceName, psychonautWikiPsychoactiveClasses, tripSitCategories) {
    let psychonautWikiCategories = psychonautWikiPsychoactiveClasses.map(psychonautClass => {
        return psychonautClass.toLowerCase().replace(/s$/, "");
    });
    let finalCategories = new Set([...psychonautWikiCategories, ...tripSitCategories]);
    return Array.from(finalCategories)
}

function getAllCategoriesOfSubstances(allSubstances) {
    let allCategories = new Set();
    for (const allSubstancesKey in allSubstances) {
        let sub = allSubstances[allSubstancesKey];
        let cats = sub.categories ?? []
        for (const catsKey in cats) {
            let name = cats[catsKey];
            allCategories.add(name);
        }
    }
    return Array.from(allCategories);
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
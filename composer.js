const {promises: fsPromises} = require('fs');
const fs = require("fs");
const assert = require("assert");

(async () => {
    let psychonautWikiContent = await fsPromises.readFile('./input/psychonautwiki.json', 'utf-8');
    let psychonautWikiSubstances = cleanupPsychonautWikiSubstances(JSON.parse(psychonautWikiContent)['data']['substances']);
    let approvedContent = await fsPromises.readFile('./input/approved.json', 'utf-8');
    let approvedSubstances = JSON.parse(approvedContent);
    let saferContent = await fsPromises.readFile('./input/saferparty.json', 'utf-8');
    let saferpartySubstances = JSON.parse(saferContent);
    let tripsitContent = await fsPromises.readFile('./input/tripsitCleaned.json', 'utf-8');
    let tripsitSubstances = JSON.parse(tripsitContent);
    let finalSubstances = getFinalSubstances(psychonautWikiSubstances, saferpartySubstances, tripsitSubstances, approvedSubstances);
    let categoriesContent = await fsPromises.readFile('./input/categories.json', 'utf-8');
    let categories = JSON.parse(categoriesContent);
    let inferredCategoryNames = getAllCategoriesOfSubstances(finalSubstances);
    let indexToPrint = 242
    console.log(`Substance at index: ${indexToPrint} is: ${finalSubstances[indexToPrint].name}`);
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
        "Psychedelic",
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
        "Sertraline", // todo: check if roa still doesn't make sense
        "Salvia Divinorum",
        "Banisteriopsis caapi",
        "Peganum harmala",
        "Tizanidine",
        "Entactogen",
        "N-(2C)-fentanyl"
    ].map(name => name.toLowerCase()));

    function isNameOk(substance) {
        return !substance.name.toLowerCase().includes("experience") && !namesToRemove.has(substance.name.toLowerCase());
    }

    let substances = psychonautWikiSubstances.filter(isNameOk)
    substances.forEach(substance => {
        if (substance.class != undefined) {
            substance.class.psychoactive = (substance?.class?.psychoactive ?? []).flatMap(element => {
                if (element === "Selective serotonin reuptake inhibitor") {
                    return ["SSRIs"]
                } else if (element === "Atypical neuroleptic") {
                    return []
                } else {
                    return [element]
                }
            });
        }
        substance.roas = substance.roas?.map(roa => cleanedUpRoa(roa)) ?? []
        if (substance.commonNames == null) {
            substance.commonNames = []
        }
        // if (substance.name == "1B-LSD") {
        //     let a = 2;
        // }
        if (substance.crossTolerances == null) {
            substance.crossTolerances = []
        }
        if (substance.toxicity == null) {
            substance.toxicities = []
        } else {
            substance.toxicities = substance.toxicity
        }
        replaceInteractions(substance?.dangerousInteractions ?? []);
        replaceInteractions(substance?.unsafeInteractions ?? []);
        replaceInteractions(substance?.uncertainInteractions ?? []);
    })
    return substances
}

function replaceInteractions(array) {
    return array.map(element => {
        if (element.name === "Selective serotonin reuptake inhibitor") {
            element.name = "SSRIs"
        }
        if (element.name === "Serotonin") {
            element.name = "Serotonin releasers"
        }
        if (element.name === "Psychedelic") {
            element.name = "Psychedelics"
        }
        return element
    });
}

function cleanedUpRoa(roa) {
    roa.duration = cleanupDuration(roa.duration)
    roa.dose = cleanupDose(roa.dose)
    return roa
}

function cleanupDuration(duration) {
    let onsetValue = cleanupDurationRange(duration?.onset)
    let comeupValue = cleanupDurationRange(duration?.comeup)
    let peakValue = cleanupDurationRange(duration?.peak)
    let offsetValue = cleanupDurationRange(duration?.offset)
    let totalValue = cleanupDurationRange(duration?.total)
    let afterglowValue = cleanupDurationRange(duration?.afterglow)
    if (onsetValue == null && comeupValue == null && peakValue == null && offsetValue == null && totalValue == null && afterglowValue == null) {
        return null
    } else {
        return {
            onset: onsetValue,
            comeup: comeupValue,
            peak: peakValue,
            offset: offsetValue,
            total: totalValue,
            afterglow: afterglowValue
        }
    }
}

function cleanupDose(dose) {
    let lightMin = dose?.threshold ?? dose?.light?.min
    let commonMin = dose?.common?.min ?? dose?.light?.max
    let strongMin = dose?.strong?.min ?? dose?.common?.max
    let heavyMin = dose?.heavy ?? dose?.strong?.max
    if (dose?.units == null || dose?.units?.length === 0) {
        return null
    } else {
        let units = dose.units == "μg" ? "µg" : dose.units
        return {
            units: units,
            lightMin: lightMin,
            commonMin: commonMin,
            strongMin: strongMin,
            heavyMin: heavyMin,
        }
    }
}

function cleanupDurationRange(range) {
    if (range?.min == null && range?.max == null) {
        return null
    }
    if (range?.units === "Hours#" || range?.units === "Hours") {
        range.units = "hours"
        return range
    }
    if (range?.units === "Minutes#" || range?.units === "min") {
        range.units = "minutes"
        return range
    }
    return range
}

function getFinalSubstances(psychonautWikiSubstances, saferpartySubstances, tripsitSubstances, approvedSubstances) {
    let unusedSaferpartyNames = new Set(saferpartySubstances.map(sub => sub.name));
    let unusedTripsitNames = new Set(tripsitSubstances.map(sub => sub.name));
    let psychonautWikiSubstancesWithoutMatch = new Set();
    let finalSubstances = psychonautWikiSubstances.map(onePsychonautWikiSubstance => {
            let name = onePsychonautWikiSubstance.name;
            let saferpartyOptional = saferpartySubstances.find(safer => safer.name === name);
            let tripsitOptional = tripsitSubstances.find(tripsit => tripsit.name === name);
            let approvedOptional = approvedSubstances.find(approved => approved.name === name);
            if (saferpartyOptional !== undefined) {
                unusedSaferpartyNames.delete(name);
            }
            if (tripsitOptional !== undefined) {
                unusedTripsitNames.delete(name);
            } else {
                psychonautWikiSubstancesWithoutMatch.add(name);
            }
            let dangerousNames = onePsychonautWikiSubstance?.dangerousInteractions?.map(interaction => interaction.name) ?? [];
            let unsafeNames = onePsychonautWikiSubstance?.unsafeInteractions?.map(interaction => interaction.name) ?? [];
            let uncertainNames = onePsychonautWikiSubstance?.uncertainInteractions?.map(interaction => interaction.name) ?? [];
            let interactions = (dangerousNames.length + unsafeNames.length + uncertainNames.length > 0) ? {
                dangerous: dangerousNames,
                unsafe: unsafeNames,
                uncertain: uncertainNames
            } : null;
            checkMissingDurations(onePsychonautWikiSubstance);
            return {
                name: name,
                commonNames: onePsychonautWikiSubstance.commonNames,
                url: onePsychonautWikiSubstance.url,
                isApproved: approvedOptional?.isApproved ?? false,
                tolerance: onePsychonautWikiSubstance.tolerance,
                crossTolerances: onePsychonautWikiSubstance.crossTolerances,
                addictionPotential: onePsychonautWikiSubstance.addictionPotential,
                toxicities: onePsychonautWikiSubstance.toxicities,
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
    printInteractionsWhichAreNotSubstances(finalSubstances);
    return finalSubstances;
}

function checkMissingDurations(substance) {
    let roas = substance.roas;
    if (roas === undefined) return;
    roas.forEach(roa => {
        let duration = roa.duration;
        if (duration === null) return;
        let message = substance.name + " " + roa.name + ":";
        let nullCount = 0;
        if (duration.onset === null) {
            message += " onset";
            nullCount += 1;
        }
        if (duration.comeup === null) {
            message += " comeup";
            nullCount += 1;
        }
        if (duration.peak === null) {
            message += " peak";
            nullCount += 1;
        }
        if (duration.offset === null) {
            message += " offset";
            nullCount += 1;
        }
        if (duration.total === null) {
            message += " total";
            nullCount += 1;
        }
        message += " missing";
        if (nullCount > 0) {
            console.log(message);
        }
    })
}

function printInteractionsWhichAreNotSubstances(finalSubstances) {
    let interactions = finalSubstances.flatMap(substance => {
        return substance.interactions?.dangerous ?? [] + substance.interactions?.unsafe ?? [] + substance.interactions?.uncertain ?? []
    });
    const interactionsUnique = interactions
        .filter((item) => item !== undefined)
        .filter((item, index, self) => self.indexOf(item) === index);
    let interactionsWhichAreNotASubstance = interactionsUnique.filter(interactionName => {
        return !finalSubstances.some(substance => {
            return substance.name === interactionName;
        });
    });
    console.log(`Interactions which are not substances: ${JSON.stringify(Array.from(interactionsWhichAreNotASubstance), null, 2)}`);
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

function saveInFile(fileOutput) {
    const fileName = "output/substances.json"
    fs.writeFile(
        fileName,
        JSON.stringify(fileOutput, removeFieldsWithNullValues, 2),
        'utf8',
        function (err) {
            if (err) {
                return console.log(err);
            }
            console.log(`${fileOutput.substances.length} substances been saved successfully! View them at './${fileName}'`);
        }
    );
}

function removeFieldsWithNullValues(key, value) {
    if (value === null) return undefined;
    return value;
}
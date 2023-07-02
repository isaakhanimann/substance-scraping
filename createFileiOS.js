const {promises: fsPromises} = require('fs');
const fs = require("fs");

(async () => {
    let fileData = await fsPromises.readFile('./substances.json', 'utf-8');
    let file = JSON.parse(fileData);
    let newFile = { ...file };
    newFile.substances = file.substances.map(substance => {
        return getNewSubstanceWithUpdatedTolerance(substance)
    });
    saveInFile(newFile);
})();


function getNewSubstanceWithUpdatedTolerance(substance) {
    let newSubstance = { ...substance };
    if (substance.tolerance != undefined) {
        if (substance.tolerance.half != undefined) {
            let halfToleranceInHours = convertToHours(substance.tolerance.half);
            newSubstance.tolerance['halfToleranceInHours'] = halfToleranceInHours;
        }
        if (substance.tolerance.zero != undefined) {
            let zeroToleranceInHours = convertToHours(substance.tolerance.zero);
            newSubstance.tolerance['zeroToleranceInHours'] = zeroToleranceInHours;
        }
    }
    return newSubstance;
}

function convertToHours(durationStr) {
    let daysToHours = 24;
    let weeksToHours = 7 * daysToHours;
    let monthsToHours = 30 * daysToHours;
    let range = durationStr.split("-");
    var value;
    if (range.length === 2) {
        let start = parseFloat(range[0]);
        let end = parseFloat(range[1]);
        value = (start + end) / 2;
    } else {
        value = parseFloat(range[0]);
    }
    if (durationStr.includes("day")) {
        return value * daysToHours;
    } else if (durationStr.includes("week")) {
        return value * weeksToHours;
    } else if (durationStr.includes("month")) {
        return value * monthsToHours;
    } else if (durationStr.includes("hour")) {
        return value;
    } else {
        throw new Error('Unknown time unit in duration string.');
    }
}



function saveInFile(fileOutput) {
    const fileName = "ios-substances.json"
    fs.writeFile(
        fileName,
        JSON.stringify(fileOutput, null, 2),
        'utf8',
        function (err) {
            if (err) {
                return console.log(err);
            }
            console.log(`${fileOutput.substances.length} substances been saved successfully! View them at './${fileName}'`);
        }
    );
}
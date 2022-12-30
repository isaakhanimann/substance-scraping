const fs = require('fs');
const {promises: fsPromises} = require("fs");

(async () => {
    // tripsitOriginal.json is obtained by writing "https://tripbot.tripsit.me/api/tripsit/getAllDrugs" into the browser url and copying the text into a file and formatting and sorting the json with pretty json
    let tripsitContent = await fsPromises.readFile('./tripsitOriginal.json', 'utf-8');
    let tripsitSubstances = cleanupTripsitSubstances(JSON.parse(tripsitContent));
    saveInFile(tripsitSubstances);
})();


function cleanupTripsitSubstances(tripsitContent) {
    const cleanedSubstances = [];
    for (const [, substance] of Object.entries(tripsitContent["data"][0])) {
        let newCategories = substance.categories?.map(catName => {
            if (catName === "empathogen") {
                return "entactogen";
            } else if (catName === "supplement") {
                return null;
            } else {
                return catName;
            }
        }).filter(s => s);
        if (substance.pretty_name === "Fentanyl") {
            newCategories.push("common");
        }
        if (substance.pretty_name === "Cannabis") {
            newCategories = newCategories.filter(c => c !== "stimulant" && c !== "depressant" && c !== "psychedelic")
        }
        if (substance.pretty_name === "Salvia") {
            substance.pretty_name = "Salvinorin A";
        }
        let summary = substance.properties.summary;
        if (summary === "A very rare psychedelic phenylethylamine, that is quite lovely.") {
            summary = "A very rare psychedelic phenylethylamine.";
        }
        cleanedSubstances.push({
            name: substance.pretty_name,
            categories: newCategories,
            summary: summary
        });
    }
    return cleanedSubstances
}

function saveInFile(substances) {
    const fileName = "tripsitCleaned.json"
    fs.writeFile(
        fileName,
        JSON.stringify(substances, null, 2),
        'utf8',
        function (err) {
            if (err) {
                return console.log(err);
            }
            console.log(`${substances.length} substances been cleaned and saved successfully! View them at './${fileName}'`);
        }
    );
}
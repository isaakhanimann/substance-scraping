const axios = require('axios');
const fs = require('fs');

const substanceFieldQuery = `
name
commonNames
url
class {
  chemical
  psychoactive
}
tolerance {
  full
  half
  zero
}
roas {
  name
  dose {
    units
    threshold
    light {
      min
      max
    }
    common {
      min
      max
    }
    strong {
      min
      max
    }
    heavy
  }
  duration {
    onset {
      min
      max
      units
    }
    comeup {
      min
      max
      units
    }
    peak {
      min
      max
      units
    }
    offset {
      min
      max
      units
    }
    total {
      min
      max
      units
    }
    afterglow {
      min
      max
      units
    }
  }
  bioavailability {
    min
    max
  }
}
addictionPotential
toxicity
crossTolerances
uncertainInteractions {
  name
}
unsafeInteractions {
  name
}
dangerousInteractions {
  name
}`;

const allSubstancesQuery = `
query AllSubstances {
  substances(limit: 9999) {
    ${substanceFieldQuery}
  }
}`;

Promise.all([
  axios.post('https://api.psychonautwiki.org', { query: allSubstancesQuery }),
]).then(function (responses) {
  const [allSubstancesResponse] = responses;

  const mergedSubstances = [...allSubstancesResponse.data.data.substances];

  mergedSubstances.sort((a, b) => a.name.localeCompare(b.name));

  const mergedData = {data: {substances: mergedSubstances}};

  fs.writeFile('input/psychonautwiki.json', JSON.stringify(mergedData, null, 2), (err) => {
    if (err) throw err;
    console.log('PsychonautWiki substances written to file');
  });
}).catch(function (error) {
  console.error(error);
});

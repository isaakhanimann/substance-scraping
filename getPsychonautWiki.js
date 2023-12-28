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

const dmtQuery = `
query OneSubstance {
  substances(query: "DMT") {
    ${substanceFieldQuery}
  }
}`;

Promise.all([
  axios.post('https://api.psychonautwiki.org', { query: allSubstancesQuery }),
  axios.post('https://api.psychonautwiki.org', { query: dmtQuery })
]).then(function (responses) {
  const [allSubstancesResponse, dmtResponse] = responses;
  const mergedData = {data: {substances: [...allSubstancesResponse.data.data.substances, ...dmtResponse.data.data.substances]}};

  fs.writeFile('input/psychonautwiki.json', JSON.stringify(mergedData, null, 2), (err) => {
    if (err) throw err;
    console.log('Data written to file');
  });
}).catch(function (error) {
  console.error(error);
});

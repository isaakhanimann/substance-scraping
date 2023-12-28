const axios = require('axios');
const fs = require('fs');

const query = `
query AllSubstances {
    substances(limit: 9999) {
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
      }
    }
  }`;

axios.post('https://api.psychonautwiki.org', { query })
  .then(response => {
    fs.writeFile('input/psychonautwiki.json', JSON.stringify(response.data, null, 2), (err) => {
      if (err) throw err;
      console.log('Data written to file');
    });
  })
  .catch(error => console.error(error));
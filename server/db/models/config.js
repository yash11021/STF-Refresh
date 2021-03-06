import mongoose from 'mongoose'
import faker from 'faker'

/*
CONFIG SCHEMA:
Contains top-level data and enums
that are pre-loaded into ALL routes
There is only one entity for this model

This approach allows us to configure the site
via the config panel and DB SaaS in real time
*/
const ConfigSchema = new mongoose.Schema({
  year: { type: Number, default: 2018 },
  quarter: { type: String, default: 'Autumn' },
  annualFunds: { type: Number, default: 5000000 },
  blockFunds: { type: Number, default: 1000000 },
  //  Submissions: Open or closed (default to open)
  submissions: { type: Boolean, default: true },
  links: {
    type: Object,
    default: {
      rfp: 'https://drive.google.com/drive/folders/0BwVcM9nLxRsqbVNqV2lwa3lRZzA',
      drive: 'https://drive.google.com/drive/folders/0BwVcM9nLxRsqbVNqV2lwa3lRZzA',
      keyserver: 'http://itconnect.uw.edu/wares/acquiring-software-and-hardware/keyserver-help-for-it-staff/'
    }
  },
  //  Stage: Where we are on the frontpage timeline (voting, deliberation, etc)
  news: {
    type: String,
    default: faker.lorem.paragraph()
  },
  timeline: {
    type: Array,
    default: [
      faker.company.bsNoun(),
      faker.company.bsNoun(),
      faker.company.bsNoun(),
      faker.company.bsNoun()
    ]
  },
  enums: {
    //  Basic arrays
    categories: {
      type: Array,
      default: ['Research', 'Computer Labs', 'Frontier Technology']
    },
    statuses: {
      type: Array,
      default: [
        'In Review',
        'Fully Funded',
        'Partially Funded',
        'Revisions Requested',
        'Denied'
      ]
    },
    //  Recognized campus orgs (mech engineering dept, etc)
    //  There's a mapping between orgs and their budget codes.
    organizations: {
      type: Object,
      default: {'Org A': '000', 'Org B': '111', 'Org C': '222'}
      //  NOTE: Use Object.keys(orgs).map(key => ...) to iterate
    },
    //  Questions, in object form for scalability
    questions: {
      review: {
        type: Array,
        default: ['Placeholder A', 'Placeholder B']
      }
    }
  }
})
const Config = mongoose.model('Config', ConfigSchema)
export default Config

/* *****
FAKE DATA GENERATOR: Contact
***** */
//  NOTE: Min should = 1
const dummyConfigs = (min, ids) => {
  //  Check the db for existing data satisfying min required
  Config.count().exec((err, count) => {
    if (err) {
      console.warn(`Unable to count Config schema: ${err}`)
    } else if (count < 1) {
      let fake = new Config({
        submissions: true,
        organizations: [
          faker.company.bsNoun(),
          faker.company.bsNoun()
        ]
      })
      Config.create(fake, (error) => {
        if (!error) { console.log(`SEED: Created fake Config scheme`) }
      })
    }
  })
}

export { dummyConfigs }

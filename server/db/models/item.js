import mongoose from 'mongoose'
import autoref from 'mongoose-autorefs'
import faker from 'faker'

/*
ITEM SCHEMA:
Items in a budget manifest
NOTE: Be careful with logic related to this.
Items should be 1:1 with budget manifests.
*/
const ItemSchema = new mongoose.Schema({
  //  Items are tied to manifests, tied to proposals... or a budget report.
  manifest: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest' },
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  name: { type: String, required: true },
  // Description will contain the old "justification" element at the end,
  description: String,
  category: String,
  //  NOTE: Quantity min must be 0 so people can report not buying things in reports
  quantity: { type: Number, required: true, default: 1, min: 0 },
  price: { type: Number, required: true, min: 0 },
  //  Vendor (for reporting, these are tracked)
  vendor: String,
  //  Tax rate, used to automatically account for tax.
  //  TODO: Handle tax calculations on the server side.
  tax: { type: Number, required: true, default: 10.1, min: 0 },
  //  Priority (legacy: group) is used to sort items by importance, lower is most imp.
  //  Tad confusing, but this is a constant question for proposers.
  priority: { type: Number, min: 0 }
})
ItemSchema.plugin(autoref, [
  // 'manifest.items',
  'report.items'
])
const Item = mongoose.model('Item', ItemSchema)
export default Item

/* *****
FAKE DATA GENERATOR: Contact
***** */
const dummyItems = (min, ids) => {
  //  Check the db for existing data satisfying min required
  Item.count().exec((err, count) => {
    if (err) {
      console.warn(`Unable to count Item schema: ${err}`)
    } else if (count < min) {
      //  If it didn't, inject dummies.
      let fakes = []
      for (let i = 0; i < min; i++) {
        fakes[i] = new Item({
          _id: ids.item[i],
          manifest: ids.manifest[i],
          report: ids.report[i],
          name: faker.company.bsNoun(),
          description: faker.lorem.paragraph(),
          quantity: faker.random.number(),
          price: faker.random.number(),
          tax: faker.random.number(),
          priority: faker.random.number(),
          vendor: faker.company.bsNoun()
        })
      }
      //  Create will push our fakes into the DB.
      Item.create(fakes, (error) => {
        if (!error) { console.log(`SEED: Created fake Item (${fakes.length})`) }
      })
    }
  })
}

export { dummyItems }

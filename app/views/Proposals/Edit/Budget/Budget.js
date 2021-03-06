import React from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { message } from 'antd'
import api from '../../../../services'

import { Boundary, Spreadsheet } from '../../../../components'

@connect(
  state => ({
    proposal: state.db.proposal._id,
    manifest: state.db.proposal.manifests[0],
    type: 'original',
    id: state.db.proposal.manifests[0] ? state.db.proposal.manifests[0]._id : undefined
  }),
  dispatch => ({ api: bindActionCreators(api, dispatch) })
)
class Budget extends React.Component {
  static propTypes = {
    id: PropTypes.string,
    type: PropTypes.string,
    api: PropTypes.object,
    proposal: PropTypes.string,
    manifest: PropTypes.object
  }
  handleSubmit = (items) => {
    if (Array.isArray(items) && items.length > 0) {
      let { api, proposal, type, id } = this.props
      const budget = { proposal, type, items }

      const params = {
        id,
        populate: ['items'],
        transform: proposal => ({ proposal }),
        update: ({ proposal: (prev, next) => {
          let change = Object.assign({}, prev, { manifests: [next] })
          return change
        }})
      }
      params.id
      ? api.patch('manifest', budget, params)
      .then(message.success('Budget updated!', 10))
      .catch(err => {
        message.warning('Budget failed to update - Unexpected client error', 10)
        console.warn(err)
      })
      : api.post('manifest', budget, params)
      .then(message.success('Budget created!', 10))
      .catch(err => {
        message.warning('Budget failed to update - Unexpected client error', 10)
        console.warn(err)
      })
    } else {
      message.error('Budgets must cost at least something!', 10)
    }
  }
  render ({ manifest } = this.props) {
    const data = manifest ? manifest.items : []
    return (
      <Boundary title='Budget Wizard'>
        <Spreadsheet
          data={data}
          onSubmit={this.handleSubmit}
          disabled={false}
        />
      </Boundary>
    )
  }
}
export default Budget

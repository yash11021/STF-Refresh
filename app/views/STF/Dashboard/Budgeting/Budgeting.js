//  React and its typechecking
import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
//  Redux utils
import { compose } from 'redux'
import { connect } from 'react-redux'
import { connectRequest } from 'redux-query'
//  Our API services
import api from '../../../../services'
import { Loading } from '../../../../components'
import { currency } from '../../../../util'

import { Link } from 'react-router'
import { Table, Progress, Badge, Input, Icon } from 'antd'

import SubTable from './SubTable/SubTable'

//  Status indicator mapping for badge components
const indicators = {
  'Submitted': 'default',
  'Funded': 'success',
  'Partially Funded': 'warning',
  'In Review': 'warning',
  'Awaiting Decision': 'warning',
  'Denied': 'error',
  'Draft': 'error',
  'Withdrawn': 'error'
}

const expandedRowRender = (record, i) => <SubTable
  contacts={record.proposal && record.proposal.contacts}
  manifest={record.manifest}
  report={record.manifest && record.manifest.report}
/>

/*
BUDGETING FEATURE:
Allows you to see a breakdown of all awards,
including awards vs reported expenditures
SUPER useful for stfagent / techfee
*/
@compose(
  connect((state, props) => ({
    awards: state.db.decisions,
    enums: state.config.enums,
    screen: state.screen,
    user: state.user
  })),
  connectRequest(
    () => api.get('decisions', {
      query: { approved: true },
      populate: [
        { path: 'manifest', populate: { path: 'report' } },
        { path: 'manifest', populate: { path: 'items' } },
        { path: 'proposal', populate: { path: 'contacts' } }
      ]
    })
  )
)
class Budgeting extends React.Component {
  static propTypes = {
    awards: PropTypes.array,
    screen: PropTypes.object,
    user: PropTypes.object
  }
  constructor (props) {
    super(props)
    const { awards } = this.props
    this.state = {
      awards,
      filterDropdownVisible: false,
      searchText: '',
      filtered: false
    }
  }
  componentWillReceiveProps (nextProps) {
    const { awards } = nextProps
    if (awards) this.setState({ awards })
  }

  onInputChange = searchText => this.setState({ searchText })
  onSearch = () => {
    const { searchText } = this.state
    const { awards } = this.props
    const reg = new RegExp(searchText, 'gi')
    this.setState({
      filterDropdownVisible: false,
      filtered: !!searchText,
      awards: awards
        .map(record => {
          const match = record.proposal.title.match(reg)
          if (!match) return null
          return {
            ...record,
            title: (
              <span>
                {record.proposal.title
                  .split(reg).map((text, i) => i > 0
                      ? [(<span className='highlight'>{match[0]}</span>), text]
                      : text
                  )}
              </span>
            )
          }
        })
        .filter(record => !!record)
    })
  }
  //  Shorthand assignment of variables when defining render
  render (
    { enums, screen } = this.props,
    //  Proposals go through state since we filter
    { awards } = this.state
  ) {
    //  Create an array of years for select boxes
    const years = _.range(
      2000,
      new Date().getFullYear() + 1
    )
    const columns = [
      {
        title: 'ID',
        dataIndex: 'proposal.number',
        key: 'proposal.number',
        render: (text, record) => (
          <span>{`${record.proposal.year}-${record.proposal.number}`}</span>
        ),
        sorter: (a, b) =>
          a.proposal.year * a.proposal.number - b.proposal.year * b.proposal.number,
        filters: years.map((year, i) => {
          return { text: year, value: year }
        }),
        onFilter: (value, record) =>
          record.proposal.year.toString().includes(value),
        width: 80
      }, {
        title: 'Q',
        dataIndex: 'proposal.quarter',
        key: 'quarter',
        render: text => <span>{text.substr(0, 2) || ''}</span>,
        filters: [
          { text: 'Autumn', value: 'Autumn' },
          { text: 'Winter', value: 'Winter' },
          { text: 'Spring', value: 'Spring' },
          { text: 'Summer', value: 'Summer' }
        ],
        onFilter: (value, record) => record.proposal.quarter.includes(value),
        width: 60
      }, {
        title: 'Type',
        dataIndex: 'manifest.type',
        key: 'manifest.type',
        render: text => <span>{_.capitalize(text)}</span>,
        filters: [
          { text: 'Original Proposal', value: 'original' },
          { text: 'Supplemental Award', value: 'supplemental' },
          { text: 'Partial Funding', value: 'partial' }
        ],
        onFilter: (value, record) => record.manifest.type.includes(value),
        width: 120
      }, {
        title: 'Title',
        dataIndex: 'proposal.title',
        key: 'proposal.title',
        render: (text, record) => (
          <span>
            <Link to={`/proposals/${record.proposal.year}/${record.proposal.number}`}>
              {record.proposal.title}
            </Link>
          </span>
        ),
        filterDropdown: (
          <Input
            ref={ele => this.searchInput = ele}
            placeholder='Search title'
            value={this.state.searchText}
            onChange={(e) => this.onInputChange(e.target.value)}
            onPressEnter={this.onSearch}
          />
        ),
        filterIcon: <Icon type='search' style={{ color: this.state.filtered ? '#108ee9' : '#aaa' }} />,
        filterDropdownVisible: this.state.filterDropdownVisible,
        onFilterDropdownVisibleChange: visible => {
          this.setState(
            { filterDropdownVisible: visible },
            () => this.searchInput.focus()
          )
        }
      },
      {
        title: 'Organization',
        dataIndex: 'proposal.organization',
        key: 'proposal.organization',
        render: (text, record) => (
          <span>
            {text}
            <br />
            <em>{record.proposal.budget}</em>
          </span>
        ),
        filters: enums
          ? Object.keys(enums.organizations).map(org => {
            return { text: org, value: org }
          })
          : [],
        onFilter: (value, record) => record.proposal.organization === value
      },
      {
        title: 'Category',
        dataIndex: 'proposal.category',
        key: 'proposal.category',
        filters: enums
          ? enums.categories.map(category => {
            return { text: category, value: category }
          })
          : [],
        onFilter: (value, record) => record.proposal.category === value,
        width: 150
      }, {
        title: 'Award',
        dataIndex: 'manifest.total',
        key: 'manifest.total',
        render: (text, record) => (
          <span>
            {text ? currency(text) : '$0'}
            <br />
            <Badge status={indicators[record.proposal.status] || 'default'} text={record.proposal.status.split(' ')[0]} />
          </span>
        ),
        width: 120,
        sorter: (a, b) => a.manifest.total - b.manifest.total,
        filters: enums
          ? enums.statuses.map(status => {
            return { text: status, value: status }
          })
          : [],
        onFilter: (value, record) => record.proposal.status === value
      }, {
        title: 'Spent',
        dataIndex: 'manifest.report.total',
        key: 'manifest.report.total',
        render: (text, record) => {
          // let percentage = record.manifest.report.total > 0
          //   ? Number.parseInt(record.manifest.report.total / record.proposal.received * 100)
          //   : 0
          // let percentage = Number.parseInt(text / record.manifest.total) * 100
          let percentage = Number.parseInt(text / record.manifest.total * 100)
          if (Number.isNaN(percentage)) percentage = 0
          // else if (percentage > 100) percentage = 100
          let status = 'active'
          if (percentage === 100) status = 'success'
          if (percentage > 100) status = 'exception'
          return (
            <span>
              {text ? currency(text) : 'N/A'}
              <br />
              <div style={{ width: 100 }}>
                <Progress
                  percent={percentage <= 100 ? percentage : 100}
                  status={status}
                  strokeWidth={10} />
              </div>
            </span>
          )
        },
        width: 80,
        sorter: (a, b) => a.manifest.report.total - b.manifest.report.total,
        filters: [
          { text: 'No Reporting', value: 'No Reporting' },
          { text: 'In Budget', value: 'In Budget' },
          { text: 'Over Budget', value: 'Over Budget' }
        ],
        onFilter: (value, record) => {
          let percentage = Number.parseInt(record.manifest.report.total / record.manifest.total * 100)
          switch (value) {
            case 'No Reporting':
              return Number.isNaN(percentage)
            case 'In Budget':
              return percentage <= 100
            case 'Over Budget':
              return percentage > 100
            default:
              return true
          }
        }
      }, {
        title: 'Budget',
        dataIndex: 'manifest.report.budget',
        key: 'manifest.report.budget',
        width: 80
      }, {
        title: 'Due',
        dataIndex: 'manifest.report.due',
        key: 'manifest.report.due',
        render: (text, record) => (
          <span>
            {text
              ? new Date(text)
                .toLocaleDateString('en-US', { timeZone: 'UTC' })
              : 'N/A'
            }
          </span>
        ),
        sorter: (a, b) => Date.parse(a.manifest.report.due) - Date.parse(b.manifest.report.due),
        width: 100
      }
    ]
    const footer = () => (
      <span>
        Dashboard is a breakdown of STF's awards (approved budgets), combined with proposal and reporting data. This can be used to cross-reference awards with expense reporting, tracking organizations, and our spending trends.
      </span>
    )
    return (
      <section>
        <Loading render={Array.isArray(awards) && awards.length > 0}
          title='Awards'
          tip='Loading Award Data... This will take some time.'
          timeout={10000}
        >
          <Table
            dataSource={awards}
            sort
            size={screen.lessThan.medium ? 'small' : 'middle'}
            columns={columns}
            rowKey={record => record._id}
            expandedRowRender={expandedRowRender}
            footer={footer}
          />
        </Loading>
      </section>
    )
  }
}
export default Budgeting

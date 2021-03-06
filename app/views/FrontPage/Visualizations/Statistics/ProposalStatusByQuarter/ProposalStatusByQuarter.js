import React from 'react'
import PropTypes from 'prop-types'

import { Sunburst, LabelSeries, Hint, DiscreteColorLegend } from 'react-vis'
import { statusColors, brandColors } from '../../colors'
import { statusLegend } from '../../legends'

class ProposalStatusByQuarter extends React.Component {
  static propTypes = {
    year: PropTypes.number,
    statistics: PropTypes.array.isRequired
  }
  static defaultProps = {
    year: 2018
  }
  jss = {
    labels: {
      primary: { fill: '#FFF', fontSize: '46px', textAnchor: 'middle' },
      secondary: { fill: brandColors['Light Gray'], fontSize: '16px', textAnchor: 'middle' }
    }
  }
  state = {
    //  Data follows D3 data conventions, look at the flare dataset for an example.
    data: {
      // That hex code tho
      color: '#4b2e83',
      size: 0,
      children: []
    },
    hoveredCell: {}
  }
  priority = { Withdrawn: 0, Draft: 1, Submitted: 2, 'In Review': 3, 'Awaiting Decision': 4, 'Partially Funded': 5, Funded: 6, Denied: 7 }
  componentWillReceiveProps (nextProps) {
    const { year, statistics } = nextProps
    //  statistics data loaded? Calculate funds per quarter
    if (Array.isArray(statistics) && statistics.length >= 0) {
      let { data } = this.state
      // Iterate over stats, creating a list of quarters with children
      // that count the amount of proposals with Y status indicator.
      // e.g. { Winter: children: [{ title: 'In Review', size: 3 }]}
      let statusByQuarter = statistics.reduce(
        (accumulator, proposal) => {
          const { quarter, status } = proposal || {}
          // Find index of the "size" node per quarter and status indicator
          // NOTE: If you accumulate sizes per quarter here, it alters the vis.
          // accumulator[quarter].size += 1
          const indexOfStatusForQuarter = accumulator[quarter]
            .children.findIndex(child => child.title === status)
          // Update or initialize the child node in question
          indexOfStatusForQuarter >= 0
            ? accumulator[quarter]
              .children[indexOfStatusForQuarter].size += 1
            : accumulator[quarter]
              .children.push({ title: status, color: statusColors[status], size: 1 })
          return accumulator
        },
        {
          Autumn: { color: '#bf360c', children: [], size: 0 },
          Winter: { color: '#01579b', children: [], size: 0 },
          Spring: { color: '#1b5e20', children: [], size: 0 }
        }
      )
      let newData = {
        title: `Proposals (${year})`,
        children: []
      }
      // Apply metadata / styles as you begin injecting child nodes into our dataset
      // const UW_COLORS = ['#00939C', '#85C4C8', '#EC9370', '#C22E00']
      for (let key of Object.keys(statusByQuarter)) {
        let { color, children } = statusByQuarter[key]
        let sortedChildren = children.sort((a, b) => this.priority[a.title] - this.priority[b.title])
        newData.children.push({ title: key, color, children: sortedChildren })
      }
      // Apply to our D3 dataset
      Object.assign(data, newData)
      this.setState({ data })
    }
  }
  // D3 utility - pulls the angle of a hovered cell, used to generate D3's styles
  buildValue (hoveredCell) {
    const { radius, angle, angle0 } = hoveredCell
    const truedAngle = (angle + angle0) / 2
    return {
      x: radius * Math.cos(truedAngle),
      y: radius * Math.sin(truedAngle)
    }
  }
  //  D3 events for selecting cells to pull data from for hints
  onValueMouseOver = (v) => this.setState({ hoveredCell: v.x && v.y ? v : false })
  onValueMouseOut= (v) => this.setState({ hoveredCell: false })

  // Per D3 schema, size is only kept in child leaves
  // getSize iterates through a parent and counts its
  // size via closure and a recursive function
  getSizeOfParent = (parent) => {
    if (parent.size) {
      return parent.size
    } else {
      let count = 0
      // Recursively count child nodes, the size prop is the target val
      const countLeaves = (node) => {
        if (node.children) {
          for (let child of node.children) {
            // Has children
            if (child.children) {
              countLeaves(child)
            // Has leaves
            } else if (child.size) {
              count += child.size
            }
          }
        }
      }
      countLeaves(parent)
      return count
    }
  }

  render (
    { jss } = this,
    { year, statistics } = this.props,
    { data, hoveredCell } = this.state
  ) {
    const labels = [
      { x: 0, y: -5, label: (statistics.length || 0), style: jss.labels.primary },
      { x: 0, y: -20, label: 'Proposals Received', style: jss.labels.secondary }
    ]
    return (
      <div>
        <Sunburst
          className='rv-inline'
          data={data}
          colorType='literal'
          style={{ stroke: '#FFF' }}
          height={300}
          width={300}
          onValueMouseOver={this.onValueMouseOver}
          onValueMouseOut={this.onValueMouseOut}
        >
          <LabelSeries data={labels} />
          {hoveredCell && hoveredCell.title
            // Generates tooltips onMouseOver w/ dynamic JSS styles
            ? <Hint value={this.buildValue(hoveredCell)}>
              <div className='rv-tooltip'>
                <div className='rv-box' style={{ background: hoveredCell.color }} />
                {`${this.getSizeOfParent(hoveredCell)} ${hoveredCell.title}`}
              </div>
            </Hint>
          : null}
        </Sunburst>
        <DiscreteColorLegend
          className='rv-inline'
          items={statusLegend}
        />
      </div>
    )
  }
}

export default ProposalStatusByQuarter

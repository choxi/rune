import React from 'react'
import PropTypes from 'prop-types'

export default class Bitmap extends React.Component {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.array).isRequired,
    rows: PropTypes.number.isRequired,
    columns: PropTypes.number.isRequired
  }

  render() {
    const { data, rows, columns } = this.props

    const gridStyle = {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`
    }

    const cells = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        if (data[r][c][0] !== 0) {
          let cellStyle = {
            gridColumn: `${c + 1} / span 1`,
            gridRow: `${r + 1} / span 1`,
            background: "black"
          }

          cells.push(<div className="Bitmap__grid__cell" style={cellStyle} />)
        }
      }
    }

    return <div className="Bitmap">
      <div className="Bitmap__grid" style={gridStyle}>
        { cells }
      </div>
    </div>
  }
}

import React from 'react'
import { LABELS } from '../../model'

export default class Path extends React.PureComponent {
  componentDidMount() {
    this.drawPath()
  }

  componentDidUpdate() {
    this.drawPath()
  }

  drawPath() {
    const ctx = this.canvas.getContext('2d')
    const start = this.props.path[0]
    ctx.lineWidth=5
    ctx.moveTo(start.x, start.y)

    this.props.path.forEach(({x, y}) => {
      ctx.lineTo(x, y)
      ctx.stroke()
    })
  }

  render() {
    return <div className="Path">
      <div className="Path__label">{ LABELS[this.props.label] }</div>
      <div>#{ this.props.id }</div>
      <canvas 
        ref={node => this.canvas = node}
        width={this.props.canvas.width} 
        height={this.props.canvas.height}
      >
      </canvas>
    </div>
  }
}

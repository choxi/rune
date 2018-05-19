import React from 'react'
import PropTypes from 'prop-types'
import Pointable from 'react-pointable'

import './App.scss'

export default class App extends React.Component {
  constructor() {
    super()
    this.state = {
      drawing: false,
      canvas: { width: 0, height: 0 },
      paths: [],
      currentPath: [],
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateCanvasDimensions)
    this.updateCanvasDimensions()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateCanvasDimensions)
  }

  updateCanvasDimensions() {
    this.setState({ canvas: { width: window.innerWidth, height: window.innerHeight }})
  }

  pointerDown(event) {
    const { x, y } = event
    const ctx = this.canvas.getContext('2d')

    ctx.beginPath()
    ctx.moveTo(x, y)

    this.setState({drawing: true})
  }

  pointerMove(event) {
    if(!this.state.drawing) {
      return
    }

    const ctx = this.canvas.getContext('2d')
    ctx.lineTo(event.x, event.y)
    ctx.stroke()
  }

  pointerUp(event) {
    this.setState({drawing: false})
  }

  render() {
    return (
      <Pointable 
        onPointerDown={event => this.pointerDown(event)}
        onPointerMove={event => this.pointerMove(event)}
        onPointerUp={event => this.pointerUp(event)}
      >
        <canvas { ...this.state.canvas } ref={node => this.canvas = node}></canvas>
      </Pointable>
    )
  }
}

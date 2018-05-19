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

    this.updateCanvasDimensions = this.updateCanvasDimensions.bind(this)
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateCanvasDimensions)
    this.updateCanvasDimensions()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateCanvasDimensions)
  }

  updateCanvasDimensions() {
    let { clientWidth, clientHeight } = this.viewport
    this.setState({ canvas: { width: clientWidth, height: clientHeight }})
  }

  pointerDown(event) {
    const x = event.offsetX
    const y = event.offsetY
    const currentPath = [{ x, y}]
    const ctx = this.canvas.getContext('2d')

    ctx.beginPath()
    ctx.moveTo(x, y)

    this.setState({drawing: true, currentPath})
  }

  pointerMove(event) {
    if(!this.state.drawing)
      return

    const x = event.offsetX
    const y = event.offsetY
    const currentPath = [...this.state.currentPath, {x, y}]
    const ctx = this.canvas.getContext('2d')

    ctx.lineTo(x, y)
    ctx.stroke()

    this.setState({ currentPath })
  }

  pointerUp(event) {
    const paths = [...this.state.paths, this.state.currentPath]
    const currentPath = []

    this.setState({drawing: false, paths, currentPath})
  }

  render() {
    return (
      <div className="App">
        <div className="Sidebar">
          <p>Stuff</p>
        </div>
        <div className="Viewport" ref={node => this.viewport = node}>
          <Pointable 
            onPointerDown={event => this.pointerDown(event)}
            onPointerMove={event => this.pointerMove(event)}
            onPointerUp={event => this.pointerUp(event)}
          >
            <canvas { ...this.state.canvas } ref={node => this.canvas = node}></canvas>
          </Pointable>
        </div>
      </div>
    )
  }
}

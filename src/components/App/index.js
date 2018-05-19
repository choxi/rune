import React from 'react'
import PropTypes from 'prop-types'
import Pointable from 'react-pointable'
import Path from '../Path'
import tf from 'tfjs'

import Model from '../../model'
import './index.scss'

export default class App extends React.PureComponent {
  constructor() {
    super()
    this.state = {
      drawing: false,
      canvas: { width: 0, height: 0 },
      gestures: [],
      currentGesture: { canvas: null, path: [] },
    }

    this.updateCanvasDimensions = this.updateCanvasDimensions.bind(this)
    this.model = new Model()
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
    const currentGesture = {canvas: { ...this.state.canvas }, path: [{x, y}]}
    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    ctx.beginPath()
    ctx.moveTo(x, y)

    this.setState({drawing: true, currentGesture})
  }

  pointerMove(event) {
    if(!this.state.drawing)
      return

    const x = event.offsetX
    const y = event.offsetY
    const ctx = this.canvas.getContext('2d')
    const path = [...this.state.currentGesture.path, {x, y}]
    const currentGesture = { ...this.state.currentGesture, path }

    ctx.lineTo(x, y)
    ctx.stroke()

    this.setState({ currentGesture })
  }

  pointerUp(event) {
    const gestures = [...this.state.gestures, this.state.currentGesture]
    const currentGesture = { canvas: null, path: [] }

    this.setState({drawing: false, gestures, currentGesture})
  }

  async train() {
    const h = await this.model.train()
  }

  render() {
    const gestures = this.state.gestures.map((gesture, index) => {
      return <Path key={index} path={gesture.path} canvas={gesture.canvas} />
    })

    return (
      <div className="App">
        <div className="Sidebar">
          <button onClick={() => this.train()}>Train</button>
          {gestures}
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

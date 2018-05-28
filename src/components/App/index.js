import React from 'react'
import PropTypes from 'prop-types'
import Pointable from 'react-pointable'
import Path from '../Path'
import tf from 'tfjs'
import Airtable from 'airtable'

import Model from '../../model'
import { centerCrop } from '../../utils'
import './index.scss'

const AIRTABLE_TABLE_NAME = 'Development'

export default class App extends React.PureComponent {
  constructor() {
    super()

    this.state = {
      drawing: false,
      canvas: { width: 0, height: 0 },
      gestures: [],
      currentGesture: { label: null, canvas: null, path: [] },
    }

    this.db = new Airtable({ apiKey: 'keyJzEMcRpYkme8V6' }).base('appLVCDspzsAACmVF')

    this.updateCanvasDimensions = this.updateCanvasDimensions.bind(this)
    this.model = new Model()
    this.gestureRefs = {}
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
    const currentGesture = { canvas: { ...this.state.canvas }, path: [{x, y}], label: null }
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
    this.setState({ drawing: false })
  }

  setLabel(label) {
    if(this.state.currentGesture.path.length === 0)
      return

    const gesture = { ...this.state.currentGesture, label }
    const gestures = [ ...this.state.gestures, gesture ]
    const currentGesture = { canvas: null, path: [] }

    const bitmap = this.preprocessGesture(this.canvas)

    this.db(AIRTABLE_TABLE_NAME).create({ bitmap: JSON.stringify(bitmap), gesture: JSON.stringify(gesture.path), label: gesture.label })
    this.setState({gestures, currentGesture})
  }

  async train() {
    const data = []
    const labels = []

    this.db(AIRTABLE_TABLE_NAME).select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        // This function (`page`) will get called for each page of records.

        records.forEach((record) => {
          data.push(JSON.parse(record.get('bitmap')))
          labels.push(record.get('label'))
        })

        fetchNextPage()

    }, async (err) => {
      if (err) { console.error(err); return; }

      const h = await this.model.train(data, labels)
      console.log(`Loss: ${ h.history.loss[0] }`)
      console.log(`Accuracy: ${ h.history.acc[0] }`)
    })
  }

  preprocessGestures() {
    const data = []
    this.state.gestures.forEach((gesture, index) => {
      const canvas = this.gestureRefs[index].canvas
      data.push(this.preprocessGesture(canvas))
    })
    return data
  }

  preprocessGesture(canvas) {
    const ctx = canvas.getContext('2d')

    // center crop
    const imageDataCenterCrop = centerCrop(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height))
    const ctxCenterCrop = document.getElementById('input-canvas-centercrop').getContext('2d')
    ctxCenterCrop.canvas.width = imageDataCenterCrop.width
    ctxCenterCrop.canvas.height = imageDataCenterCrop.height
    ctxCenterCrop.putImageData(imageDataCenterCrop, 0, 0)

    // scaled to 28 x 28
    const ctxScaled = document.getElementById('input-canvas-scaled').getContext('2d')
    ctxScaled.save()
    ctxScaled.scale(28 / ctxCenterCrop.canvas.width, 28 / ctxCenterCrop.canvas.height)
    ctxScaled.clearRect(0, 0, ctxCenterCrop.canvas.width, ctxCenterCrop.canvas.height)
    ctxScaled.drawImage(document.getElementById('input-canvas-centercrop'), 0, 0)
    const imageDataScaled = ctxScaled.getImageData(0, 0, ctxScaled.canvas.width, ctxScaled.canvas.height)
    ctxScaled.restore()

    const data = imageDataScaled.data
    const input = new Array(784)
    for (let i = 0, len = data.length; i < len; i += 4) {
      input[i / 4] = [ Math.ceil(data[i + 3] / 255) ]
    }

    const grid = []
    for(let r = 0; r < 28; r++) {
      let row = []
      for(let c = 0; c < 28; c++) {
        row.push(input[r * 28 + c])
      }
      grid.push(row)
    }

    return grid
  }

  render() {
    const gestures = this.state.gestures.map((gesture, index) => {
      return <Path
        ref={node => this.gestureRefs[index] = node }
        key={index}
        label={gesture.label}
        path={gesture.path}
        canvas={gesture.canvas}
      />
    })

    return (
      <div className="App">
        <div className="Sidebar">
          <button onClick={() => this.train()}>Train</button>
          {gestures}
        </div>

        <div className="RightPane">
          <div className="RightPane__labeler">
            <button onClick={() => this.setLabel(0)}>Square</button>
            <button onClick={() => this.setLabel(1)}>Circle</button>
            <button onClick={() => this.setLabel(2)}>Triangle</button>
          </div>
          <div className="Viewport" ref={node => this.viewport = node}>
            <Pointable
              onPointerDown={event => this.pointerDown(event)}
              onPointerMove={event => this.pointerMove(event)}
              onPointerUp={event => this.pointerUp(event)}
            >
              <canvas { ...this.state.canvas } ref={node => this.canvas = node}></canvas>
              <canvas id="input-canvas-centercrop" style={{ display: 'none' }}></canvas>
              <canvas id="input-canvas-scaled" width="28" height="28" style={{ display: 'none' }}></canvas>
            </Pointable>
          </div>
        </div>
      </div>
    )
  }
}

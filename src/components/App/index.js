import React from 'react'
import PropTypes from 'prop-types'
import Pointable from 'react-pointable'
import tf from 'tfjs'
import Airtable from 'airtable'

import Path from '../Path'
import Bitmap from '../Bitmap'
import Model, { INPUT_SHAPE, LABELS } from '../../model'
import { indexOfMax, centerCrop } from '../../utils'
import './index.scss'

const AIRTABLE_TABLE_NAME = 'Development-2'
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const MODEL_URL = 'https://s3-us-west-1.amazonaws.com/spacerocket-models/model-2.json'
const STROKE_WIDTH = 10

export default class App extends React.PureComponent {
  constructor() {
    super()

    this.state = {
      drawing: false,
      canvas: { width: 0, height: 0 },
      gestures: [],
      currentGesture: { label: null, canvas: null, path: [], bitmap: null },
      prediction: null
    }

    this.db = new Airtable({ apiKey: AIRTABLE_API_KEY }).base('appLVCDspzsAACmVF')

    this.updateCanvasDimensions = this.updateCanvasDimensions.bind(this)
    this.model = new Model()
    this.model.load(MODEL_URL)
    this.gestureRefs = {}

    this.train = this.train.bind(this)
    this.predict = this.predict.bind(this)
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateCanvasDimensions)
    this.updateCanvasDimensions()
    document.body.addEventListener('touchmove', (e) => e.preventDefault, { passive: false })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateCanvasDimensions)
  }

  updateCanvasDimensions() {
    let { clientWidth, clientHeight } = this.viewport
    this.setState({ canvas: { width: clientWidth, height: clientHeight }})
  }

  beginPath(x, y) {
    const currentGesture = { canvas: { ...this.state.canvas }, path: [{x, y}], label: null }
    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.lineWidth = STROKE_WIDTH

    ctx.beginPath()
    ctx.moveTo(x, y)

    this.setState({drawing: true, currentGesture})
  }

  movePath(x, y) {
    const ctx = this.canvas.getContext('2d')
    const path = [...this.state.currentGesture.path, {x, y}]
    const currentGesture = { ...this.state.currentGesture, path }

    ctx.lineTo(x, y)
    ctx.stroke()

    this.setState({ currentGesture })
  }

  endPath() {
    const bitmap = this.preprocessGesture(this.canvas)
    const currentGesture = Object.assign({}, this.state.currentGesture, { bitmap })

    this.setState({ drawing: false, currentGesture })
    this.predict()
  }

  pointerDown(event) {
    const x = event.offsetX
    const y = event.offsetY

    this.beginPath(x, y)
  }

  pointerMove(event) {
    if(!this.state.drawing)
      return

    const x = event.offsetX
    const y = event.offsetY

    this.movePath(x, y)
  }

  pointerUp(event) {
    this.endPath()
  }

  setLabel(label) {
    if(this.state.currentGesture.path.length === 0)
      return

    const { path } = this.state.currentGesture
    const bitmap = this.preprocessGesture(this.canvas)

    this.db(AIRTABLE_TABLE_NAME).create(
      {
        bitmap: JSON.stringify(bitmap),
        gesture: JSON.stringify(path),
        label
      }, (err, record) => {
        if(err)
          console.log(err)

        const gesture = { ...this.state.currentGesture, label, id: record.get('id') }
        const gestures = [ gesture, ...this.state.gestures ]
        const currentGesture = { canvas: null, path: [] }

        this.setState({ gestures, currentGesture })
      }
    )
  }

  async train() {
    const data = []

    console.log("Fetching data...")
    this.db(AIRTABLE_TABLE_NAME).select({ view: "Grid view" }).eachPage((records, fetchNextPage) => {
        // This function (`page`) will get called for each page of records.

        records.forEach((record) => {
          const bitmap = JSON.parse(record.get('bitmap'))
          const label = record.get('label')
          data.push([bitmap, label])
        })

        fetchNextPage()

    }, async (err) => {
      if (err) { console.error(err); return; }
      console.log(`Fetched ${data.length} samples`)
      this.model = new Model()
      this.model.train(data).then(() => this.model.save())
    })
  }

  predict() {
    const bitmap = this.preprocessGesture(this.canvas)
    const oneHotResult = this.model.predict([bitmap])
    const labelIndex = indexOfMax(oneHotResult.dataSync())
    const prediction = LABELS[labelIndex]

    this.setState({ prediction })
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
    const scaledWidth = INPUT_SHAPE[0]
    const scaledHeight = INPUT_SHAPE[1]
    ctxScaled.canvas.width = scaledWidth
    ctxScaled.canvas.height = scaledHeight

    ctxScaled.drawImage(ctxCenterCrop.canvas, 0, 0, scaledWidth, scaledHeight)
    const imageDataScaled = ctxScaled.getImageData(0, 0, scaledWidth, scaledHeight)

    const data = imageDataScaled.data
    const input = new Array(scaledWidth * scaledHeight)
    for (let i = 0, len = data.length; i < len; i += 4) {
      input[i / 4] = [ Math.ceil(data[i + 3] / 255) ]
    }

    const grid = []
    for(let r = 0; r < scaledHeight; r++) {
      let row = []
      for(let c = 0; c < scaledWidth; c++) {
        row.push(input[r * scaledWidth + c])
      }
      grid.push(row)
    }

    return grid
  }

  labelClasses(name) {
    if (this.state.prediction === name) {
      return "Button Button--highlighted"
    }

    return "Button"
  }

  touchStart(event) {
    const rect = event.target.getBoundingClientRect()
    const x = event.changedTouches[0].clientX
    const y = event.changedTouches[0].clientY

    this.beginPath(x, y)
  }

  touchMove(event) {
    const rect = event.target.getBoundingClientRect()
    const x = event.changedTouches[0].clientX
    const y = event.changedTouches[0].clientY

    this.movePath(x, y)
  }

  touchEnd(event) {
    this.endPath()
  }

  render() {
    return (
      <div className="App">
        <div className="RightPane">
          <div className="RightPane__labeler">
            {
              Object.keys(LABELS).map(id => {
                const name = LABELS[id]
                const classes = this.labelClasses(name)
                return <a
                  className={classes}
                  onClick={() => this.setLabel(parseInt(id))}
                >
                  { name }
                </a>
              })
            }
          </div>
          <div className="Viewport" ref={node => this.viewport = node}>
            <Pointable
              onPointerDown={event => this.pointerDown(event)}
              onPointerMove={event => this.pointerMove(event)}
              onPointerUp={event => this.pointerUp(event)}
            >
              <div 
                onTouchStart={event => this.touchStart(event)}
                onTouchMove={event => this.touchMove(event)}
                onTouchEnd={event => this.touchEnd(event)}
              >
                <canvas { ...this.state.canvas } ref={node => this.canvas = node}></canvas>
                <canvas style={{display: 'none'}} id="input-canvas-centercrop"></canvas>
                <canvas style={{display: 'none'}} id="input-canvas-scaled" width="100" height="100"></canvas>
              </div>
            </Pointable>
          </div>
        </div>
      </div>
    )
  }
}

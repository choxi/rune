import React from 'react'
import PropTypes from 'prop-types'
import './App.scss'

export default class App extends React.Component {
  pointerDown(event) {
    console.log('down')
  }

  render() {
    return (
      <canvas onPointerDown={event => this.pointerDown(event)}>
      </canvas>
    )
  }
}

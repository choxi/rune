import React from 'react'
import PropTypes from 'prop-types'

export default class Gesture extends React.Component {
  static propTypes = {
    gesture: PropTypes.obj
  }

  render() {
    <p>{ gesture.id }</p>  
  }
}

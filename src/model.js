import * as tf from '@tensorflow/tfjs'
import { shuffle } from './utils'

const LEARNING_RATE = 0.15
const optimizer = tf.train.sgd(LEARNING_RATE)
export const LABELS = {
  0: "square",
  1: "circle",
  2: "triangle",
  3: "star",
  4: "zigzag",
  5: "heart"
}

const NUM_CLASSES = Object.keys(LABELS).length

export default class Model {
  constructor() {
    this.model = tf.sequential()
    this.model.add(tf.layers.conv2d({
      inputShape: [28, 28, 1],
      kernelSize: 5,
      filters: 8,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'VarianceScaling'
    }))

    this.model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2],
      strides: [2, 2]
    }))

    this.model.add(tf.layers.conv2d({
      kernelSize: 5,
      filters: 16,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'VarianceScaling'
    }))

    this.model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2],
      strides: [2, 2]
    }))

    this.model.add(tf.layers.flatten())

    this.model.add(tf.layers.dense({
      units: NUM_CLASSES,
      kernelInitializer: 'VarianceScaling',
      activation: 'softmax'
    }))

    this.model.compile({
      optimizer: optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })
  }

  // data => [
  //   [bitmap, label],
  //   [[0,1,0,0...], "square"],
  //   ...
  // ]
  async train(data) {
    const BATCH_EPOCHS = 100
    const BATCH_SIZE = 32

    const labels = data.map(d => d[1])
    const oneHotLabels = tf.oneHot(tf.tensor1d(labels, 'int32'), NUM_CLASSES)
    const batch = tf.tensor(data.map(d => d[0]))

    console.log("Training...")
    const history = await this.model.fit(batch, oneHotLabels, {
      batchSize: BATCH_SIZE,
      epochs: BATCH_EPOCHS,
      shuffle: true,
      validationSplit: 0.3,
      callbacks: {
        onEpochEnd: async (epoch, log) => {
          console.log(`Epoch ${epoch}: loss = ${log.loss} acc = ${log.acc}`);
        }
      }
    })

    return history
  }
}

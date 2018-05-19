import * as tf from '@tensorflow/tfjs'

const LEARNING_RATE = 0.15
const optimizer = tf.train.sgd(LEARNING_RATE)

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
      units: 10,
      kernelInitializer: 'VarianceScaling',
      activation: 'softmax'
    }))

    this.model.compile({
      optimizer: optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })
  }

  async train() {
    const BATCH_SIZE = 1
    const BATCH_EPOCHS = 1
    const NUM_CLASSES = 10
    const batch = tf.zeros([BATCH_SIZE,28,28,1])
    const labels = tf.zeros([BATCH_SIZE,NUM_CLASSES])

    const history = await this.model.fit(batch, labels, {
      batchSize: BATCH_SIZE,
      epochs: BATCH_EPOCHS
    })

    return history
  }
}

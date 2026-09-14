import * as Eldrow from "/projects/eldrow/eldrow.js"
import difficulties from '/projects/eldrow/assets/difficulties.json' with { type: 'json' }

// const word = "sxxxx"
// const accuracy = [2, 0, 0, 0, 0]

// console.log(Eldrow.calculateDifficulty(word, accuracy))

const data = Eldrow.generateWord(difficulties.Easy)
const word = data[0]
const accuracy = data[1]

new Eldrow.Eldrow(word, accuracy)
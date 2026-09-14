const LINK = "https://gist.githubusercontent.com/dracos/dd0668f281e685bad51479e5acaadb93/raw/6bfa15d263d6d5b63840a8e5b64e04b382fdb079/valid-wordle-words.txt"

var xmlHttp = new XMLHttpRequest()
xmlHttp.open("GET", LINK, false)
xmlHttp.send()

import letterValue from '/projects/eldrow/assets/letterValue.json' with { type: 'json' }

export const words = xmlHttp.responseText.split("\n")
const letters = "abcdefghijklmnopqrstuvwxyz".split("")

const scoreValues = [
	["words", 20, 30, "correct"],
	["score", 80, 30, "correct"],
	["guess", 50, 65, "present"]
]

const board = document.querySelector(".gameContainer")
const background = document.querySelector(".background")
const gameTimer = document.querySelector(".gameTimer")
const scoreContainer = document.querySelector(".scoreContainer")
const mainRow = document.createElement("div")
mainRow.className = "gameRow mainRow"
board.appendChild(mainRow)

const inputRow = document.createElement("div")
inputRow.className = "gameRow inputRow"
board.appendChild(inputRow)

export function calculateDifficulty(word, accuracy) {
	let difficulty = 0
	let multiplier = 1

	let repeatList = []

	for (let index = 0; index < 5; index++) {
		let character = word.charAt(index)

		switch(accuracy[index]) {
			case 0:
				difficulty += Math.ceil(50 / letterValue[character])
				break
			case 1:
				multiplier *= 1.3

				if (!repeatList.includes(character)) {
					difficulty += 2 + 2 * letterValue[character]
				} else {
					difficulty += 6 + 3 * letterValue[character]
				}
			case 2:
				multiplier *= 1.3

				if (!repeatList.includes(character)) {
					difficulty += 2 + letterValue[character]
				} else {
					difficulty += 6 + 2 * letterValue[character]
				}
		}

		repeatList.push(character)
	}
	
	return Math.ceil(difficulty * multiplier)
}

function chooseLetter(min, max) {
	while (true) {
		let letter = letters[Math.floor(Math.random() * letters.length)]

		if (letterValue[letter] >= min && letterValue[letter] <= max) {
			return letter
		}
	}
}

export function generateWord(properties) {
	let value = properties.letterRange[0] + Math.round(Math.pow(Math.random(), properties.letterPower) * (properties.letterRange[1] - properties.letterRange[0]))
	let word = []
	let accuracy = []
	let availableIndex = [0, 1, 2, 3, 4]

	for (let index = 0; index < 5; index++) {
		word[index] = chooseLetter(properties.minIncorrectValue, properties.maxIncorrectValue)
		accuracy[index] = 0
	}
	
	while (value > 0){
		let i = Math.floor(Math.random() * availableIndex.length)
		let index = availableIndex[i]
		availableIndex.splice(i, 1)

		if (Math.random() < properties.correctChance) {
			// Correct
			word[index] = chooseLetter(properties.minCorrectValue, properties.maxCorrectValue)
			accuracy[index] = 2
			value -= 2
		} else {
			// Present
			word[index] = chooseLetter(properties.minPresentValue, properties.maxPresentValue)
			accuracy[index] = 1
			value -= 1
		}
	}

	return [word.join(""), accuracy]
}

export class Eldrow {
	constructor(word, accuracy) {
		this.word = word

		this.accuracy = accuracy
		this.correctLetters = []
		this.presentLetters = []
		this.presentLetterCount = {}
		this.presentLetterCountMax = {}
		this.incorrectLetters = []
		this.mainRow = []

		let characters = word.split("")
		let index = 0

		this.accuracy.forEach(value => {
			let character = characters[index]

			let element = document.createElement("div")
			element.style.animationDelay = index * 60 + "ms"
			element.textContent = character.toUpperCase()
			element.className = "gameElement mainRowElement"

			switch(value) {
				case 2: {
					element.classList.add("correct")

					this.correctLetters[index] = character

					break
				}
				case 1: {
					element.classList.add("present")

					this.presentLetters[index] = character
					this.presentLetterCount[character] = (this.presentLetterCount[character] || 0) + 1
					this.presentLetterCountMax[character] = (this.presentLetterCountMax[character] || 5)

					break
				}
				case 0: {
					element.classList.add("incorrect")

					if (!this.presentLetterCount[character]) {
						this.incorrectLetters[index] = character
					} else {
						this.presentLetterCountMax[character] = this.presentLetterCount[character]
					}

					break
				}
			}

			mainRow.appendChild(element)
			
			this.mainRow[index] = element

			index++
		})

		this.inputs = []

		for (let index = 0; index < 5; index++) {
			let element = document.createElement("div")
			element.className = "gameElement inputRowElement"

			let span = document.createElement("span")
			span.className = "gameTextElement"

			element.appendChild(span)

			inputRow.appendChild(element)

			this.inputs[index] = element
		}

		this.timerFragments = []

		for (let index = 0; index < 4; index++) {
			let element = document.createElement("div")
			element.className = "smallWordElement"

			gameTimer.appendChild(element)

			this.timerFragments[index] = element
		}

		this.input = ""
		this.inputIndex = 0
		this.guessed = []
		this.guessCount = 0

		this.setTimerTime("1:00")

		setTimeout(() => {
			this.connectInput()

			this.startTimer(60)
		}, 2500)

		this.difficulty = calculateDifficulty(this.word, this.accuracy)
	}

	applies(word) {
		if (!WordExists(word)) {
			return []
		}

		let corrections = []
		let characters = word.split("")
		let presentCount = {}
		let index = 0

		for (let character of characters) {
			if (this.incorrectLetters.includes(character) ||
			(this.presentLetters.includes(character) && this.presentLetters.indexOf(character) == index) ||
			(this.correctLetters[index] && this.correctLetters[index] != character)) {
				corrections[index] = true
			} else if (this.presentLetters.includes(character) && this.correctLetters[index] != character) {
				presentCount[character] = (presentCount[character] || 0) + 1
			}

			index++
		}
		
		for (let [character, count] of Object.entries(this.presentLetterCount)) {
			if (!presentCount[character] || presentCount[character] < count || presentCount[character] > this.presentLetterCountMax[character]) {
				corrections[5] = true
			}
		}

		if (corrections.length == 0) {
			return true
		} else {
			return corrections
		}
	}

	connectInput() {
		this.onInput = this.onInput.bind(this)

		document.addEventListener("keydown", this.onInput)
	}

	checkAnswer() {
		let outcome = this.applies(this.input)

		if (outcome == true) {
			this.guessed.push(this.input)

			let bgEffect = document.createElement("div")
			bgEffect.className = "backgroundWord"

			for (let index = 0; index < 5; index++) {
				let letter = document.createElement("div")
				letter.className = "smallWordElement correctBorder"
				letter.innerText = this.inputs[index].querySelector("span").innerText

				bgEffect.appendChild(letter)

				let effect = document.createElement("div")
				effect.className = "correctEffect"
				effect.innerText = letter.innerText

				this.inputs[index].appendChild(effect)

				setTimeout(() => {
					effect.remove()
				}, 1000)
			}

			background.appendChild(bgEffect)
			
			this.inputIndex = 0
			this.input = ""

			this.pulseAll("correct", 0)

			this.inputs.forEach(inputDiv => {
				inputDiv.querySelector("span").innerText = ""
			})

			this.bounce(board, Math.PI, 5)
			this.bounce(gameTimer, Math.PI, 3)
		} else if (outcome.length == 0) {
			this.pulseAll("ultra-incorrect", 10)
		} else {
			if (outcome.length == 6) {
				this.pulseAll("present", 5)
			}

			for (let index = 0; index < 5; index++) {
				if (outcome[index]) {
					this.pulse(this.inputs[index], "ultra-incorrect", 10)
				}
			}
		}
	}

	pulse(div, color, power) {
		let direction = Math.PI * 2 * Math.random()
		let transform = `translate(-${50 + Math.sin(direction) * power}%, -${50 + Math.cos(direction) * power}%)`
		let colorValue = `var(--${color})`

		const keyframes = [
			{transform: transform, color: colorValue, borderColor: colorValue},
			{}
		]

		const options = {
			duration: 800,
			iterations: 1,
			easing: 'cubic-bezier(0.075, 0.82, 0.165, 1)'
		}

		div.animate(keyframes, options)
	}

	bounce(div, direction, power) {
		let transform = `translate(-${50 + Math.sin(direction) * power}%, -${50 + Math.cos(direction) * power}%)`

		const keyframes = [
			{transform: transform},
			{}
		]

		const options = {
			duration: 800,
			iterations: 1,
			easing: 'cubic-bezier(0.075, 0.82, 0.165, 1)'
		}

		div.animate(keyframes, options)
	}
	
	pulseAll(color, power) {
		for (let index = 0; index < 5; index++) {
			this.pulse(this.inputs[index], color, power)
		}
	}

	startTimer(time) {
		this.time = Date.now() + time * 1000

		for (let index = 0; index < 4; index++) {
			this.pulse(this.timerFragments[index], "correct", 5)
		}

		this.timer = setInterval(() => {
			let milliseconds = this.time - Date.now()

			if (milliseconds > 0) {
				milliseconds += 1000

				let seconds = Math.floor((milliseconds % 60000) / 1000).toString().padStart(2, '0')
				let minutes = Math.floor(milliseconds / 60000).toString()

				let string = minutes + ":" + seconds

				this.setTimerTime(string)
			} else {
				this.stopTimer()
			}
		}, 100)
	}

	setTimerTime(time) {
		for (let index = 0; index < 4; index++) {
			if (time.charAt(index) != this.timerFragments[index].innerText) {
				this.pulse(this.timerFragments[index], "ultra-incorrect", 5)
			}

			this.timerFragments[index].innerText = time.charAt(index)
		}
	}

	onInput(event) {
		if (event.key.length == 1 && this.inputIndex < 5) {
			this.input += event.key.toLowerCase()
			this.inputs[this.inputIndex++].querySelector("span").innerText = event.key.toUpperCase()
		} else if (event.key == "Backspace" && this.inputIndex > 0) {
			this.input = this.input.slice(0, -1)
			this.inputs[--this.inputIndex].querySelector("span").innerText = ""
		} else if (event.key == "Enter" && this.inputIndex == 5) {
			this.guessCount++
			
			if (this.guessed.includes(this.input)) {
				this.pulseAll("already-guessed", 10)
			} else {
				this.checkAnswer()
			}
		}
	}

	stopTimer() {
		document.removeEventListener("keydown", this.onInput)

		this.setTimerTime("0:00")

		for (let index = 0; index < 4; index++) {
			this.pulse(this.timerFragments[index], "ultra-incorrect", 15)

			// this.timerFragments[index].classList.add("gameTimerOut")
		}

		board.classList.add("gameContainerOut")

		for (let index = 0; index < 5; index++) {
			this.inputs[index].style.animationDelay = 30 * index + "ms"
			this.inputs[index].style.opacity = 1

			// this.inputs[index].classList.add("inputRowElementOut")

			// void this.inputs[index].offsetWidth
		}

		inputRow.classList.add("inputRowOut")

		void inputRow.offsetWidth

		this.viewScore()

		clearInterval(this.timer)
	}

	viewScore() {
		let score = this.getScoreValue()
		let correctChance = Math.pow(score / 500, .75)
		let presentChance = Math.sqrt(score / 400)
		let text = "SCORE"

		for (let index = 0; index < 5; index++) {
			this.flip(this.mainRow[index], text.charAt(index), this.getColor(correctChance, presentChance))
		}

		let scores = [this.guessed.length, score, this.guessCount - this.guessed.length]
		let scoreIndex = 0

		scoreValues.forEach(data => {
			let value = scores[scoreIndex]

			let element = document.createElement("div")
			element.classList.add("scoreSection")
			element.classList.add(data[0])
			element.style.left = data[1] + "%"
			element.style.top = data[2] + "%"

			for (let index = 0; index < 5; index++) {
				let letter = document.createElement("div")
				letter.className = "smallWordElement scoreIn"
				letter.innerText = data[0].charAt(index).toUpperCase()
				letter.style.animationDelay = .2 + index * .1 + scoreIndex * .2 + "s"
				
				let amount = Math.floor(value / Math.pow(10, 4 - index))

				if (amount > 0) {
					letter.classList.add(data[3])
				} else {
					letter.classList.add("incorrect")
				}

				element.appendChild(letter)
			}

			for (let index = 0; index < 5; index++) {
				let letter = document.createElement("div")
				letter.className = "smallWordElement scoreIn"
				letter.style.animationDelay = .3 + index * .1 + scoreIndex * .2 + "s"

				let amount = Math.floor(value / Math.pow(10, 4 - index))
				let digit = amount % 10

				if (amount > 0) {
					letter.classList.add(data[3] + "Border")
				}

				letter.innerText = digit

				element.appendChild(letter)
			}

			scoreContainer.appendChild(element)

			scoreIndex++
		})
	}

	getColor(cc, pc) {
		let color = "incorrect"

		if (Math.random() <= cc) {
			color = "correct"
		} else if (Math.random() <= pc) {
			color = "present"
		}

		return color
	}

	getScoreValue() {
		let value = 0

		this.guessed.forEach(word => {
			word.split("").forEach(character => {
				value += letterValue[character]
			})
		})

		return value
	}

	flip(div, text, color) {
		let transform = `translate(-50%, -50%) rotate3d(1, 0, 0, 180deg)`

		let keyframes = [
			{},
			{transform: transform}
		]

		let options = {
			duration: 200,
			iterations: 1,
			easing: 'cubic-bezier(.8, .78, .8, 1)',
			fill: 'forwards'
		}

		let animation = div.animate(keyframes, options)

		animation.finished.then(() => {
			let keyframes = [
				{transform: transform},
				{transform: 'translate(-50%, -50%)'}
			]

			div.innerText = text

			let options = {
				duration: 600,
				iterations: 1,
				easing: 'cubic-bezier(.21, .99, .77, .98)',
				fill: 'forwards'
			}

			div.animate(keyframes, options)
			div.className = "gameElement mainRowElement"
			div.classList.add(color)
		})
	}
}

export function WordExists(word) {
	let index = words.length / 2
	let delta = words.length

	while (delta > 1) {
		delta = Math.ceil(delta / 2)

		if (words[index] > word || index >= words.length - 1) {
			index -= delta
		} else if (words[index] < word || index < 0) {
			index += delta
		}

		if (words[index] == word) {
			return true
		}
	}

	return false
}
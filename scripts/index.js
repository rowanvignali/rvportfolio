import {request, saveRequest, clamp} from "/scripts/static.js"

const sections = {
	About: document.getElementById("aboutSection"),
	Projects: document.getElementById("projectsSection"),
	Experience: document.getElementById("experienceSection")
}

// Top Bar
const tBar = document.getElementById("topBar")
const labels = document.getElementById("labels")
var sectionList = []
for (let [name, section] of Object.entries(sections)) {
	let instance = document.createElement("label")
	instance.className = "clear white"
	instance.innerText = name
	instance.style.left = `${section.getBoundingClientRect().left}px`

	labels.append(instance)

	updateSize(instance)

	sectionList.push([instance, section])
}

// Layout Functionality
const doc = document.querySelector(".doc")
var divPos = 0
var scrollIndex = 0
var scrollStart = 0

function animateTopBar(initialIndex) {
	sectionList.forEach((data) => {
		let rect = data[1].getBoundingClientRect()

		if (rect.right > 0 && rect.left < 0) {
			data[0].style.left = 0
		} else {
			data[0].style.left = `${rect.left}px`
		}
	})

	if (scrollIndex == initialIndex && Date.now() - scrollStart <= 500) {
		requestAnimationFrame(() => {
			animateTopBar(initialIndex)
		})
	}
}

document.addEventListener("wheel", (event) => {
	if (!event.deltaY) {
		return
	}

	divPos = Math.min(Math.max(divPos - (event.deltaY + event.deltaX), window.innerWidth - doc.scrollWidth), 0)
	// let delta = Math.abs(event.deltaY + event.deltaX)
	doc.style.translate = `${divPos}px`
	// doc.style.transition = `translate ${delta / 400}s cubic-bezier(0.175, 0.885, 0.32, 1.275)`
	event.preventDefault()

	scrollIndex++
	scrollStart = Date.now()
	animateTopBar(scrollIndex)
})

function updateSize(instance) {
	let style = window.getComputedStyle(instance)

	instance.style.setProperty("--xScale", 1 / parseInt(style.width))
	instance.style.setProperty("--yScale", 1 / parseInt(style.height))
}

// Style Functionality
function sizeChanged() {
	// document.documentElement.style.fontSize = `${}px`

	document.querySelectorAll(".clear").forEach(instance => {
		updateSize(instance)
		animateTopBar()
	})
}

sizeChanged()

window.addEventListener("resize", () => {
	sizeChanged()
})

// Projects
request("assets/portfolioData/projectRedirects.json").then((projectRedirects) => {
	function createProject(name) {
		let div = document.createElement("div")
		div.className = "clear white project13"

		let info = document.createElement("div")
		info.className = "projectInfo"

		div.append(info)
		
		let readme = document.createElement("div")
		readme.className = "clear black projectReadme"

		readme.addEventListener("wheel", (event) => {
			if (readme.scrollHeight > readme.clientHeight) {
				event.stopImmediatePropagation()
			}
		})

		let readmePre = document.createElement("span")
		readmePre.style.margin = 0

		let popInAnimation = document.createElement("div")
		popInAnimation.className = "popIn"

		readme.append(readmePre)

		if (projectRedirects[name]) {
			createProjectButton(div, projectRedirects[name], "assets/images/link.svg")
		}

		let nameText = document.createElement("div")
		nameText.className = "clear black projectName"
		nameText.innerText = name

		info.append(nameText)

		div.append(readme, popInAnimation)

		return div
	}

	function createProjectButton(project, link, image) {
		let button = document.createElement("button")
		button.className = "clear black projectButton"

		button.addEventListener("mousedown", (event) => {
			window.open(link, "_blank")
		})

		let logo = document.createElement("img")
		logo.style.width = "100%"
		logo.style.height = "100%"
		logo.src = image
		logo.draggable = false

		button.append(logo)

		project.querySelector(".projectInfo").append(button)
	}

	// GitHub Projects
	const projects = document.getElementById("projects")
	request("https://api.github.com/users/rowanvignali/repos", "repos").then(data => {
		var repoData = []

		for (let index = 0; index < data.length; index++) {
			repoData.push({
				name: data[index].name
			})
		}

		saveRequest("repos", repoData)

		var readmeConverter = new showdown.Converter()

		data.forEach(async projectData => {
			let project = createProject("rowanvignali/" + projectData.name)
			let readme = project.querySelector(".projectReadme")
			createProjectButton(project, "https://github.com/rowanvignali/" + projectData.name, "assets/images/githubInvertocatLogo.svg")

			let commits = document.createElement("div")
			commits.className = "clear black projectCommits"

			let commitList = []

			for (let index = 0; index < 10; index++) {
				let ci = document.createElement("commitInstance")
				ci.className = "clear black"

				commitList.push(ci)
				commits.append(ci)
			}
			
			try {
				const readmeData = await request(`https://api.github.com/repos/rowanvignali/${projectData.name}/readme`, `${projectData.name}_readme`)
				readme.innerHTML = readmeConverter.makeHtml(atob(readmeData.content))

				saveRequest(`${projectData.name}_readme`, {content: readmeData.content})
			} catch {
				readme.innerHTML = "<h5>Error loading readme</h5>"
			}

			try {
				const commitData = await request(`https://api.github.com/repos/rowanvignali/${projectData.name}/commits?per_page=10`)
				
				let index = 0
				commitData.forEach(commit => {
					commitList[index].className += " filled"

					let hour = parseInt(commit.commit.author.date.substring(11, 13))
					let time = String(hour % 12) + commit.commit.author.date.substring(13, 16)
					let affix = " AM"

					if (hour > 12) {
						affix = " PM"
					}

					let hover = document.createElement("div")
					hover.className = "clear black commitHover"
					hover.innerHTML = `<date>[ ${commit.commit.author.date.substring(0, 10)} at ${time + affix} ]</date><br>${commit.commit.message}`

					commitList[index].append(hover)
					
					index++
				})
			} catch {
				console.log("Error loading commits: Rate limited")
			}

			project.append(commits)

			projects.append(project)

			updateSize(project)
		})
	})
})

// Experience
const languages = document.getElementById("languages")
request("assets/portfolioData/languages.json").then(async (data) => {
	for (let [language, languageData] of Object.entries(data)) {
		let instance = document.createElement("div")
		instance.className = "clear black language"

		let image = document.createElement("img")
		image.className = "languageImage"
		image.draggable = false
		image.src = languageData[1]

		let name = document.createElement("span")
		name.className = "languageText"
		name.innerText = language

		let progress = document.createElement("div")
		progress.className = "languageProgress"
		progress.style.setProperty("--percent", languageData[0])

		let rating = document.createElement("span")
		rating.className = "languageRating"
		rating.innerText = `${languageData[0] / 10}/10`

		instance.append(image, name, progress, rating)

		languages.append(instance)

		updateSize(languages)
	}
})

// Bottom Bar
const bBar = document.getElementById("bottomBar")
const bBarDisplay = document.getElementById("bottomBarDisplay")
var bBarOpen = false
var bBarClicks = 0
bBar.addEventListener("mousedown", (event) => {
	if (event.target.tagName.toLowerCase() != "a") {
		if (bBarOpen == true) {
			bBar.style.translate = "-50% 92%"
		} else {
			bBar.style.translate = "-50% 80%"
		}

		bBarOpen = !bBarOpen
		bBarClicks++
		
		bBarDisplay.style.rotate = `${bBarClicks * 180}deg`
	}
})

// Name Phrases
const name = document.getElementById("name")
request("assets/portfolioData/namePhrases.json").then((data) => {
	let index = 0
	const phrases = data.phrases
	
	name.innerHTML = `Rowan Vignali<br><small>${phrases[index++]}</small>`

	name.addEventListener("mousedown", (event) => {
		name.innerHTML = `Rowan Vignali<br><small>${phrases[index++]}</small>`
		index %= phrases.length
	})
})
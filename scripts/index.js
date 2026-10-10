import {request, saveRequest, closeEnoughRound} from "/scripts/static.js"

const sections = {
	About: document.getElementById("aboutSection"),
	Projects: document.getElementById("projectsSection"),
	Languages: document.getElementById("skillsSection"),
	Experience: document.getElementById("experienceSection")
}

// Top Bar
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
		let labelRect = data[0].getBoundingClientRect()
		let labelSize = labelRect.right - labelRect.left

		if (rect.right > 0 && rect.left < 0) {
			data[0].style.left = `${Math.min(rect.right - labelSize, 0)}px`
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

let recentlyDisabledScroll = 0
let recentlyScrolled = 0

function enableScroll(instance) {
	instance.addEventListener("wheel", (event) => {
		if (recentlyScrolled > 0) {
			event.preventDefault()

			return
		}

		let top = instance.scrollHeight - instance.clientHeight - 1
		if (recentlyDisabledScroll == 0 && ((event.deltaY < 0 && instance.scrollTop <= 0) || (event.deltaY > 0 && instance.scrollTop >= top))) {
			return
		}

		if (instance.scrollHeight > instance.clientHeight) {
			recentlyDisabledScroll += 1
			
			event.stopImmediatePropagation()

			setTimeout(() => {
				recentlyDisabledScroll -= 1
			}, 100)
		}
	})
}

document.addEventListener("wheel", (event) => {
	if (!event.deltaY) {
		return
	}

	divPos = Math.min(Math.max(divPos - (event.deltaY + event.deltaX), window.innerWidth - doc.scrollWidth), 0)
	
	doc.style.translate = `${divPos}px`

	event.preventDefault()

	scrollIndex++
	scrollStart = Date.now()
	animateTopBar(scrollIndex)

	recentlyScrolled += 1

	setTimeout(() => {
		recentlyScrolled -= 1
	}, 300)
})

function scrollToSection(id) {
	let box = document.getElementById(id).getBoundingClientRect()

	divPos = Math.max(-box.left, window.innerWidth - doc.scrollWidth)
}

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
import projectRedirects from "/assets/portfolioData/projectRedirects.json" with {type: "json"}

const projects = document.getElementById("projects")

function sortProjects() {
	projects.append(...Array.from(projects.childNodes).sort((a, b) => {
		return a.getAttribute("name") > b.getAttribute("name")
	}))
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

	return button
}

function createProject(name) {
	let div = document.createElement("div")
	div.className = "clear white project13"
	div.setAttribute("name", name)

	let info = document.createElement("div")
	info.className = "projectInfo"

	div.append(info)
	
	let readme = document.createElement("div")
	readme.className = "clear black projectReadme"

	enableScroll(readme)

	let readmePre = document.createElement("span")
	readmePre.style.margin = 0

	let popInAnimation = document.createElement("div")
	popInAnimation.className = "popIn"

	readme.append(readmePre)

	if (projectRedirects[name]) {
		let button = createProjectButton(div, projectRedirects[name], "assets/images/link.svg")
		let text = document.createElement("span")
		text.className = "projectDemo"
		text.innerHTML = "DEMO"
		button.append(text)
	}

	let nameText = document.createElement("div")
	nameText.className = "clear black projectName"
	nameText.innerText = name

	info.append(nameText)

	div.append(readme, popInAnimation)

	return div
}

// GitHub Projects
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
		let project = createProject("rowanvignali/" + projectData.name.toLowerCase())
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
				hover.innerHTML = `<date>[ ${commit.commit.author.date.substring(0, 10)} at ${time + affix} UTC ]</date><br>${commit.commit.message}`

				commitList[index].append(hover)
				
				index++
			})
		} catch {
			console.log("Error loading commits: Rate limited")
		}

		let makeup = document.createElement("div")
		makeup.className = "clear black projectMakeup"

		try {
			const makeupData = await request(`https://api.github.com/repos/rowanvignali/${projectData.name}/languages`)
			let rounded = closeEnoughRound(makeupData, 1)

			for (let [language, value] of Object.entries(rounded)) {
				let lang = document.createElement("div")
				lang.className = "clear black projectLanguage"
				lang.innerHTML = `${language}<makeuplang>${value}%</makeuplang>`
				// lang.style.width = `${Math.max(40, value)}%`

				makeup.append(lang)
			}
		} catch {
			console.log("Error loading makeup: Rate limited")
		}

		project.append(makeup, commits)

		projects.append(project)

		updateSize(project)

		sortProjects()
	})
})

// Skills
import rawLanguageData from "/assets/portfolioData/languages.json" with {type: "json"}

const languages = document.getElementById("languages")

for (let [language, languageData] of Object.entries(rawLanguageData)) {
	let instance = document.createElement("div")
	instance.className = "clear black language"

	let imageDiv = document.createElement("div")
	imageDiv.className = "clear black languageImageDiv"

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

	let description = document.createElement("div")
	description.className = "clear black languageDescription"

	let descriptionSpan = document.createElement("span")
	descriptionSpan.className = "languageDescriptionSpan"
	descriptionSpan.innerHTML = languageData[2]

	description.append(descriptionSpan)

	imageDiv.append(image, name, progress, rating)
	instance.append(imageDiv, description)

	languages.append(instance)

	updateSize(languages)
	updateSize(imageDiv)
	updateSize(description)
}

// Experience
import rawExperienceData from "/assets/portfolioData/experience.json" with {type: "json"}

const experience = document.getElementById("experience")
enableScroll(experience)

for (let experienceData of rawExperienceData) {
	let instance = document.createElement("div")
	instance.className = "clear black experience"

	let experienceBar = document.createElement("div")
	experienceBar.className = "clear black experienceTopBar"

	let title = document.createElement("div")
	title.className = "experienceTitle"
	title.innerHTML = experienceData.title

	let barRight = document.createElement("div")
	barRight.className = "experienceBarRight"

	let employer = document.createElement("span")
	employer.className = "experienceEmployer"
	employer.innerHTML = experienceData.employer

	let duration = document.createElement("span")
	duration.className = "experienceDuration"
	duration.innerHTML = experienceData.duration

	barRight.append(employer, duration)

	experienceBar.append(title, barRight)

	let details = document.createElement("div")
	details.className = "clear black experienceDetails"

	experienceData.description.forEach((description) => {
		let detail = document.createElement("span")
		detail.className = "experienceDetailSingle"
		detail.innerHTML = `   ●\t${description}`

		details.append(detail)
	})

	instance.append(experienceBar, details)

	experience.append(instance)
}

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
// import phrases from "/assets/portfolioData/namePhrases.json" with {type: "json"}

// const name = document.getElementById("name")
// let index = 0

// name.innerHTML = `Rowan Vignali<br><small>${phrases[index++]}</small>`

// name.addEventListener("mousedown", (event) => {
// 	name.innerHTML = `Rowan Vignali<br><small>${phrases[index++]}</small>`
// 	index %= phrases.length
// })
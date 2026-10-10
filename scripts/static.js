export async function request(url, alias, headers) {
	let cookies = decodeURIComponent(document.cookie).split(";")
	
	for (let index = 0; index < cookies.length; index++) {
		let cookie = cookies[index]
		
		while (cookie.charAt(0) == ' ') {
			cookie = cookie.substring(1)
		}

		if (cookie.indexOf(alias + "=") == 0) {
			return JSON.parse(cookie.substring(alias.length + 1, cookie.length))
		}
	}

	return await fetch(url, {headers: headers}).then(response => response.json())
}

export function saveRequest(alias, data) {
	const date = new Date()
	date.setTime(date.getTime() + 60 * 60 * 1000)
	document.cookie = alias + "=" + JSON.stringify(data) + ";" + "expires=" + date.toUTCString() + ";path=/"
}

export function clamp(x, min, max) {
	return Math.max(Math.min(x, max), min)
}

export function closeEnoughRound(arr, decimals) {
	let total = 0
	let totalPercent = 0
	let decimalMul = Math.pow(10, decimals)
	let final = {}
	let error = {}

	for (let value of Object.values(arr)) {
		total += value
	}

	for (let [index, value] of Object.entries(arr)) {
		final[index] = Math.round(value / total * 100 * decimalMul) / decimalMul
		totalPercent += final[index] * decimalMul
		error[index] = final[index] - (value / total) * 100
	}

	let diff = totalPercent - 100 * decimalMul

	if (diff > 0) {
		let sorted = Object.entries(error).sort((a, b) => {return a[1] < b[1]})

		for (let loop = 0; loop < diff; loop++) {
			final[sorted.pop()[0]] -= 1 / decimalMul
		}
	} else if (diff < 0) {
		let sorted = Object.entries(error).sort((a, b) => {return a[1] > b[1]})
		
		for (let loop = 0; loop < -diff; loop++) {
			final[sorted.pop()[0]] += 1 / decimalMul
		}
	}

	return final
}
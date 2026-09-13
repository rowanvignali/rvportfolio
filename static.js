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
export async function request(url, headers) {
	return await fetch(url, {headers: headers}).then(response => response.json())
}
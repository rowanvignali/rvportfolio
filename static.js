export async function request(url) {
	return await fetch(url).then(response => response.json())
}
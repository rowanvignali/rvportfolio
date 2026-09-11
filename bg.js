import {fragmentShader, vertexShader} from "/assets/bgShader.js"

const scene = new THREE.Scene()

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.domElement.className = "bg"
document.body.appendChild(renderer.domElement)

const uniforms = {
	u_time: { value: 0.0 },
	u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
	blue: {value: new THREE.Vector3(20/255, 27/255, 77/255)},
	charcoal: {value: new THREE.Vector3(23/255, 23/255, 23/255)}
}

const material = new THREE.ShaderMaterial({
	vertexShader: vertexShader,
	fragmentShader: fragmentShader,
	uniforms: uniforms
})

const geometry = new THREE.PlaneGeometry(2, 2)
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const clock = new THREE.Clock()

function animate() {
	requestAnimationFrame(animate)

	uniforms.u_time.value = clock.getElapsedTime()

	renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight)
	uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight)
})
import React, { useEffect } from 'react'
import './App.css'
import * as faceapi from 'face-api.js'   // <-- IMPORTANT!

function App() {
	useEffect(() => {
		const video = document.getElementById('video')

		// Start webcam
		navigator.mediaDevices.getUserMedia({ video: true })
			.then((stream) => {
				video.srcObject = stream
				video.play()
			})
			.catch((err) => {
				console.error('Error accessing webcam: ', err)
			})

		// Load face-api models
		const loadModels = async () => {
			const MODEL_URL = process.env.PUBLIC_URL + '/models'
			await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
			await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
		}

		loadModels().then(() => {
			video.addEventListener('play', () => {
				const canvas = document.getElementById('canvas')
				const displaySize = { width: video.width, height: video.height }
				faceapi.matchDimensions(canvas, displaySize)

				setInterval(async () => {
					const detections = await faceapi
						.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
						.withFaceExpressions()

					const resizedDetections = faceapi.resizeResults(detections, displaySize)

					canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
					faceapi.draw.drawDetections(canvas, resizedDetections)
					faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

					// Update emoji and text
					if (detections.length > 0) {
						const expressions = detections[0].expressions
						const maxExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b)
						
						document.getElementById('textStatus').innerText = maxExpression
						const emojiMap = {
							happy: "😄",
							sad: "😢",
							angry: "😠",
							surprised: "😲",
							disgusted: "🤢",
							fearful: "😨",
							neutral: "😐"
						}
						document.getElementById('emoji').innerText = emojiMap[maxExpression] || "😐"
					}
				}, 500)
			})
		})

	}, [])

	return (
		<>
			<div id="app" className="app">
				<div className="overlay"></div>
				<div className="text">
					<span aria-label="emoji" role="img" id="emoji">😐</span>
					You look <span id="textStatus">...</span>!
				</div>
				<div className="mockup">
					<div id="browser" className="browser">
						<div className="browserChrome">
							<div className="browserActions"></div>
						</div>
						<canvas id="canvas"></canvas>
						<video id="video" width="540" height="405" muted autoPlay></video>
					</div>
				</div>
				<p className="note">You are not being recorded, it all happens in your own browser!</p>
			</div>
		</>
	)
}

export default App

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');
const scene = document.querySelector('a-scene');

let previousLandmarkPosition = null;
let markerEntity = null;

function smoothPosition(position) {
    if (!previousLandmarkPosition) {
        previousLandmarkPosition = position;
        return position;
    }

    const smoothedX = position.x * 0.3 + previousLandmarkPosition.x * 0.7;
    const smoothedY = position.y * 0.3 + previousLandmarkPosition.y * 0.7;

    previousLandmarkPosition = { x: smoothedX, y: smoothedY };
    return { x: smoothedX, y: smoothedY };
}

function createMarker() {
    markerEntity = document.createElement('a-circle');
    markerEntity.setAttribute('radius', 0.1);
    markerEntity.setAttribute('color', 'blue');
    markerEntity.setAttribute('position', '0 0 -2');
    markerEntity.setAttribute('rotation', '-90 0 0'); // Menghadap ke atas
    scene.appendChild(markerEntity);
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            const smoothedLandmarks = smoothLandmarks(landmarks);
            drawConnectors(canvasCtx, smoothedLandmarks, HAND_CONNECTIONS,
                { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, smoothedLandmarks, { color: '#FF0000', lineWidth: 2 });

            if (smoothedLandmarks[8]) {
                const indexFinger = smoothedLandmarks[8];

                const aframeX = (indexFinger.x * canvasElement.width / canvasElement.width - 0.5) * 2;
                const aframeY = 0; // Lantai

                const smoothedPosition = smoothPosition({ x: aframeX, y: aframeY });

                if (!markerEntity) {
                    createMarker();
                }

                markerEntity.setAttribute('position', `${smoothedPosition.x} ${smoothedPosition.y} -2`);
                modelEntity.setAttribute('position', `${smoothedPosition.x} ${smoothedPosition.y} -1.9`); // Sedikit di atas tanda
            }
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
    facingMode: "environment"
});
camera.start();

camera.onCameraError = (error) => {
    console.error("Error accessing camera:", error);
};

modelEntity.addEventListener('model-loaded', () => {
    console.log("Model 3D loaded successfully!");
});

modelEntity.addEventListener('model-error', (error) => {
    console.error("Error loading 3D model:", error);
});

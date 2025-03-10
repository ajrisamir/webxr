const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');
const loadingMessage = document.getElementById('loading-message');

canvasElement.width = 480;
canvasElement.height = 480;

let previousLandmarks = null;

function smoothLandmarks(landmarks) {
    if (!previousLandmarks) {
        previousLandmarks = landmarks;
        return landmarks;
    }

    const smoothedLandmarks = landmarks.map((landmark, index) => {
        const previousLandmark = previousLandmarks[index];
        if (!previousLandmark) return landmark;

        const smoothedX = landmark.x * 0.3 + previousLandmark.x * 0.7;
        const smoothedY = landmark.y * 0.3 + previousLandmark.y * 0.7;
        const smoothedZ = landmark.z * 0.3 + previousLandmark.z * 0.7;

        return { x: smoothedX, y: smoothedY, z: smoothedZ };
    });

    previousLandmarks = smoothedLandmarks;
    return smoothedLandmarks;
}

function updateModelTransform(landmarks) {
    if (landmarks[8] && landmarks[4]) {
        const indexFinger = landmarks[8];
        const thumb = landmarks[4];

        const distance = Math.sqrt(
            Math.pow(indexFinger.x - thumb.x, 2) + Math.pow(indexFinger.y - thumb.y, 2)
        );

        const scaleFactor = 5;
        const scale = distance * scaleFactor;
        modelEntity.setAttribute('scale', `${scale} ${scale} ${scale}`);

        const positionFactor = 2;
        const aframeX = (indexFinger.x * canvasElement.width / canvasElement.width - 0.5) * positionFactor;
        const aframeY = -(indexFinger.y * canvasElement.height / canvasElement.height - 0.5) * positionFactor;
        modelEntity.setAttribute('position', `${aframeX} ${aframeY} 0`);

        const rotationFactor = 180;
        const rotationX = (thumb.y - indexFinger.y) * rotationFactor;
        const rotationY = (thumb.x - indexFinger.x) * rotationFactor;
        modelEntity.setAttribute('rotation', `${rotationX} ${rotationY} 0`);
    }
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
            updateModelTransform(smoothedLandmarks);
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
    width: 480,
    height: 480,
    facingMode: "environment"
});

camera.start().then(()=>{
    loadingMessage.style.display = 'none';
});

camera.onCameraError = (error) => {
    console.error("Error accessing camera:", error);
    alert("Kamera tidak dapat diakses. Pastikan kamera terhubung dan izin diberikan.");
    loadingMessage.textContent = "Error: Kamera tidak dapat diakses.";
};

modelEntity.addEventListener('model-loaded', () => {
    console.log("Model 3D berhasil dimuat!");
});

modelEntity.addEventListener('model-error', (error) => {
    console.error("Error loading 3D model:", error);
    alert("Gagal memuat model 3D. Periksa jalur file model.");
    loadingMessage.textContent = "Error: Gagal memuat model 3D.";
});

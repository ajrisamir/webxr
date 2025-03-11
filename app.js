const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');

let previousLandmarks = null;

function smoothLandmarks(landmarks) {
    if (!previousLandmarks) {
        previousLandmarks = landmarks;
        return landmarks;
    }

    // Exponential smoothing
    const smoothingFactor = 0.7; // Adjustable factor
    return landmarks.map((landmark, index) => {
        const previousLandmark = previousLandmarks[index];
        const smoothedLandmark = {
            x: smoothingFactor * landmark.x + (1 - smoothingFactor) * previousLandmark.x,
            y: smoothingFactor * landmark.y + (1 - smoothingFactor) * previousLandmark.y,
            z: smoothingFactor * landmark.z + (1 - smoothingFactor) * previousLandmark.z,
        };
        return smoothedLandmark;
    });
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

            if (smoothedLandmarks[8] && smoothedLandmarks[4]) {
                const indexFinger = smoothedLandmarks[8];
                const thumb = smoothedLandmarks[4];

                const distance = Math.sqrt(
                    Math.pow(indexFinger.x - thumb.x, 2) + Math.pow(indexFinger.y - thumb.y, 2)
                );

                const thresholdDistance = 0.05; // Threshold to prevent unintentional scaling
                if (distance < thresholdDistance) {
                    return; // No interaction if fingers are too close
                }

                // Scale model based on finger distance
                const scale = distance * 5;
                modelEntity.setAttribute('scale', `${scale} ${scale} ${scale}`);

                const aframeX = (indexFinger.x * canvasElement.width / window.innerWidth - 0.5) * 2;
                const aframeY = -(indexFinger.y * canvasElement.height / window.innerHeight - 0.5) * 2;

                modelEntity.setAttribute('position', `${aframeX} ${aframeY} 0`);

                const rotationX = (thumb.y - indexFinger.y) * 180;
                const rotationY = (thumb.x - indexFinger.x) * 180;
                modelEntity.setAttribute('rotation', `${rotationX} ${rotationY} 0`);
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
    width: window.innerWidth,
    height: window.innerHeight,
    facingMode: "environment"
});

camera.start();

camera.onCameraError = (error) => {
    console.error("Error accessing camera:", error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Kamera tidak dapat diakses. Pastikan kamera terhubung dan izin diberikan.';
    document.body.appendChild(errorDiv);
};

modelEntity.addEventListener('model-loaded', () => {
    console.log("Model 3D berhasil dimuat!");
});

modelEntity.addEventListener('model-error', (error) => {
    console.error("Error loading 3D model:", error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Gagal memuat model 3D. Periksa jalur file model.';
    document.body.appendChild(errorDiv);
});

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1; // Adjust for high-DPI screens
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
        return;
    }

    // Menentukan rasio aspek video dan layar
    const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    const screenAspectRatio = window.innerWidth / window.innerHeight;

    if (videoAspectRatio > screenAspectRatio) {
        // Jika rasio aspek video lebih besar dari layar, sesuaikan canvas dengan lebar layar
        canvasElement.width = window.innerWidth;
        canvasElement.height = window.innerWidth / videoAspectRatio;
    } else {
        // Jika rasio aspek layar lebih besar, sesuaikan canvas dengan tinggi layar
        canvasElement.width = window.innerHeight * videoAspectRatio;
        canvasElement.height = window.innerHeight;
    }
    
    // Posisi video tetap menutupi seluruh layar tanpa zoom
    videoElement.width = canvasElement.width;
    videoElement.height = canvasElement.height;
}

window.addEventListener('resize', () => {
    if (videoElement.videoWidth && videoElement.videoHeight) {
        resizeCanvas();
    }
});

videoElement.addEventListener('loadedmetadata', () => {
    if (videoElement.videoWidth && videoElement.videoHeight) {
        resizeCanvas();
    }
});

// Use requestAnimationFrame for efficient frame rendering
function renderFrame() {
    requestAnimationFrame(renderFrame);
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        // Drawing and processing can be added here for optimization
    }
}

requestAnimationFrame(renderFrame);

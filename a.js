const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');

// Fungsi untuk menyesuaikan ukuran video dan kanvas agar sesuai dengan layar tanpa distorsi dan tanpa ruang kosong
function resizeElements() {
    videoElement.style.position = 'fixed';
    videoElement.style.top = '0';
    videoElement.style.left = '0';
    videoElement.style.width = '100vw';
    videoElement.style.height = '100vh';
    videoElement.style.objectFit = 'cover';
    
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    canvasElement.style.position = 'fixed';
    canvasElement.style.top = '0';
    canvasElement.style.left = '0';
}

window.addEventListener('resize', resizeElements);
resizeElements();

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

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            const smoothedLandmarks = smoothLandmarks(landmarks);

            drawConnectors(canvasCtx, smoothedLandmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, smoothedLandmarks, { color: '#FF0000', lineWidth: 2 });

            if (smoothedLandmarks[8] && smoothedLandmarks[4]) {
                const indexFinger = smoothedLandmarks[8];
                const thumb = smoothedLandmarks[4];

                const distance = Math.sqrt(
                    Math.pow(indexFinger.x - thumb.x, 2) + Math.pow(indexFinger.y - thumb.y, 2)
                );

                const scale = distance * 5;
                modelEntity.setAttribute('scale', `${scale} ${scale} ${scale}`);

                const aframeX = (indexFinger.x - 0.5) * 2;
                const aframeY = -(indexFinger.y - 0.5) * 2;

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
    alert("Kamera tidak dapat diakses. Pastikan kamera terhubung dan izin diberikan.");
};

modelEntity.addEventListener('model-loaded', () => {
    console.log("Model 3D berhasil dimuat!");
});

modelEntity.addEventListener('model-error', (error) => {
    console.error("Error loading 3D model:", error);
    alert("Gagal memuat model 3D. Periksa jalur file model.");
});

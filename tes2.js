const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');

let previousLandmarks = null; // Menyimpan landmark sebelumnya untuk smoothing

function smoothLandmarks(landmarks) {
    if (!previousLandmarks) {
        previousLandmarks = landmarks;
        return landmarks;
    }

    const smoothedLandmarks = landmarks.map((landmark, index) => {
        const previousLandmark = previousLandmarks[index];
        if (!previousLandmark) return landmark;

        const smoothedX = landmark.x * 0.3 + previousLandmark.x * 0.7; // Faktor smoothing
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
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            const smoothedLandmarks = smoothLandmarks(landmarks); // Smoothing landmark
            drawConnectors(canvasCtx, smoothedLandmarks, HAND_CONNECTIONS,
                { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, smoothedLandmarks, { color: '#FF0000', lineWidth: 2 });

            if (smoothedLandmarks[8] && smoothedLandmarks[4]) {
                const indexFinger = smoothedLandmarks[8];
                const thumb = smoothedLandmarks[4];

                const distance = Math.sqrt(
                    Math.pow(indexFinger.x - thumb.x, 2) + Math.pow(indexFinger.y - thumb.y, 2)
                );

                const scale = distance * 5;
                modelEntity.setAttribute('scale', `${scale} ${scale} ${scale}`);

                const aframeX = (indexFinger.x * canvasElement.width / canvasElement.width - 0.5) * 2;
                const aframeY = -(indexFinger.y * canvasElement.height / canvasElement.height - 0.5) * 2;

                modelEntity.setAttribute('position', `${aframeX} ${aframeY} -1`);

                const rotationX = (thumb.y - indexFinger.y) * 180; // Rotasi berdasarkan perbedaan y
                const rotationY = (thumb.x - indexFinger.x) * 180; // Rotasi berdasarkan perbedaan x
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
    width: 640, // Resolusi yang disesuaikan
    height: 480,
    facingMode: "environment" // Menggunakan kamera belakang
});
camera.start();

// Penanganan Error
camera.onCameraError = (error) => {
    console.error("Error accessing camera:", error);
};

modelEntity.addEventListener('model-loaded', () => {
    console.log("Model 3D loaded successfully!");
});

modelEntity.addEventListener('model-error', (error) => {
    console.error("Error loading 3D model:", error);
});

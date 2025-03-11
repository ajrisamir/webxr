const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');

let previousLandmarks = null;
let previousScale = null;
let previousPosition = null;

function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

function smoothLandmarks(landmarks) {
    if (!previousLandmarks) {
        previousLandmarks = landmarks;
        return landmarks;
    }

    const smoothedLandmarks = landmarks.map((landmark, index) => {
        const previousLandmark = previousLandmarks[index] || landmark;
        return {
            x: lerp(previousLandmark.x, landmark.x, 0.3),
            y: lerp(previousLandmark.y, landmark.y, 0.3),
            z: lerp(previousLandmark.z, landmark.z, 0.3)
        };
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
                    Math.pow(indexFinger.x - thumb.x, 2) +
                    Math.pow(indexFinger.y - thumb.y, 2)
                );
                
                const targetScale = distance * 5;
                previousScale = previousScale || targetScale;
                const smoothedScale = lerp(previousScale, targetScale, 0.2);
                previousScale = smoothedScale;
                modelEntity.setAttribute('scale', `${smoothedScale} ${smoothedScale} ${smoothedScale}`);

                const aframeX = (indexFinger.x - 0.5) * 2;
                const aframeY = -(indexFinger.y - 0.5) * 2;
                const aframeZ = -indexFinger.z * 2;
                
                previousPosition = previousPosition || { x: aframeX, y: aframeY, z: aframeZ };
                const smoothX = lerp(previousPosition.x, aframeX, 0.2);
                const smoothY = lerp(previousPosition.y, aframeY, 0.2);
                const smoothZ = lerp(previousPosition.z, aframeZ, 0.2);
                previousPosition = { x: smoothX, y: smoothY, z: smoothZ };

                modelEntity.setAttribute('position', `${smoothX} ${smoothY} ${smoothZ}`);

                const deltaX = thumb.x - indexFinger.x;
                const deltaY = thumb.y - indexFinger.y;
                const deltaZ = thumb.z - indexFinger.z;
                
                const rotationX = Math.atan2(deltaY, deltaZ) * (180 / Math.PI);
                const rotationY = Math.atan2(deltaX, deltaZ) * (180 / Math.PI);
                modelEntity.setAttribute('rotation', `${rotationX} ${rotationY} 0`);
            }
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
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

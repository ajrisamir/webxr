const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');

// Set video dan canvas agar menyesuaikan dengan ukuran layar ponsel
function adjustVideoCanvasSize() {
    const width = window.innerWidth;  // Lebar layar
    const height = window.innerHeight;  // Tinggi layar

    videoElement.width = width;
    videoElement.height = height;

    canvasElement.width = width;
    canvasElement.height = height;
}

window.addEventListener('resize', adjustVideoCanvasSize); // Menyesuaikan saat ukuran layar berubah
adjustVideoCanvasSize(); // Pertama kali dijalankan saat halaman dimuat

let previousLandmarks = null;
let previousScale = null;
let previousPosition = null;
let handLostFrames = 0;
const maxLostFrames = 10; // Sembunyikan setelah 10 frame tanpa tangan

// Fungsi untuk melakukan smoothing pada landmarks tangan
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

// Fungsi untuk menghitung linear interpolation (lerp)
function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

// Fungsi untuk mengatur posisi, skala, dan rotasi model berdasarkan hasil tracking
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        handLostFrames++;
        if (handLostFrames > maxLostFrames) {
            modelEntity.setAttribute('visible', 'false');
        }
        return;
    }

    handLostFrames = 0;
    modelEntity.setAttribute('visible', 'true');

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

            const targetScale = distance * 5;
            const minScale = 0.1;
            const maxScale = 2.0;
            const smoothedScale = lerp(previousScale || targetScale, targetScale, 0.2);
            previousScale = smoothedScale;
            const clampedScale = Math.max(minScale, Math.min(smoothedScale, maxScale));
            modelEntity.setAttribute('scale', `${clampedScale} ${clampedScale} ${clampedScale}`);

            const aframeX = (indexFinger.x * canvasElement.width / videoElement.videoWidth - 0.5) * 2;
            const aframeY = -(indexFinger.y * canvasElement.height / videoElement.videoHeight - 0.5) * 2;
            const aframeZ = -smoothedLandmarks[8].z * 2;

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
    canvasCtx.restore();
}

// Setup MediaPipe Hands
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

// Setup Kamera untuk menangkap video
ttry {
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        facingMode: "environment"
    });
    camera.start();
} catch (err) {
    console.error("Error starting camera:", err);
    alert("Gagal mengakses kamera. Pastikan izin telah diberikan.");
}

// Event listener untuk model 3D
modelEntity.addEventListener('model-loaded', () => {
    console.log("Model 3D berhasil dimuat!");
});

modelEntity.addEventListener('model-error', (error) => {
    console.error("Error loading 3D model:", error);
    alert("Gagal memuat model 3D. Periksa jalur file model.");
});

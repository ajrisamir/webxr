const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');

// Fungsi untuk menyelaraskan ukuran video dengan ukuran canvas tanpa distorsi
function setVideoSize() {
    const videoAspect = videoElement.videoWidth / videoElement.videoHeight; // Rasio aspek video
    const canvasAspect = canvasElement.width / canvasElement.height; // Rasio aspek canvas

    let videoWidth, videoHeight;

    // Menyesuaikan ukuran video dengan ukuran canvas tanpa distorsi
    if (canvasAspect > videoAspect) {
        // Jika canvas lebih lebar dari rasio video, sesuaikan tinggi video
        videoHeight = canvasElement.height;
        videoWidth = videoHeight * videoAspect;
    } else {
        // Jika canvas lebih tinggi dari rasio video, sesuaikan lebar video
        videoWidth = canvasElement.width;
        videoHeight = videoWidth / videoAspect;
    }

    // Mengatur ukuran video
    videoElement.style.width = `${videoWidth}px`;
    videoElement.style.height = `${videoHeight}px`;

    // Posisi video di tengah-tengah canvas
    videoElement.style.position = 'absolute';
    videoElement.style.top = `${(canvasElement.height - videoHeight) / 2}px`;
    videoElement.style.left = `${(canvasElement.width - videoWidth) / 2}px`;
}

// Fungsi untuk mengatur ukuran video dan canvas
function setVideoCanvasSize() {
    // Menyelaraskan ukuran canvas dengan ukuran jendela perangkat
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    // Menyesuaikan ukuran video dengan canvas
    setVideoSize();
}

// Atur ukuran saat pertama kali dimuat
setVideoCanvasSize();

// Mengatur ukuran saat jendela berubah
window.addEventListener('resize', setVideoCanvasSize);

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

                const scale = distance * 5;
                modelEntity.setAttribute('scale', `${scale} ${scale} ${scale}`);

                const aframeX = (indexFinger.x * canvasElement.width / canvasElement.width - 0.5) * 2;
                const aframeY = -(indexFinger.y * canvasElement.height / canvasElement.height - 0.5) * 2;

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

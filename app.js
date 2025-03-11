const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');

// Wait for the video to load so we can get its original width and height
videoElement.onloadedmetadata = function () {
    // Set the initial video size based on its aspect ratio
    resizeElements();
};

// Function to adjust video and canvas sizes while maintaining the aspect ratio
function resizeElements() {
    const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    const windowAspectRatio = window.innerWidth / window.innerHeight;

    // Check if the window is wider or taller than the video aspect ratio
    if (windowAspectRatio > videoAspectRatio) {
        // Window is wider, so set width to window width and height proportional to video aspect ratio
        videoElement.width = window.innerWidth;
        videoElement.height = window.innerWidth / videoAspectRatio;
    } else {
        // Window is taller, so set height to window height and width proportional to video aspect ratio
        videoElement.height = window.innerHeight;
        videoElement.width = window.innerHeight * videoAspectRatio;
    }

    // Adjust canvas size to match video size
    canvasElement.width = videoElement.width;
    canvasElement.height = videoElement.height;
}

// Call resizeElements on window resize to adjust the sizes dynamically
window.addEventListener('resize', resizeElements);

// Initial resize when the page is loaded
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

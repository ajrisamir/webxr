// app.js

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const modelEntity = document.getElementById('model');

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                {color: '#00FF00', lineWidth: 5});
            drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

            // Mendapatkan posisi landmark ujung jari telunjuk (landmark 8)
            if (landmarks[8]) {
                const landmark = landmarks[8];
                const x = landmark.x * canvasElement.width;
                const y = landmark.y * canvasElement.height;

                // Mengonversi posisi piksel ke koordinat A-Frame
                const aframeX = (x / canvasElement.width - 0.5) * 2; // Normalisasi ke -1 sampai 1
                const aframeY = -(y / canvasElement.height - 0.5) * 2; // Normalisasi dan balikkan y

                // Mengatur posisi model 3D
                modelEntity.setAttribute('position', `${aframeX} ${aframeY} -1`); // -1 untuk z agar terlihat
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
        await hands.send({image: videoElement});
    },
    width: 480,
    height: 720
    facingMode: 'environment'
});
camera.start();

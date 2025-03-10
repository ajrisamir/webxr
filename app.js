// app.js

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const marker = document.querySelector('a-marker');
const model = document.getElementById('model');
const hand = document.getElementById('hand');

let isGripped = false;

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

            const landmark = landmarks[8]; // Ujung jari telunjuk
            const x = landmark.x * canvasElement.width;
            const y = landmark.y * canvasElement.height;
            const aframeX = (x / canvasElement.width - 0.5) * 2;
            const aframeY = -(y / canvasElement.height - 0.5) * 2;

            hand.setAttribute('position', `${aframeX} ${aframeY} -1`);

            if (marker.object3D.visible) { // Hanya interaksi jika marker terlihat
                const handPos = hand.object3D.position;
                const modelPos = model.object3D.position;
                const distance = handPos.distanceTo(modelPos);

                if (distance < 0.2) { // Jarak interaksi
                    if (isGripping(landmarks)) {
                        isGripped = true;
                        model.setAttribute('position', hand.getAttribute('position'));
                    } else if (isGripped) {
                        isGripped = false;
                    }
                } else if (isGripped) {
                    isGripped = false;
                }

                if (!isGripped && marker.object3D.visible) {
                    model.setAttribute('position', { x: 0, y: 0, z: 0 }); // Kembali ke posisi marker
                }
            }
        }
    }
    canvasCtx.restore();
}

function isGripping(landmarks) {
    // Deteksi genggaman: Jarak antara ibu jari dan jari telunjuk
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2)
    );
    return distance < 0.05; // Sesuaikan ambang batas
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
    height: 720,
    facingMode: "environment"
});
camera.start();

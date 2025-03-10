document.addEventListener("DOMContentLoaded", async () => {
    const videoElement = document.createElement("video");
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

    async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            videoElement.srcObject = stream;
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve();
                };
            });
        } catch (error) {
            console.error("❌ Gagal mengakses kamera:", error);
        }
    }

    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    function onResults(results) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

        const hand = results.multiHandLandmarks[0];
        const thumb = hand[4]; // Contoh titik untuk interaksi (thumb tip)

        // Gunakan posisi thumb untuk melakukan interaksi dengan model (rotasi dan scale)
        handleHandInteraction(thumb.x, thumb.y);
    }

    function handleHandInteraction(x, y) {
        const modelEntity = document.querySelector("#model-entity");

        // Rotasi model berdasarkan posisi x dan y (misalnya dengan jarak antara tangan)
        const rotationX = x * 360;
        const rotationY = y * 360;
        modelEntity.setAttribute("rotation", `${rotationX} ${rotationY} 0`);
        
        // Scaling model berdasarkan jarak tangan
        const scale = Math.max(0.5, Math.min(1.5, (x + y) * 2));  // Atur scale dengan batas 0.5 hingga 1.5
        modelEntity.setAttribute("scale", `${scale} ${scale} ${scale}`);
    }

    await setupCamera();
    processVideoFrame();
});

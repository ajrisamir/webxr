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
        const palm = hand[9]; // Titik tengah telapak tangan untuk referensi

        // Posisikan model 3D berdasarkan posisi telapak tangan
        positionModelAtHand(palm.x * canvasElement.width, palm.y * canvasElement.height);
    }

    // Fungsi untuk menyesuaikan posisi dan skala model 3D pada tangan
    function positionModelAtHand(x, y) {
        const modelEntity = document.querySelector("#model-entity");

        // Konversi koordinat (x, y) ke dalam ruang 3D
        const posX = (x - canvasElement.width / 2) / canvasElement.width * 2;
        const posY = -(y - canvasElement.height / 2) / canvasElement.height * 2;

        // Posisi model 3D di ruang AR
        modelEntity.setAttribute("position", `${posX} ${posY} -1`); // Set posisi di depan kamera

        // Batasi scale model agar tidak terlalu besar atau kecil
        const scale = 1; // Ukuran model tetap
        modelEntity.setAttribute("scale", `${scale} ${scale} ${scale}`);
    }

    await setupCamera();
    processVideoFrame();
});

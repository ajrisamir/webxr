document.addEventListener("DOMContentLoaded", async () => {
    const videoElement = document.getElementById("video");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    const model = document.getElementById("model");

    async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            videoElement.srcObject = stream;
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                    resolve();
                };
            });
        } catch (error) {
            console.error("❌ Gagal mengakses kamera:", error);
        }
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

    function onResults(results) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            return;
        }

        const hand = results.multiHandLandmarks[0];
        const indexFinger = hand[8]; // Titik ujung jari telunjuk
        const thumb = hand[4]; // Titik ibu jari

        // Gambar lingkaran merah untuk debug posisi tangan
        canvasCtx.fillStyle = "red";
        canvasCtx.beginPath();
        canvasCtx.arc(indexFinger.x * canvasElement.width, indexFinger.y * canvasElement.height, 10, 0, 2 * Math.PI);
        canvasCtx.fill();

        // Hitung jarak antara ibu jari dan telunjuk untuk scaling
        const distance = Math.sqrt(
            Math.pow(indexFinger.x - thumb.x, 2) + Math.pow(indexFinger.y - thumb.y, 2)
        );

        // Terapkan scaling berdasarkan jarak antara ibu jari dan telunjuk
        const scaleValue = Math.max(0.3, Math.min(1.5, distance * 4));
        model.setAttribute("scale", `${scaleValue} ${scaleValue} ${scaleValue}`);

        // Terapkan rotasi berdasarkan posisi tangan
        const rotationValue = (indexFinger.x - 0.5) * 360;
        model.setAttribute("rotation", `0 ${rotationValue} 0`);
    }

    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    await setupCamera();
    videoElement.play();
    processVideoFrame();
});

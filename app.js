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
        const palm = hand[9]; // Titik tengah telapak tangan

        // Gambar lingkaran merah untuk menandai posisi telapak tangan
        canvasCtx.fillStyle = "red";
        canvasCtx.beginPath();
        canvasCtx.arc(palm.x * canvasElement.width, palm.y * canvasElement.height, 10, 0, 2 * Math.PI);
        canvasCtx.fill();

        // Posisikan model 3D pada telapak tangan
        positionModelAtHand(palm.x * canvasElement.width, palm.y * canvasElement.height);
    }

    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    await setupCamera();
    videoElement.play();
    processVideoFrame();

    function positionModelAtHand(x, y) {
    // Konversi posisi ke dalam rentang -1 hingga 1 untuk X dan Y
    const scaleX = (x / canvasElement.width) * 2 - 1;
    const scaleY = -((y / canvasElement.height) * 2 - 1);

    // Sesuaikan nilai Z untuk membawa model lebih dekat ke kamera
    const scaleZ = -3;  // Nilai Z ini bisa disesuaikan lebih lanjut agar model lebih dekat ke tangan

    // Jika model terlalu jauh, coba kurangi nilai Z (misalnya -0.5 atau lebih tinggi)
    console.log(`Posisi Model: X: ${scaleX}, Y: ${scaleY}, Z: ${scaleZ}`);

    // Posisikan model di dunia AR menggunakan A-Frame
    model.setAttribute('position', `${scaleX} ${scaleY} ${scaleZ}`);  // Pastikan Z tidak terlalu besar
}

});

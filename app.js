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
        positionModelAtHand(palm.x, palm.y);
    }

    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    await setupCamera();
    videoElement.play();
    processVideoFrame();

    // Fungsi untuk memposisikan model 3D
    function positionModelAtHand(x, y) {
        const model = document.getElementById("model");

        // Konversi posisi x, y ke sistem koordinat dunia AR (dalam A-Frame, kita bisa mengubah koordinat dalam sistem 3D)
        // Arahkan model ke posisi telapak tangan (posisi di layar)
        const scaleX = (x - 0.5) * 2;  // Menyesuaikan dengan rentang -1 hingga 1
        const scaleY = (y - 0.5) * 2;  // Menyesuaikan dengan rentang -1 hingga 1
        model.setAttribute('position', `${scaleX} ${scaleY} -3`);  // Mengatur posisi model 3D dalam dunia AR
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script dimulai...");

    const videoElement = document.getElementById("video");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    const handModel = document.getElementById("handModel"); // Model 3D yang ada di A-Frame

    // Setup kamera
    async function setupCamera() {
        console.log("🎥 Mengakses kamera belakang...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            videoElement.srcObject = stream;
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    console.log("✅ Kamera siap digunakan!");
                    resolve();
                };
            });
        } catch (error) {
            console.error("❌ Gagal mengakses kamera:", error);
        }
    }

    // Inisialisasi MediaPipe Hands
    console.log("🖐️ Menginisialisasi MediaPipe Hands...");
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

    // Fungsi ketika hasil deteksi tangan diterima
    function onResults(results) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            console.warn("❌ Tidak ada tangan terdeteksi.");
            return;
        }

        console.log("📊 Data hasil deteksi tangan diterima!");
        const hand = results.multiHandLandmarks[0];
        const palm = hand[9]; // Titik tengah telapak tangan
        console.log("📍 Telapak tangan di:", palm.x, palm.y);

        // Hitung posisi model berdasarkan koordinat tangan
        const xPos = (palm.x - 0.5) * 2; // Mengubah dari [0, 1] menjadi [-1, 1]
        const yPos = (palm.y - 0.5) * 2; // Mengubah dari [0, 1] menjadi [-1, 1]
        const zPos = -2; // Tentukan jarak model

        // Perbarui posisi model di A-Frame
        handModel.setAttribute('position', `${xPos} ${yPos} ${zPos}`);
    }

    // Fungsi untuk memproses frame video
    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    await setupCamera();
    videoElement.play();
    processVideoFrame();
});

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script dimulai...");

    const videoElement = document.getElementById("video");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    const handModel = document.querySelector("#hand-model"); // A-Frame model

    async function setupCamera() {
        console.log("🎥 Mengakses kamera...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" } // Gunakan kamera belakang
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

    function onResults(results) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            console.warn("❌ Tidak ada tangan terdeteksi.");
            handModel.setAttribute('visible', 'false'); // Sembunyikan model 3D
            return;
        }

        console.log("📊 Data hasil deteksi tangan diterima!");
        const hand = results.multiHandLandmarks[0];
        const palm = hand[9]; // Titik tengah telapak tangan

        console.log("📍 Telapak tangan di:", palm.x, palm.y);

        // Menampilkan model 3D pada posisi telapak tangan
        const xPos = palm.x * 2 - 1; // Menyesuaikan koordinat agar model bisa muncul
        const yPos = -(palm.y * 2 - 1); // Menyesuaikan koordinat agar model bisa muncul

        handModel.setAttribute('visible', 'true');
        handModel.setAttribute('position', `${xPos} ${yPos} -3`); // Menempatkan model pada posisi telapak tangan
    }

    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    await setupCamera();
    videoElement.play();
    processVideoFrame();
});

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script dimulai...");

    const videoElement = document.getElementById("video");

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

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            console.log("📸 Frame diambil, mengirim ke MediaPipe...");
            try {
                await hands.send({ image: videoElement });
                console.log("✅ Frame berhasil dikirim ke MediaPipe!");
            } catch (error) {
                console.error("❌ Gagal mengirim frame ke MediaPipe:", error);
            }
        },
        width: 640,
        height: 480
    });
    camera.start();

    function onResults(results) {
        console.log("📊 Data hasil deteksi tangan diterima!");

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            console.warn("❌ Tidak ada tangan terdeteksi.");
            return;
        }

        const hand = results.multiHandLandmarks[0];
        const palm = hand[9]; // Titik tengah telapak tangan

        console.log("📍 Telapak tangan di:", palm.x, palm.y);
    }

    await setupCamera();
});

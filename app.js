document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script dimulai...");

    const videoElement = document.getElementById("video");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");

    async function setupCamera() {
        console.log("🎥 Mengakses kamera belakang...");
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

    const model3D = document.getElementById("3d-model"); // A-Frame model 3D (Model4.glb)

    function onResults(results) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            console.warn("❌ Tidak ada tangan terdeteksi.");
            model3D.setAttribute("visible", "false"); // Sembunyikan model 3D jika tidak ada tangan terdeteksi
            return;
        }

        console.log("📊 Data hasil deteksi tangan diterima!");
        const hand = results.multiHandLandmarks[0];
        const palm = hand[9]; // Titik tengah telapak tangan
        console.log("📍 Telapak tangan di:", palm.x, palm.y);

        // Gambar lingkaran di atas telapak tangan
        canvasCtx.fillStyle = "red";
        canvasCtx.beginPath();
        canvasCtx.arc(palm.x * canvasElement.width, palm.y * canvasElement.height, 10, 0, 2 * Math.PI);
        canvasCtx.fill();

        // Posisi model 3D berdasarkan koordinat telapak tangan
        const sceneWidth = window.innerWidth;
        const sceneHeight = window.innerHeight;

        // Konversi posisi telapak tangan menjadi posisi 3D
        const modelX = (palm.x - 0.5) * 2; // Normalisasi x
        const modelY = -(palm.y - 0.5) * 2; // Normalisasi y (dengan invert Y)
        const modelZ = -3; // Posisi z (sejauh mana model akan muncul)

        model3D.setAttribute("position", `${modelX} ${modelY} ${modelZ}`);
        model3D.setAttribute("visible", "true"); // Tampilkan model 3D saat tangan terdeteksi
    }

    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    await setupCamera();
    videoElement.play();
    processVideoFrame();
});

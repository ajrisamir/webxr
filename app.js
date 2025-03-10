document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script dimulai...");

    const videoElement = document.getElementById("video");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");

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

    // Fungsi untuk menangani hasil deteksi tangan
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

        // Mendapatkan posisi telapak tangan
        const xPos = palm.x * canvasElement.width;
        const yPos = palm.y * canvasElement.height;

        // Pastikan elemen model sudah ada dan model 3D siap
        const handModel = document.querySelector('#hand-model');
        if (handModel) {
            // Menunggu model selesai dimuat
            handModel.addEventListener('model-loaded', function() {
                console.log("✅ Model 3D berhasil dimuat!");
                handModel.setAttribute('position', `${xPos} ${yPos} -2`);  // Posisi model
                handModel.setAttribute('visible', 'true');  // Menampilkan model
            });

            // Jika model belum dimuat, tampilkan pesan error
            handModel.addEventListener('error', function() {
                console.error("❌ Gagal memuat model 3D.");
            });
        } else {
            console.warn("❌ Elemen model tangan tidak ditemukan.");
        }
    }

    // Fungsi untuk memproses frame video
    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    // Setup kamera dan mulai memproses video
    await setupCamera();
    videoElement.play();
    processVideoFrame();
});

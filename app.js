document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script dimulai...");

    const videoElement = document.getElementById("video");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");

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

    // Inisialisasi scene 3D menggunakan Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvasElement.width / canvasElement.height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasElement });
    renderer.setSize(canvasElement.width, canvasElement.height);

    // Tambahkan cahaya
    const light = new THREE.AmbientLight(0x404040); // Cahaya lembut
    scene.add(light);

    // Buat model 3D (misalnya bola kecil)
    const geometry = new THREE.SphereGeometry(0.05, 32, 32); // Bola kecil
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Warna merah
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 2;

    function onResults(results) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            console.warn("❌ Tidak ada tangan terdeteksi.");
            return;
        }

        const hand = results.multiHandLandmarks[0];
        const palm = hand[9]; // Titik tengah telapak tangan
        console.log("📍 Telapak tangan di:", palm.x, palm.y);

        // Gambar lingkaran di atas telapak tangan
        canvasCtx.fillStyle = "red";
        canvasCtx.beginPath();
        canvasCtx.arc(palm.x * canvasElement.width, palm.y * canvasElement.height, 10, 0, 2 * Math.PI);
        canvasCtx.fill();

        // Update posisi model 3D berdasarkan koordinat telapak tangan
        sphere.position.x = (palm.x - 0.5) * 2; // Konversi ke rentang (-1, 1)
        sphere.position.y = -(palm.y - 0.5) * 2; // Konversi ke rentang (-1, 1)
    }

    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        renderer.render(scene, camera);
        requestAnimationFrame(processVideoFrame);
    }

    await setupCamera();
    videoElement.play();
    processVideoFrame();
});

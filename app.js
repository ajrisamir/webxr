document.addEventListener("DOMContentLoaded", async () => {
    const videoElement = document.getElementById("video");

    // ✅ Inisialisasi kamera belakang
    async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            videoElement.srcObject = stream;
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => resolve();
            });
        } catch (error) {
            console.error("Gagal mengakses kamera:", error);
        }
    }

    // ✅ Inisialisasi MediaPipe Hands
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,         // Hanya deteksi satu tangan
        modelComplexity: 1,      // Gunakan model sederhana untuk kecepatan
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });
    camera.start();

    // ✅ Setup Three.js
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera3D.position.z = 2;

    // ✅ Buat objek 3D (kubus merah)
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // ✅ Fungsi deteksi tangan dan update posisi objek 3D
    function onResults(results) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            console.warn("❌ Tidak ada tangan terdeteksi.");
            return;
        }

        const hand = results.multiHandLandmarks[0];
        const palm = hand[9]; // Titik tengah telapak tangan

        console.log("📍 Telapak tangan di:", palm.x, palm.y);

        // Konversi posisi ke koordinat Three.js
        cube.position.x = (palm.x - 0.5) * 2;  // Skala agar sesuai layar
        cube.position.y = -(palm.y - 0.5) * 2; // Inversi karena koordinat berbeda

        renderer.render(scene, camera3D);
    }

    // ✅ Jalankan kamera
    await setupCamera();
});

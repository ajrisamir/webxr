document.addEventListener("DOMContentLoaded", async () => {
    const videoElement = document.getElementById("video");

    if (!videoElement) {
        console.error("Elemen video tidak ditemukan!");
        return;
    }

    // Setup kamera
    async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }, // Gunakan kamera belakang
            });
            videoElement.srcObject = stream;
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => resolve();
            });
        } catch (error) {
            console.error("Gagal mengakses kamera:", error);
        }
    }

    // Load Pose Detector
    async function loadPoseModel() {
        try {
            const model = poseDetection.SupportedModels.BlazePose;
            const detectorConfig = { runtime: "tfjs" };
            return await poseDetection.createDetector(model, detectorConfig);
        } catch (error) {
            console.error("Gagal memuat Pose Detector:", error);
        }
    }

    // Setup Three.js Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Model 3D (Kubus Sederhana)
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 1;

    console.log("📢 Inisialisasi selesai. Menunggu deteksi pose...");

    // Fungsi deteksi pose
    async function detectPose(detector) {
        if (!videoElement.videoWidth) {
            requestAnimationFrame(() => detectPose(detector));
            return;
        }

        const poses = await detector.estimatePoses(videoElement, {
            flipHorizontal: false, // Kamera belakang tidak perlu mirror
        });

        if (poses.length > 0 && poses[0].keypoints) {
            const keypoints = poses[0].keypoints;

            console.log("🔹 Keypoints:", keypoints);

            // Mendapatkan koordinat tangan kanan (wrist)
            const wristRight = keypoints.find(kp => kp.name === "right_wrist");

            if (wristRight) {
                console.log("📍 Tangan kanan terdeteksi di:", wristRight.x, wristRight.y);

                // Mengubah koordinat agar sesuai dengan Three.js
                const scale = 2.5;
                cube.position.x = (wristRight.x / videoElement.videoWidth - 0.5) * scale;
                cube.position.y = -(wristRight.y / videoElement.videoHeight - 0.5) * scale;
            }
        } else {
            console.warn("⚠️ Tidak ada pose terdeteksi.");
        }

        renderer.render(scene, camera);
        requestAnimationFrame(() => detectPose(detector));
    }

    // Inisialisasi
    async function main() {
        await setupCamera();
        const detector = await loadPoseModel();
        if (!detector) {
            console.error("Detektor pose tidak dapat dibuat. Periksa konfigurasi model.");
            return;
        }
        detectPose(detector);
    }

    main();
});

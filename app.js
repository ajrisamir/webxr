const videoElement = document.getElementById('video');
const startARButton = document.getElementById('startARButton');

// Fungsi untuk mendapatkan akses ke kamera
async function setupCamera() {
  const video = videoElement;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  });
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
  video.play();
  return video;
}

// Fungsi untuk mendeteksi pose
async function detectPose(video) {
  // Memilih model pose yang tepat (MediaPipePose)
  const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MediaPipePose, {
    runtime: 'tfjs', // Pastikan menggunakan TensorFlow.js
    modelType: 'lite' // Bisa juga 'full' untuk model yang lebih besar
  });

  const poses = await detector.estimatePoses(video);

  // Untuk testing, kita log koordinat titik pose pertama
  if (poses.length > 0) {
    const keypoints = poses[0].keypoints;
    console.log(keypoints);
  }

  // Panggil lagi untuk mendeteksi pose secara berkelanjutan
  requestAnimationFrame(() => detectPose(video));
}


// Fungsi utama untuk setup
async function main() {
  const video = await setupCamera();
  detectPose(video);
}

main();

// Fungsi untuk memulai sesi AR
async function startARSession() {
  if ('xr' in navigator) {
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test']
    });

    // Pengaturan untuk sesi AR
    const referenceSpace = await session.requestReferenceSpace('local');
    const viewerPose = await session.getViewerPose(referenceSpace);

    // Sesi AR aktif
    session.addEventListener('end', () => console.log('AR session ended'));
  } else {
    console.log('WebXR tidak didukung pada perangkat ini');
  }
}

// Panggil fungsi untuk memulai sesi AR setelah klik tombol
startARButton.addEventListener('click', startARSession);

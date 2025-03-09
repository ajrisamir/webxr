// Setup video stream
const videoElement = document.getElementById('video');

// Setup MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.3.1626/${file}`;
  }
});

// Setup TensorFlow.js
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' }
  });
  videoElement.srcObject = stream;
  await new Promise((resolve) => {
    videoElement.onloadedmetadata = () => resolve();
  });
  videoElement.play();
}

// Setup Three.js scene for rendering 3D model
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a simple cube as the 3D model for demonstration
const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 1;

async function detectPose() {
  const poseResults = await pose.send({ image: videoElement });
  if (poseResults && poseResults.poseLandmarks) {
    const landmarks = poseResults.poseLandmarks;
    
    // Get coordinates of the wrist (index 15 and 16)
    const wristLeft = landmarks[15];
    const wristRight = landmarks[16];

    // Translate coordinates to scene for rendering
    // Scaling and translating coordinates to match 3D space
    const scale = 1.5; // Adjust this factor to position the model
    cube.position.x = (wristRight.x - 0.5) * scale;
    cube.position.y = -(wristRight.y - 0.5) * scale; // Flip Y axis
  }

  // Render the scene
  renderer.render(scene, camera);
  requestAnimationFrame(detectPose); // Continuously call detectPose
}

async function main() {
  await setupCamera();
  pose.onResults(detectPose);
}

main();

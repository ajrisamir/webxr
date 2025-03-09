<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pose Tracking with Model on Hand</title>

  <!-- Import TensorFlow.js & Pose Detection -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection"></script>

  <!-- Import Three.js for 3D rendering -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

  <style>
    body { margin: 0; overflow: hidden; }
    video { 
      position: absolute;
      top: 0; left: 0;
      width: 100vw;
      height: 100vh;
      object-fit: cover;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <video id="video" autoplay playsinline></video>
  <script src="app.js"></script>
</body>
</html>

document.addEventListener("DOMContentLoaded", async () => {
    const videoElement = document.getElementById("video");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");

    async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            videoElement.srcObject = stream;
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                    resolve();
                };
            });
        } catch (error) {
            console.error("❌ Gagal mengakses kamera:", error);
        }
    }

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
            return;
        }

        const hand = results.multiHandLandmarks[0];
        const palm = hand[9]; // Titik tengah telapak tangan

        // Gambar lingkaran merah untuk menandai posisi telapak tangan
        canvasCtx.fillStyle = "red";
        canvasCtx.beginPath();
        canvasCtx.arc(palm.x * canvasElement.width, palm.y * canvasElement.height, 10, 0, 2 * Math.PI);
        canvasCtx.fill();

        // Render model 3D di atas telapak tangan
        draw3DModel(palm.x * canvasElement.width, palm.y * canvasElement.height);
    }

    async function processVideoFrame() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processVideoFrame);
    }

    await setupCamera();
    videoElement.play();
    processVideoFrame();

    // Fungsi untuk menggambar model 3D sederhana (seperti kubus)
    function draw3DModel(x, y) {
        const gl = canvasElement.getContext("webgl");

        if (!gl) {
            console.error("❌ WebGL tidak tersedia.");
            return;
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const vertexShaderSource = `
            attribute vec3 aPosition;
            void main() {
                gl_Position = vec4(aPosition, 1.0);
            }
        `;
        const fragmentShaderSource = `
            void main() {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Warna merah
            }
        `;

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(shaderProgram);

        const vertices = new Float32Array([
            -0.1, -0.1, -0.1, // Vertex 1
             0.1, -0.1, -0.1, // Vertex 2
             0.1,  0.1, -0.1, // Vertex 3
            -0.1,  0.1, -0.1, // Vertex 4
            -0.1, -0.1,  0.1, // Vertex 5
             0.1, -0.1,  0.1, // Vertex 6
             0.1,  0.1,  0.1, // Vertex 7
            -0.1,  0.1,  0.1  // Vertex 8
        ]);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(shaderProgram, "aPosition");
        gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttribLocation);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 8);
    }

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("❌ Shader gagal dikompilasi:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createShaderProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("❌ Program shader gagal dipasang:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }
});

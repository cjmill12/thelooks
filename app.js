document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const videoFeed = document.getElementById('video-feed');
    const aiResultImg = document.getElementById('ai-result');
    const canvas = document.getElementById('hidden-canvas');
    
    // Buttons and Controls
    const takeSelfieBtn = document.getElementById('take-selfie-btn');
    const tryOnBtn = document.getElementById('try-on-btn');
    const styleOptions = document.querySelectorAll('.style-option'); 
    const spinner = document.getElementById('loading-spinner');
    
    const statusMessage = document.getElementById('status-message');
    
    let capturedImageBase64 = null; 
    let selectedPrompt = null; 
    let cameraStarted = false; 

    // --- CONSTANTS ---
    const NEGATIVE_PROMPT = "extra fingers, blurry, low resolution, bad hands, deformed face, mask artifact, bad blending, unnatural hair hair color, ugly, tiling, duplicate, abstract, cartoon, distorted pupils, bad lighting, cropped, grainy, noise, poor quality, bad anatomy.";
    
    
    // --- Camera Initialization Function (Includes Mobile Fix) ---
    function startCamera() {
        if (cameraStarted) return;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            statusMessage.textContent = "Attempting to access camera...";
            takeSelfieBtn.disabled = true;

            // Mobile Compatibility: Ensure playsinline is set
            videoFeed.setAttribute('playsinline', ''); 

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    videoFeed.srcObject = stream;
                    
                    videoFeed.style.display = 'block'; 
                    aiResultImg.style.display = 'none'; 
                    
                    // CRITICAL MOBILE FIX: Attempt to play and handle the result asynchronously
                    return videoFeed.play(); 
                })
                .then(() => {
                    // Success block
                    cameraStarted = true;
                    takeSelfieBtn.textContent = "📸 Take Selfie"; 
                    takeSelfieBtn.disabled = false;
                    statusMessage.textContent = "Camera ready. Click 'Take Selfie'!";
                })
                .catch(err => {
                    console.error("Camera access error (getUserMedia or play failed):", err);
                    takeSelfieBtn.disabled = false; 
                    takeSelfieBtn.textContent = "Error: Camera Access Failed";
                    statusMessage.textContent = "Error: Cannot access camera. Check browser permissions.";
                });
        }
    }
    
    // 🚨 INITIAL STATE SETUP
    takeSelfieBtn.textContent = "▶️ Start Camera"; 
    statusMessage.textContent = "Click 'Start Camera' to begin the virtual try-on.";
    tryOnBtn.style.display = 'none'; 
    videoFeed.style.display = 'none'; 
    tryOnBtn.disabled = true; // Ensure it starts disabled

    // --- Capture Selfie/Camera Activation ---
    takeSelfieBtn.addEventListener('click', () => {
        // First Click: Start Camera
        if (!cameraStarted) {
            startCamera(); 
            return; 
        }
        
        // Second Click: Take Photo
        if (videoFeed.readyState !== 4) { 
            statusMessage.textContent = "Camera feed not ready yet. Please wait a moment.";
            return; 
        }
        
        // 1. Capture Logic
        canvas.width = videoFeed.videoWidth;
        canvas.height = videoFeed.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        capturedImageBase64 = dataUrl.split(',')[1]; 
        
        // 2. State Transition (Camera -> Captured Image)
        takeSelfieBtn.style.display = 'none'; 
        tryOnBtn.style.display = 'block'; 
        videoFeed.style.display = 'none'; 
        
        // 3. Display captured image
        aiResultImg.src = dataUrl;
        aiResultImg.style.display = 'block'; 

        // 🚨 REVISED ENABLE LOGIC: Check if a style is already selected
        if (selectedPrompt) {
            tryOnBtn.disabled = false; 
            statusMessage.textContent = "Selfie captured! Click 'Try On Selected Hairstyle' above.";
        } else {
            tryOnBtn.disabled = true; 
            statusMessage.textContent = "Selfie captured! Now, select a hairstyle below.";
        }
    });

    // --- Style Selection Logic (REVISED) ---
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Highlight selected style
            styleOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            selectedPrompt = option.getAttribute('data-prompt');
            
            // 🚨 REVISED LOGIC: If a selfie exists, enable the button for manual click.
            if (capturedImageBase64) {
                tryOnBtn.disabled = false;
                // Make sure the button is visible, just in case (e.g., if the user clicks a style immediately after the AI process finishes)
                takeSelfieBtn.style.display = 'none';
                tryOnBtn.style.display = 'block';
                statusMessage.textContent = `Style selected: ${option.getAttribute('data-name')}. Click 'Try On Selected Hairstyle' above!`;
            } else {
                tryOnBtn.disabled = true;
                statusMessage.textContent = `Style selected. Click 'Start Camera' to take your selfie!`;
            }
        });
    });


    // --- Call Netlify Function for AI Processing (The button's action) ---
    tryOnBtn.addEventListener('click', async () => {
        if (!capturedImageBase64 || !selectedPrompt) {
            statusMessage.textContent = "Error: Please take a selfie AND select a style!";
            return;
        }

        statusMessage.textContent = `Applying your selected style... This may take a moment.`;
        tryOnBtn.disabled = true;
        spinner.style.display = 'inline-block'; 
        
        try {
            const response = await fetch('/.netlify/functions/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseImage: capturedImageBase64,
                    prompt: `Edit the hair in this image using the following instruction: ${selectedPrompt}. Ensure the final result is photorealistic, seamlessly blended, and maintains the subject's face and original lighting.`,
                    negativePrompt: NEGATIVE_PROMPT 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Result is loaded directly into the central viewport
            aiResultImg.src = `data:image/jpeg;base64,${data.generatedImageBase64}`;
            aiResultImg.style.display = 'block';
            statusMessage.textContent = `Done! Your new look is ready.`;

        } catch (error) {
            console.error('AI Processing Error:', error);
            statusMessage.textContent = `Error during AI try-on: ${error.message}. Please check your console/Netlify logs.`;
        } finally {
            tryOnBtn.disabled = true; // Ensure it's disabled while waiting for the next action
            spinner.style.display = 'none'; 
            
            // State Transition (Result -> Ready to Take New Selfie)
            takeSelfieBtn.style.display = 'block';
            takeSelfieBtn.textContent = "📸 Take New Selfie"; 
            cameraStarted = false; 
            tryOnBtn.style.display = 'none';
        }
    });
});

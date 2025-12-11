document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const videoFeed = document.getElementById('video-feed');
    const aiResultImg = document.getElementById('ai-result');
    const canvas = document.getElementById('hidden-canvas');
    const centralViewport = document.getElementById('central-viewport');
    
    // Buttons and Controls
    // MODIFIED: Renamed takeSelfieBtn to startCameraBtn and added a new captureSelfieBtn
    const startCameraBtn = document.getElementById('start-camera-btn');
    const captureSelfieBtn = document.getElementById('capture-selfie-btn'); 
    const tryOnBtn = document.getElementById('try-on-btn');
    const spinner = document.getElementById('loading-spinner');
    
    const statusMessage = document.getElementById('status-message');
    
    // Filter elements (using IDs for sections)
    const genderSelector = document.getElementById('gender-selector');
    const complexionSelector = document.getElementById('complexion-selector');
    const complexionGroup = document.getElementById('complexion-options-group');
    const galleryContainer = document.getElementById('hairstyle-gallery'); 
    
    // State tracking variables
    let capturedImageBase64 = null; 
    let selectedPrompt = null; 
    let cameraStarted = false; 
    let selectedGender = null;
    let selectedComplexion = null;

    // --- CONSTANTS ---
    const NEGATIVE_PROMPT = "extra fingers, blurry, low resolution, bad hands, deformed face, mask artifact, bad blending, unnatural hair hair color, ugly, tiling, duplicate, abstract, cartoon, distorted pupils, bad lighting, cropped, grainy, noise, poor quality, bad anatomy.";
    
    // --- Complexion Data and Prompt Database (Using Hyphenated Paths) ---
    const complexionData = [
        { id: 'fair', name: 'Fair', color: '#F0E6D2' },
        { id: 'medium', name: 'Medium', color: '#E0C79A' },
        { id: 'olive', name: 'Olive', color: '#C0A88D' },
        { id: 'brown', name: 'Brown', color: '#966F53' },
        { id: 'dark_brown', name: 'Dark Brown', color: '#6A4A3C' },
        { id: 'deep', name: 'Deep', color: '#442C2E' },
    ];
    
    const promptDatabase = {
        male: {
            fair: [
                { name: 'Fringe', prompt: 'Photorealistic inpainting, perfect masking, medium forward fringe, light golden brown, 4K resolution.', img: '/styles/forward-fringe.jpeg' },
                { name: 'Spiked Charm', prompt: 'Flawless composite, high-detail spiked texture, short cut with sharp fade, light brown color.', img: '/styles/spiked-charm.jpeg' },
            ],
            medium: [
                { name: 'Wavy Quiff', prompt: 'Flawless composite, high volume wavy quiff, medium brown hair color, cinematic portrait lighting.', img: '/styles/wavy-quiff.jpeg' },
                { name: 'Sleek Side Part', prompt: 'Seamless photo-merge, ultra-clean classic side-part, medium brown color, sharp definition.', img: '/styles/sleek-side-part.jpeg' },
            ],
            olive: [
                { name: 'Tousled Top', prompt: 'Perfectly masked, highly textured and tousled top with short sides, dark brown color, high resolution.', img: '/styles/tousled-top.jpeg' },
                { name: 'Natural Curls', prompt: 'Soft texture natural curls, dark espresso brown color, ultra HD quality.', img: '/styles/natural-curls.jpeg' },
            ],
            brown: [
                { name: 'High Top Fade', prompt: 'Ultra-realistic, sharp high-top fade, dark black color, high contrast lighting.', img: '/styles/high-top-fade.jpeg' },
                { name: 'Textured Scissor', prompt: 'Perfect composite, defined short texture on the fringe, high-contrast fade, dark black color.', img: '/styles/side-swept-scissor-cut.jpeg' },
            ],
            dark_brown: [
                { name: 'High Top Fade', prompt: 'Ultra-realistic, sharp high-top fade, dark black color, high contrast lighting.', img: '/styles/high-top-fade.jpeg' },
                { name: 'Natural Curls', prompt: 'Soft texture natural curls, dark espresso brown color, ultra HD quality.', img: '/styles/natural-curls.jpeg' },
            ],
            deep: [
                { name: 'High Top Fade', prompt: 'Ultra-realistic, sharp high-top fade, dark black color, high contrast lighting.', img: '/styles/high-top-fade.jpeg' },
                { name: 'Textured Scissor', prompt: 'Perfect composite, defined short texture on the fringe, high-contrast fade, dark black color.', img: '/styles/side-swept-scissor-cut.jpeg' },
            ],
        },
        female: {
            fair: [ { name: 'Long Bob', prompt: 'Shoulder length layered bob, light blonde highlights.', img: '/styles/placeholder_bob.jpeg' }],
            deep: [ { name: 'Afro Puff', prompt: 'Voluminous afro puff hairstyle, natural black color, defined curls.', img: '/styles/placeholder_afro.jpeg' }],
        }
    };


    // --- Helper function to manage filter collapse/expand state ---
    function setFilterState(sectionElement, isExpanded) {
        sectionElement.classList.toggle('expanded', isExpanded);
        sectionElement.classList.toggle('collapsed', !isExpanded);
    }
    
    // --- Generic Toggle Handler for Collapsible Sections ---
    document.querySelectorAll('.filter-section h3').forEach(header => {
        header.addEventListener('click', (e) => {
            const section = e.currentTarget.parentElement;
            const isCurrentlyExpanded = section.classList.contains('expanded');
            
            // Collapse all filter sections first
            document.querySelectorAll('.filter-section').forEach(s => setFilterState(s, false));

            // Only expand the clicked section if it was previously collapsed
            if (!isCurrentlyExpanded) {
                 setFilterState(section, true);
            }
            e.stopPropagation(); 
        });
    });


    // --- Camera Initialization Function (Simplified for dedicated button) ---
    function startCamera() {
        if (cameraStarted) return;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            statusMessage.textContent = "Attempting to access camera...";
            startCameraBtn.disabled = true;

            videoFeed.setAttribute('playsinline', ''); 

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    videoFeed.srcObject = stream;
                    
                    centralViewport.classList.add('active'); 
                    videoFeed.style.display = 'block'; 
                    aiResultImg.style.display = 'none'; 
                    
                    return videoFeed.play(); 
                })
                .then(() => {
                    cameraStarted = true;
                    startCameraBtn.style.display = 'none'; // Hide Start button
                    captureSelfieBtn.style.display = 'block'; // Show Capture button
                    captureSelfieBtn.textContent = '📸 Take Selfie';
                    
                    startCameraBtn.disabled = false;
                    statusMessage.textContent = "Camera ready. Click 'Take Selfie' below!";
                })
                .catch(err => {
                    console.error("Camera access error (getUserMedia or play failed):", err);
                    startCameraBtn.disabled = false; 
                    statusMessage.textContent = "Error: Cannot access camera. Check browser permissions.";
                    centralViewport.classList.remove('active'); 
                });
        }
    }

    // --- INITIAL STATE SETUP ---
    // startCameraBtn.textContent = "▶️ Start Camera"; // Set in HTML
    statusMessage.textContent = "Select your Gender and Complexion to begin.";
    tryOnBtn.style.display = 'none'; 
    captureSelfieBtn.style.display = 'none';
    videoFeed.style.display = 'none'; 
    tryOnBtn.disabled = true;

    // All steps start collapsed
    setFilterState(genderSelector, false); 
    setFilterState(complexionSelector, false); 
    setFilterState(galleryContainer, false); 
    
    renderComplexionSelector(); 
    renderFinalGallery();


    // --- FILTER STEP 1: Gender Selection Logic (RETAINED) ---
    document.querySelectorAll('.gender-option').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.gender-option').forEach(btn => btn.classList.remove('selected'));
            e.currentTarget.classList.add('selected');

            selectedGender = e.currentTarget.getAttribute('data-gender');
            
            // Reset downstream selections
            selectedComplexion = null;
            selectedPrompt = null; 
            
            renderComplexionSelector(); 
            
            // Action: Collapse Step 1, Expand Step 2
            setFilterState(genderSelector, false);
            setFilterState(complexionSelector, true);
            setFilterState(galleryContainer, false); 
            
            statusMessage.textContent = "1. Gender selected. Now choose your 2. complexion.";
        });
    });


    // --- FILTER STEP 2: Complexion Selector Generation (RETAINED) ---
    function renderComplexionSelector() {
        complexionGroup.innerHTML = ''; 
        
        complexionData.forEach(c => {
            const tile = document.createElement('div');
            tile.classList.add('complexion-tile');
            tile.setAttribute('data-complexion', c.id);
            tile.style.backgroundColor = c.color;
            
            const label = document.createElement('p');
            label.textContent = c.name;
            
            tile.appendChild(label);
            complexionGroup.appendChild(tile);
            
            tile.addEventListener('click', (e) => {
                document.querySelectorAll('.complexion-tile').forEach(t => t.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                
                selectedComplexion = e.currentTarget.getAttribute('data-complexion');
                
                renderFinalGallery();

                // Collapse Step 2, Automatically Expand Inspiration (Step 3)
                setFilterState(complexionSelector, false);
                setFilterState(galleryContainer, true);

                statusMessage.textContent = "2. Complexion selected. Now choose your 3. Inspiration style below!";
            });
        });
    }


    // --- FINAL STEP 3: Render the Filtered Gallery (RETAINED) ---
    function renderFinalGallery() {
        const galleryOptionsGroup = galleryContainer.querySelector('.filter-options-group');
        galleryOptionsGroup.innerHTML = ''; 
        
        if (!selectedGender || !selectedComplexion) {
            galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 15px;">Please complete Gender and Complexion selections first.</p>';
            return;
        }
        
        const filteredStyles = promptDatabase[selectedGender] && promptDatabase[selectedGender][selectedComplexion] 
                             ? promptDatabase[selectedGender][selectedComplexion]
                             : [];
        
        if (filteredStyles.length === 0) {
            statusMessage.textContent = `No styles available for this selection yet. Please choose another option.`;
            galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 15px;">No styles found.</p>';
            return;
        }

        filteredStyles.forEach(style => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('style-option');
            optionDiv.setAttribute('data-prompt', style.prompt);
            optionDiv.setAttribute('data-name', style.name);

            const img = document.createElement('img');
            img.src = style.img; 
            img.alt = style.name;
            img.classList.add('style-thumbnail');

            const p = document.createElement('p');
            p.textContent = style.name; 

            optionDiv.appendChild(img);
            optionDiv.appendChild(p);
            galleryOptionsGroup.appendChild(optionDiv);
            
            optionDiv.addEventListener('click', handleStyleSelection);
        });

        statusMessage.textContent = "3. Select your final style and click 'Start Camera' above.";
    }

    // --- Style Selection Handler (MODIFIED FOR NEW BUTTONS) ---
    function handleStyleSelection(e) {
        document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        
        selectedPrompt = e.currentTarget.getAttribute('data-prompt');
        setFilterState(galleryContainer, false); 
        
        if (capturedImageBase64) {
            // We have a photo, allow generation
            tryOnBtn.disabled = false;
            statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Click 'Try On Selected Hairstyle' to generate.`;
        } else if (cameraStarted) {
            // Camera is running, tell them to capture
            statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Click 'Take Selfie' to capture.`;
        } else {
            // Camera is off, tell them to start
            statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Click 'Start Camera' to begin.`;
        }
    }


    // --- 1. START CAMERA BUTTON LISTENER ---
    startCameraBtn.addEventListener('click', startCamera);


    // --- 2. CAPTURE/RETAKE BUTTON LISTENER ---
    captureSelfieBtn.addEventListener('click', () => {
        // If the button says 'Retake Selfie', reset and show the camera feed
        if (captureSelfieBtn.textContent.includes('Retake')) {
            capturedImageBase64 = null;
            aiResultImg.src = ''; 
            aiResultImg.style.display = 'none';
            videoFeed.style.display = 'block';
            
            // Hide Try On button
            tryOnBtn.style.display = 'none'; 
            tryOnBtn.disabled = true; 
            
            captureSelfieBtn.textContent = '📸 Take Selfie';
            statusMessage.textContent = "Camera ready. Take a new selfie!";
            return;
        }
        
        // --- CAPTURE SELFIE LOGIC ---
        if (videoFeed.readyState !== 4) { 
            statusMessage.textContent = "Camera feed not ready yet. Please wait a moment.";
            return; 
        }
        
        // Capture image data
        canvas.width = videoFeed.videoWidth;
        canvas.height = videoFeed.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        capturedImageBase64 = dataUrl.split(',')[1]; 
        
        // State Transition (Camera -> Captured Image)
        videoFeed.style.display = 'none'; 
        aiResultImg.src = dataUrl;
        aiResultImg.style.display = 'block'; 
        
        // Update Controls/Status
        captureSelfieBtn.textContent = '🔄 Retake Selfie'; // Change to Retake icon
        tryOnBtn.style.display = 'block'; // Show Generate button

        if (selectedPrompt) {
            tryOnBtn.disabled = false; 
            statusMessage.textContent = "Selfie captured! Click 'Try On Selected Hairstyle' or 'Retake Selfie'.";
        } else {
            tryOnBtn.disabled = true; 
            statusMessage.textContent = "Selfie captured! Now, please select your Inspiration style.";
            
            // Prompt user to select style
            document.querySelectorAll('.filter-section').forEach(s => setFilterState(s, false));
            setFilterState(galleryContainer, true);
        }
    });


    // --- 3. TRY ON BUTTON LISTENER ---
    tryOnBtn.addEventListener('click', async () => {
        if (!capturedImageBase64 || !selectedPrompt) {
            statusMessage.textContent = "Error: Please take a selfie AND select a style!";
            return;
        }

        statusMessage.textContent = `Applying your selected style... This may take a moment.`;
        tryOnBtn.disabled = true;
        spinner.style.display = 'inline-block'; 
        
        try {
            // This is the Netlify Function call
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
            
            // --- SUCCESS BLOCK ---
            aiResultImg.src = `data:image/jpeg;base64,${data.generatedImageBase64}`;
            aiResultImg.style.display = 'block';
            statusMessage.textContent = `Done! Your new look is ready. Click 'Retake Selfie' to try another look.`;
            
            // Cleanup on successful completion
            tryOnBtn.disabled = true; 
            spinner.style.display = 'none'; 
            tryOnBtn.style.display = 'none'; // Hide Generate button

            // The Capture/Retake button remains visible as '🔄 Retake Selfie'
            
        } catch (error) {
            // --- ERROR BLOCK ---
            console.error('AI Processing Error:', error);
            statusMessage.textContent = `Error during AI try-on: ${error.message}. Please try again.`;
            
            // Cleanup on error: keep image visible, restore try-on button
            tryOnBtn.disabled = false; 
            spinner.style.display = 'none'; 
            tryOnBtn.style.display = 'block';
        }
    });
});

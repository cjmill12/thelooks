document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const videoFeed = document.getElementById('video-feed');
    const aiResultImg = document.getElementById('ai-result');
    const canvas = document.getElementById('hidden-canvas');
    const centralViewport = document.getElementById('central-viewport');
    
    // Buttons and Controls - Corrected IDs and placement
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
    
    // --- Complexion Data and Prompt Database (EXPANDED STYLES) ---
    const complexionData = [
        { id: 'fair', name: 'Fair', color: '#F0E6D2' },
        { id: 'medium', name: 'Medium', color: '#E0C79A' },
        { id: 'olive', name: 'Olive', color: '#C0A88D' },
        { id: 'brown', name: 'Brown', color: '#966F53' },
        { id: 'dark_brown', name: 'Dark Brown', color: '#6A4A3C' },
        { id: 'deep', name: 'Deep', color: '#442C2E' },
    ];
    
    // Expanded prompt database with more unique styles for demonstration
    const promptDatabase = {
        male: {
            fair: [
                { name: 'Fringe', prompt: 'Photorealistic inpainting, perfect masking, medium forward fringe, light golden brown, 4K resolution.', img: '/styles/forward fringe.jpeg' },
                { name: 'Spiked Charm', prompt: 'Flawless composite, high-detail spiked texture, short cut with sharp fade, light brown color.', img: '/styles/spiked charm.jpeg' },
                { name: 'Slick Back', prompt: 'Classic, highly detailed slick back with a modern taper fade, honey brown color.', img: '/styles/slickback.jpeg' },
            ],
            medium: [
                { name: 'Wavy Quiff', prompt: 'Flawless composite, high volume wavy quiff, medium brown hair color, cinematic portrait lighting.', img: '/styles/wavy quiff.jpeg' },
                { name: 'Sleek Side Part', prompt: 'Seamless photo-merge, ultra-clean classic side-part, medium brown color, sharp definition.', img: '/styles/sleek side part.jpeg' },
                { name: 'Undercut Pompadour', prompt: 'Modern pompadour with dramatic undercut, dark brown shade, studio lighting.', img: '/styles/pompadour.jpeg' },
            ],
            olive: [
                { name: 'Tousled Top', prompt: 'Perfectly masked, highly textured and tousled top with short sides, dark brown color, high resolution.', img: '/styles/tousled top.jpeg' },
                { name: 'Natural Curls', prompt: 'Soft texture natural curls, dark espresso brown color, ultra HD quality.', img: '/styles/natural curls.jpeg' },
                { name: 'Messy Textured Crop', prompt: 'High-fade textured crop with messy, forward fringe, black hair color.', img: '/styles/textured_crop.jpeg' },
            ],
            brown: [
                { name: 'High Top Fade', prompt: 'Ultra-realistic, sharp high-top fade, dark black color, high contrast lighting.', img: '/styles/high top fade.jpeg' },
                { name: 'Textured Scissor', prompt: 'Perfect composite, defined short texture on the fringe, high-contrast fade, dark black color.', img: '/styles/side swept scissor cut.jpeg' },
                { name: 'Wavy Quiff', prompt: 'Flawless composite, high volume wavy quiff, medium brown hair color, cinematic portrait lighting.', img: '/styles/wavy quiff.jpeg' },
            ],
            dark_brown: [
                { name: 'Box Braid Fade', prompt: 'Intricate box braids with clean fade, deep black color, hyperrealistic detail.', img: '/styles/box_braid_fade.jpeg' },
                { name: 'Afro Fade', prompt: 'Classic rounded afro fade with perfect edge up, natural black texture.', img: '/styles/afro_fade.jpeg' },
                { name: 'Natural Curls', prompt: 'Soft texture natural curls, dark espresso brown color, ultra HD quality.', img: '/styles/natural curls.jpeg' },
            ],
            deep: [
                { name: 'High Top Fade', prompt: 'Ultra-realistic, sharp high-top fade, dark black color, high contrast lighting.', img: '/styles/high top fade.jpeg' },
                { name: 'Textured Scissor', prompt: 'Perfect composite, defined short texture on the fringe, high-contrast fade, dark black color.', img: '/styles/side swept scissor cut.jpeg' },
                { name: 'Box Braid Fade', prompt: 'Intricate box braids with clean fade, deep black color, hyperrealistic detail.', img: '/styles/box_braid_fade.jpeg' },
            ],
        },
        female: {
            fair: [ 
                { name: 'Long Bob', prompt: 'Shoulder length layered bob, light blonde highlights.', img: '/styles/placeholder_bob.jpeg' },
                { name: 'Mermaid Waves', prompt: 'Long, flowing, slightly messy beach wave texture, platinum blonde color, soft portrait lighting.', img: '/styles/mermaid_waves.jpeg' },
                { name: 'French Braid', prompt: 'Detailed crown French braid style, ginger red color.', img: '/styles/french_braid.jpeg' },
            ],
            medium: [
                { name: 'Ponytail', prompt: 'High, sleek ponytail with side-swept bangs, dark ash brown color.', img: '/styles/ponytail.jpeg' },
                { name: 'Soft Curls', prompt: 'Long hair with soft, defined ringlet curls, light brown balayage.', img: '/styles/soft_curls.jpeg' },
                { name: 'Long Layers', prompt: 'Very long hair with face-framing layers, medium brown color.', img: '/styles/long_layers.jpeg' },
            ],
            olive: [
                { name: 'Sleek Straight', prompt: 'Very long, poker straight hair with center part, rich mahogany color.', img: '/styles/sleek_straight.jpeg' },
                { name: 'Wavy Shag', prompt: 'Medium length wavy shag haircut, deep espresso color.', img: '/styles/wavy_shag.jpeg' },
                { name: 'Long Bob', prompt: 'Shoulder length layered bob, light blonde highlights.', img: '/styles/placeholder_bob.jpeg' },
            ],
            brown: [
                { name: 'Curly Shag', prompt: 'Mid-length, voluminous curly shag, deep chestnut brown color.', img: '/styles/curly_shag.jpeg' },
                { name: 'Half-Up Bun', prompt: 'Half-up top knot bun with loose waves below, dark brown color.', img: '/styles/half_up_bun.jpeg' },
            ],
            dark_brown: [
                 { name: 'Space Buns', prompt: 'Two tight space buns on the crown, with face-framing curls, natural black color.', img: '/styles/space_buns.jpeg' },
                 { name: 'Twist Out', prompt: 'Defined twist-out style, deep black color, soft lighting.', img: '/styles/twist_out.jpeg' },
                 { name: 'Curly Shag', prompt: 'Mid-length, voluminous curly shag, deep chestnut brown color.', img: '/styles/curly_shag.jpeg' },
            ],
            deep: [ 
                { name: 'Afro Puff', prompt: 'Voluminous afro puff hairstyle, natural black color, defined curls.', img: '/styles/placeholder_afro.jpeg' },
                { name: 'Twist Out', prompt: 'Defined twist-out style, deep black color, soft lighting.', img: '/styles/twist_out.jpeg' },
                { name: 'Cornrows', prompt: 'Tight cornrows going straight back into a bun, natural black hair.', img: '/styles/cornrows.jpeg' },
            ],
        }
    };

    // --- New Helper: Collects all unique styles from the entire database ---
    function getAllStyles() {
        const allStyles = [];
        const seenNames = new Set();
        
        for (const genderKey in promptDatabase) {
            for (const complexionKey in promptDatabase[genderKey]) {
                promptDatabase[genderKey][complexionKey].forEach(style => {
                    // Use style name to ensure uniqueness across the whole database
                    if (!seenNames.has(style.name)) {
                        allStyles.push(style);
                        seenNames.add(style.name);
                    }
                });
            }
        }
        return allStyles;
    }
    
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


    // --- Camera Initialization Function ---
    function startCamera() {
        if (cameraStarted) return;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            statusMessage.textContent = "Attempting to access camera...";
            startCameraBtn.disabled = true;

            videoFeed.setAttribute('playsinline', ''); 

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    videoFeed.srcObject = stream;
                    
                    // The viewport is always visible, but now the video starts playing
                    videoFeed.style.display = 'block'; 
                    aiResultImg.style.display = 'none'; 
                    
                    return videoFeed.play(); 
                })
                .then(() => {
                    cameraStarted = true;
                    startCameraBtn.style.display = 'none'; // Hide Start button
                    captureSelfieBtn.style.display = 'block'; // Show Capture button
                    captureSelfieBtn.textContent = '📸 Take Selfie'; // Set initial text
                    
                    startCameraBtn.disabled = false;
                    statusMessage.textContent = "Camera ready. Click 'Take Selfie' below!";
                })
                .catch(err => {
                    console.error("Camera access error (getUserMedia or play failed):", err);
                    startCameraBtn.disabled = false; 
                    statusMessage.textContent = "Error: Cannot access camera. Check browser permissions.";
                });
        }
    }

    // --- INITIAL STATE SETUP ---
    statusMessage.textContent = "1. Select Gender, 2. Complexion, then click Start Camera.";
    tryOnBtn.style.display = 'none'; 
    captureSelfieBtn.style.display = 'none'; 
    videoFeed.style.display = 'none'; 
    tryOnBtn.disabled = true;
    startCameraBtn.style.display = 'block'; // Ensure Start Camera button is visible initially

    // All steps start collapsed
    setFilterState(genderSelector, true); // Start with gender open
    setFilterState(complexionSelector, false); 
    setFilterState(galleryContainer, true); // Keep gallery open initially
    
    // Render Step 2 and Step 3 content immediately on load
    renderComplexionSelector(); 
    renderFinalGallery(); // NEW: Render all styles initially


    // --- FILTER STEP 1: Gender Selection Logic ---
    document.querySelectorAll('.gender-option').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.gender-option').forEach(btn => btn.classList.remove('selected'));
            e.currentTarget.classList.add('selected');

            selectedGender = e.currentTarget.getAttribute('data-gender');
            
            // Reset downstream selection
            selectedComplexion = null;
            
            // Re-render Step 2 tiles (Complexion) to clear selection
            renderComplexionSelector(); 
            
            // Re-render Step 3 (Gallery) to filter based on Gender (but still show all for gender)
            renderFinalGallery();
            
            // Action: Collapse Step 1, Expand Step 2
            setFilterState(genderSelector, false);
            setFilterState(complexionSelector, true);
            
            statusMessage.textContent = "2. Now choose your complexion, then select a style below.";
        });
    });


    // --- FILTER STEP 2: Complexion Selector Generation ---
    function renderComplexionSelector() {
        complexionGroup.innerHTML = ''; // Clear previous tiles
        
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
                
                // RENDER STEP 3 (Gallery) based on new selection (Gender + Complexion)
                renderFinalGallery();

                // Collapse Step 2, Ensure Inspiration (Step 3) is visible
                setFilterState(complexionSelector, false);
                setFilterState(galleryContainer, true);

                statusMessage.textContent = "3. Select your style and click 'Start Camera' above!";
            });
        });
        
    }


    // --- FINAL STEP 3: Render the Filtered Gallery ---
    function renderFinalGallery() {
        const galleryOptionsGroup = galleryContainer.querySelector('.filter-options-group');
        galleryOptionsGroup.innerHTML = ''; // Clear previous gallery styles
        
        let stylesToRender = [];
        
        if (selectedGender && selectedComplexion) {
            // Case 1: Both selected (Narrowest filter: Gender AND Complexion)
            stylesToRender = promptDatabase[selectedGender] && promptDatabase[selectedGender][selectedComplexion] 
                             ? promptDatabase[selectedGender][selectedComplexion]
                             : [];
        } else if (selectedGender) {
            // Case 2: Only Gender selected (Show all styles regardless of complexion for that gender)
            let stylesForGender = [];
            for (const complexionKey in promptDatabase[selectedGender]) {
                stylesForGender = stylesForGender.concat(promptDatabase[selectedGender][complexionKey]);
            }
            // Ensure unique names across the gender
            const seenNames = new Set();
            stylesToRender = stylesForGender.filter(style => {
                if (!seenNames.has(style.name)) {
                    seenNames.add(style.name);
                    return true;
                }
                return false;
            });
        } else {
            // Case 3: Neither selected (Show all unique styles from the entire database)
            stylesToRender = getAllStyles();
        }
        
        if (stylesToRender.length === 0) {
            galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 15px;">No styles found for this selection.</p>';
            return;
        }

        stylesToRender.forEach(style => {
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

    // --- Style Selection Handler ---
    function handleStyleSelection(e) {
        document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        
        selectedPrompt = e.currentTarget.getAttribute('data-prompt');
        
        // Action: Collapse Step 3
        setFilterState(galleryContainer, false); 
        
        // Always show the Start Camera button if it was hidden
        if (!cameraStarted) {
             startCameraBtn.style.display = 'block';
             startCameraBtn.disabled = false;
        }


        if (capturedImageBase64) {
            // We have a photo, allow generation
            tryOnBtn.disabled = false;
            captureSelfieBtn.style.display = 'block'; 
            tryOnBtn.style.display = 'block';
            statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Click 'Try On Selected Hairstyle' above!`;
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
        
        // 1. Capture Logic
        canvas.width = videoFeed.videoWidth;
        canvas.height = videoFeed.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        capturedImageBase64 = dataUrl.split(',')[1]; 
        
        // 2. State Transition (Camera -> Captured Image)
        videoFeed.style.display = 'none'; 
        aiResultImg.src = dataUrl;
        aiResultImg.style.display = 'block'; 
        
        // 3. Update Controls/Status
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

        const selectedStyleName = document.querySelector('.style-option.selected').getAttribute('data-name');
        statusMessage.textContent = `Applying your selected style: ${selectedStyleName}... This may take a moment.`;
        tryOnBtn.disabled = true;
        spinner.style.display = 'inline-block'; 
        
        try {
            const response = await fetch('/.netlify/functions/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Edit the hair in this image using the following instruction: ${selectedPrompt}. Ensure the final result is photorealistic, seamlessly blended, and maintains the subject's face and original lighting.`,
                    negativePrompt: NEGATIVE_PROMPT,
                    baseImage: capturedImageBase64 
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
            
            // Cleanup on successful completion
            tryOnBtn.disabled = true; 
            spinner.style.display = 'none'; 
            tryOnBtn.style.display = 'none';

            // The Capture/Retake button remains visible as '🔄 Retake Selfie'
            captureSelfieBtn.style.display = 'block'; 
            statusMessage.textContent = `Done! Your new look is ready. Click 'Retake Selfie' to try another look.`;
            
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

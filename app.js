document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const videoFeed = document.getElementById('video-feed');
    const aiResultImg = document.getElementById('ai-result');
    const canvas = document.getElementById('hidden-canvas');
    const centralViewport = document.getElementById('central-viewport');
    const statusMessage = document.getElementById('status-message');
    
    // Controls
    const takeSelfieBtn = document.getElementById('take-selfie-btn');
    
    // Filter elements (Pills in viewport)
    const genderPill = document.getElementById('gender-button-mobile');
    const complexionPill = document.getElementById('complexion-button-mobile');

    // Filter Content Wrappers (Bottom of screen)
    const filterWrapper = document.getElementById('filter-selection-wrapper');
    const genderContent = document.getElementById('gender-selector');
    const complexionContent = document.getElementById('complexion-selector');
    const complexionGroup = document.getElementById('complexion-options-group');
    
    // Inspiration Toggle and Gallery
    const inspirationToggle = document.getElementById('inspiration-toggle');
    const galleryContainer = document.getElementById('hairstyle-gallery'); 

    // State tracking variables
    let capturedImageBase64 = null; 
    let selectedPrompt = null; 
    let cameraStarted = false; 
    let selectedGender = null;
    let selectedComplexion = null;
    let activeFilterContent = null; // Tracks which content div is currently open

    // --- CONSTANTS ---
    // Placeholder image paths
    const SIMULATED_AI_RESULT_PATH = '/styles/simulated_ai_result.jpeg';
    
    // --- Complexion Data and Prompt Database (Simplified for brevity) ---
    const complexionData = [
        { id: 'fair', name: 'Fair', color: '#F0E6D2' },
        { id: 'medium', name: 'Medium', color: '#E0C79A' },
        { id: 'olive', name: 'Olive', color: '#C0A88D' },
        { id: 'brown', name: 'Brown', color: '#966F53' },
        { id: 'dark_brown', name: 'Dark Brown', color: '#6A4A3C' },
        { id: 'deep', name: 'Deep', color: '#442C2E' },
    ];
    
    // NOTE: Replace '/styles/...' with actual image paths in your project
    const promptDatabase = {
        male: {
            fair: [
                { name: 'Fringe', prompt: 'medium forward fringe, light golden brown', img: '/styles/forward fringe.jpeg' },
                { name: 'Spiked', prompt: 'spiked texture, short cut, light brown', img: '/styles/spiked charm.jpeg' },
            ],
            medium: [
                { name: 'Wavy Quiff', prompt: 'high volume wavy quiff, medium brown', img: '/styles/wavy quiff.jpeg' },
                { name: 'Side Part', prompt: 'classic side-part, medium brown', img: '/styles/sleek side part.jpeg' },
            ],
            deep: [
                { name: 'High Fade', prompt: 'sharp high-top fade, dark black color', img: '/styles/high top fade.jpeg' },
                { name: 'Natural Curls', prompt: 'soft texture natural curls, dark espresso', img: '/styles/natural curls.jpeg' },
            ],
        },
        female: {
            fair: [ { name: 'Long Bob', prompt: 'Shoulder length layered bob, light blonde highlights.', img: '/styles/placeholder_bob.jpeg' }],
            deep: [ { name: 'Afro Puff', prompt: 'Voluminous afro puff hairstyle, natural black color, defined curls.', img: '/styles/placeholder_afro.jpeg' }],
        }
    };


    // --- Helper function to manage filter content visibility ---
    function toggleFilterContent(contentElement) {
        // If the same content is clicked, close it.
        if (activeFilterContent === contentElement) {
            filterWrapper.style.display = 'none';
            contentElement.classList.add('hidden');
            activeFilterContent = null;
        } else {
            // Hide all others, show the new one.
            document.querySelectorAll('.selector-content').forEach(c => c.classList.add('hidden'));

            filterWrapper.style.display = 'block';
            contentElement.classList.remove('hidden');
            activeFilterContent = contentElement;
        }
        
        // Ensure Inspiration gallery is collapsed when Gender/Complexion opens
        inspirationToggle.classList.add('collapsed');
        inspirationToggle.classList.remove('expanded');
        galleryContainer.style.display = 'none';
    }
    
    // --- Helper function to manage filter pill active state ---
    function updatePillState() {
        if (selectedGender) {
            genderPill.classList.add('selected');
            genderPill.textContent = selectedGender === 'male' ? 'M' : 'F';
        } else {
            genderPill.classList.remove('selected');
            genderPill.textContent = 'M/F';
        }

        if (selectedComplexion) {
            complexionPill.classList.add('selected');
        } else {
            complexionPill.classList.remove('selected');
        }
    }

    // --- Camera Initialization Function ---
    function startCamera() {
        if (cameraStarted) return;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            statusMessage.textContent = "Attempting to access camera...";
            takeSelfieBtn.disabled = true;

            navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }) // Use front camera
                .then(stream => {
                    videoFeed.srcObject = stream;
                    centralViewport.classList.add('active'); 
                    videoFeed.style.display = 'block'; 
                    aiResultImg.style.display = 'none'; 
                    return videoFeed.play(); 
                })
                .then(() => {
                    cameraStarted = true;
                    takeSelfieBtn.textContent = "📸"; 
                    takeSelfieBtn.disabled = false;
                    statusMessage.textContent = "Camera ready. Select your style and capture!";
                })
                .catch(err => {
                    console.error("Camera access error:", err);
                    takeSelfieBtn.disabled = false; 
                    takeSelfieBtn.textContent = "❌";
                    statusMessage.textContent = "Error: Cannot access camera. Check browser permissions.";
                    centralViewport.classList.remove('active'); 
                });
        }
    }

    // --- INITIAL STATE SETUP ---
    // 🚨 Ensure initial states are set correctly
    takeSelfieBtn.textContent = "▶️"; 
    statusMessage.textContent = "Select your Gender (M/F) and Complexion (🎨) to begin.";
    
    filterWrapper.style.display = 'none';
    
    inspirationToggle.classList.add('collapsed');
    inspirationToggle.classList.remove('expanded');
    galleryContainer.style.display = 'none'; 
    
    renderComplexionSelector(); 
    renderFinalGallery(); 


    // --- 2. Floating Pill Click Handlers (Gender & Complexion) ---

    // GENDER PILL
    genderPill.addEventListener('click', (e) => {
        toggleFilterContent(genderContent);
        statusMessage.textContent = "Select a style gender (Male or Female) below.";
    });

    // COMPLEXION PILL
    complexionPill.addEventListener('click', (e) => {
        if (!selectedGender) {
            statusMessage.textContent = "Please select a Gender first!";
            genderPill.click(); 
            return;
        }
        toggleFilterContent(complexionContent);
        statusMessage.textContent = "Select your desired complexion below.";
    });


    // --- Filter Option Click Handlers (inside the expanded content) ---

    // GENDER OPTIONS
    // 🚨 Attach listener to the correct parent, as the buttons are created statically
    genderContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('gender-option')) {
            genderContent.querySelectorAll('.gender-option').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');

            selectedGender = e.target.getAttribute('data-gender');
            selectedComplexion = null; 
            selectedPrompt = null; 
            
            updatePillState();
            
            toggleFilterContent(genderContent); 
            complexionPill.click(); 
            
            statusMessage.textContent = "Gender set. Now select your Complexion (🎨)";
        }
    });


    // COMPLEXION TILES
    function renderComplexionSelector() {
        complexionGroup.innerHTML = ''; 
        
        complexionData.forEach(c => {
            const tile = document.createElement('div');
            tile.classList.add('complexion-tile');
            tile.setAttribute('data-complexion', c.id);
            tile.style.backgroundColor = c.color;
            complexionGroup.appendChild(tile);
            
            tile.addEventListener('click', (e) => {
                complexionGroup.querySelectorAll('.complexion-tile').forEach(t => t.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                
                selectedComplexion = e.currentTarget.getAttribute('data-complexion');
                
                updatePillState();
                renderFinalGallery();

                toggleFilterContent(complexionContent);
                inspirationToggle.click(); // Auto-expand Inspiration
            });
        });
        
    }


    // --- 5. INSPIRATION TOGGLE ---
    inspirationToggle.addEventListener('click', () => {
        // Only allow toggle if prerequisite filters are set
        if (!selectedGender || !selectedComplexion) {
            statusMessage.textContent = "Please select Gender (M/F) and Complexion (🎨) first!";
            return;
        }

        const isExpanded = inspirationToggle.classList.contains('expanded');
        
        inspirationToggle.classList.toggle('expanded', !isExpanded);
        inspirationToggle.classList.toggle('collapsed', isExpanded);
        
        // Toggle gallery visibility
        galleryContainer.style.display = isExpanded ? 'none' : 'block';

        if (!isExpanded) {
             statusMessage.textContent = "Select an inspiration style from the gallery below.";
        }
    });


    // --- FINAL STEP: Render the Filtered Gallery ---
    function renderFinalGallery() {
        const galleryOptionsGroup = galleryContainer.querySelector('.filter-options-group');
        galleryOptionsGroup.innerHTML = ''; 
        
        if (!selectedGender || !selectedComplexion) {
            galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; color: #666;">Complete the steps above to see styles.</p>';
            return;
        }
        
        const filteredStyles = promptDatabase[selectedGender] && promptDatabase[selectedGender][selectedComplexion] 
                             ? promptDatabase[selectedGender][selectedComplexion]
                             : [];
        
        if (filteredStyles.length === 0) {
            galleryOptionsGroup.innerHTML = '<p style="text-align: center; width: 100%; color: #666;">No styles found for this combination.</p>';
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

            optionDiv.appendChild(img);
            galleryOptionsGroup.appendChild(optionDiv);
            
            // 🚨 Attach style selection listener
            optionDiv.addEventListener('click', handleStyleSelection);
        });
        
        const genderText = selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1);
        const complexionText = selectedComplexion.charAt(0).toUpperCase() + selectedComplexion.slice(1);
        document.getElementById('inspiration-toggle-header').querySelector('span').textContent = `Inspiration (${genderText} - ${complexionText})`;
    }

    // --- Style Selection Handler ---
    function handleStyleSelection(e) {
        document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        
        selectedPrompt = e.currentTarget.getAttribute('data-prompt');
        
        inspirationToggle.classList.remove('expanded');
        inspirationToggle.classList.add('collapsed');
        galleryContainer.style.display = 'none';

        // Set button based on current camera state
        const buttonText = (videoFeed.style.display === 'block') ? '📸' : '✨';
        takeSelfieBtn.textContent = buttonText;
        takeSelfieBtn.style.display = 'flex'; 
        
        statusMessage.textContent = `Style selected: ${e.currentTarget.getAttribute('data-name')}. Tap the button to capture your selfie.`;
    }


    // --- 4. Capture Selfie/Camera Activation & AI Processing ---
    takeSelfieBtn.addEventListener('click', () => {
        // State Check 1: Must have a style selected
        if (!selectedPrompt) {
            statusMessage.textContent = "Please select a style from the Inspiration gallery first!";
            inspirationToggle.click(); 
            return;
        }

        // State Check 2: If camera hasn't started (Initial 'Play' button)
        if (!cameraStarted) {
            startCamera(); 
            return; 
        }
        
        // State Check 3: Live Camera -> Capture Selfie ('📸' button)
        if (videoFeed.style.display === 'block') {
            
            // 1. Capture Logic
            canvas.width = videoFeed.videoWidth;
            canvas.height = videoFeed.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            capturedImageBase64 = dataUrl.split(',')[1]; 
            
            // 2. State Transition (Live Camera -> Captured Image)
            takeSelfieBtn.textContent = '✨'; // Change to Try On icon
            videoFeed.style.display = 'none'; 
            aiResultImg.src = dataUrl; // Show the captured image
            aiResultImg.style.display = 'block'; 
            
            statusMessage.textContent = "Selfie captured! Tap the sparkle button to 'Try On' the hairstyle.";
            
        } 
        // State Check 4: Captured Image -> AI Processing ('✨' button)
        else if (aiResultImg.style.display === 'block' && takeSelfieBtn.textContent === '✨') {
             
            statusMessage.textContent = `Applying your selected style... This may take a moment.`;
            takeSelfieBtn.disabled = true;
            takeSelfieBtn.textContent = '⏳'; // Show loading indicator
            
            // ** Simulating the AI call **
            setTimeout(() => {
                
                // --- SUCCESS BLOCK (SIMULATED AI RESULT) ---
                
                // Replace the image source with a simulated AI-processed result
                // NOTE: Ensure the path below is correct, or use another placeholder image
                aiResultImg.src = SIMULATED_AI_RESULT_PATH; 
                
                takeSelfieBtn.textContent = "🔄"; // Change to Re-capture icon
                takeSelfieBtn.disabled = false;
                statusMessage.textContent = `Done! Your new look is ready. Tap the button to take a new selfie.`;
                
            }, 3000);
            
        } 
        // State Check 5: AI Result -> Start Camera/Re-capture ('🔄' button)
        else if (takeSelfieBtn.textContent === '🔄') {
            capturedImageBase64 = null;
            videoFeed.style.display = 'block';
            aiResultImg.style.display = 'none';
            takeSelfieBtn.textContent = '📸'; 
            statusMessage.textContent = "Camera ready for a new look! Select a style and capture!";
        }
    });

    // Initialize complexions and state on load
    renderComplexionSelector(); 
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const videoFeed = document.getElementById('video-feed');
    const aiResultImg = document.getElementById('ai-result');
    const canvas = document.getElementById('hidden-canvas');
    const cameraPlaceholderIcon = document.getElementById('camera-placeholder-icon');
    const cameraCaptureBtn = document.getElementById('camera-capture-btn');
    const redoSelfieBtn = document.getElementById('redo-selfie-btn');
    const generateLookBtn = document.getElementById('generate-look-btn');
    const bookAppointmentBtn = document.getElementById('book-appointment-btn'); 
    const spinner = document.getElementById('loading-spinner');
    const statusMessage = document.getElementById('status-message');
    const filtersAccordion = document.getElementById('additional-filters-selector');
    const complexionGroup = document.getElementById('complexion-options-group');
    const maleStyleOptionsGroup = document.getElementById('male-hairstyle-options-group');
    const femaleStyleOptionsGroup = document.getElementById('female-hairstyle-options-group');
    const maleGenderBtn = document.getElementById('male-gender-btn');
    const femaleGenderBtn = document.getElementById('female-gender-btn');
    const bookingModalOverlay = document.getElementById('booking-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const bookingForm = document.getElementById('booking-form');
    const referenceImagePreview = document.getElementById('reference-image-preview');
    const selectedStyleNameSpan = document.getElementById('selected-style-name');

    // State
    let capturedImageBase64 = null;
    let selectedPrompt = null;
    let selectedStyleLabel = null; 
    let cameraStarted = false;
    let selectedGender = 'Male';
    let selectedComplexionCode = null;
    let imageCaptured = false;
    let aiGenerationComplete = false; 

    const NEGATIVE_PROMPT = "extra fingers, blurry, low resolution, bad hands, deformed face, mask artifact, bad blending, unnatural hair hair color, ugly, tiling, duplicate, abstract, cartoon, distorted pupils, bad lighting, cropped, grainy, noise, poor lighting, poor composition, low quality, changed clothing, changed background, new outfit, new background, different lighting";

    const ALL_MALE_STYLES = [
        { code: 'default', src: "styles/male/style1.png", label: "Tousled Short Crop", prompt: "A short haircut with a tousled and textured top..." },
        { code: 'default', src: "styles/male/style2.png", label: "Wavy Clean Fade", prompt: "A clean fade with a slightly messy wavy top..." },
        { code: 'ds', src: "styles/male/ds/1.png", label: "Low Fade Coils", prompt: "A low fade with short tight coils..." },
        // ... include ALL 40+ styles from your index (6).html here ...
    ];

    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function renderStyles(container, stylesArray) {
        container.innerHTML = ''; 
        stylesArray.forEach(style => {
            const div = document.createElement('div');
            div.className = 'style-option';
            div.dataset.prompt = style.prompt;
            div.innerHTML = `<img class="style-thumbnail" src="${style.src}"><p>${style.label}</p>`;
            div.addEventListener('click', () => handleStyleSelect(div));
            container.appendChild(div);
        });
        setupScrollListeners(container);
    }

    function updateMaleStyleGallery(filterCode = null) {
        let filtered = filterCode ? ALL_MALE_STYLES.filter(s => s.code === filterCode) : ALL_MALE_STYLES;
        renderStyles(maleStyleOptionsGroup, shuffle([...filtered]));
    }

    // --- CAMERA LOGIC ---
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            videoFeed.srcObject = stream;
            videoFeed.style.display = 'block';
            cameraPlaceholderIcon.style.display = 'none';
            cameraStarted = true;
            updateButtonVisibility();
        } catch (err) {
            statusMessage.textContent = "Camera error.";
        }
    }

    cameraCaptureBtn.onclick = () => {
        canvas.width = videoFeed.videoWidth;
        canvas.height = videoFeed.videoHeight;
        canvas.getContext('2d').drawImage(videoFeed, 0, 0);
        capturedImageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
        aiResultImg.src = canvas.toDataURL('image/jpeg');
        aiResultImg.style.display = 'block';
        videoFeed.style.display = 'none';
        imageCaptured = true;
        updateButtonVisibility();
    };

    // --- AI GENERATION ---
    generateLookBtn.onclick = async () => {
        spinner.style.display = 'block';
        const finalPrompt = `STRICTLY operate in an inpainting mode. Apply: ${selectedPrompt}. Preserve face and identity.`;
        try {
            const response = await fetch('/api/run_model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseImage: capturedImageBase64, prompt: finalPrompt, negativePrompt: NEGATIVE_PROMPT })
            });
            const data = await response.json();
            aiResultImg.src = `data:image/jpeg;base64,${data.generatedImageBase64}`;
            aiGenerationComplete = true;
            updateButtonVisibility();
        } catch (error) {
            statusMessage.textContent = "AI error.";
        }
    };

    // --- INITIALIZATION ---
    function initialize() {
        maleGenderBtn.onclick = () => handleGenderSelect('Male');
        femaleGenderBtn.onclick = () => handleGenderSelect('Female');
        cameraPlaceholderIcon.onclick = startCamera;
        handleGenderSelect('Male');
    }

    initialize();
});

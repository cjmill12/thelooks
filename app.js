// ... (code above the event listener remains the same) ...

// --- Call Netlify Function for AI Processing (with Loading Indicator) ---
tryOnBtn.addEventListener('click', async () => {
    if (!capturedImageBase64 || !selectedPrompt) {
        statusMessage.textContent = "Please take a selfie AND select a style!";
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
                // 🚨 NEW PROMPT STRUCTURE: Direct and prioritizing the instruction
                prompt: `Edit the hair in this image using the following instruction: ${selectedPrompt}. Ensure the final result is photorealistic, seamlessly blended, and maintains the subject's face and original lighting.`
            })
        });

        // ... (rest of the API call and result display logic remains the same) ...
        
    } catch (error) {
        console.error('AI Processing Error:', error);
        statusMessage.textContent = `Error during AI try-on: ${error.message}. Please check your console/Netlify logs.`;
    } finally {
        tryOnBtn.disabled = false;
        spinner.style.display = 'none'; 
    }
});
// ... (rest of the file) ...

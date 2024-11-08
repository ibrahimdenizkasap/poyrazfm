// JavaScript code to control the RNBO FM synthesizer

(function() {
    let device; // Will hold the RNBO device
    let audioContext; // Will hold the AudioContext
    let isAudioInitialized = false; // Flag to check if audio has been initialized

    // Variables to store parameter references
    let carrierFreqParam, harmonicityParam, modulationIndexParam, volumeParam;

    // Variable to store the current volume value
    let currentVolume = 100; // Default volume

    // Variable to track whether a note is currently playing
    let isNotePlaying = false;

    // Set up carrier frequency buttons
    const carrierFreqButtonsContainer = document.getElementById('carrier-freq-buttons');
    // Carrier frequencies in Hz
    const carrierFrequencies = [220, 440, 660, 880, 1100, 1320, 1540];

        // Mapping of frequencies to image filenames
        const frequencyImages = {
            220: 'images/1.webp',
            440: 'images/2.webp',
            660: 'images/3.webp',
            880: 'images/4.webp',
            1100: 'images/5.webp',
            1320: 'images/6.webp',
            1540: 'images/7.webp'
        };

    carrierFrequencies.forEach(freqValue => {
        const button = document.createElement('button');
        button.textContent = `${freqValue} Hz`;

        // Event handler functions
        async function startSound() {
            // Set 'isNotePlaying' to true
            isNotePlaying = true;

            // Add 'active' class to the button
            button.classList.add('active');

            // Initialize audio on first user interaction
            if (!isAudioInitialized) {
                await initializeAudio();
            }

            // After initialization, check if 'isNotePlaying' is still true
            if (isNotePlaying) {
                carrierFreqParam.value = freqValue;
                volumeParam.value = currentVolume;

                 // Change the background image
                 changeBackgroundImage(freqValue);
            } else {
                // If 'isNotePlaying' is false, remove the 'active' class
                button.classList.remove('active');
            }
        }

        function stopSound() {
            isNotePlaying = false;
            if (isAudioInitialized) {
                volumeParam.value = 0;
            }
            button.classList.remove('active');
        }

        // Mouse events
        button.addEventListener('mousedown', startSound);
        button.addEventListener('mouseup', stopSound);
        button.addEventListener('mouseleave', (event) => {
            if (event.buttons === 1) {
                stopSound();
            }
        });

        // Touch events
        button.addEventListener('touchstart', (event) => {
            event.preventDefault();
            startSound();
        });
        button.addEventListener('touchend', stopSound);
        button.addEventListener('touchcancel', stopSound);
        button.addEventListener('touchleave', stopSound);

        carrierFreqButtonsContainer.appendChild(button);
    });

    function changeBackgroundImage(freq) {
        const imageUrl = frequencyImages[freq];
        if (imageUrl) {
            document.body.style.backgroundImage = `url('${imageUrl}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
        }
    }
    

    // Set up volume slider
    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.value = currentVolume; // Set slider to initial volume (100)

    volumeSlider.addEventListener('input', (event) => {
        currentVolume = parseFloat(event.target.value);
        if (isAudioInitialized) {
            volumeParam.value = currentVolume;
        }
    });

    // Initialize harmonicity and modulation index values
    let harmonicityValue = 0; // Initial value matching the patch
    let modulationIndexValue = 0; // Initial value matching the patch

    // Function to set up a rotary knob
    function setupRotaryKnob(elementId, param, min, max, initialValue, displayElementId) {
        const knobElement = document.getElementById(elementId);
        const displayElement = document.getElementById(displayElementId);

        let value = initialValue;

        // Update the display
        displayElement.textContent = value.toFixed(2);

        // Variables for mouse/touch tracking
        let isDragging = false;
        let startY = 0;
        let startValue = value;

        // Function to update the rotation based on value
        function updateRotation(val) {
            const angle = (val - min) / (max - min) * 270 - 135; // Map value to angle (-135 to 135 degrees)
            knobElement.style.transform = `rotate(${angle}deg)`;
        }

        // Initial rotation
        updateRotation(value);

        // Mouse events
        knobElement.addEventListener('mousedown', (event) => {
            isDragging = true;
            startY = event.clientY;
            startValue = value;
            event.preventDefault();
        });

        document.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaY = startY - event.clientY;
                const sensitivity = (max - min) / 200; // Adjust sensitivity as needed
                value = startValue + deltaY * sensitivity;
                value = Math.max(min, Math.min(max, value));
                if (isAudioInitialized) {
                    param.value = value;
                }
                displayElement.textContent = value.toFixed(2);
                updateRotation(value);
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (isDragging) {
                isDragging = false;
            }
        });

        // Touch events
        knobElement.addEventListener('touchstart', (event) => {
            isDragging = true;
            startY = event.touches[0].clientY;
            startValue = value;
            event.preventDefault();
        });

        document.addEventListener('touchmove', (event) => {
            if (isDragging) {
                const deltaY = startY - event.touches[0].clientY;
                const sensitivity = (max - min) / 200; // Adjust sensitivity as needed
                value = startValue + deltaY * sensitivity;
                value = Math.max(min, Math.min(max, value));
                if (isAudioInitialized) {
                    param.value = value;
                }
                displayElement.textContent = value.toFixed(2);
                updateRotation(value);
            }
        });

        document.addEventListener('touchend', (event) => {
            if (isDragging) {
                isDragging = false;
            }
        });

        // Prevent default scrolling behavior on touch devices
        knobElement.addEventListener('touchmove', (event) => {
            event.preventDefault();
        });
    }

    // Set up harmonicity rotary knob
    setupRotaryKnob('harmonicity-knob', harmonicityParam, 0, 100, harmonicityValue, 'harmonicity-value');

    // Set up modulation index rotary knob
    setupRotaryKnob('modulation-index-knob', modulationIndexParam, 0, 1000, modulationIndexValue, 'modulation-index-value');

    // Function to initialize audio (called on first user interaction)
    async function initializeAudio() {
        isAudioInitialized = true;

        // Fetch the RNBO patch
        const patchExportURL = 'fmsynthweb5.export.json'; // Update the patch filename if needed
        let patchData;

        try {
            const response = await fetch(patchExportURL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            patchData = await response.json();
        } catch (error) {
            console.error('Error fetching patch data:', error);
            return;
        }

        // Create the audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create the RNBO device
        try {
            device = await RNBO.createDevice({ context: audioContext, patcher: patchData });
        } catch (error) {
            console.error('Error creating RNBO device:', error);
            return;
        }

        // Connect the device outputs to the audio context destination
        device.node.connect(audioContext.destination);

        // Resume the audio context
        await audioContext.resume();

        // Get references to the parameters
        carrierFreqParam = device.parametersById.get('carrierfreq');
        harmonicityParam = device.parametersById.get('harmonicityfreq');
        modulationIndexParam = device.parametersById.get('motulationindex'); // Ensure this matches your RNBO patch
        volumeParam = device.parametersById.get('volume');

        // Initialize parameters
        carrierFreqParam.value = 0;
        harmonicityParam.value = harmonicityValue;
        modulationIndexParam.value = modulationIndexValue;
        volumeParam.value = currentVolume;

        // Now that the parameters are initialized, set up the knobs again with the parameters
        setupRotaryKnob('harmonicity-knob', harmonicityParam, 0, 100, harmonicityValue, 'harmonicity-value');
        setupRotaryKnob('modulation-index-knob', modulationIndexParam, 0, 1000, modulationIndexValue, 'modulation-index-value');
    }

})();

// JavaScript code to control the RNBO FM synthesizer

(async function() {
    // Fetch the RNBO patch
    const patchExportURL = 'fmsynthweb4.export.json'; // Update the patch filename if needed
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
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create the RNBO device
    let device;
    try {
        device = await RNBO.createDevice({ context: audioContext, patcher: patchData });
    } catch (error) {
        console.error('Error creating RNBO device:', error);
        return;
    }

    // Connect the device outputs to the audio context destination
    device.node.connect(audioContext.destination);

    // Resume the audio context (required for some browsers)
    await audioContext.resume();

    // Get references to the parameters
    const carrierFreqParam = device.parametersById.get('carrierfreq');
    const harmonicityParam = device.parametersById.get('harmonicityfreq');
    const modulationIndexParam = device.parametersById.get('motulationindex'); // Ensure this matches your RNBO patch
    const volumeParam = device.parametersById.get('volume');

    // Initialize parameters
    carrierFreqParam.value = 0;
    harmonicityParam.value = 0;
    modulationIndexParam.value = 0;
    volumeParam.value = 100; // Starting volume

    // Variable to store the current volume value
    let currentVolume = volumeParam.value; // Initializes to 100

    // Variable to track whether a note is currently playing
    let isNotePlaying = false;

    // Set up carrier frequency buttons
    const carrierFreqButtonsContainer = document.getElementById('carrier-freq-buttons');
    // Carrier frequencies in Hz
    const carrierFrequencies = [220, 440, 660, 880, 1100, 1320, 1540];

    carrierFrequencies.forEach(freqValue => {
        const button = document.createElement('button');
        button.textContent = `${freqValue} Hz`;

        // Event handler functions
        function startSound() {
            carrierFreqParam.value = freqValue;
            volumeParam.value = currentVolume;
            isNotePlaying = true;
            button.classList.add('active');
        }

        function stopSound() {
            volumeParam.value = 0;
            isNotePlaying = false;
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

    // Set up volume slider
    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.value = volumeParam.value; // Set slider to initial volume (100)

    volumeSlider.addEventListener('input', (event) => {
        currentVolume = parseFloat(event.target.value);
        volumeParam.value = currentVolume;
    });

    // Set up harmonicity slider
    const harmonicitySlider = document.getElementById('harmonicity-slider');
    const harmonicityValueDisplay = document.getElementById('harmonicity-value');

    harmonicitySlider.value = harmonicityParam.value;
    harmonicityValueDisplay.textContent = harmonicitySlider.value;

    harmonicitySlider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        harmonicityParam.value = value;
        harmonicityValueDisplay.textContent = value;
    });

    // Set up modulation index slider
    const modulationIndexSlider = document.getElementById('modulation-index-slider');
    const modulationIndexValueDisplay = document.getElementById('modulation-index-value');

    modulationIndexSlider.value = modulationIndexParam.value;
    modulationIndexValueDisplay.textContent = modulationIndexSlider.value;

    modulationIndexSlider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        modulationIndexParam.value = value;
        modulationIndexValueDisplay.textContent = value;
    });

})();

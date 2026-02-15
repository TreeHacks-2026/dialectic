// DOM Elements
const avatarVideo = document.getElementById('avatar-video');
const placeholder = document.getElementById('placeholder');
const statusBadge = document.getElementById('status-badge');
const statusText = statusBadge.querySelector('.status-text');
const textInput = document.getElementById('text-input');
const startBtn = document.getElementById('start-btn');
const speakBtn = document.getElementById('speak-btn');
const stopBtn = document.getElementById('stop-btn');

// LiveKit room instance
let room = null;
let sessionData = null;

// Ensure Livekit reference is available
const LK = window.LivekitClient || window.LiveKit;

// Update UI status
function updateStatus(status, text) {
    statusBadge.className = `status-badge ${status}`;
    statusText.textContent = text;
}

// Update button states
function updateButtons(state) {
    switch (state) {
        case 'disconnected':
            startBtn.disabled = false;
            speakBtn.disabled = true;
            stopBtn.disabled = true;
            break;
        case 'connecting':
            startBtn.disabled = true;
            speakBtn.disabled = true;
            stopBtn.disabled = true;
            break;
        case 'connected':
            startBtn.disabled = true;
            speakBtn.disabled = false;
            stopBtn.disabled = false;
            break;
        case 'speaking':
            startBtn.disabled = true;
            speakBtn.disabled = true;
            stopBtn.disabled = false;
            break;
    }
}

// Start avatar session
async function startSession() {
    try {
        updateStatus('connecting', 'Connecting...');
        updateButtons('connecting');

        // Step 1: Get session token from backend
        const tokenResponse = await fetch('http://localhost:3001/api/get-access-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!tokenResponse.ok) {
            throw new Error(`HTTP error! status: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Got session token');

        // Step 2: Start the LiveAvatar session to get LiveKit room details
        const startResponse = await fetch('http://localhost:3001/api/start-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_token: tokenData.token,
            }),
        });

        if (!startResponse.ok) {
            throw new Error(`HTTP error! status: ${startResponse.status}`);
        }

        sessionData = await startResponse.json();
        console.log('Got LiveKit room details:', sessionData);

        // Step 3: Connect to LiveKit room
        room = new LK.Room();

        // Set up event listeners
        room.on('trackSubscribed', (track, publication, participant) => {
            console.log('Track subscribed:', track.kind);
            if (track.kind === 'video') {
                const videoElement = track.attach();
                avatarVideo.srcObject = videoElement.srcObject;
                avatarVideo.classList.add('active');
                placeholder.classList.add('hidden');
            } else if (track.kind === 'audio') {
                // Attach audio track to play sound
                const audioElement = track.attach();
                audioElement.play().catch(err => {
                    console.error('Error playing audio:', err);
                });
                document.body.appendChild(audioElement);
                console.log('Audio track attached and playing');
            }
        });

        room.on('connected', () => {
            console.log('Connected to LiveKit room');
            updateStatus('connected', 'Connected');
            updateButtons('connected');
        });

        room.on('disconnected', () => {
            console.log('Disconnected from room');
            updateStatus('', 'Disconnected');
            updateButtons('disconnected');
        });

        // Connect to the room
        await room.connect(sessionData.livekit_url, sessionData.livekit_client_token);

        console.log('Avatar session started successfully');
    } catch (error) {
        console.error('Error starting session:', error);
        updateStatus('', 'Error: ' + error.message);
        updateButtons('disconnected');
        alert('Failed to start session: ' + error.message);
    }
}

// Make avatar speak
async function speak() {
    const text = textInput.value.trim();

    if (!text) {
        alert('Please enter some text');
        return;
    }

    if (!room || !room.state === 'connected') {
        alert('Please start a session first');
        return;
    }

    try {
        updateStatus('speaking', 'Speaking...');
        updateButtons('speaking');

        // Publish command event to LiveAvatar via agent-control topic
        const commandEvent = JSON.stringify({
            event_type: 'avatar.speak_text',
            text: text,
        });

        const encoder = new TextEncoder();
        const data = encoder.encode(commandEvent);

        // Publish to agent-control topic for LiveAvatar FULL mode
        await room.localParticipant.publishData(
            data,
            {
                reliable: true,
                topic: 'agent-control',
            }
        );

        console.log('Speech command sent to LiveAvatar:', text);

        // Reset status after a short delay
        setTimeout(() => {
            updateStatus('connected', 'Connected');
            updateButtons('connected');
        }, 2000);
    } catch (error) {
        console.error('Error speaking:', error);
        updateStatus('connected', 'Connected');
        updateButtons('connected');
        alert('Failed to speak: ' + error.message);
    }
}

// Stop session
async function stopSession() {
    try {
        if (room) {
            await room.disconnect();
            room = null;
        }

        avatarVideo.srcObject = null;
        avatarVideo.classList.remove('active');
        placeholder.classList.remove('hidden');

        updateStatus('', 'Disconnected');
        updateButtons('disconnected');

        console.log('Avatar session stopped');
    } catch (error) {
        console.error('Error stopping session:', error);
        alert('Failed to stop session: ' + error.message);
    }
}

// Event Listeners
startBtn.addEventListener('click', startSession);
speakBtn.addEventListener('click', speak);
stopBtn.addEventListener('click', stopSession);

// Handle Enter key in textarea
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!speakBtn.disabled) {
            speak();
        }
    }
});

// Initialize UI
updateStatus('', 'Disconnected');
updateButtons('disconnected');

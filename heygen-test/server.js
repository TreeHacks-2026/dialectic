const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Load avatars lookup
const avatarsPath = path.join(__dirname, 'avatars.json');
const avatars = JSON.parse(fs.readFileSync(avatarsPath, 'utf8'));

// Get avatar details from config
const avatarName = config.heygen.avatarName || 'Ann Therapist';
const avatarInfo = avatars[avatarName];

if (!avatarInfo) {
  console.error(`Avatar "${avatarName}" not found in avatars.json`);
  console.log('Available avatars:', Object.keys(avatars).sort().join(', '));
  process.exit(1);
}

console.log(`Using avatar: ${avatarName}`);
console.log(`  ID: ${avatarInfo.id}`);
console.log(`  Voice: ${avatarInfo.voice_name} (${avatarInfo.voice_id})`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint to generate HeyGen access token
app.post('/api/get-access-token', async (req, res) => {
  try {
    const apiKey = config.heygen.apiKey;

    // Call LiveAvatar API to create a new session token
    const response = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'FULL',
        avatar_id: avatarInfo.id,
        avatar_persona: {
          voice_id: avatarInfo.voice_id,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LiveAvatar API error:', errorData);
      throw new Error(`LiveAvatar API returned ${response.status}: ${errorData}`);
    }

    const data = await response.json();

    res.json({
      token: data.data.session_token,
      session_id: data.data.session_id,
    });
  } catch (error) {
    console.error('Error generating access token:', error);
    res.status(500).json({
      error: 'Failed to generate access token',
      message: error.message
    });
  }
});

// Endpoint to start LiveAvatar session and get LiveKit room details
app.post('/api/start-session', async (req, res) => {
  try {
    const { session_token } = req.body;

    // Call LiveAvatar API to start the session
    const response = await fetch('https://api.liveavatar.com/v1/sessions/start', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${session_token}`,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LiveAvatar start session error:', errorData);
      throw new Error(`LiveAvatar API returned ${response.status}: ${errorData}`);
    }

    const data = await response.json();

    res.json(data.data);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      error: 'Failed to start session',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📺 Open http://localhost:${PORT} in your browser`);
});

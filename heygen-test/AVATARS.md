# Avatar Selection Guide

## Overview

This project now supports easy avatar selection from 83 available LiveAvatar public avatars. Simply specify the avatar name in `config.json` and the server will automatically look up the avatar ID and voice ID.

## How to Change Avatars

1. **Edit `config.json`:**
   ```json
   {
     "heygen": {
       "apiKey": "your-api-key",
       "avatarName": "Ann Therapist"
     }
   }
   ```

2. **Restart the server:**
   ```bash
   node server.js
   ```

The server will display which avatar is being used:
```
Using avatar: Ann Therapist
  ID: 513fd1b7-7ef9-466d-9af2-344e51eeb833
  Voice: Ann - IA (de5574fc-009e-4a01-a881-9919ef8f5a0c)
```

## Available Avatars

All 83 avatars are stored in [`avatars.json`](file:///Users/aarushg/Code/heygen-test/avatars.json) with the following structure:

```json
{
  "Avatar Name": {
    "id": "avatar-uuid",
    "voice_id": "voice-uuid",
    "voice_name": "Voice Name",
    "preview_url": "https://..."
  }
}
```

### Popular Avatars

- **Ann Therapist** - Professional female therapist
- **Dexter Lawyer** - Professional male lawyer
- **Judy Doctor Standing** - Female doctor standing
- **Bryan Tech Expert** - Male tech expert
- **Silas HR** - Male HR representative
- **June HR** - Female HR representative
- **Santa Fireplace Front** - Seasonal Santa avatar

### Full Avatar List

To see all available avatars:
```bash
cat avatars.json | jq 'keys | sort'
```

Or in the server, if you specify an invalid avatar name, it will list all available options.

## Updating Avatar List

To refresh the avatar list from LiveAvatar API:

```bash
./fetch_avatars.sh
```

This will:
1. Fetch all pages of public avatars
2. Create/update `avatars.json` with name-keyed lookup
3. Include avatar ID, voice ID, voice name, and preview URL

## Technical Details

**Files:**
- [`avatars.json`](file:///Users/aarushg/Code/heygen-test/avatars.json) - Name-keyed avatar lookup
- [`fetch_avatars.sh`](file:///Users/aarushg/Code/heygen-test/fetch_avatars.sh) - Script to update avatar list
- [`config.json`](file:///Users/aarushg/Code/heygen-test/config.json) - Configuration with `avatarName`
- [`server.js`](file:///Users/aarushg/Code/heygen-test/server.js) - Loads and validates avatar selection

**Server Startup:**
1. Loads `config.json`
2. Loads `avatars.json`
3. Looks up avatar by name from config
4. Validates avatar exists
5. Uses avatar ID and voice ID for API calls

**Error Handling:**
- If avatar name not found, server exits with error
- Lists all available avatars for easy selection
- Prevents invalid API calls with missing avatars

# Multi-Agent Input Processing System

A modular TypeScript system for buffering streamed inputs, detecting pauses, and processing with multiple agents in round-robin fashion.

## Architecture

```
src/
├── index.ts              # Main entry point
├── types/
│   └── types.ts          # Type definitions
└── core/
    ├── input-buffer.ts   # InputBuffer class
    ├── understanding-base.ts  # UnderstandingBase class
    ├── agent.ts          # Agent class
    ├── agent-selector.ts # AgentSelector class
    └── multi-agent-system.ts  # MultiAgentSystem class

examples/
├── simulator.ts          # Full demo
└── example.ts            # Simple example
```

## Quick Start

### Installation

```bash
npm install
```

### Run Demo

```bash
npm run dev
```

### Run Simple Example

```bash
npm run example
```

## Usage

### Basic Usage

```typescript
import { MultiAgentSystem, AgentResponse } from "./src/index";

// Create system with output callback
const system = new MultiAgentSystem((response: AgentResponse) => {
  console.log("Agent:", response.agent);
  console.log("Response:", response.response);
});

// Start processing
system.start();

// Send inputs (e.g., from Zoom STT)
system.addInput("Hello");
system.addInput("How are you?");

// System automatically processes after 5-second pause
// and calls your callback with the response

// Stop when done
system.stop();
```

### Custom Configuration

```typescript
const system = new MultiAgentSystem(
  (response) => {
    // Handle output
  },
  {
    pauseThreshold: 3.0, // Custom pause threshold (seconds)
    agents: [
      {
        name: "CustomAgent",
        acknowledgments: ["Processing...", "One moment..."],
      },
    ],
  }
);
```

## API Reference

### `MultiAgentSystem`

**Constructor:**
```typescript
new MultiAgentSystem(
  outputCallback: (response: AgentResponse) => void,
  config?: SystemConfig
)
```

**Methods:**
- `start()` - Start the system
- `stop()` - Stop the system
- `addInput(text: string)` - Add an input line

### `AgentResponse`

```typescript
{
  agent: string;           // Agent name
  acknowledgment: string;  // Acknowledgment phrase
  query: string;          // Condensed query
  context: string;        // Historical context
  response: string;       // Agent's response
  timestamp: string;      // ISO timestamp
}
```

## How It Works

1. **Input Buffering**: Collects pause-to-pause inputs via `addInput()`
2. **Pause Detection**: Monitors for 5-second pauses (configurable)
3. **Processing**: After pause detected:
   - Condenses all buffered inputs
   - Selects agent via round-robin
   - Agent processes with context
   - Calls your callback with result

## File Structure

- **src/types/types.ts** - All TypeScript interfaces and types
- **src/core/** - Core system classes (import via `src/index.ts`)
- **examples/simulator.ts** - Full demo with test scenarios
- **examples/example.ts** - Minimal usage example

## Integration

To integrate with real Zoom STT or other services:

```typescript
// Your Zoom STT handler
zoomClient.onTranscript((text: string) => {
  system.addInput(text);
});

// Your output handler
const system = new MultiAgentSystem((response) => {
  // Send to your backend/frontend
  sendToClient(response);
});
```

/**
 * Interactive Chat Simulator
 * 
 * Simulates a meeting with human participants and AI agents.
 * Human input is entered via terminal. On each message, the system
 * selects the best agent to respond and generates a persona-driven reply.
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as dotenv from "dotenv";
import { MultiAgentSystem, MeetingConfig } from "../src/index";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function loadConfig(configPath: string): MeetingConfig {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as MeetingConfig;
}

function printBanner(config: MeetingConfig): void {
    console.log("\n" + "=".repeat(60));
    console.log("  DIALECTIC — Multi-Agent Meeting Simulator");
    console.log("=".repeat(60));

    console.log("\n  Participants:");
    for (const h of config.humans) {
        console.log(`    👤 ${h.name}`);
    }
    for (const a of config.agents) {
        console.log(`    🤖 ${a.name} — ${a.description.substring(0, 60)}...`);
    }

    console.log("\n  Commands:");
    console.log("    /pass         — Let another agent continue");
    console.log("    /switch       — Change active speaker");
    console.log("    /transcript   — Print full transcript");
    console.log("    /quit         — Exit the simulator");
    console.log("\n" + "=".repeat(60) + "\n");
}

async function main(): Promise<void> {
    // Load config
    const configPath = path.resolve(__dirname, "../config.json");
    const config = loadConfig(configPath);

    // Check for API keys
    const claudeKey = process.env.CLAUDE_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    if (!claudeKey || claudeKey === "your-claude-key-here") {
        console.error("Error: Set CLAUDE_API_KEY in .env file");
        console.error("  Get key: https://console.anthropic.com/");
        process.exit(1);
    }
    if (!perplexityKey || perplexityKey === "your-perplexity-key-here") {
        console.error("Error: Set PERPLEXITY_API_KEY in .env file");
        process.exit(1);
    }

    // Initialize system
    const system = new MultiAgentSystem(config, {
        claude: claudeKey,
        perplexity: perplexityKey,
    });

    // Print banner
    printBanner(config);

    // Setup readline
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Default to first human participant
    let activeSpeaker = config.humans[0].name;
    console.log(`Speaking as: ${activeSpeaker}\n`);

    const prompt = (): void => {
        rl.question(`[${activeSpeaker}]: `, async (input) => {
            const trimmed = input.trim();

            if (!trimmed) {
                prompt();
                return;
            }

            // Handle commands
            if (trimmed === "/quit") {
                console.log("\nGoodbye!");
                rl.close();
                return;
            }

            if (trimmed === "/transcript") {
                console.log("\n" + "-".repeat(40));
                console.log("Full Transcript:");
                console.log("-".repeat(40));
                console.log(system.getTranscript().getFullText() || "(empty)");
                console.log("-".repeat(40) + "\n");
                prompt();
                return;
            }

            if (trimmed === "/switch") {
                const humans = config.humans.map((h) => h.name);
                console.log("\nAvailable speakers:");
                humans.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));

                rl.question("Select speaker number: ", (answer) => {
                    const idx = parseInt(answer, 10) - 1;
                    if (idx >= 0 && idx < humans.length) {
                        activeSpeaker = humans[idx];
                        console.log(`\nNow speaking as: ${activeSpeaker}\n`);
                    } else {
                        console.log("Invalid selection.\n");
                    }
                    prompt();
                });
                return;
            }

            if (trimmed === "/pass") {
                if (system.getTranscript().length() === 0) {
                    console.log("\n  No conversation yet — say something first!\n");
                    prompt();
                    return;
                }
                try {
                    console.log("\n  ⏳ Another agent is chiming in...\n");
                    const response = await system.continueConversation();
                    console.log(`  🤖 [${response.agent}]: ${response.response}\n`);
                } catch (error) {
                    console.error(
                        `\n  ❌ Error: ${error instanceof Error ? error.message : error}\n`
                    );
                }
                prompt();
                return;
            }

            // Process human input
            try {
                console.log("\n  ⏳ Selecting agent and generating response...\n");

                const response = await system.addInput(activeSpeaker, trimmed);

                console.log(`  🤖 [${response.agent}]: ${response.response}\n`);
            } catch (error) {
                console.error(
                    `\n  ❌ Error: ${error instanceof Error ? error.message : error}\n`
                );
            }

            prompt();
        });
    };

    prompt();
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

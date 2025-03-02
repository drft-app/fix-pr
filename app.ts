import dotenv from "dotenv";
import fs from "fs";
import { Octokit, App } from "octokit";
import { registerWebhooks } from "./src/webhooks";
import { startServer } from "./src/server";

// Load environment variables from .env file
dotenv.config();

// Set configured values
const appId = process.env.APP_ID!;
const privateKeyPath = process.env.PRIVATE_KEY_PATH!;
const privateKey = fs.readFileSync(privateKeyPath, "utf8");
const secret = process.env.WEBHOOK_SECRET!;
const enterpriseHostname = process.env.ENTERPRISE_HOSTNAME;

// Create an authenticated Octokit client authenticated as a GitHub App
const app = new App({
  appId,
  privateKey,
  webhooks: {
    secret,
  },
  ...(enterpriseHostname && {
    Octokit: Octokit.defaults({
      baseUrl: `https://${enterpriseHostname}/api/v3`,
    }),
  }),
});

// Register all webhook handlers
registerWebhooks(app.webhooks);

// Start the HTTP server
startServer(app.webhooks);

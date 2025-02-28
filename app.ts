import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import { Octokit, App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";

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

// Optional: Get & log the authenticated app's name
const { data } = await app.octokit.request("/app");

// Read more about custom logging: https://github.com/octokit/core.js#logging
console.log(`Authenticated as '${data.name}'`);

// Subscribe to the "pull_request.opened" webhook event
app.webhooks.on(
  "pull_request_review.submitted",
  async ({ octokit, payload }) => {
    console.log(
      "pull_request_review.submitted",
      JSON.stringify(payload.review, null, 2)
    );
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const ref = payload.pull_request.head.ref;
    console.log(owner, repo, ref);
    const workflowId = "fix-pr";
    try {
      await octokit.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs: {
          comment: payload.review.body,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
);

app.webhooks.on("pull_request_review.edited", async ({ octokit, payload }) => {
  console.log(
    "pull_request_review.edited",
    JSON.stringify(payload.review, null, 2)
  );
});

app.webhooks.on(
  "pull_request_review_comment.created",
  async ({ octokit, payload }) => {
    console.log(
      "pull_request_review_comment.created",
      JSON.stringify(payload.comment, null, 2)
    );
  }
);

app.webhooks.on(
  "pull_request_review_comment.edited",
  async ({ octokit, payload }) => {
    console.log(
      "pull_request_review_comment.edited",
      JSON.stringify(payload.comment, null, 2)
    );
  }
);
// Optional: Handle errors
app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    // Log Secret verification errors
    console.log(`Error processing request: ${error.event}`);
  } else {
    console.log(error);
  }
});

// Launch a web server to listen for GitHub webhooks
const port = process.env.PORT || 3000;
const path = "/api/webhook";
const localWebhookUrl = `http://localhost:${port}${path}`;

// See https://github.com/octokit/webhooks.js/#createnodemiddleware for all options
const middleware = createNodeMiddleware(app.webhooks, { path });

http.createServer(middleware).listen(port, () => {
  console.log(`Server is listening for events at: ${localWebhookUrl}`);
  console.log("Press Ctrl + C to quit.");
});

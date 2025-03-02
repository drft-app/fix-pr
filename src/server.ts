import http from "http";
import { createNodeMiddleware } from "@octokit/webhooks";

export const startServer = (webhooks: any) => {
  // Launch a web server to listen for GitHub webhooks
  const port = process.env.PORT || 3000;
  const path = "/api/webhook";
  const localWebhookUrl = `http://localhost:${port}${path}`;

  // See https://github.com/octokit/webhooks.js/#createnodemiddleware for all options
  const middleware = createNodeMiddleware(webhooks, { path });

  http.createServer(middleware).listen(port, () => {
    console.log(`Server is listening for events at: ${localWebhookUrl}`);
    console.log("Press Ctrl + C to quit.");
  });
};

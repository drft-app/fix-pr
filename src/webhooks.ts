import { Octokit } from "octokit";
import {
  updateReviewWithCheckbox,
  triggerWorkflow,
  getReviewComments,
  buildAiderPrompt,
} from "./utils";

export const registerWebhooks = (webhooks: any) => {
  // Subscribe to the "pull_request.opened" webhook event
  webhooks.on(
    "pull_request_review.submitted",
    async ({ octokit, payload }: { octokit: Octokit; payload: any }) => {
      console.log(
        "pull_request_review.submitted",
        JSON.stringify(payload.review, null, 2)
      );
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const ref = payload.pull_request.head.ref;
      const pull_number = payload.pull_request.number;

      // Update the review with a checkbox appended to the end
      await updateReviewWithCheckbox(
        octokit,
        owner,
        repo,
        pull_number,
        payload.review.id,
        payload.review.body || ""
      );
    }
  );

  webhooks.on(
    "pull_request_review.edited",
    async ({ octokit, payload }: { octokit: Octokit; payload: any }) => {
      console.log(
        "pull_request_review.edited",
        JSON.stringify(payload.review, null, 2)
      );
      // make sure the PR is open
      if (payload.pull_request.state !== "open") {
        console.log("PR is not open, skipping");
        return;
      }

      // Check if the review body contains the checked checkbox for "Address using Fix PR"
      if (
        payload.review.body &&
        payload.review.body.includes("- [x] Address using Fix PR")
      ) {
        console.log("Checkbox is checked, triggering workflow");

        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const ref = payload.pull_request.head.ref;
        const comments = await getReviewComments(
          octokit,
          payload.repository.owner.login,
          payload.repository.name,
          payload.pull_request.number,
          payload.review.id
        );
        console.log("Comments:", comments);
        // build prompt for aider
        const aider_message = buildAiderPrompt(payload.review.body, comments);
        console.log("aider_message:", aider_message);
        // Trigger the workflow with the review body as the aider_message
        await triggerWorkflow(
          octokit,
          owner,
          repo,
          ref,
          aider_message,
          payload.pull_request.number.toString(),
          payload.review.id.toString()
        );
      }
    }
  );

  webhooks.on(
    "pull_request_review_comment.created",
    async ({ octokit, payload }: { octokit: Octokit; payload: any }) => {
      console.log(
        "pull_request_review_comment.created",
        JSON.stringify(payload.comment, null, 2)
      );
    }
  );

  webhooks.on(
    "pull_request_review_comment.edited",
    async ({ octokit, payload }: { octokit: Octokit; payload: any }) => {
      console.log(
        "pull_request_review_comment.edited",
        JSON.stringify(payload.comment, null, 2)
      );
    }
  );

  // Optional: Handle errors
  webhooks.onError((error: any) => {
    if ("name" in error && error.name === "AggregateError") {
      // Log Secret verification errors
      console.log(`Error processing request: ${error.event}`);
    } else {
      console.log(error);
    }
  });
};

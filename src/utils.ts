import { Octokit } from "octokit";

/**
 * Updates a pull request review by appending a checkbox to the end of the review body
 */
export const updateReviewWithCheckbox = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number,
  review_id: number,
  original_body: string
) => {
  try {
    // Append the checkbox to the original review body
    const updatedBody = original_body + "\n\n- [ ] Address using Fix PR";
    await octokit.rest.pulls.updateReview({
      owner,
      repo,
      pull_number,
      review_id,
      body: updatedBody,
    });

    console.log(`Updated review #${review_id} with checkbox`);
  } catch (error) {
    console.error("Error updating review:", error);
  }
};

export const getReviewComments = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number,
  review_id: number
) => {
  const comments = await octokit.rest.pulls.listCommentsForReview({
    owner,
    repo,
    pull_number,
    review_id: review_id,
  });
  return comments.data;
};

export const buildAiderPrompt = (
  overall_comment: string,
  comments: {
    body: string;
    path: string;
    line?: number;
  }[]
) => {
  // strip the "Address using Fix PR" from the overall_comment
  const overall_comment_without_checkbox = overall_comment.replace(
    "- [x] Address using Fix PR",
    ""
  );
  const file_comments = comments
    .map(
      (comment) =>
        `For file ${comment.path}${
          comment.line ? `, line ${comment.line}` : ""
        }: ${comment.body}`
    )
    .join("\n");
  return `${overall_comment_without_checkbox}\n${file_comments}`;
};

export const triggerWorkflow = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  aider_message: string,
  base_pull_request_number: string,
  review_id: string,
  author_user_name: string
) => {
  const inputs = {
    base_branch_name: ref,
    aider_message: aider_message,
    base_pull_request_number: base_pull_request_number,
    review_id: review_id,
    author_user_name: author_user_name,
  };
  console.log("Triggering workflow with inputs:", inputs);
  try {
    await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: "fix-pr.yml",
      ref,
      inputs,
    });
  } catch (error) {
    console.error(error);
  }
};

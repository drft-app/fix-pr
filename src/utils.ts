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

export const triggerWorkflow = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  inputs: Record<string, string>
) => {
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
  return comments;
};

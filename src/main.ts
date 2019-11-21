import * as core from "@actions/core";
import { context, GitHub } from "@actions/github";

async function run() {
  try {
    const repo = context.repo;
    const issue_number = context?.payload?.pull_request?.number;
    if (!issue_number) {
      core.setFailed("This action only works for pull_request");
      return;
    }
    const body = core.getInput("message");
    const githubToken = core.getInput("GITHUB_TOKEN");
    if (!body || !githubToken) {
      core.setFailed("invalid input: please check your workflow");
      return;
    }
    const octokit = new GitHub(githubToken);
    const { data: comments } = await octokit.issues.listComments({
      ...repo,
      issue_number
    });
    const myComment = comments.find(
      comment => comment.user.login === "github-actions[bot]"
    );
    if (myComment) {
      await octokit.issues.updateComment({
        ...repo,
        comment_id: myComment.id,
        body
      });
    } else {
      await octokit.issues.createComment({
        ...repo,
        issue_number,
        body
      });
    }
  } catch ({ message }) {
    core.setFailed(message);
  }
}

run();

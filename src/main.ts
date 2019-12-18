import * as core from "@actions/core";
import { context, GitHub } from "@actions/github";
import { findPreviousComment, createComment, updateComment } from "./comment";
async function run() {
  try {
    const repo = context.repo;
    const number =
      context?.payload?.pull_request?.number || +core.getInput("number");
    const body = core.getInput("message");
    const githubToken = core.getInput("GITHUB_TOKEN");
    if (isNaN(number)) {
      core.setFailed("not found pull request number");
      return;
    }
    if (!body || !githubToken) {
      core.setFailed("invalid input: please check your workflow");
      return;
    }
    const octokit = new GitHub(githubToken);
    const previous = await findPreviousComment(octokit, repo, number);
    if (previous) {
      await updateComment(octokit, repo, previous.id, body);
    } else {
      await createComment(octokit, repo, number, body);
    }
  } catch ({ message }) {
    core.setFailed(message);
  }
}

run();

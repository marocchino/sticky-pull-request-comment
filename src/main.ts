import * as core from "@actions/core";
import { context, GitHub } from "@actions/github";
import { findPreviousComment, createComment, updateComment } from "./comment";
import { readFileSync } from 'fs';

async function run() {
  const number =
    context?.payload?.pull_request?.number ||
    +core.getInput("number", { required: false });
  if (isNaN(number) || number < 1) {
    core.info("no numbers given: skip step");
    return;
  }

  try {
    const repo = context.repo;
    const message = core.getInput("message", { required: false });
    const path = core.getInput("path", { required: false });
    const header = core.getInput("header", { required: false }) || "";
    const append = core.getInput("append", { required: false }) || false;
    const githubToken = core.getInput("GITHUB_TOKEN", { required: true });
    const octokit = new GitHub(githubToken);
    const previous = await findPreviousComment(octokit, repo, number, header);

    if (!message && !path) {
      throw { message: 'Either message or path input is required' };
    }

    let body;

    if (path) {
      body = readFileSync(path);
    } else {
      body = message;
    }

    if (previous) {
      if (append) {
        await updateComment(octokit, repo, previous.id, body, header, previous.body);
      } else {
        await updateComment(octokit, repo, previous.id, body, header);
      }
    } else {
      await createComment(octokit, repo, number, body, header);
    }
  } catch ({ message }) {
    core.setFailed(message);
  }
}

run();

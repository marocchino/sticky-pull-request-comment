import * as core from "@actions/core"
import * as github from "@actions/github"
import {
  append,
  getBody,
  deleteOldComment,
  githubToken,
  header,
  hideAndRecreate,
  hideClassify,
  hideDetails,
  hideOldComment,
  pullRequestNumber,
  recreate,
  repo,
  ignoreEmpty,
  onlyCreateComment,
  onlyUpdateComment
} from "./config"
import {
  createComment,
  deleteComment,
  findPreviousComment,
  getBodyOf,
  minimizeComment,
  updateComment
} from "./comment"

async function run(): Promise<undefined> {
  if (isNaN(pullRequestNumber) || pullRequestNumber < 1) {
    core.info("no pull request numbers given: skip step")
    return
  }

  try {
    const body = await getBody()

    if (!body && ignoreEmpty) {
      core.info("no body given: skip step by ignoreEmpty")
      return
    }

    if (!deleteOldComment && !hideOldComment && !body) {
      throw new Error("Either message or path input is required")
    }

    if (deleteOldComment && recreate) {
      throw new Error("delete and recreate cannot be both set to true")
    }

    if (onlyCreateComment && onlyUpdateComment) {
      throw new Error("only_create and only_update cannot be both set to true")
    }

    if (hideOldComment && hideAndRecreate) {
      throw new Error("hide and hide_and_recreate cannot be both set to true")
    }

    const octokit = github.getOctokit(githubToken)
    const previous = await findPreviousComment(
      octokit,
      repo,
      pullRequestNumber,
      header
    )

    if (deleteOldComment) {
      if (previous) {
        await deleteComment(octokit, previous.id)
      }
      return
    }

    if (!previous) {
      if (onlyUpdateComment) {
        return
      }
      await createComment(octokit, repo, pullRequestNumber, body, header)
      return
    }

    if (onlyCreateComment) {
      // don't comment anything, user specified only_create and there is an
      // existing comment, so this is probably a placeholder / introduction one.
      return
    }

    if (hideOldComment) {
      await minimizeComment(octokit, previous.id, hideClassify)
      return
    }

    const previousBody = getBodyOf(previous, append, hideDetails)
    if (recreate) {
      await deleteComment(octokit, previous.id)
      await createComment(
        octokit,
        repo,
        pullRequestNumber,
        body,
        header,
        previousBody
      )
      return
    }

    if (hideAndRecreate) {
      await minimizeComment(octokit, previous.id, hideClassify)
      await createComment(octokit, repo, pullRequestNumber, body, header)
      return
    }

    await updateComment(octokit, previous.id, body, header, previousBody)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()

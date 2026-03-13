import * as core from "@actions/core"
import * as github from "@actions/github"
import {
  commentsEqual,
  createComment,
  deleteComment,
  findPreviousComment,
  getBodyOf,
  minimizeComment,
  updateComment,
} from "./comment"
import {
  append,
  deleteOldComment,
  getBody,
  githubToken,
  header,
  hideAndRecreate,
  hideClassify,
  hideDetails,
  hideOldComment,
  ignoreEmpty,
  onlyCreateComment,
  onlyUpdateComment,
  pullRequestNumber,
  recreate,
  repo,
  skipUnchanged,
} from "./config"
import {validateBody, validateExclusiveModes} from "./validate"

async function run(): Promise<undefined> {
  if (Number.isNaN(pullRequestNumber) || pullRequestNumber < 1) {
    core.info("no pull request numbers given: skip step")
    return
  }

  try {
    const body = await getBody()

    if (!body && ignoreEmpty) {
      core.info("no body given: skip step by ignoreEmpty")
      return
    }

    validateBody(body, deleteOldComment, hideOldComment)
    validateExclusiveModes(
      deleteOldComment,
      recreate,
      onlyCreateComment,
      onlyUpdateComment,
      hideOldComment,
      hideAndRecreate,
    )

    const octokit = github.getOctokit(githubToken)
    const previous = await findPreviousComment(octokit, repo, pullRequestNumber, header)

    core.setOutput("previous_comment_id", previous?.id)

    if (!previous) {
      if (onlyUpdateComment || hideOldComment || deleteOldComment) {
        return
      }
      const created = await createComment(octokit, repo, pullRequestNumber, body, header)
      core.setOutput("created_comment_id", created?.data.id)
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

    if (deleteOldComment) {
      await deleteComment(octokit, previous.id)
      return
    }

    if (skipUnchanged && commentsEqual(body, previous.body || "", header)) {
      // don't recreate or update if the message is unchanged
      return
    }

    const previousBody = getBodyOf({body: previous.body || ""}, append, hideDetails)
    if (recreate) {
      await deleteComment(octokit, previous.id)
      const created = await createComment(
        octokit,
        repo,
        pullRequestNumber,
        body,
        header,
        previousBody,
      )
      core.setOutput("created_comment_id", created?.data.id)
      return
    }

    if (hideAndRecreate) {
      await minimizeComment(octokit, previous.id, hideClassify)
      const created = await createComment(octokit, repo, pullRequestNumber, body, header)
      core.setOutput("created_comment_id", created?.data.id)
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

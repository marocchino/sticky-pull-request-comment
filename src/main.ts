import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  findPreviousComment,
  createComment,
  updateComment,
  deleteComment
} from './comment'
import {
  pullRequestNumber,
  repo,
  message,
  path,
  header,
  append,
  recreate,
  deleteOldComment,
  githubToken
} from './config'
import {readFileSync} from 'fs'

async function run(): Promise<undefined> {
  if (isNaN(pullRequestNumber) || pullRequestNumber < 1) {
    core.info('no pull request numbers given: skip step')
    return
  }

  try {
    const octokit = github.getOctokit(githubToken)
    const previous = await findPreviousComment(
      octokit,
      repo,
      pullRequestNumber,
      header
    )

    if (!deleteOldComment && !message && !path) {
      throw new Error('Either message or path input is required')
    }

    if (deleteOldComment && recreate) {
      throw new Error('delete and recreate cannot be both set to true')
    }

    let body

    if (path) {
      body = readFileSync(path, 'utf-8')
    } else {
      body = message
    }

    if (previous) {
      const previousBody = append ? previous.body : undefined
      if (deleteOldComment) {
        await deleteComment(octokit, repo, previous.id)
      } else if (recreate) {
        await deleteComment(octokit, repo, previous.id)
        await createComment(
          octokit,
          repo,
          pullRequestNumber,
          body,
          header,
          previousBody
        )
      } else {
        await updateComment(
          octokit,
          repo,
          previous.id,
          body,
          header,
          previousBody
        )
      }
    } else {
      await createComment(octokit, repo, pullRequestNumber, body, header)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

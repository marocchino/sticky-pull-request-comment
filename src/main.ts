import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  findPreviousComment,
  createComment,
  updateComment,
  deleteComment
} from './comment'
import {readFileSync} from 'fs'

async function run(): Promise<undefined> {
  const number =
    github.context?.payload?.pull_request?.number ||
    +core.getInput('number', {required: false})
  if (isNaN(number) || number < 1) {
    core.info('no pull request numbers given: skip step')
    return
  }

  try {
    const repo = github.context.repo
    repo.repo = core.getInput('repo', {required: false}) || repo.repo
    const message = core.getInput('message', {required: false})
    const path = core.getInput('path', {required: false})
    const header = core.getInput('header', {required: false}) || ''
    const append =
      (core.getInput('append', {required: false}) || 'false') === 'true'
    const recreate =
      (core.getInput('recreate', {required: false}) || 'false') === 'true'
    const deleteOldComment =
      (core.getInput('delete', {required: false}) || 'false') === 'true'
    const githubToken = core.getInput('GITHUB_TOKEN', {required: true})
    const octokit = github.getOctokit(githubToken)
    const previous = await findPreviousComment(octokit, repo, number, header)

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
        await createComment(octokit, repo, number, body, header, previousBody)
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
      await createComment(octokit, repo, number, body, header)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

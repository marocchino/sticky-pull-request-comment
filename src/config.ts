import * as core from '@actions/core'
import {context} from '@actions/github'

export const pullRequestNumber =
  context?.payload?.pull_request?.number ||
  +core.getInput('number', {required: false})

export const repo = buildRepo()
export const message = core.getInput('message', {required: false})
export const path = core.getInput('path', {required: false})
export const header = core.getInput('header', {required: false})
export const append = core.getInput('append', {required: true}) === 'true'
export const recreate = core.getInput('recreate', {required: true}) === 'true'
export const deleteOldComment =
  core.getInput('delete', {required: true}) === 'true'
export const githubToken = core.getInput('GITHUB_TOKEN', {required: true})

function buildRepo(): {repo: string; owner: string} {
  return {
    owner: context.repo.owner,
    repo: core.getInput('repo', {required: false}) || context.repo.repo
  }
}

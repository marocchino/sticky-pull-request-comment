import {readFileSync} from "node:fs"
import * as core from "@actions/core"
import {context} from "@actions/github"
import {create} from "@actions/glob"
import type {ReportedContentClassifiers} from "@octokit/graphql-schema"

export const pullRequestNumber =
  context?.payload?.pull_request?.number || +core.getInput("number", {required: false})

export const repo = buildRepo()
export const header = core.getInput("header", {required: false})
export const append = core.getBooleanInput("append", {required: true})
export const hideDetails = core.getBooleanInput("hide_details", {
  required: true,
})
export const recreate = core.getBooleanInput("recreate", {required: true})
export const hideAndRecreate = core.getBooleanInput("hide_and_recreate", {
  required: true,
})
export const hideClassify = core.getInput("hide_classify", {
  required: true,
}) as ReportedContentClassifiers
export const deleteOldComment = core.getBooleanInput("delete", {required: true})
export const onlyCreateComment = core.getBooleanInput("only_create", {
  required: true,
})
export const onlyUpdateComment = core.getBooleanInput("only_update", {
  required: true,
})
export const skipUnchanged = core.getBooleanInput("skip_unchanged", {
  required: true,
})
export const hideOldComment = core.getBooleanInput("hide", {required: true})
export const githubToken = core.getInput("GITHUB_TOKEN", {required: true})
export const ignoreEmpty = core.getBooleanInput("ignore_empty", {
  required: true,
})

function buildRepo(): {repo: string; owner: string} {
  return {
    owner: core.getInput("owner", {required: false}) || context.repo.owner,
    repo: core.getInput("repo", {required: false}) || context.repo.repo,
  }
}

export async function getBody(): Promise<string> {
  const pathInput = core.getMultilineInput("path", {required: false})
  const followSymbolicLinks = core.getBooleanInput("follow_symbolic_links", {
    required: true,
  })
  if (pathInput && pathInput.length > 0) {
    try {
      const globber = await create(pathInput.join("\n"), {
        followSymbolicLinks,
        matchDirectories: false,
      })
      return (await globber.glob()).map(path => readFileSync(path, "utf-8")).join("\n")
    } catch (error) {
      if (error instanceof Error) {
        core.setFailed(error.message)
      }
      return ""
    }
  } else {
    return core.getInput("message", {required: false})
  }
}

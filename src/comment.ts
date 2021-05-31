import * as core from "@actions/core"
import {GitHub} from "@actions/github/lib/utils"

function headerComment(header: String): string {
  return `<!-- Sticky Pull Request Comment${header} -->`
}

export async function findPreviousComment(
  octokit: InstanceType<typeof GitHub>,
  repo: {
    owner: string
    repo: string
  },
  issue_number: number,
  header: string
): Promise<{body?: string; id: number} | undefined> {
  const {data: comments} = await octokit.rest.issues.listComments({
    ...repo,
    issue_number
  })
  const h = headerComment(header)
  return comments.find(comment => comment.body?.includes(h))
}
export async function updateComment(
  octokit: InstanceType<typeof GitHub>,
  repo: {
    owner: string
    repo: string
  },
  comment_id: number,
  body: string,
  header: string,
  previousBody?: string
): Promise<void> {
  if (!body && !previousBody)
    return core.warning("Comment body cannot be blank")

  await octokit.rest.issues.updateComment({
    ...repo,
    comment_id,
    body: previousBody
      ? `${previousBody}\n${body}`
      : `${body}\n${headerComment(header)}`
  })
}
export async function createComment(
  octokit: InstanceType<typeof GitHub>,
  repo: {
    owner: string
    repo: string
  },
  issue_number: number,
  body: string,
  header: string,
  previousBody?: string
): Promise<void> {
  if (!body && !previousBody)
    return core.warning("Comment body cannot be blank")

  await octokit.rest.issues.createComment({
    ...repo,
    issue_number,
    body: previousBody
      ? `${previousBody}\n${body}`
      : `${body}\n${headerComment(header)}`
  })
}
export async function deleteComment(
  octokit: InstanceType<typeof GitHub>,
  repo: {
    owner: string
    repo: string
  },
  comment_id: number
): Promise<void> {
  await octokit.rest.issues.deleteComment({
    ...repo,
    comment_id
  })
}

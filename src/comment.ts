import * as core from "@actions/core"
import type {GitHub} from "@actions/github/lib/utils"
import type {
  IssueComment,
  ReportedContentClassifiers,
  Repository,
  User,
} from "@octokit/graphql-schema"

type CreateCommentResponse = Awaited<
  ReturnType<InstanceType<typeof GitHub>["rest"]["issues"]["createComment"]>
>

function headerComment(header: string): string {
  return `<!-- Sticky Pull Request Comment${header} -->`
}

function bodyWithHeader(body: string, header: string): string {
  return `${body}\n${headerComment(header)}`
}

function bodyWithoutHeader(body: string, header: string): string {
  return body.replace(`\n${headerComment(header)}`, "")
}

export async function findPreviousComment(
  octokit: InstanceType<typeof GitHub>,
  repo: {
    owner: string
    repo: string
  },
  number: number,
  header: string,
): Promise<IssueComment | undefined> {
  let after = null
  let hasNextPage = true
  const h = headerComment(header)
  while (hasNextPage) {
    const data = await octokit.graphql<{repository: Repository; viewer: User}>(
      `
      query($repo: String! $owner: String! $number: Int! $after: String) {
        viewer { login }
        repository(name: $repo owner: $owner) {
          pullRequest(number: $number) {
            comments(first: 100 after: $after) {
              nodes {
                id
                author {
                  login
                }
                isMinimized
                body
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      }
      `,
      {...repo, after, number},
    )
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const viewer = data.viewer as User
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const repository = data.repository as Repository
    const target = repository.pullRequest?.comments?.nodes?.find(
      (node: IssueComment | null | undefined) =>
        node?.author?.login === viewer.login.replace("[bot]", "") &&
        !node?.isMinimized &&
        node?.body?.includes(h),
    )
    if (target) {
      return target
    }
    after = repository.pullRequest?.comments?.pageInfo?.endCursor
    hasNextPage = repository.pullRequest?.comments?.pageInfo?.hasNextPage ?? false
  }
  return undefined
}

export async function updateComment(
  octokit: InstanceType<typeof GitHub>,
  id: string,
  body: string,
  header: string,
  previousBody?: string,
): Promise<void> {
  if (!body && !previousBody) return core.warning("Comment body cannot be blank")

  const rawPreviousBody: string = previousBody ? bodyWithoutHeader(previousBody, header) : ""

  await octokit.graphql(
    `
    mutation($input: UpdateIssueCommentInput!) {
      updateIssueComment(input: $input) {
        issueComment {
          id
          body
        }
      }
    }
    `,
    {
      input: {
        id,
        body: previousBody
          ? bodyWithHeader(`${rawPreviousBody}\n${body}`, header)
          : bodyWithHeader(body, header),
      },
    },
  )
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
  previousBody?: string,
): Promise<CreateCommentResponse | undefined> {
  if (!body && !previousBody) {
    core.warning("Comment body cannot be blank")
    return
  }

  return await octokit.rest.issues.createComment({
    ...repo,
    issue_number,
    body: previousBody ? `${previousBody}\n${body}` : bodyWithHeader(body, header),
  })
}
export async function deleteComment(
  octokit: InstanceType<typeof GitHub>,
  id: string,
): Promise<void> {
  await octokit.graphql(
    `
    mutation($id: ID!) {
      deleteIssueComment(input: { id: $id }) {
        clientMutationId
      }
    }
    `,
    {id},
  )
}
export async function minimizeComment(
  octokit: InstanceType<typeof GitHub>,
  subjectId: string,
  classifier: ReportedContentClassifiers,
): Promise<void> {
  await octokit.graphql(
    `
    mutation($input: MinimizeCommentInput!) {
      minimizeComment(input: $input) {
        clientMutationId
      }
    }
    `,
    {input: {subjectId, classifier}},
  )
}

export function getBodyOf(
  previous: {body?: string},
  append: boolean,
  hideDetails: boolean,
): string | undefined {
  if (!append) {
    return undefined
  }

  if (!hideDetails || !previous.body) {
    return previous.body
  }

  return previous.body.replace(/(<details.*?)\s*\bopen\b(.*>)/g, "$1$2")
}

export function commentsEqual(body: string, previous: string | undefined, header: string): boolean {
  const newBody = bodyWithHeader(body, header)
  return newBody === previous
}

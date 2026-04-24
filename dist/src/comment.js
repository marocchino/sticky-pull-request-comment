import * as core from "@actions/core";
function headerComment(header) {
    return `<!-- Sticky Pull Request Comment${header} -->`;
}
function bodyWithHeader(body, header) {
    return `${body}\n${headerComment(header)}`;
}
function bodyWithoutHeader(body, header) {
    return body.replace(`\n${headerComment(header)}`, "");
}
export async function findPreviousComment(octokit, repo, number, header) {
    let after = null;
    let hasNextPage = true;
    const h = headerComment(header);
    while (hasNextPage) {
        const data = await octokit.graphql(`
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
      `, { ...repo, after, number });
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const viewer = data.viewer;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const repository = data.repository;
        const target = repository.pullRequest?.comments?.nodes?.find((node) => node?.author?.login === viewer.login.replace("[bot]", "") &&
            !node?.isMinimized &&
            node?.body?.includes(h));
        if (target) {
            return target;
        }
        after = repository.pullRequest?.comments?.pageInfo?.endCursor;
        hasNextPage = repository.pullRequest?.comments?.pageInfo?.hasNextPage ?? false;
    }
    return undefined;
}
export async function updateComment(octokit, id, body, header, previousBody) {
    if (!body && !previousBody)
        return core.warning("Comment body cannot be blank");
    const rawPreviousBody = previousBody ? bodyWithoutHeader(previousBody, header) : "";
    await octokit.graphql(`
    mutation($input: UpdateIssueCommentInput!) {
      updateIssueComment(input: $input) {
        issueComment {
          id
          body
        }
      }
    }
    `, {
        input: {
            id,
            body: previousBody
                ? bodyWithHeader(`${rawPreviousBody}\n${body}`, header)
                : bodyWithHeader(body, header),
        },
    });
}
export async function createComment(octokit, repo, issue_number, body, header, previousBody) {
    if (!body && !previousBody) {
        core.warning("Comment body cannot be blank");
        return;
    }
    return await octokit.rest.issues.createComment({
        ...repo,
        issue_number,
        body: previousBody ? `${previousBody}\n${body}` : bodyWithHeader(body, header),
    });
}
export async function deleteComment(octokit, id) {
    await octokit.graphql(`
    mutation($id: ID!) {
      deleteIssueComment(input: { id: $id }) {
        clientMutationId
      }
    }
    `, { id });
}
export async function minimizeComment(octokit, subjectId, classifier) {
    await octokit.graphql(`
    mutation($input: MinimizeCommentInput!) {
      minimizeComment(input: $input) {
        clientMutationId
      }
    }
    `, { input: { subjectId, classifier } });
}
export function getBodyOf(previous, append, hideDetails) {
    if (!append) {
        return undefined;
    }
    if (!hideDetails || !previous.body) {
        return previous.body;
    }
    return previous.body.replace(/(<details.*?)\s*\bopen\b(.*>)/g, "$1$2");
}
export function commentsEqual(body, previous, header) {
    const newBody = bodyWithHeader(body, header);
    return newBody === previous;
}

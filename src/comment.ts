import * as core from "@actions/core";

function headerComment(header) {
  return `<!-- Sticky Pull Request Comment${header} -->`;
}

export async function findPreviousComment(octokit, repo, issue_number, header) {
  const { data: comments } = await octokit.issues.listComments({
    ...repo,
    issue_number
  });
  const h = headerComment(header);
  return comments.find(comment => comment.body.includes(h));
}
export async function updateComment(octokit, repo, comment_id, body, header, previousBody?) {
  if (!body && !previousBody) core.warning('Comment body cannot be blank');

  await octokit.issues.updateComment({
    ...repo,
    comment_id,
    body: previousBody ? `${previousBody}\n${body}` : `${body}\n${headerComment(header)}`
  });
}
export async function createComment(octokit, repo, issue_number, body, header, previousBody?) {
  if (!body) core.warning('Comment body cannot be blank');

  await octokit.issues.createComment({
    ...repo,
    issue_number,
    body:  previousBody ? `${previousBody}\n${body}` : `${body}\n${headerComment(header)}`
  });
}
export async function deleteComment(octokit, repo, comment_id) {
  await octokit.issues.deleteComment({
    ...repo,
    comment_id,
  });
}

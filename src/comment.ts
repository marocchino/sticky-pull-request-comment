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
  await octokit.issues.updateComment({
    ...repo,
    comment_id,
    body: previousBody ? `${previousBody}\n${body}` : `${body}\n${headerComment(header)}`
  });
}
export async function createComment(octokit, repo, issue_number, body, header) {
  await octokit.issues.createComment({
    ...repo,
    issue_number,
    body: `${body}\n${headerComment(header)}`
  });
}

const HEADER = "<!-- Sticky Pull Request Comment -->";

export async function findPreviousComment(octokit, repo, issue_number) {
  const { data: comments } = await octokit.issues.listComments({
    ...repo,
    issue_number
  });
  return comments.find(comment => comment.body.startsWith(HEADER));
}
export async function updateComment(octokit, repo, comment_id, body) {
  await octokit.issues.updateComment({
    ...repo,
    comment_id,
    body: `${HEADER}\n${body}`
  });
}
export async function createComment(octokit, repo, issue_number, body) {
  await octokit.issues.createComment({
    ...repo,
    issue_number,
    body: `${HEADER}\n${body}`
  });
}

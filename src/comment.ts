function headerComment(header) {
  return `<!-- Sticky Pull Request Comment${header} -->`;
}

function removeHeaderComment(body, header) {
  return body.replace(`\n${header}`, '');
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
  const headerIdentifier = headerComment(header);
  const updatedBody = previousBody ? `${removeHeaderComment(previousBody, headerIdentifier)}\n${body}` : body;
  await octokit.issues.updateComment({
    ...repo,
    comment_id,
    body: `${updatedBody}\n${headerIdentifier}`
  });
}
export async function createComment(octokit, repo, issue_number, body, header) {
  await octokit.issues.createComment({
    ...repo,
    issue_number,
    body: `${body}\n${headerComment(header)}`
  });
}

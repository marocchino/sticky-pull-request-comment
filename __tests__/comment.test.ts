import {
  findPreviousComment,
  createComment,
  updateComment
} from "../src/comment";
const repo = {};
it("findPreviousComment", async () => {
  const comment = {
    user: {
      login: "github-actions[bot]"
    },
    body: "<!-- Sticky Pull Request Comment -->\nprevious message"
  };
  const otherComment = {
    user: {
      login: "some-user"
    },
    body: "lgtm"
  };
  const octokit = {
    issues: {
      listComments: jest.fn(() =>
        Promise.resolve({
          data: [otherComment, comment]
        })
      )
    }
  };

  expect(await findPreviousComment(octokit, repo, 123)).toBe(comment);
  expect(octokit.issues.listComments).toBeCalledWith({ issue_number: 123 });
});
it("updateComment", async () => {
  const octokit = {
    issues: {
      updateComment: jest.fn(() => Promise.resolve())
    }
  };
  expect(
    await updateComment(octokit, repo, 456, "hello there")
  ).toBeUndefined();
  expect(octokit.issues.updateComment).toBeCalledWith({
    comment_id: 456,
    body: "<!-- Sticky Pull Request Comment -->\nhello there"
  });
});
it("createComment", async () => {
  const octokit = {
    issues: {
      createComment: jest.fn(() => Promise.resolve())
    }
  };
  expect(
    await createComment(octokit, repo, 456, "hello there")
  ).toBeUndefined();
  expect(octokit.issues.createComment).toBeCalledWith({
    issue_number: 456,
    body: "<!-- Sticky Pull Request Comment -->\nhello there"
  });
});

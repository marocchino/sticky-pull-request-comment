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
  const commentWithCustomHeader = {
    user: {
      login: "github-actions[bot]"
    },
    body: "<!-- Sticky Pull Request CommentTypeA -->\nprevious message"
  };
  const otherComments = [
    {
      user: {
        login: "some-user"
      },
      body: "lgtm"
    },
    {
      user: {
        login: "github-actions[bot]"
      },
      body: "<!-- Sticky Pull Request CommentTypeB -->\nprevious message"
    }
  ];
  const octokit = {
    issues: {
      listComments: jest.fn(() =>
        Promise.resolve({
          data: [commentWithCustomHeader, comment, ...otherComments]
        })
      )
    }
  };

  expect(await findPreviousComment(octokit, repo, 123, "")).toBe(comment);
  expect(await findPreviousComment(octokit, repo, 123, "TypeA")).toBe(
    commentWithCustomHeader
  );
  expect(octokit.issues.listComments).toBeCalledWith({ issue_number: 123 });
});
it("updateComment", async () => {
  const octokit = {
    issues: {
      updateComment: jest.fn(() => Promise.resolve())
    }
  };
  expect(
    await updateComment(octokit, repo, 456, "hello there", "")
  ).toBeUndefined();
  expect(octokit.issues.updateComment).toBeCalledWith({
    comment_id: 456,
    body: "<!-- Sticky Pull Request Comment -->\nhello there"
  });
  expect(
    await updateComment(octokit, repo, 456, "hello there", "TypeA")
  ).toBeUndefined();
  expect(octokit.issues.updateComment).toBeCalledWith({
    comment_id: 456,
    body: "<!-- Sticky Pull Request CommentTypeA -->\nhello there"
  });
});
it("createComment", async () => {
  const octokit = {
    issues: {
      createComment: jest.fn(() => Promise.resolve())
    }
  };
  expect(
    await createComment(octokit, repo, 456, "hello there", "")
  ).toBeUndefined();
  expect(octokit.issues.createComment).toBeCalledWith({
    issue_number: 456,
    body: "<!-- Sticky Pull Request Comment -->\nhello there"
  });
  expect(
    await createComment(octokit, repo, 456, "hello there", "TypeA")
  ).toBeUndefined();
  expect(octokit.issues.createComment).toBeCalledWith({
    issue_number: 456,
    body: "<!-- Sticky Pull Request CommentTypeA -->\nhello there"
  });
});

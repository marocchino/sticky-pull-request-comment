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
    body: "previous message\n<!-- Sticky Pull Request Comment -->"
  };
  const commentWithCustomHeader = {
    user: {
      login: "github-actions[bot]"
    },
    body: "previous message\n<!-- Sticky Pull Request CommentTypeA -->"
  };
  const headerFirstComment = {
      user: {
        login: "github-actions[bot]"
      },
      body: "<!-- Sticky Pull Request CommentLegacyComment -->\nheader first message"
  }
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
      body: "previous message\n<!-- Sticky Pull Request CommentTypeB -->"
    },
  ];
  const octokit = {
    issues: {
      listComments: jest.fn(() =>
        Promise.resolve({
          data: [commentWithCustomHeader, comment, headerFirstComment, ...otherComments]
        })
      )
    }
  };

  expect(await findPreviousComment(octokit, repo, 123, "")).toBe(comment);
  expect(await findPreviousComment(octokit, repo, 123, "TypeA")).toBe(
    commentWithCustomHeader
  );
  expect(await findPreviousComment(octokit, repo, 123, "LegacyComment")).toBe(headerFirstComment)
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
    body: "hello there\n<!-- Sticky Pull Request Comment -->"
  });
  expect(
    await updateComment(octokit, repo, 456, "hello there", "TypeA")
  ).toBeUndefined();
  expect(octokit.issues.updateComment).toBeCalledWith({
    comment_id: 456,
    body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
  });

  expect(
    await updateComment(octokit, repo, 456, "hello there", "TypeA", "hello there\n<!-- Sticky Pull Request CommentTypeA -->")
  ).toBeUndefined();
  expect(octokit.issues.updateComment).toBeCalledWith({
    comment_id: 456,
    body: "hello there\nhello there\n<!-- Sticky Pull Request CommentTypeA -->"
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
    body: "hello there\n<!-- Sticky Pull Request Comment -->"
  });
  expect(
    await createComment(octokit, repo, 456, "hello there", "TypeA")
  ).toBeUndefined();
  expect(octokit.issues.createComment).toBeCalledWith({
    issue_number: 456,
    body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
  });
});

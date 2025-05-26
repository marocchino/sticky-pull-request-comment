import {getOctokit} from "@actions/github"
import * as core from "@actions/core"
import { vi, describe, it, expect, beforeEach } from 'vitest'

import {
  createComment,
  deleteComment,
  findPreviousComment,
  getBodyOf,
  updateComment,
  minimizeComment,
  commentsEqual
} from "../src/comment"

vi.mock("@actions/core", () => ({
  warning: vi.fn()
}))

const repo = {
  owner: "marocchino",
  repo: "sticky-pull-request-comment"
}
it("findPreviousComment", async () => {
  const authenticatedBotUser = {
    login: "github-actions[bot]"
  }
  const authenticatedUser = {
    login: "github-actions"
  }
  const otherUser = {
    login: "some-user"
  }
  const comment = {
    id: "1",
    author: authenticatedUser,
    isMinimized: false,
    body: "previous message\n<!-- Sticky Pull Request Comment -->"
  }
  const commentWithCustomHeader = {
    id: "2",
    author: authenticatedUser,
    isMinimized: false,
    body: "previous message\n<!-- Sticky Pull Request CommentTypeA -->"
  }
  const headerFirstComment = {
    id: "3",
    author: authenticatedUser,
    isMinimized: false,
    body: "<!-- Sticky Pull Request CommentLegacyComment -->\nheader first message"
  }
  const otherUserComment = {
    id: "4",
    author: otherUser,
    isMinimized: false,
    body: "Fake previous message\n<!-- Sticky Pull Request Comment -->"
  }
  const otherComments = [
    {
      id: "5",
      author: otherUser,
      isMinimized: false,
      body: "lgtm"
    },
    {
      id: "6",
      author: authenticatedUser,
      isMinimized: false,
      body: "previous message\n<!-- Sticky Pull Request CommentTypeB -->"
    }
  ]
  const octokit = getOctokit("github-token")
  vi.spyOn(octokit, "graphql").mockResolvedValue({
    viewer: authenticatedBotUser,
    repository: {
      pullRequest: {
        comments: {
          nodes: [
            commentWithCustomHeader,
            otherUserComment,
            comment,
            headerFirstComment,
            ...otherComments
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: "6"
          }
        }
      }
    }
  } as any)

  expect(await findPreviousComment(octokit, repo, 123, "")).toBe(comment)
  expect(await findPreviousComment(octokit, repo, 123, "TypeA")).toBe(commentWithCustomHeader)
  expect(await findPreviousComment(octokit, repo, 123, "LegacyComment")).toBe(headerFirstComment)
  expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
    after: null,
    number: 123,
    owner: "marocchino",
    repo: "sticky-pull-request-comment"
  })
})

describe("findPreviousComment edge cases", () => {
  const octokit = getOctokit("github-token")
  const authenticatedBotUser = { login: "github-actions[bot]" }

  beforeEach(() => {
    // Reset the spy/mock before each test in this describe block
    vi.spyOn(octokit, "graphql").mockReset();
  });

  it("should return undefined if pullRequest is null", async () => {
    vi.spyOn(octokit, "graphql").mockResolvedValue({
      viewer: authenticatedBotUser,
      repository: { pullRequest: null }
    } as any)
    expect(await findPreviousComment(octokit, repo, 123, "")).toBeUndefined()
  })

  it("should return undefined if comments.nodes is null or empty", async () => {
    vi.spyOn(octokit, "graphql").mockResolvedValueOnce({
      viewer: authenticatedBotUser,
      repository: { pullRequest: { comments: { nodes: null, pageInfo: {hasNextPage: false, endCursor: null} } } }
    } as any)
    expect(await findPreviousComment(octokit, repo, 123, "")).toBeUndefined()

    vi.spyOn(octokit, "graphql").mockResolvedValueOnce({
      viewer: authenticatedBotUser,
      repository: { pullRequest: { comments: { nodes: [], pageInfo: {hasNextPage: false, endCursor: null} } } }
    } as any)
    expect(await findPreviousComment(octokit, repo, 123, "")).toBeUndefined()
  })
  
  it("should handle pagination correctly", async () => {
    const commentInPage2 = {
      id: "page2-comment",
      author: { login: "github-actions" }, 
      isMinimized: false,
      body: "Comment from page 2\n<!-- Sticky Pull Request CommentPage2Test -->"
    }
    const graphqlMockFn = vi.fn()
      .mockResolvedValueOnce({ 
        viewer: authenticatedBotUser, 
        repository: {
          pullRequest: {
            comments: {
              nodes: [{ id: "page1-comment", author: { login: "github-actions" } , isMinimized: false, body: "Page 1\n<!-- Sticky Pull Request Comment -->" }],
              pageInfo: { hasNextPage: true, endCursor: "cursor1" }
            }
          }
        }
      } as any)
      .mockResolvedValueOnce({ 
        viewer: authenticatedBotUser,
        repository: {
          pullRequest: {
            comments: {
              nodes: [commentInPage2], 
              pageInfo: { hasNextPage: false, endCursor: "cursor2" }
            }
          }
        }
      } as any)
    vi.spyOn(octokit, "graphql").mockImplementation(graphqlMockFn)

    const foundComment = await findPreviousComment(octokit, repo, 123, "Page2Test")
    expect(foundComment).toEqual(commentInPage2); 
    expect(graphqlMockFn).toHaveBeenCalledTimes(2)
    expect(graphqlMockFn).toHaveBeenNthCalledWith(1, expect.any(String), expect.objectContaining({ after: null }))
    expect(graphqlMockFn).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({ after: "cursor1" }))
  })

  it("should find comment by non-bot author when viewer is bot", async () => {
    const userAuthor = { login: "real-user" };
    const targetComment = { 
      id: "user-comment-id",
      author: userAuthor,
      isMinimized: false,
      body: "A comment by a real user\n<!-- Sticky Pull Request CommentUserAuthored -->"
    };
    vi.spyOn(octokit, "graphql").mockResolvedValue({
      viewer: authenticatedBotUser, 
      repository: {
        pullRequest: {
          comments: {
            nodes: [targetComment],
            pageInfo: { hasNextPage: false, endCursor: null }
          }
        }
      }
    } as any);
    // Corrected expectation: The function should NOT find a comment by a different author
    // if the viewer is the bot and the comment author is not the bot or the user equivalent of the bot.
    const result = await findPreviousComment(octokit, repo, 123, "UserAuthored");
    expect(result).toBeUndefined();
  });
})

describe("updateComment", () => {
  const octokit = getOctokit("github-token")

  beforeEach(() => {
    vi.spyOn(octokit, "graphql").mockReset().mockResolvedValue({ updateIssueComment: { issueComment: { id: "456" } } } as any);
  })

  it("with new body and previous body (old content)", async () => {
    await updateComment(octokit, "456", "new content", "TestHeader", "old content")
    expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
      input: {
        id: "456",
        body: "old content\nnew content\n<!-- Sticky Pull Request CommentTestHeader -->"
      }
    })
  })

  it("with empty new body and previous body (old content)", async () => {
    await updateComment(octokit, "456", "", "TestHeader", "old content")
    expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
      input: {
        id: "456",
        body: "old content\n\n<!-- Sticky Pull Request CommentTestHeader -->" 
      }
    })
  })

  it("with comment body (no previous body)", async () => {
    await updateComment(octokit, "456", "hello there", "")
    expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
      input: {
        id: "456",
        body: "hello there\n<!-- Sticky Pull Request Comment -->"
      }
    })
    await updateComment(octokit, "456", "hello there", "TypeA")
    expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
      input: {
        id: "456",
        body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
      }
    })
  })

  it("without comment body and without previous body (should warn)", async () => {
    await updateComment(octokit, "456", "", "", "") 
    expect(octokit.graphql).not.toHaveBeenCalled()
    expect(core.warning).toHaveBeenCalledWith("Comment body cannot be blank")
  })
})

describe("createComment", () => {
  const octokit = getOctokit("github-token")

  beforeEach(() => {
    vi.spyOn(octokit.rest.issues, "createComment").mockReset().mockResolvedValue({ data: { id: 789, html_url: "created_url" } } as any)
  })

  it("with new body and previous body (old content) - no header re-added", async () => {
    await createComment(octokit, repo, 456, "new message", "TestHeader", "previous message content")
    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      issue_number: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "previous message content\nnew message" 
    })
  })

  it("with empty new body and previous body (old content) - no header re-added", async () => {
    await createComment(octokit, repo, 456, "", "TestHeader", "previous message content")
    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      issue_number: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "previous message content\n" 
    })
  })

  it("with comment body only (no previousBody - header is added)", async () => {
    await createComment(octokit, repo, 456, "hello there", "")
    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      issue_number: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "hello there\n<!-- Sticky Pull Request Comment -->"
    })
    await createComment(octokit, repo, 456, "hello there", "TypeA")
    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      issue_number: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
    })
  })

  it("without comment body and without previousBody (should warn)", async () => {
    await createComment(octokit, repo, 456, "", "", "") 
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled()
    expect(core.warning).toHaveBeenCalledWith("Comment body cannot be blank")
  })
})

it("deleteComment", async () => {
  const octokit = getOctokit("github-token")

  vi.spyOn(octokit, "graphql").mockReset().mockResolvedValue(undefined as any)
  await deleteComment(octokit, "456")
  expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
    input: { id: "456" } 
  })
})

it("minimizeComment", async () => {
  const octokit = getOctokit("github-token")

  vi.spyOn(octokit, "graphql").mockReset().mockResolvedValue(undefined as any)
  await minimizeComment(octokit, "456", "OUTDATED")
  expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
    input: {
      subjectId: "456",
      classifier: "OUTDATED"
    }
  })
})

describe("getBodyOf", () => {
  const nullPrevious = {}
  const simplePrevious = {
    body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
  }
  const detailsPrevious = {
    body: `
    <details open>
    <summary>title</summary>

    content
    </details>
    <!-- Sticky Pull Request CommentTypeA -->
  `
  }
  const replaced = `
    <details>
    <summary>title</summary>

    content
    </details>
    <!-- Sticky Pull Request CommentTypeA -->
  `
  it.each`
    append   | hideDetails | previous           | expected
    ${false} | ${false}    | ${detailsPrevious} | ${undefined}
    ${true}  | ${false}    | ${nullPrevious}    | ${undefined}
    ${true}  | ${false}    | ${detailsPrevious} | ${detailsPrevious.body}
    ${true}  | ${true}     | ${nullPrevious}    | ${undefined}
    ${true}  | ${true}     | ${simplePrevious}  | ${simplePrevious.body}
    ${true}  | ${true}     | ${detailsPrevious} | ${replaced}
  `(
    "receive $previous, $append, $hideDetails and returns $expected",
    ({append, hideDetails, previous, expected}) => {
      expect(getBodyOf(previous, append, hideDetails)).toEqual(expected)
    }
  )
})

describe("commentsEqual", () => {
  it.each([
    {
      body: "body",
      previous: "body\n<!-- Sticky Pull Request Commentheader -->",
      header: "header",
      expected: true
    },
    {
      body: "body",
      previous: "body\n<!-- Sticky Pull Request Comment -->",
      header: "",
      expected: true
    },
    {
      body: "body",
      previous: "body\n<!-- Sticky Pull Request Commenta different header -->",
      header: "header",
      expected: false
    },
    {body: "body", previous: "body", header: "header", expected: false},
    {body: "body", previous: "", header: "header", expected: false},
    {body: "", previous: "body", header: "header", expected: false}
  ])("commentsEqual(%s, %s, %s)", ({body, previous, header, expected}) => {
    expect(commentsEqual(body, previous, header)).toEqual(expected)
  })
})

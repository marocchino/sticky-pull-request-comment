import {getOctokit} from "@actions/github"
import * as core from "@actions/core"

import {
  createComment,
  deleteComment,
  findPreviousComment,
  getBodyOf,
  updateComment,
  minimizeComment
} from "../src/comment"

jest.mock("@actions/core", () => ({
  warning: jest.fn()
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
  jest.spyOn(octokit, "graphql").mockResolvedValue({
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
  expect(await findPreviousComment(octokit, repo, 123, "TypeA")).toBe(
    commentWithCustomHeader
  )
  expect(await findPreviousComment(octokit, repo, 123, "LegacyComment")).toBe(
    headerFirstComment
  )
  expect(octokit.graphql).toBeCalledWith(expect.any(String), {
    after: null,
    number: 123,
    owner: "marocchino",
    repo: "sticky-pull-request-comment"
  })
})

describe("updateComment", () => {
  const octokit = getOctokit("github-token")

  beforeEach(() => {
    jest.spyOn<any, string>(octokit, "graphql").mockResolvedValue("")
  })

  it("with comment body", async () => {
    expect(
      await updateComment(octokit, "456", "hello there", "")
    ).toBeUndefined()
    expect(octokit.graphql).toBeCalledWith(expect.any(String), {
      input: {
        id: "456",
        body: "hello there\n<!-- Sticky Pull Request Comment -->"
      }
    })
    expect(
      await updateComment(octokit, "456", "hello there", "TypeA")
    ).toBeUndefined()
    expect(octokit.graphql).toBeCalledWith(expect.any(String), {
      input: {
        id: "456",
        body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
      }
    })
    expect(
      await updateComment(
        octokit,
        "456",
        "hello there",
        "TypeA",
        "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
      )
    ).toBeUndefined()
    expect(octokit.graphql).toBeCalledWith(expect.any(String), {
      input: {
        id: "456",
        body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->\nhello there"
      }
    })
  })

  it("without comment body and previous body", async () => {
    expect(await updateComment(octokit, "456", "", "")).toBeUndefined()
    expect(octokit.graphql).not.toBeCalled()
    expect(core.warning).toBeCalledWith("Comment body cannot be blank")
  })
})

describe("createComment", () => {
  const octokit = getOctokit("github-token")

  beforeEach(() => {
    jest
      .spyOn<any, string>(octokit.rest.issues, "createComment")
      .mockResolvedValue("<return value>")
  })

  it("with comment body or previousBody", async () => {
    expect(await createComment(octokit, repo, 456, "hello there", "")).toEqual(
      "<return value>"
    )
    expect(octokit.rest.issues.createComment).toBeCalledWith({
      issue_number: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "hello there\n<!-- Sticky Pull Request Comment -->"
    })
    expect(
      await createComment(octokit, repo, 456, "hello there", "TypeA")
    ).toEqual("<return value>")
    expect(octokit.rest.issues.createComment).toBeCalledWith({
      issue_number: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
    })
  })
  it("without comment body and previousBody", async () => {
    expect(await createComment(octokit, repo, 456, "", "")).toBeUndefined()
    expect(octokit.rest.issues.createComment).not.toBeCalled()
    expect(core.warning).toBeCalledWith("Comment body cannot be blank")
  })
})

it("deleteComment", async () => {
  const octokit = getOctokit("github-token")

  jest.spyOn(octokit, "graphql").mockReturnValue(undefined as any)
  expect(await deleteComment(octokit, "456")).toBeUndefined()
  expect(octokit.graphql).toBeCalledWith(expect.any(String), {
    id: "456"
  })
})

it("minimizeComment", async () => {
  const octokit = getOctokit("github-token")

  jest.spyOn(octokit, "graphql").mockReturnValue(undefined as any)
  expect(await minimizeComment(octokit, "456", "OUTDATED")).toBeUndefined()
  expect(octokit.graphql).toBeCalledWith(expect.any(String), {
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
  test.each`
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

import {getOctokit} from "@actions/github"
import * as core from "@actions/core"

import {
  createComment,
  deleteComment,
  findPreviousComment,
  updateComment
} from "../src/comment"

jest.mock("@actions/core", () => ({
  warning: jest.fn()
}))

const repo = {
  owner: "marocchino",
  repo: "sticky-pull-request-comment"
}
it("findPreviousComment", async () => {
  const authenticatedUser = {
    login: "github-actions[bot]"
  }
  const otherUser = {
    login: "some-user"
  }
  const comment = {
    user: authenticatedUser,
    body: "previous message\n<!-- Sticky Pull Request Comment -->"
  }
  const commentWithCustomHeader = {
    user: authenticatedUser,
    body: "previous message\n<!-- Sticky Pull Request CommentTypeA -->"
  }
  const headerFirstComment = {
    user: authenticatedUser,
    body: "<!-- Sticky Pull Request CommentLegacyComment -->\nheader first message"
  }
  const otherUserComment = {
    user: otherUser,
    body: "Fake previous message\n<!-- Sticky Pull Request Comment -->"
  }
  const otherComments = [
    {
      user: otherUser,
      body: "lgtm"
    },
    {
      user: authenticatedUser,
      body: "previous message\n<!-- Sticky Pull Request CommentTypeB -->"
    }
  ]
  const octokit = getOctokit("github-token")
  jest.spyOn(octokit, "graphql").mockResolvedValue({viewer: authenticatedUser})
  jest.spyOn(octokit.rest.issues, "listComments").mockResolvedValue({
    data: [
      commentWithCustomHeader,
      otherUserComment,
      comment,
      headerFirstComment,
      ...otherComments
    ]
  } as any)

  expect(await findPreviousComment(octokit, repo, 123, "")).toBe(comment)
  expect(await findPreviousComment(octokit, repo, 123, "TypeA")).toBe(
    commentWithCustomHeader
  )
  expect(await findPreviousComment(octokit, repo, 123, "LegacyComment")).toBe(
    headerFirstComment
  )
  expect(octokit.rest.issues.listComments).toBeCalledWith({
    owner: "marocchino",
    repo: "sticky-pull-request-comment",
    issue_number: 123
  })
})

describe("updateComment", () => {
  const octokit = getOctokit("github-token")

  beforeEach(() => {
    jest
      .spyOn<any, string>(octokit.rest.issues, "updateComment")
      .mockResolvedValue("")
  })

  it("with comment body", async () => {
    expect(
      await updateComment(octokit, repo, 456, "hello there", "")
    ).toBeUndefined()
    expect(octokit.rest.issues.updateComment).toBeCalledWith({
      comment_id: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "hello there\n<!-- Sticky Pull Request Comment -->"
    })
    expect(
      await updateComment(octokit, repo, 456, "hello there", "TypeA")
    ).toBeUndefined()
    expect(octokit.rest.issues.updateComment).toBeCalledWith({
      comment_id: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
    })
    expect(
      await updateComment(
        octokit,
        repo,
        456,
        "hello there",
        "TypeA",
        "hello there\n<!-- Sticky Pull Request CommentTypeA -->"
      )
    ).toBeUndefined()
    expect(octokit.rest.issues.updateComment).toBeCalledWith({
      comment_id: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "hello there\n<!-- Sticky Pull Request CommentTypeA -->\nhello there"
    })
  })

  it("without comment body and previous body", async () => {
    expect(await updateComment(octokit, repo, 456, "", "")).toBeUndefined()
    expect(octokit.rest.issues.updateComment).not.toBeCalled()
    expect(core.warning).toBeCalledWith("Comment body cannot be blank")
  })
})

describe("createComment", () => {
  const octokit = getOctokit("github-token")

  beforeEach(() => {
    jest
      .spyOn<any, string>(octokit.rest.issues, "createComment")
      .mockResolvedValue("")
  })

  it("with comment body or previousBody", async () => {
    expect(
      await createComment(octokit, repo, 456, "hello there", "")
    ).toBeUndefined()
    expect(octokit.rest.issues.createComment).toBeCalledWith({
      issue_number: 456,
      owner: "marocchino",
      repo: "sticky-pull-request-comment",
      body: "hello there\n<!-- Sticky Pull Request Comment -->"
    })
    expect(
      await createComment(octokit, repo, 456, "hello there", "TypeA")
    ).toBeUndefined()
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

  jest
    .spyOn(octokit.rest.issues, "deleteComment")
    .mockReturnValue(undefined as any)
  expect(await deleteComment(octokit, repo, 456)).toBeUndefined()
  expect(octokit.rest.issues.deleteComment).toBeCalledWith({
    comment_id: 456,
    owner: "marocchino",
    repo: "sticky-pull-request-comment"
  })
})

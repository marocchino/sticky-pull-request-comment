import {beforeEach, describe, expect, test, vi} from "vitest"

vi.mock("@actions/core", () => ({
  info: vi.fn(),
  setFailed: vi.fn(),
  setOutput: vi.fn(),
}))

vi.mock("@actions/github", () => ({
  getOctokit: vi.fn().mockReturnValue({}),
}))

vi.mock("../src/comment", () => ({
  commentsEqual: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  findPreviousComment: vi.fn(),
  getBodyOf: vi.fn(),
  minimizeComment: vi.fn(),
  updateComment: vi.fn(),
}))

const mockConfig = {
  append: false,
  deleteOldComment: false,
  getBody: vi.fn(),
  githubToken: "some-token",
  header: "",
  hideAndRecreate: false,
  hideClassify: "OUTDATED",
  hideDetails: false,
  hideOldComment: false,
  ignoreEmpty: false,
  onlyCreateComment: false,
  onlyUpdateComment: false,
  pullRequestNumber: 123,
  recreate: false,
  repo: {owner: "marocchino", repo: "sticky-pull-request-comment"},
  skipUnchanged: false,
}

vi.mock("../src/config", () => mockConfig)

const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve, 0))

async function runMain(
  setup?: (mocks: {comment: typeof import("../src/comment")}) => void,
) {
  vi.resetModules()
  const comment = await import("../src/comment")
  vi.mocked(comment.findPreviousComment).mockResolvedValue(null)
  vi.mocked(comment.createComment).mockResolvedValue({data: {id: 456}} as any)
  vi.mocked(comment.deleteComment).mockResolvedValue(undefined)
  vi.mocked(comment.updateComment).mockResolvedValue(undefined)
  vi.mocked(comment.minimizeComment).mockResolvedValue(undefined)
  vi.mocked(comment.commentsEqual).mockReturnValue(false)
  vi.mocked(comment.getBodyOf).mockReturnValue(undefined)
  setup?.({comment})
  await import("../src/main")
  await flushPromises()
  const core = await import("@actions/core")
  return {comment, core}
}

beforeEach(() => {
  mockConfig.append = false
  mockConfig.deleteOldComment = false
  mockConfig.getBody = vi.fn().mockResolvedValue("test body")
  mockConfig.githubToken = "some-token"
  mockConfig.header = ""
  mockConfig.hideAndRecreate = false
  mockConfig.hideClassify = "OUTDATED"
  mockConfig.hideDetails = false
  mockConfig.hideOldComment = false
  mockConfig.ignoreEmpty = false
  mockConfig.onlyCreateComment = false
  mockConfig.onlyUpdateComment = false
  mockConfig.pullRequestNumber = 123
  mockConfig.recreate = false
  mockConfig.repo = {owner: "marocchino", repo: "sticky-pull-request-comment"}
  mockConfig.skipUnchanged = false
})

describe("run", () => {
  test("skips step when pullRequestNumber is NaN", async () => {
    mockConfig.pullRequestNumber = NaN
    const {comment, core} = await runMain()
    expect(core.info).toHaveBeenCalledWith("no pull request numbers given: skip step")
    expect(comment.findPreviousComment).not.toHaveBeenCalled()
  })

  test("skips step when pullRequestNumber is less than 1", async () => {
    mockConfig.pullRequestNumber = 0
    const {comment, core} = await runMain()
    expect(core.info).toHaveBeenCalledWith("no pull request numbers given: skip step")
    expect(comment.findPreviousComment).not.toHaveBeenCalled()
  })

  test("skips step when body is empty and ignoreEmpty is true", async () => {
    mockConfig.getBody = vi.fn().mockResolvedValue("")
    mockConfig.ignoreEmpty = true
    const {comment, core} = await runMain()
    expect(core.info).toHaveBeenCalledWith("no body given: skip step by ignoreEmpty")
    expect(comment.findPreviousComment).not.toHaveBeenCalled()
  })

  test("fails when body is empty and no delete or hide flags are set", async () => {
    mockConfig.getBody = vi.fn().mockResolvedValue("")
    const {core} = await runMain()
    expect(core.setFailed).toHaveBeenCalledWith("Either message or path input is required")
  })

  test("fails when deleteOldComment and recreate are both true", async () => {
    mockConfig.deleteOldComment = true
    mockConfig.recreate = true
    const {core} = await runMain()
    expect(core.setFailed).toHaveBeenCalledWith(
      "delete and recreate cannot be set to true simultaneously",
    )
    expect(mockConfig.getBody).not.toHaveBeenCalled()
  })

  test("fails when deleteOldComment and onlyCreateComment are both true", async () => {
    mockConfig.deleteOldComment = true
    mockConfig.onlyCreateComment = true
    const {core} = await runMain()
    expect(core.setFailed).toHaveBeenCalledWith(
      "delete and only_create cannot be set to true simultaneously",
    )
    expect(mockConfig.getBody).not.toHaveBeenCalled()
  })

  test("fails when deleteOldComment and hideOldComment are both true", async () => {
    mockConfig.deleteOldComment = true
    mockConfig.hideOldComment = true
    const {core} = await runMain()
    expect(core.setFailed).toHaveBeenCalledWith(
      "delete and hide cannot be set to true simultaneously",
    )
    expect(mockConfig.getBody).not.toHaveBeenCalled()
  })

  test("fails when onlyCreateComment and onlyUpdateComment are both true", async () => {
    mockConfig.onlyCreateComment = true
    mockConfig.onlyUpdateComment = true
    const {core} = await runMain()
    expect(core.setFailed).toHaveBeenCalledWith(
      "only_create and only_update cannot be set to true simultaneously",
    )
    expect(mockConfig.getBody).not.toHaveBeenCalled()
  })

  test("fails when hideOldComment and hideAndRecreate are both true", async () => {
    mockConfig.hideOldComment = true
    mockConfig.hideAndRecreate = true
    const {core} = await runMain()
    expect(core.setFailed).toHaveBeenCalledWith(
      "hide and hide_and_recreate cannot be set to true simultaneously",
    )
    expect(mockConfig.getBody).not.toHaveBeenCalled()
  })

  test("fails when deleteOldComment and hideAndRecreate are both true", async () => {
    mockConfig.deleteOldComment = true
    mockConfig.hideAndRecreate = true
    const {core} = await runMain()
    expect(core.setFailed).toHaveBeenCalledWith(
      "delete and hide_and_recreate cannot be set to true simultaneously",
    )
    expect(mockConfig.getBody).not.toHaveBeenCalled()
  })

  test("deletes previous comment when deleteOldComment is true and previous comment exists", async () => {
    mockConfig.deleteOldComment = true
    const previous = {id: "existing-id", body: "old body"}
    const {comment, core} = await runMain(({comment}) => {
      vi.mocked(comment.findPreviousComment).mockResolvedValue(previous as any)
    })
    expect(core.setOutput).toHaveBeenCalledWith("previous_comment_id", "existing-id")
    expect(comment.deleteComment).toHaveBeenCalledWith(expect.anything(), "existing-id")
    expect(comment.createComment).not.toHaveBeenCalled()
    expect(comment.updateComment).not.toHaveBeenCalled()
  })

  test("skips delete when deleteOldComment is true but no previous comment exists", async () => {
    mockConfig.deleteOldComment = true
    const {comment, core} = await runMain()
    expect(core.setOutput).toHaveBeenCalledWith("previous_comment_id", undefined)
    expect(comment.deleteComment).not.toHaveBeenCalled()
    expect(comment.createComment).not.toHaveBeenCalled()
    expect(comment.updateComment).not.toHaveBeenCalled()
  })

  test("Updates previous comment when onlyUpdateComment is true and previous comment exists", async () => {
    mockConfig.onlyUpdateComment = true
    const previous = {id: "existing-id", body: "old body"}
    const {comment, core} = await runMain(({comment}) => {
      vi.mocked(comment.findPreviousComment).mockResolvedValue(previous as any)
      vi.mocked(comment.getBodyOf).mockReturnValue("previous body content")
    })
    expect(comment.updateComment).toHaveBeenCalledWith(
      expect.anything(),
      "existing-id",
      "test body",
      "",
      "previous body content",
    )
    expect(comment.createComment).not.toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenCalledWith("previous_comment_id", "existing-id")
  })

  test("skips creating comment when onlyUpdateComment is true and no previous comment exists", async () => {
    mockConfig.onlyUpdateComment = true
    const {comment} = await runMain()
    expect(comment.createComment).not.toHaveBeenCalled()
    expect(comment.updateComment).not.toHaveBeenCalled()
  })

  test("creates comment when no previous comment exists", async () => {
    const {comment, core} = await runMain()
    expect(comment.createComment).toHaveBeenCalledWith(
      expect.anything(),
      {owner: "marocchino", repo: "sticky-pull-request-comment"},
      123,
      "test body",
      "",
    )
    expect(core.setOutput).toHaveBeenCalledWith("created_comment_id", 456)
  })

  test("skips update when onlyCreateComment is true and previous comment exists", async () => {
    mockConfig.onlyCreateComment = true
    const previous = {id: "existing-id", body: "old body"}
    const {comment} = await runMain(({comment}) => {
      vi.mocked(comment.findPreviousComment).mockResolvedValue(previous as any)
    })
    expect(comment.updateComment).not.toHaveBeenCalled()
    expect(comment.createComment).not.toHaveBeenCalled()
  })

  test("minimizes previous comment when hideOldComment is true", async () => {
    mockConfig.hideOldComment = true
    const previous = {id: "existing-id", body: "old body"}
    const {comment} = await runMain(({comment}) => {
      vi.mocked(comment.findPreviousComment).mockResolvedValue(previous as any)
    })
    expect(comment.minimizeComment).toHaveBeenCalledWith(
      expect.anything(),
      "existing-id",
      "OUTDATED",
    )
    expect(comment.updateComment).not.toHaveBeenCalled()
  })

  test("skips when hideOldComment is true and no previous comment exists", async () => {
    mockConfig.hideOldComment = true
    const {comment} = await runMain()
    expect(comment.minimizeComment).not.toHaveBeenCalled()
    expect(comment.createComment).not.toHaveBeenCalled()
    expect(comment.updateComment).not.toHaveBeenCalled()
  })

  test("skips update when skipUnchanged is true and body is unchanged", async () => {
    mockConfig.skipUnchanged = true
    const previous = {id: "existing-id", body: "old body"}
    const {comment} = await runMain(({comment}) => {
      vi.mocked(comment.findPreviousComment).mockResolvedValue(previous as any)
      vi.mocked(comment.commentsEqual).mockReturnValue(true)
    })
    expect(comment.updateComment).not.toHaveBeenCalled()
    expect(comment.createComment).not.toHaveBeenCalled()
  })

  test("deletes and recreates comment when recreate is true", async () => {
    mockConfig.recreate = true
    const previous = {id: "existing-id", body: "old body"}
    const {comment, core} = await runMain(({comment}) => {
      vi.mocked(comment.findPreviousComment).mockResolvedValue(previous as any)
      vi.mocked(comment.getBodyOf).mockReturnValue("previous body content")
    })
    expect(comment.deleteComment).toHaveBeenCalledWith(expect.anything(), "existing-id")
    expect(comment.createComment).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "test body",
      "",
      "previous body content",
    )
    expect(core.setOutput).toHaveBeenCalledWith("created_comment_id", 456)
  })

  test("minimizes and recreates comment when hideAndRecreate is true", async () => {
    mockConfig.hideAndRecreate = true
    const previous = {id: "existing-id", body: "old body"}
    const {comment, core} = await runMain(({comment}) => {
      vi.mocked(comment.findPreviousComment).mockResolvedValue(previous as any)
    })
    expect(comment.minimizeComment).toHaveBeenCalledWith(
      expect.anything(),
      "existing-id",
      "OUTDATED",
    )
    expect(comment.createComment).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "test body",
      "",
    )
    expect(core.setOutput).toHaveBeenCalledWith("created_comment_id", 456)
  })

  test("updates existing comment by default", async () => {
    const previous = {id: "existing-id", body: "old body"}
    const {comment} = await runMain(({comment}) => {
      vi.mocked(comment.findPreviousComment).mockResolvedValue(previous as any)
      vi.mocked(comment.getBodyOf).mockReturnValue("previous body content")
    })
    expect(comment.updateComment).toHaveBeenCalledWith(
      expect.anything(),
      "existing-id",
      "test body",
      "",
      "previous body content",
    )
  })
})

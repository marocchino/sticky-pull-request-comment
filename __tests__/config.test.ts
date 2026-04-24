import {afterEach, describe, expect, test, vi} from "vitest"
import {resolve} from "node:path"

vi.mock("@actions/core", () => ({
  getInput: vi.fn().mockReturnValue(""),
  getBooleanInput: vi.fn().mockReturnValue(false),
  getMultilineInput: vi.fn().mockReturnValue([]),
  setFailed: vi.fn(),
}))

const mockContext = vi.hoisted(() => ({
  repo: {owner: "marocchino", repo: "sticky-pull-request-comment"},
  payload: {} as Record<string, unknown>,
}))

vi.mock("@actions/github", () => ({
  context: mockContext,
}))

const mockGlobCreate = vi.hoisted(() => vi.fn())

vi.mock("@actions/glob", () => ({
  create: mockGlobCreate,
}))

afterEach(() => {
  mockContext.payload = {}
  mockContext.repo = {owner: "marocchino", repo: "sticky-pull-request-comment"}
  mockGlobCreate.mockReset()
})

async function loadConfig(
  setup?: (mocks: {core: typeof import("@actions/core")}) => void,
) {
  vi.resetModules()
  const core = await import("@actions/core")
  // vi.resetModules clears the config module cache but not mock instances,
  // so reset core back to default values before each test.
  vi.mocked(core.getInput).mockReturnValue("")
  vi.mocked(core.getBooleanInput).mockReturnValue(false)
  vi.mocked(core.getMultilineInput).mockReturnValue([])
  setup?.({core})
  const config = await import("../src/config")
  return {config, core}
}

describe("pullRequestNumber", () => {
  test("number_force takes highest priority", async () => {
    mockContext.payload = {pull_request: {number: 789}}
    const {config} = await loadConfig(({core}) => {
      vi.mocked(core.getInput).mockImplementation(name => {
        if (name === "number_force") return "456"
        if (name === "number") return "123"
        return ""
      })
    })
    expect(config.pullRequestNumber).toBe(456)
  })

  test("falls back to context.payload.pull_request.number", async () => {
    mockContext.payload = {pull_request: {number: 789}}
    const {config} = await loadConfig()
    expect(config.pullRequestNumber).toBe(789)
  })

  test("falls back to number input", async () => {
    const {config} = await loadConfig(({core}) => {
      vi.mocked(core.getInput).mockImplementation(name => (name === "number" ? "123" : ""))
    })
    expect(config.pullRequestNumber).toBe(123)
  })
})

describe("repo", () => {
  test("defaults to context.repo", async () => {
    const {config} = await loadConfig()
    expect(config.repo).toEqual({owner: "marocchino", repo: "sticky-pull-request-comment"})
  })

  test("uses owner and repo inputs when provided", async () => {
    const {config} = await loadConfig(({core}) => {
      vi.mocked(core.getInput).mockImplementation(name => {
        if (name === "owner") return "jin"
        if (name === "repo") return "other"
        return ""
      })
    })
    expect(config.repo).toEqual({owner: "jin", repo: "other"})
  })
})

test("header", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getInput).mockImplementation(name => (name === "header" ? "my-header" : ""))
  })
  expect(config.header).toBe("my-header")
})

test("append", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getBooleanInput).mockImplementation(name => name === "append")
  })
  expect(config.append).toBe(true)
})

test("recreate", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getBooleanInput).mockImplementation(name => name === "recreate")
  })
  expect(config.recreate).toBe(true)
})

test("deleteOldComment", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getBooleanInput).mockImplementation(name => name === "delete")
  })
  expect(config.deleteOldComment).toBe(true)
})

test("hideOldComment", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getBooleanInput).mockImplementation(name => name === "hide")
  })
  expect(config.hideOldComment).toBe(true)
})

test("hideAndRecreate", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getBooleanInput).mockImplementation(name => name === "hide_and_recreate")
  })
  expect(config.hideAndRecreate).toBe(true)
})

test("hideClassify", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getInput).mockImplementation(name => (name === "hide_classify" ? "OFF_TOPIC" : ""))
  })
  expect(config.hideClassify).toBe("OFF_TOPIC")
})

test("hideDetails", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getBooleanInput).mockImplementation(name => name === "hide_details")
  })
  expect(config.hideDetails).toBe(true)
})

test("ignoreEmpty", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getBooleanInput).mockImplementation(name => name === "ignore_empty")
  })
  expect(config.ignoreEmpty).toBe(true)
})

test("skipUnchanged", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getBooleanInput).mockImplementation(name => name === "skip_unchanged")
  })
  expect(config.skipUnchanged).toBe(true)
})

test("githubToken", async () => {
  const {config} = await loadConfig(({core}) => {
    vi.mocked(core.getInput).mockImplementation(name => (name === "GITHUB_TOKEN" ? "my-token" : ""))
  })
  expect(config.githubToken).toBe("my-token")
})

describe("getBody", () => {
  test("returns message when no path is provided", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getInput).mockImplementation(name => (name === "message" ? "hello there" : ""))
    expect(await config.getBody()).toBe("hello there")
  })

  test("returns file content when path exists", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getMultilineInput).mockReturnValue(["__tests__/assets/result"])
    mockGlobCreate.mockResolvedValue({
      glob: vi.fn().mockResolvedValue([resolve("__tests__/assets/result")]),
    })
    expect(await config.getBody()).toBe("hi there\n")
  })

  test("glob matches multiple files", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getMultilineInput).mockReturnValue(["__tests__/assets/*"])
    mockGlobCreate.mockResolvedValue({
      glob: vi
        .fn()
        .mockResolvedValue([
          resolve("__tests__/assets/result"),
          resolve("__tests__/assets/result2"),
        ]),
    })
    expect(await config.getBody()).toBe("hi there\n\nhey there\n")
  })

  test("returns empty string when path matches no files", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getMultilineInput).mockReturnValue(["__tests__/assets/not_exists"])
    mockGlobCreate.mockResolvedValue({glob: vi.fn().mockResolvedValue([])})
    expect(await config.getBody()).toBe("")
  })

  test("returns empty string and calls setFailed when glob throws", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getMultilineInput).mockReturnValue(["__tests__/assets/result"])
    mockGlobCreate.mockRejectedValue(new Error("glob error"))
    expect(await config.getBody()).toBe("")
    expect(core.setFailed).toHaveBeenCalledWith("glob error")
  })

  test("embeds file content in message when {{{content}}} placeholder is used", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getMultilineInput).mockReturnValue(["__tests__/assets/result"])
    vi.mocked(core.getInput).mockImplementation(name => {
      if (name === "message") return "```\n{{{content}}}\n```"
      return ""
    })
    mockGlobCreate.mockResolvedValue({
      glob: vi.fn().mockResolvedValue([resolve("__tests__/assets/result")]),
    })
    expect(await config.getBody()).toBe("```\nhi there\n\n```")
  })

  test("replaces {{{content}}} in message with file content", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getMultilineInput).mockReturnValue(["__tests__/assets/result"])
    vi.mocked(core.getInput).mockImplementation(name => {
      if (name === "message") return "{{{content}}}\n---\n{{{content}}}"
      return ""
    })
    mockGlobCreate.mockResolvedValue({
      glob: vi.fn().mockResolvedValue([resolve("__tests__/assets/result")]),
    })
    expect(await config.getBody()).toBe("hi there\n\n---\n{{{content}}}")
  })

  test("uses message as body when path is provided but message has no {{{content}}} placeholder", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getMultilineInput).mockReturnValue(["__tests__/assets/result"])
    vi.mocked(core.getInput).mockImplementation(name => {
      if (name === "message") return "no placeholder here"
      return ""
    })
    mockGlobCreate.mockResolvedValue({
      glob: vi.fn().mockResolvedValue([resolve("__tests__/assets/result")]),
    })
    expect(await config.getBody()).toBe("no placeholder here")
  })

  test("embeds multiple files content in message when {{{content}}} placeholder is used", async () => {
    const {config, core} = await loadConfig()
    vi.mocked(core.getMultilineInput).mockReturnValue(["__tests__/assets/*"])
    vi.mocked(core.getInput).mockImplementation(name => {
      if (name === "message") return "```\n{{{content}}}\n```"
      return ""
    })
    mockGlobCreate.mockResolvedValue({
      glob: vi
        .fn()
        .mockResolvedValue([
          resolve("__tests__/assets/result"),
          resolve("__tests__/assets/result2"),
        ]),
    })
    expect(await config.getBody()).toBe("```\nhi there\n\nhey there\n\n```")
  })
})

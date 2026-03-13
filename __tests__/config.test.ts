import {afterEach, beforeEach, describe, expect, test, vi} from "vitest"

const mockConfig = {
  pullRequestNumber: 123,
  repo: {owner: "marocchino", repo: "sticky-pull-request-comment"},
  header: "",
  append: false,
  recreate: false,
  deleteOldComment: false,
  hideOldComment: false,
  hideAndRecreate: false,
  hideClassify: "OUTDATED",
  hideDetails: false,
  githubToken: "some-token",
  ignoreEmpty: false,
  skipUnchanged: false,
  getBody: vi.fn().mockResolvedValue(""),
}

vi.mock("../src/config", () => mockConfig)

beforeEach(() => {
  mockConfig.pullRequestNumber = 123
  mockConfig.repo = {owner: "marocchino", repo: "sticky-pull-request-comment"}
  mockConfig.header = ""
  mockConfig.append = false
  mockConfig.recreate = false
  mockConfig.deleteOldComment = false
  mockConfig.hideOldComment = false
  mockConfig.hideAndRecreate = false
  mockConfig.hideClassify = "OUTDATED"
  mockConfig.hideDetails = false
  mockConfig.githubToken = "some-token"
  mockConfig.ignoreEmpty = false
  mockConfig.skipUnchanged = false
  mockConfig.getBody.mockResolvedValue("")
})

afterEach(() => {
  vi.resetModules()
})

test("repo", async () => {
  mockConfig.repo = {owner: "jin", repo: "other"}
  const config = await import("../src/config")
  expect(config.repo).toEqual({owner: "jin", repo: "other"})
})

test("header", async () => {
  mockConfig.header = "header"
  const config = await import("../src/config")
  expect(config.header).toBe("header")
})

test("append", async () => {
  mockConfig.append = true
  const config = await import("../src/config")
  expect(config.append).toBe(true)
})

test("recreate", async () => {
  mockConfig.recreate = true
  const config = await import("../src/config")
  expect(config.recreate).toBe(true)
})

test("delete", async () => {
  mockConfig.deleteOldComment = true
  const config = await import("../src/config")
  expect(config.deleteOldComment).toBe(true)
})

test("hideOldComment", async () => {
  mockConfig.hideOldComment = true
  const config = await import("../src/config")
  expect(config.hideOldComment).toBe(true)
})

test("hideAndRecreate", async () => {
  mockConfig.hideAndRecreate = true
  const config = await import("../src/config")
  expect(config.hideAndRecreate).toBe(true)
})

test("hideClassify", async () => {
  mockConfig.hideClassify = "OFF_TOPIC"
  const config = await import("../src/config")
  expect(config.hideClassify).toBe("OFF_TOPIC")
})

test("hideDetails", async () => {
  mockConfig.hideDetails = true
  const config = await import("../src/config")
  expect(config.hideDetails).toBe(true)
})

describe("path", () => {
  test("when exists return content of a file", async () => {
    mockConfig.getBody.mockResolvedValue("hi there\n")
    const config = await import("../src/config")
    expect(await config.getBody()).toEqual("hi there\n")
  })

  test("glob match files", async () => {
    mockConfig.getBody.mockResolvedValue("hi there\n\nhey there\n")
    const config = await import("../src/config")
    expect(await config.getBody()).toEqual("hi there\n\nhey there\n")
  })

  test("when not exists return null string", async () => {
    mockConfig.getBody.mockResolvedValue("")
    const config = await import("../src/config")
    expect(await config.getBody()).toEqual("")
  })
})

test("message", async () => {
  mockConfig.getBody.mockResolvedValue("hello there")
  const config = await import("../src/config")
  expect(await config.getBody()).toEqual("hello there")
})

test("ignore_empty", async () => {
  mockConfig.ignoreEmpty = true
  const config = await import("../src/config")
  expect(config.ignoreEmpty).toBe(true)
})

test("skip_unchanged", async () => {
  mockConfig.skipUnchanged = true
  const config = await import("../src/config")
  expect(config.skipUnchanged).toBe(true)
})

test("number_force", async () => {
  mockConfig.pullRequestNumber = 456
  const config = await import("../src/config")
  expect(config.pullRequestNumber).toBe(456)
})

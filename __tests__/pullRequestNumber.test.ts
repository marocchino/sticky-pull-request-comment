import {afterEach, describe, expect, test, vi} from "vitest"

const mockGetInput = vi.fn().mockReturnValue("")

vi.mock("@actions/core", () => ({
  getInput: mockGetInput,
  getBooleanInput: vi.fn().mockReturnValue(false),
  getMultilineInput: vi.fn().mockReturnValue([]),
  setFailed: vi.fn(),
  info: vi.fn(),
}))

const mockContext: {payload: Record<string, unknown>; repo: {owner: string; repo: string}} = {
  payload: {},
  repo: {owner: "marocchino", repo: "sticky-pull-request-comment"},
}

vi.mock("@actions/github", () => ({
  context: mockContext,
}))

vi.mock("@actions/glob", () => ({
  create: vi.fn(),
}))

afterEach(() => {
  vi.resetModules()
  mockContext.payload = {}
  mockGetInput.mockReturnValue("")
})

describe("pullRequestNumber priority", () => {
  test("uses number_force when set, overriding pull_request event number", async () => {
    mockContext.payload = {pull_request: {number: 100}}
    mockGetInput.mockImplementation((name: string) => {
      if (name === "number_force") return "999"
      if (name === "number") return "200"
      return ""
    })

    const {pullRequestNumber} = await import("../src/config")
    expect(pullRequestNumber).toBe(999)
  })

  test("uses number_force when set, overriding number input", async () => {
    mockContext.payload = {}
    mockGetInput.mockImplementation((name: string) => {
      if (name === "number_force") return "999"
      if (name === "number") return "200"
      return ""
    })

    const {pullRequestNumber} = await import("../src/config")
    expect(pullRequestNumber).toBe(999)
  })

  test("uses pull_request event number when number_force is not set", async () => {
    mockContext.payload = {pull_request: {number: 100}}
    mockGetInput.mockImplementation((name: string) => {
      if (name === "number") return "200"
      return ""
    })

    const {pullRequestNumber} = await import("../src/config")
    expect(pullRequestNumber).toBe(100)
  })

  test("uses number input when number_force and pull_request event number are not set", async () => {
    mockContext.payload = {}
    mockGetInput.mockImplementation((name: string) => {
      if (name === "number") return "200"
      return ""
    })

    const {pullRequestNumber} = await import("../src/config")
    expect(pullRequestNumber).toBe(200)
  })

  test("returns 0 when none of number_force, pull_request number, or number are set", async () => {
    mockContext.payload = {}
    mockGetInput.mockReturnValue("")

    const {pullRequestNumber} = await import("../src/config")
    expect(pullRequestNumber).toBe(0)
  })
})

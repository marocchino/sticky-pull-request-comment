beforeEach(() => {
  process.env["GITHUB_REPOSITORY"] = "marocchino/stick-pull-request-comment"
  process.env["INPUT_NUMBER"] = "123"
  process.env["INPUT_APPEND"] = "false"
  process.env["INPUT_RECREATE"] = "false"
  process.env["INPUT_DELETE"] = "false"
  process.env["INPUT_HIDE"] = "false"
  process.env["INPUT_HIDE_AND_RECREATE"] = "false"
  process.env["INPUT_HIDE_CLASSIFY"] = "OUTDATED"
  process.env["INPUT_HIDE_DETAILS"] = "false"
  process.env["INPUT_GITHUB_TOKEN"] = "some-token"
})

afterEach(() => {
  jest.resetModules()
  delete process.env["GITHUB_REPOSITORY"]
  delete process.env["INPUT_REPO"]
  delete process.env["INPUT_HEADER"]
  delete process.env["INPUT_MESSAGE"]
  delete process.env["INPUT_NUMBER"]
  delete process.env["INPUT_APPEND"]
  delete process.env["INPUT_RECREATE"]
  delete process.env["INPUT_DELETE"]
  delete process.env["INPUT_HIDE"]
  delete process.env["INPUT_HIDE_AND_RECREATE"]
  delete process.env["INPUT_HIDE_CLASSIFY"]
  delete process.env["INPUT_HIDE_DETAILS"]
  delete process.env["INPUT_GITHUB_TOKEN"]
  delete process.env["INPUT_PATH"]
})

test("repo", () => {
  process.env["INPUT_REPO"] = "other"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "other"},
    body: "",
    header: "",
    append: false,
    recreate: false,
    deleteOldComment: false,
    hideOldComment: false,
    hideAndRecreate: false,
    hideClassify: "OUTDATED",
    hideDetails: false,
    githubToken: "some-token"
  })
})
test("header", () => {
  process.env["INPUT_HEADER"] = "header"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "",
    header: "header",
    append: false,
    recreate: false,
    deleteOldComment: false,
    hideOldComment: false,
    hideAndRecreate: false,
    hideClassify: "OUTDATED",
    hideDetails: false,
    githubToken: "some-token"
  })
})
test("append", () => {
  process.env["INPUT_APPEND"] = "true"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "",
    header: "",
    append: true,
    recreate: false,
    deleteOldComment: false,
    hideOldComment: false,
    hideAndRecreate: false,
    hideClassify: "OUTDATED",
    hideDetails: false,
    githubToken: "some-token"
  })
})
test("recreate", () => {
  process.env["INPUT_RECREATE"] = "true"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "",
    header: "",
    append: false,
    recreate: true,
    deleteOldComment: false,
    hideOldComment: false,
    hideAndRecreate: false,
    hideClassify: "OUTDATED",
    hideDetails: false,
    githubToken: "some-token"
  })
})
test("delete", () => {
  process.env["INPUT_DELETE"] = "true"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "",
    header: "",
    append: false,
    recreate: false,
    deleteOldComment: true,
    hideOldComment: false,
    hideAndRecreate: false,
    hideClassify: "OUTDATED",
    hideDetails: false,
    githubToken: "some-token"
  })
})
test("hideOldComment", () => {
  process.env["INPUT_HIDE"] = "true"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "",
    header: "",
    append: false,
    recreate: false,
    deleteOldComment: false,
    hideOldComment: true,
    hideAndRecreate: false,
    hideClassify: "OUTDATED",
    hideDetails: false,
    githubToken: "some-token"
  })
})
test("hideAndRecreate", () => {
  process.env["INPUT_HIDE_AND_RECREATE"] = "true"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "",
    header: "",
    append: false,
    recreate: false,
    deleteOldComment: false,
    hideOldComment: false,
    hideAndRecreate: true,
    hideClassify: "OUTDATED",
    hideDetails: false,
    githubToken: "some-token"
  })
})
test("hideClassify", () => {
  process.env["INPUT_HIDE_CLASSIFY"] = "OFF_TOPIC"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "",
    header: "",
    append: false,
    recreate: false,
    deleteOldComment: false,
    hideOldComment: false,
    hideAndRecreate: false,
    hideClassify: "OFF_TOPIC",
    hideDetails: false,
    githubToken: "some-token"
  })
})
test("hideDetails", () => {
  process.env["INPUT_HIDE_DETAILS"] = "true"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "",
    header: "",
    append: false,
    recreate: false,
    deleteOldComment: false,
    hideOldComment: false,
    hideAndRecreate: false,
    hideClassify: "OUTDATED",
    hideDetails: true,
    githubToken: "some-token"
  })
})
describe("path", () => {
  test("when exists return content of a file", () => {
    process.env["INPUT_PATH"] = "./__tests__/assets/result"
    expect(require("../src/config")).toMatchObject({
      pullRequestNumber: expect.any(Number),
      repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
      body: "hi there\n",
      header: "",
      append: false,
      recreate: false,
      deleteOldComment: false,
      hideOldComment: false,
      hideAndRecreate: false,
      hideClassify: "OUTDATED",
      hideDetails: false,
      githubToken: "some-token"
    })
  })

  test("when not exists return null string", () => {
    process.env["INPUT_PATH"] = "./__tests__/assets/not_exists"
    expect(require("../src/config")).toMatchObject({
      pullRequestNumber: expect.any(Number),
      repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
      body: "",
      header: "",
      append: false,
      recreate: false,
      deleteOldComment: false,
      hideOldComment: false,
      hideAndRecreate: false,
      hideClassify: "OUTDATED",
      hideDetails: false,
      githubToken: "some-token"
    })
  })
})

test("message", () => {
  process.env["INPUT_MESSAGE"] = "hello there"
  expect(require("../src/config")).toMatchObject({
    pullRequestNumber: expect.any(Number),
    repo: {owner: "marocchino", repo: "stick-pull-request-comment"},
    body: "hello there",
    header: "",
    append: false,
    recreate: false,
    deleteOldComment: false,
    hideOldComment: false,
    hideAndRecreate: false,
    hideClassify: "OUTDATED",
    hideDetails: false,
    githubToken: "some-token"
  })
})

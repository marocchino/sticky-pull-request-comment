import {describe, expect, test} from "vitest"
import {validateBody, validateExclusiveModes} from "../src/validate"

describe("validateBody", () => {
  test("throws when body is empty and neither delete nor hide is set", () => {
    expect(() => validateBody("", false, false)).toThrow(
      "Either message or path input is required",
    )
  })

  test("does not throw when body is provided", () => {
    expect(() => validateBody("some body", false, false)).not.toThrow()
  })

  test("does not throw when body is empty but deleteOldComment is true", () => {
    expect(() => validateBody("", true, false)).not.toThrow()
  })

  test("does not throw when body is empty but hideOldComment is true", () => {
    expect(() => validateBody("", false, true)).not.toThrow()
  })
})

describe("validateExclusiveModes", () => {
  test("does not throw when no modes are enabled", () => {
    expect(() => validateExclusiveModes(false, false, false, false, false, false)).not.toThrow()
  })

  test("does not throw when exactly one mode is enabled", () => {
    expect(() => validateExclusiveModes(true, false, false, false, false, false)).not.toThrow()
    expect(() => validateExclusiveModes(false, true, false, false, false, false)).not.toThrow()
    expect(() => validateExclusiveModes(false, false, true, false, false, false)).not.toThrow()
    expect(() => validateExclusiveModes(false, false, false, true, false, false)).not.toThrow()
    expect(() => validateExclusiveModes(false, false, false, false, true, false)).not.toThrow()
    expect(() => validateExclusiveModes(false, false, false, false, false, true)).not.toThrow()
  })

  test("throws when delete and recreate are both true", () => {
    expect(() => validateExclusiveModes(true, true, false, false, false, false)).toThrow(
      "delete and recreate cannot be set to true simultaneously",
    )
  })

  test("throws when delete and only_create are both true", () => {
    expect(() => validateExclusiveModes(true, false, true, false, false, false)).toThrow(
      "delete and only_create cannot be set to true simultaneously",
    )
  })

  test("throws when delete and only_update are both true", () => {
    expect(() => validateExclusiveModes(true, false, false, true, false, false)).toThrow(
      "delete and only_update cannot be set to true simultaneously",
    )
  })

  test("throws when delete and hide are both true", () => {
    expect(() => validateExclusiveModes(true, false, false, false, true, false)).toThrow(
      "delete and hide cannot be set to true simultaneously",
    )
  })

  test("throws when delete and hide_and_recreate are both true", () => {
    expect(() => validateExclusiveModes(true, false, false, false, false, true)).toThrow(
      "delete and hide_and_recreate cannot be set to true simultaneously",
    )
  })

  test("throws when only_create and only_update are both true", () => {
    expect(() => validateExclusiveModes(false, false, true, true, false, false)).toThrow(
      "only_create and only_update cannot be set to true simultaneously",
    )
  })

  test("throws when hide and hide_and_recreate are both true", () => {
    expect(() => validateExclusiveModes(false, false, false, false, true, true)).toThrow(
      "hide and hide_and_recreate cannot be set to true simultaneously",
    )
  })

  test("uses Oxford comma when three or more modes are enabled", () => {
    expect(() => validateExclusiveModes(true, true, true, false, false, false)).toThrow(
      "delete, recreate, and only_create cannot be set to true simultaneously",
    )
  })
})

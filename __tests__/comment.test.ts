import {
  findPreviousComment,
  createComment,
  updateComment,
  deleteComment
} from '../src/comment'

import * as core from '@actions/core'

jest.mock('@actions/core', () => ({
  warning: jest.fn()
}))

const repo = {
  owner: 'marocchino',
  repo: 'sticky-pull-request-comment'
}
it('findPreviousComment', async () => {
  const comment = {
    user: {
      login: 'github-actions[bot]'
    },
    body: 'previous message\n<!-- Sticky Pull Request Comment -->'
  }
  const commentWithCustomHeader = {
    user: {
      login: 'github-actions[bot]'
    },
    body: 'previous message\n<!-- Sticky Pull Request CommentTypeA -->'
  }
  const headerFirstComment = {
    user: {
      login: 'github-actions[bot]'
    },
    body: '<!-- Sticky Pull Request CommentLegacyComment -->\nheader first message'
  }
  const otherComments = [
    {
      user: {
        login: 'some-user'
      },
      body: 'lgtm'
    },
    {
      user: {
        login: 'github-actions[bot]'
      },
      body: 'previous message\n<!-- Sticky Pull Request CommentTypeB -->'
    }
  ]
  const octokit: any = {
    issues: {
      listComments: jest.fn(() =>
        Promise.resolve({
          data: [
            commentWithCustomHeader,
            comment,
            headerFirstComment,
            ...otherComments
          ]
        })
      )
    }
  }

  expect(await findPreviousComment(octokit, repo, 123, '')).toBe(comment)
  expect(await findPreviousComment(octokit, repo, 123, 'TypeA')).toBe(
    commentWithCustomHeader
  )
  expect(await findPreviousComment(octokit, repo, 123, 'LegacyComment')).toBe(
    headerFirstComment
  )
  expect(octokit.issues.listComments).toBeCalledWith({
    owner: 'marocchino',
    repo: 'sticky-pull-request-comment',
    issue_number: 123
  })
})

describe('updateComment', () => {
  let octokit

  beforeEach(() => {
    octokit = {
      issues: {
        updateComment: jest.fn(() => Promise.resolve())
      }
    }
  })

  it('with comment body', async () => {
    expect(
      await updateComment(octokit, repo, 456, 'hello there', '')
    ).toBeUndefined()
    expect(octokit.issues.updateComment).toBeCalledWith({
      comment_id: 456,
      owner: 'marocchino',
      repo: 'sticky-pull-request-comment',
      body: 'hello there\n<!-- Sticky Pull Request Comment -->'
    })
    expect(
      await updateComment(octokit, repo, 456, 'hello there', 'TypeA')
    ).toBeUndefined()
    expect(octokit.issues.updateComment).toBeCalledWith({
      comment_id: 456,
      owner: 'marocchino',
      repo: 'sticky-pull-request-comment',
      body: 'hello there\n<!-- Sticky Pull Request CommentTypeA -->'
    })
    expect(
      await updateComment(
        octokit,
        repo,
        456,
        'hello there',
        'TypeA',
        'hello there\n<!-- Sticky Pull Request CommentTypeA -->'
      )
    ).toBeUndefined()
    expect(octokit.issues.updateComment).toBeCalledWith({
      comment_id: 456,
      owner: 'marocchino',
      repo: 'sticky-pull-request-comment',
      body: 'hello there\n<!-- Sticky Pull Request CommentTypeA -->\nhello there'
    })
  })

  it('without comment body and previousbody', async () => {
    expect(await updateComment(octokit, repo, 456, '', '')).toBeUndefined()
    expect(octokit.issues.updateComment).not.toBeCalled()
    expect(core.warning).toBeCalledWith('Comment body cannot be blank')
  })
})

describe('createComment', () => {
  let octokit

  beforeEach(() => {
    octokit = {
      issues: {
        createComment: jest.fn(() => Promise.resolve())
      }
    }
  })

  it('with comment body or previousBody', async () => {
    expect(
      await createComment(octokit, repo, 456, 'hello there', '')
    ).toBeUndefined()
    expect(octokit.issues.createComment).toBeCalledWith({
      issue_number: 456,
      owner: 'marocchino',
      repo: 'sticky-pull-request-comment',
      body: 'hello there\n<!-- Sticky Pull Request Comment -->'
    })
    expect(
      await createComment(octokit, repo, 456, 'hello there', 'TypeA')
    ).toBeUndefined()
    expect(octokit.issues.createComment).toBeCalledWith({
      issue_number: 456,
      owner: 'marocchino',
      repo: 'sticky-pull-request-comment',
      body: 'hello there\n<!-- Sticky Pull Request CommentTypeA -->'
    })
  })
  it('without comment body and previousBody', async () => {
    expect(await createComment(octokit, repo, 456, '', '')).toBeUndefined()
    expect(octokit.issues.createComment).not.toBeCalled()
    expect(core.warning).toBeCalledWith('Comment body cannot be blank')
  })
})

it('deleteComment', async () => {
  const octokit: any = {
    issues: {
      deleteComment: jest.fn(() => Promise.resolve())
    }
  }
  expect(await deleteComment(octokit, repo, 456)).toBeUndefined()
  expect(octokit.issues.deleteComment).toBeCalledWith({
    comment_id: 456,
    owner: 'marocchino',
    repo: 'sticky-pull-request-comment'
  })
})

import * as process from 'process'

test('test runs', () => {
  process.env['INPUT_HEADER'] = ''
  process.env['INPUT_APPEND'] = 'false'
  process.env['INPUT_RECREATE'] = 'false'
  process.env['INPUT_DELETE'] = 'false'
  process.env['INPUT_GITHUB_TOKEN'] = 'some-token'
  process.env['GITHUB_REPOSITORY'] = 'marocchino/stick-pull-request-comment'
  expect(require('../src/config')).toEqual({
    pullRequestNumber: 0,
    repo: {owner: 'marocchino', repo: 'stick-pull-request-comment'},
    message: '',
    path: '',
    header: '',
    append: false,
    recreate: false,
    deleteOldComment: false,
    githubToken: 'some-token'
  })
})

# Sticky Pull Request Comment

Create comment on pull request, if exists update that comment.
This library runs with GitHub Actions. If you feel that the example grammar below is not friendly enough, we recommend reading [this page](https://docs.github.com/en/actions) first.

## Usage

### Basic

```yaml
uses: marocchino/sticky-pull-request-comment@v2
with:
  message: |
    Release ${{ github.sha }} to <https://pr-${{ github.event.number }}.example.com>
```

### Keep more than one comment

In some cases, different actions may require different comments. The header allows you to maintain comments independently.

```yaml
release:
  ...
  - uses: marocchino/sticky-pull-request-comment@v2
    with:
      header: release
      message: |
        Release ${{ github.sha }} to <https://pr-${{ github.event.number }}.example.com>

test:
  ...
  - name: Run Test
    id: test
    run: |
      OUTPUT=$(rake test)
      OUTPUT="${OUTPUT//'%'/'%25'}​【7,6 m】"
      OUTPUT="${OUTPUT//$'\n'/'%0A'}"
      OUTPUT="${OUTPUT//$'\r'/'%0D'}"
      echo "::set-output name=result::$OUTPUT"
  - uses: marocchino/sticky-pull-request-comment@v2
    with:
      header: test
      message: |
        ```
        ${{ steps.test.outputs.result }}
        ```
```

### Append after comment every time it runs

```yaml
test:
  ...
  - name: Run Test
    id: test
    run: |
      OUTPUT=$(rake test)
      OUTPUT="${OUTPUT//'%'/'%25'}​【7,6 m】"
      OUTPUT="${OUTPUT//$'\n'/'%0A'}"
      OUTPUT="${OUTPUT//$'\r'/'%0D'}"
      echo "::set-output name=result::$OUTPUT"
  - uses: marocchino/sticky-pull-request-comment@v2
    with:
      append: true
      message: |
        Test with ${{ github.sha }}.
        ```
        ${{ steps.test.outputs.result }}
        ```
```

### Comment from push

If for some reason, triggering on pr is not possible, you can use push.

```yaml
- uses: jwalton/gh-find-current-pr@v1
  id: finder
- uses: marocchino/sticky-pull-request-comment@v2
  with:
    number: ${{ steps.finder.outputs.pr }}
    message: |
      Test ${{ github.sha }} is successfully ended.
      This is message from push.
```

### Read comment from a file

```yaml
uses: marocchino/sticky-pull-request-comment@v2
with:
  path: path-to-comment-contents.txt
```

### Delete previous commit and add comment at bottom

```yaml
uses: marocchino/sticky-pull-request-comment@v2
with:
  recreate: true
  message: |
    Release ${{ github.sha }} to <https://pr-${{ github.event.number }}.example.com>
```

### Delete previous comment

```yaml
uses: marocchino/sticky-pull-request-comment@v2
with:
  delete: true
```

### Error: Resource not accessible by integration

This library require write permission of repo. that message means requester has
not enough permission. The solution is to split the workflow between the part
that can be executed with only read privileges and the part that writes comments.
See [this article](https://securitylab.github.com/research/github-actions-preventing-pwn-requests)
for more information, and see below example for solution:

```yaml
# test.yml
name: Test
on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: |
          mkdir -p ./pr
          echo ${{ github.event.number }} | tee ./pr/number
          npm run all | tee ./pr/all_result
      - uses: actions/upload-artifact@v2
        if: ${{ github.event_name == 'pull_request' }}
        with:
          name: all
          path: pr/

# comment_on_pr.yml
name: Comment on PR

on:
  workflow_run:
    workflows:
      - "Test"
    types:
      - completed

jobs:
  comment:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.event == 'pull_request' }}
    steps:
      - name: on artifact
        id: artifact
        uses: marocchino/on_artifact@v1
        with:
          name: all
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: All
          number: ${{ steps.artifact.outputs.number }}
          message: |
            ```
            ${{ steps.artifact.outputs.all_result }}
            ```
```

## Inputs

### `header`

**Optional** Header to determine if the comment is to be updated, not shown on screen. It can be used when you want to add multiple comments independently at the same time.

### `append`

**Optional** Indicate if new comment messages should be appended to previous comment message. Only `true` is allowed. Just skip this item when you don't need it.

### `recreate`

**Optional** Indicate if previous comment should be removed before creating a new comment. Only `true` is allowed. Just skip this item when you don't need it.

### `delete`

**Optional** delete the previously created comment. Only `true` is allowed. Just skip this item when you don't need it.

### `message`

**Optional** comment message

### `path`

**Optional** path to file containing comment message

### `number`

**Optional** pull request number for push event

### `repo`

**Optional** other repo name limited use on github enterprise. If not set, the current repo is used by default. Note that When you trying changing a repo, be aware that GITHUB_TOKEN should also use that repo's.

### `GITHUB_TOKEN`

**Optional**, typically set secrets.GITHUB_TOKEN. If not set, this will use `${{ github.token }}`.

## Outputs

no outputs

## Any problem?

Feel free to report issues. 😃

# Sticky Pull Request Comment

Create a comment on a pull request, if it exists update that comment.
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
      Test ${{ github.sha }} ended successfully.
      This message is from a push.
```

### Read comment from a file

```yaml
uses: marocchino/sticky-pull-request-comment@v2
with:
  path: path-to-comment-contents.txt
```

### Delete the previous comment and add a comment at the end

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

This message means the requester does not have enough permission. If `secrets.GITHUB_TOKEN`
is explicitly passed, this problem can be solved by just removing it. 

## Inputs

### `header`

**Optional** Header to determine if the comment should be updated (it is not shown to users). It can be used when you want to add multiple comments independently to a given object.

### `append`

**Optional** Indicate if new comment messages should be appended to previous comment message. Only `true` is allowed. Just skip this option when you don't need it.

### `recreate`

**Optional** Indicate if previous comment should be removed before creating a new comment. Only `true` is allowed. Just skip this option when you don't need it.

### `delete`

**Optional** Delete the previously created comment. Only `true` is allowed. Just skip this option when you don't need it.

### `message`

**Optional** Comment message

### `path`

**Optional** Path to file containing comment message

### `number`

**Optional** Pull request number for push event. Note that this has a **lower priority** than the number of a pull_request event.

### `repo`

**Optional** Another repository name. Of limited use on GitHub enterprise. If not set, the current repository is used by default. Note that when you trying changing a repo, be aware that `GITHUB_TOKEN` should also have permission for that repository.

### `GITHUB_TOKEN`

**Optional**, You can set [PAT](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) here. If not set, this will use `${{ github.token }}`.

## Outputs

None

## Any problem?

Feel free to report issues. 😃

# Sticky Pull Request Comment

Create comment on pull request, if exists update that comment.

## Usage:

### Basic

```yaml
uses: marocchino/sticky-pull-request-comment@v1
with:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  message: |
    Release ${{ github.sha }} to <https://pr-${{ github.event.number }}.example.com>
```

### Keep more than one comment

In some cases, different actions may require different comments. The header allows you to maintain comments independently.

```yaml
release:
  ...
  - uses: marocchino/sticky-pull-request-comment@v1
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
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
  - uses: marocchino/sticky-pull-request-comment@v1
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
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
  - uses: marocchino/sticky-pull-request-comment@v1
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
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
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}
- uses: marocchino/sticky-pull-request-comment@v1
with:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  number: ${{ steps.finder.outputs.pr }}
  message: |
    Test ${{ github.sha }} is successfully ended.
    This is message from push.
```

### Read comment from a file

```yaml
uses: marocchino/sticky-pull-request-comment@v1
with:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  path: path-to-comment-contents.txt
```

## Development

Install the dependencies

```bash
$ npm install
```

Build the typescript

```bash
$ npm run build
```

Run the tests :heavy_check_mark:

```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

## Publish to a distribution branch

Actions are run from GitHub repos. We will create a releases branch and only checkin production modules (core in this case).

Comment out node_modules in .gitignore and create a releases/v1 branch

```bash
# comment out in distribution branches
# node_modules/
```

```bash
$ git checkout -b releases/v1
$ git commit -a -m "prod dependencies"
```

```bash
$ npm prune --production
$ git add node_modules
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

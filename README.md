# Sticky Pull Request Comment

Create comment on pull request, if exists update that comment.

## Usage:

```yaml
uses: marocchino/sticky-pull-request-comment@v1
with:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  message: |
    Release ${{ github.sha }} to <https://pr-${{ github.event.number }}.example.com>
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

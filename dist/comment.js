"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPreviousComment = findPreviousComment;
exports.updateComment = updateComment;
exports.createComment = createComment;
exports.deleteComment = deleteComment;
exports.minimizeComment = minimizeComment;
exports.getBodyOf = getBodyOf;
exports.commentsEqual = commentsEqual;
const core = __importStar(require("@actions/core"));
function headerComment(header) {
    return `<!-- Sticky Pull Request Comment${header} -->`;
}
function bodyWithHeader(body, header) {
    return `${body}\n${headerComment(header)}`;
}
function bodyWithoutHeader(body, header) {
    return body.replace(`\n${headerComment(header)}`, "");
}
async function findPreviousComment(octokit, repo, number, header) {
    let after = null;
    let hasNextPage = true;
    const h = headerComment(header);
    while (hasNextPage) {
        const data = await octokit.graphql(`
      query($repo: String! $owner: String! $number: Int! $after: String) {
        viewer { login }
        repository(name: $repo owner: $owner) {
          pullRequest(number: $number) {
            comments(first: 100 after: $after) {
              nodes {
                id
                author {
                  login
                }
                isMinimized
                body
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      }
      `, { ...repo, after, number });
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const viewer = data.viewer;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const repository = data.repository;
        const target = repository.pullRequest?.comments?.nodes?.find((node) => node?.author?.login === viewer.login.replace("[bot]", "") &&
            !node?.isMinimized &&
            node?.body?.includes(h));
        if (target) {
            return target;
        }
        after = repository.pullRequest?.comments?.pageInfo?.endCursor;
        hasNextPage = repository.pullRequest?.comments?.pageInfo?.hasNextPage ?? false;
    }
    return undefined;
}
async function updateComment(octokit, id, body, header, previousBody) {
    if (!body && !previousBody)
        return core.warning("Comment body cannot be blank");
    const rawPreviousBody = previousBody ? bodyWithoutHeader(previousBody, header) : "";
    await octokit.graphql(`
    mutation($input: UpdateIssueCommentInput!) {
      updateIssueComment(input: $input) {
        issueComment {
          id
          body
        }
      }
    }
    `, {
        input: {
            id,
            body: previousBody
                ? bodyWithHeader(`${rawPreviousBody}\n${body}`, header)
                : bodyWithHeader(body, header),
        },
    });
}
async function createComment(octokit, repo, issue_number, body, header, previousBody) {
    if (!body && !previousBody) {
        core.warning("Comment body cannot be blank");
        return;
    }
    return await octokit.rest.issues.createComment({
        ...repo,
        issue_number,
        body: previousBody ? `${previousBody}\n${body}` : bodyWithHeader(body, header),
    });
}
async function deleteComment(octokit, id) {
    await octokit.graphql(`
    mutation($id: ID!) {
      deleteIssueComment(input: { id: $id }) {
        clientMutationId
      }
    }
    `, { id });
}
async function minimizeComment(octokit, subjectId, classifier) {
    await octokit.graphql(`
    mutation($input: MinimizeCommentInput!) {
      minimizeComment(input: $input) {
        clientMutationId
      }
    }
    `, { input: { subjectId, classifier } });
}
function getBodyOf(previous, append, hideDetails) {
    if (!append) {
        return undefined;
    }
    if (!hideDetails || !previous.body) {
        return previous.body;
    }
    return previous.body.replace(/(<details.*?)\s*\bopen\b(.*>)/g, "$1$2");
}
function commentsEqual(body, previous, header) {
    const newBody = bodyWithHeader(body, header);
    return newBody === previous;
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBodyOf = exports.deleteComment = exports.createComment = exports.updateComment = exports.findPreviousComment = void 0;
const core = __importStar(require("@actions/core"));
function headerComment(header) {
    return `<!-- Sticky Pull Request Comment${header} -->`;
}
function findPreviousComment(octokit, repo, number, header) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __awaiter(this, void 0, void 0, function* () {
        let after = null;
        let hasNextPage = true;
        const h = headerComment(header);
        while (hasNextPage) {
            const data = yield octokit.graphql(`
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
      `, Object.assign(Object.assign({}, repo), { after, number }));
            const viewer = data.viewer;
            const repository = data.repository;
            const target = (_c = (_b = (_a = repository.pullRequest) === null || _a === void 0 ? void 0 : _a.comments) === null || _b === void 0 ? void 0 : _b.nodes) === null || _c === void 0 ? void 0 : _c.find((node) => {
                var _a, _b;
                return ((_a = node === null || node === void 0 ? void 0 : node.author) === null || _a === void 0 ? void 0 : _a.login) === viewer.login &&
                    !(node === null || node === void 0 ? void 0 : node.isMinimized) &&
                    ((_b = node === null || node === void 0 ? void 0 : node.body) === null || _b === void 0 ? void 0 : _b.includes(h));
            });
            if (target) {
                return target;
            }
            after = (_f = (_e = (_d = repository.pullRequest) === null || _d === void 0 ? void 0 : _d.comments) === null || _e === void 0 ? void 0 : _e.pageInfo) === null || _f === void 0 ? void 0 : _f.endCursor;
            hasNextPage =
                (_k = (_j = (_h = (_g = repository.pullRequest) === null || _g === void 0 ? void 0 : _g.comments) === null || _h === void 0 ? void 0 : _h.pageInfo) === null || _j === void 0 ? void 0 : _j.hasNextPage) !== null && _k !== void 0 ? _k : false;
        }
        return undefined;
    });
}
exports.findPreviousComment = findPreviousComment;
function updateComment(octokit, id, body, header, previousBody) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!body && !previousBody)
            return core.warning("Comment body cannot be blank");
        yield octokit.graphql(`
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
                    ? `${previousBody}\n${body}`
                    : `${body}\n${headerComment(header)}`
            }
        });
    });
}
exports.updateComment = updateComment;
function createComment(octokit, repo, issue_number, body, header, previousBody) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!body && !previousBody)
            return core.warning("Comment body cannot be blank");
        yield octokit.rest.issues.createComment(Object.assign(Object.assign({}, repo), { issue_number, body: previousBody
                ? `${previousBody}\n${body}`
                : `${body}\n${headerComment(header)}` }));
    });
}
exports.createComment = createComment;
function deleteComment(octokit, id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.graphql(`
    mutation($id: ID!) { 
      deleteIssueComment(input: { id: $id }) {
        clientMutationId
      }
    }
    `, { id });
    });
}
exports.deleteComment = deleteComment;
function getBodyOf(previous, append, hideDetails) {
    var _a;
    if (!append) {
        return undefined;
    }
    if (!hideDetails) {
        return previous.body;
    }
    return (_a = previous.body) === null || _a === void 0 ? void 0 : _a.replace(/(<details.*?)\s*\bopen\b(.*>)/g, "$1$2");
}
exports.getBodyOf = getBodyOf;

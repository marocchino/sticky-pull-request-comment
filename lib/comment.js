"use strict";
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
function headerComment(header) {
    return `<!-- Sticky Pull Request Comment${header} -->`;
}
function findPreviousComment(octokit, repo, issue_number, header) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data: comments } = yield octokit.issues.listComments(Object.assign(Object.assign({}, repo), { issue_number }));
        const h = headerComment(header);
        return comments.find(comment => comment.body.startsWith(h));
    });
}
exports.findPreviousComment = findPreviousComment;
function updateComment(octokit, repo, comment_id, body, header, previousBody) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.issues.updateComment(Object.assign(Object.assign({}, repo), { comment_id, body: previousBody ? `${previousBody}\n${body}` : `${headerComment(header)}\n${body}` }));
    });
}
exports.updateComment = updateComment;
function createComment(octokit, repo, issue_number, body, header) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.issues.createComment(Object.assign(Object.assign({}, repo), { issue_number, body: `${headerComment(header)}\n${body}` }));
    });
}
exports.createComment = createComment;

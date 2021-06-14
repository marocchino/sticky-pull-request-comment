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
exports.deleteComment = exports.createComment = exports.updateComment = exports.findPreviousComment = void 0;
const core = __importStar(require("@actions/core"));
function headerComment(header) {
    return `<!-- Sticky Pull Request Comment${header} -->`;
}
function findPreviousComment(octokit, repo, issue_number, header) {
    return __awaiter(this, void 0, void 0, function* () {
        const { viewer } = yield octokit.graphql("query { viewer { login } }");
        const { data: comments } = yield octokit.rest.issues.listComments(Object.assign(Object.assign({}, repo), { issue_number }));
        const h = headerComment(header);
        return comments.find(comment => { var _a, _b; return ((_a = comment.user) === null || _a === void 0 ? void 0 : _a.login) === viewer.login && ((_b = comment.body) === null || _b === void 0 ? void 0 : _b.includes(h)); });
    });
}
exports.findPreviousComment = findPreviousComment;
function updateComment(octokit, repo, comment_id, body, header, previousBody) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!body && !previousBody)
            return core.warning("Comment body cannot be blank");
        yield octokit.rest.issues.updateComment(Object.assign(Object.assign({}, repo), { comment_id, body: previousBody
                ? `${previousBody}\n${body}`
                : `${body}\n${headerComment(header)}` }));
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
function deleteComment(octokit, repo, comment_id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.rest.issues.deleteComment(Object.assign(Object.assign({}, repo), { comment_id }));
    });
}
exports.deleteComment = deleteComment;

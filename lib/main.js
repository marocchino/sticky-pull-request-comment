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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const comment_1 = require("./comment");
const fs_1 = require("fs");
function run() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const number = ((_c = (_b = (_a = github.context) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.pull_request) === null || _c === void 0 ? void 0 : _c.number) ||
            +core.getInput('number', { required: false });
        if (isNaN(number) || number < 1) {
            core.info('no pull request numbers given: skip step');
            return;
        }
        try {
            const repo = github.context.repo;
            repo.repo = core.getInput('repo', { required: false }) || repo.repo;
            const message = core.getInput('message', { required: false });
            const path = core.getInput('path', { required: false });
            const header = core.getInput('header', { required: false }) || '';
            const append = (core.getInput('append', { required: false }) || 'false') === 'true';
            const recreate = (core.getInput('recreate', { required: false }) || 'false') === 'true';
            const deleteOldComment = (core.getInput('delete', { required: false }) || 'false') === 'true';
            const githubToken = core.getInput('GITHUB_TOKEN', { required: true });
            const octokit = github.getOctokit(githubToken);
            const previous = yield comment_1.findPreviousComment(octokit, repo, number, header);
            if (!deleteOldComment && !message && !path) {
                throw new Error('Either message or path input is required');
            }
            if (deleteOldComment && recreate) {
                throw new Error('delete and recreate cannot be both set to true');
            }
            let body;
            if (path) {
                body = fs_1.readFileSync(path, 'utf-8');
            }
            else {
                body = message;
            }
            if (previous) {
                const previousBody = append ? previous.body : undefined;
                if (deleteOldComment) {
                    yield comment_1.deleteComment(octokit, repo, previous.id);
                }
                else if (recreate) {
                    yield comment_1.deleteComment(octokit, repo, previous.id);
                    yield comment_1.createComment(octokit, repo, number, body, header, previousBody);
                }
                else {
                    yield comment_1.updateComment(octokit, repo, previous.id, body, header, previousBody);
                }
            }
            else {
                yield comment_1.createComment(octokit, repo, number, body, header);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();

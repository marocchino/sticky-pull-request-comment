import { beforeEach, test, expect, vi, describe } from 'vitest';
// import * as core from '@actions/core'; // Not imported directly
// import * as github from '@actions/github'; // Not imported directly
import * as glob from '@actions/glob'; 
import * as fs from 'node:fs';

// Mock dependencies at the top level
vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  getBooleanInput: vi.fn(),
  getMultilineInput: vi.fn(),
  setFailed: vi.fn(),
}));

vi.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'defaultOwner', repo: 'defaultRepo' },
    payload: { pull_request: { number: 123 } },
  },
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

vi.mock('@actions/glob', async () => {
  const actual = await vi.importActual<typeof glob>('@actions/glob');
  return {
    ...actual,
    create: vi.fn().mockResolvedValue({
      glob: vi.fn().mockResolvedValue([]),
    }),
  };
});

// These will hold the dynamically imported mocked modules for use in tests/setup
let coreMock: typeof import('@actions/core');
let githubMock: typeof import('@actions/github');

beforeEach(async () => {
  // Dynamically import the mocked modules to get their references for setup
  coreMock = await import('@actions/core');
  githubMock = await import('@actions/github'); 

  vi.clearAllMocks(); // Clear mock call history before each test.

  // Setup mock implementations for coreMock based on process.env
  vi.mocked(coreMock.getInput).mockImplementation((name: string, options?: any) => {
    const envVarName = `INPUT_${name.toUpperCase()}`;
    const value = process.env[envVarName];
    if (options?.required && (value === undefined || value === '')) { /* Simplified for tests */ }
    return value || '';
  });

  vi.mocked(coreMock.getBooleanInput).mockImplementation((name: string, options?: any) => {
    const envVarName = `INPUT_${name.toUpperCase()}`;
    if (options?.required && process.env[envVarName] === undefined) { /* Simplified for tests */ }
    return process.env[envVarName] === 'true';
  });

  vi.mocked(coreMock.getMultilineInput).mockImplementation((name: string, options?: any) => {
    const envVarName = `INPUT_${name.toUpperCase()}`;
    const value = process.env[envVarName];
    if (options?.required && (value === undefined || value === '')) { /* Simplified for tests */ }
    return value ? [value] : []; 
  });
  
  // Set default githubMock.context values. Tests can override if necessary.
  githubMock.context.repo = { owner: 'defaultOwner', repo: 'defaultRepo' };
  if (githubMock.context.payload.pull_request) {
    githubMock.context.payload.pull_request.number = 123;
  } else {
    githubMock.context.payload.pull_request = { number: 123 };
  }
  
  // Set up default environment variables for each test 
  process.env["GITHUB_REPOSITORY"] = "marocchino/stick-pull-request-comment"; // Used by default context
  process.env["INPUT_NUMBER"] = "123"; 
  process.env["INPUT_APPEND"] = "false";
  process.env["INPUT_RECREATE"] = "false";
  process.env["INPUT_DELETE"] = "false";
  process.env["INPUT_HIDE_CLASSIFY"] = "OUTDATED";
  process.env["INPUT_GITHUB_TOKEN"] = "some-token";
  // Clear specific env vars that control repo owner/name for repo constant tests
  delete process.env["INPUT_OWNER"];
  delete process.env["INPUT_REPO"];
});

describe("Basic Configuration Properties", () => {
  beforeEach(() => {
    vi.resetModules(); 
  });

  test("loads various configuration properties correctly", async () => {
    process.env["INPUT_HEADER"] = "Specific Header";
    process.env["INPUT_APPEND"] = "true";
    process.env["INPUT_RECREATE"] = "true";
    process.env["INPUT_HIDE_CLASSIFY"] = "SPAM";

    const config = await import('../src/config');
    
    expect(config.pullRequestNumber).toBe(123); 
    expect(config.header).toBe("Specific Header");
    expect(config.append).toBe(true);
    expect(config.recreate).toBe(true);
    expect(config.deleteOldComment).toBe(false); 
    expect(config.hideClassify).toBe("SPAM"); 
    expect(config.githubToken).toBe("some-token");
  });
});

describe("Repo Constant Logic", () => {
  beforeEach(() => {
    vi.resetModules(); 
  });

  test("repo constant uses owner and repo inputs if provided", async () => {
    process.env["INPUT_OWNER"] = "inputOwner";
    process.env["INPUT_REPO"] = "inputRepo";
    
    const { repo } = await import('../src/config');
    expect(repo).toEqual({ owner: "inputOwner", repo: "inputRepo" });
  });

  test("repo constant uses context repo if inputs are not provided", async () => {
    // INPUT_OWNER and INPUT_REPO are deleted in global beforeEach, so they are empty.
    // Set context on the githubMock that config.ts will use.
    githubMock.context.repo = { owner: 'contextOwnerConfigTest', repo: 'contextRepoConfigTest' };
        
    const { repo } = await import('../src/config');
    expect(repo).toEqual({ owner: "contextOwnerConfigTest", repo: "contextRepoConfigTest" });
  });

  test("repo constant uses owner input and context repo if repo input is empty", async () => {
    process.env["INPUT_OWNER"] = "inputOwnerOnly";
    // INPUT_REPO is empty (deleted in global beforeEach)
            
    githubMock.context.repo = { owner: 'contextOwnerForRepo', repo: 'contextRepoActual' };

    const { repo } = await import('../src/config');
    expect(repo).toEqual({ owner: "inputOwnerOnly", repo: "contextRepoActual" });
  });

   test("repo constant uses context owner and repo input if owner input is empty", async () => {
    // INPUT_OWNER is empty (deleted in global beforeEach)
    process.env["INPUT_REPO"] = "inputRepoOnly";
        
    githubMock.context.repo = { owner: 'contextOwnerActual', repo: 'contextRepoForOwner' };

    const { repo } = await import('../src/config');
    expect(repo).toEqual({ owner: "contextOwnerActual", repo: "inputRepoOnly" });
  });
});

describe("getBody Function", () => {
  beforeEach(() => {
    vi.resetModules(); 
  });

  test("returns message input when path is not provided", async () => {
    process.env["INPUT_MESSAGE"] = "Test message";
    process.env["INPUT_PATH"] = ""; 
    
    const { getBody } = await import('../src/config');
    const body = await getBody();
    expect(body).toBe("Test message");
    expect(coreMock.getInput).toHaveBeenCalledWith("message", {required: false}); 
    expect(coreMock.getMultilineInput).toHaveBeenCalledWith("path", {required: false});
  });

  test("returns single file content when path is a single file", async () => {
    const filePath = "single/file.txt";
    const fileContent = "Hello from single file";
    process.env["INPUT_PATH"] = filePath;
    
    const mockGlobber = { glob: vi.fn().mockResolvedValue([filePath]) };
    vi.mocked(glob.create).mockResolvedValue(mockGlobber as any); 
    vi.mocked(fs.readFileSync).mockReturnValue(fileContent); 

    const { getBody } = await import('../src/config');
    const body = await getBody();
    expect(body).toBe(fileContent);
    expect(glob.create).toHaveBeenCalledWith(filePath, {followSymbolicLinks: false, matchDirectories: false});
    expect(mockGlobber.glob).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, "utf-8");
  });

  test("returns concatenated content when path is a glob pattern matching multiple files", async () => {
    const globPath = "multiple/*.txt";
    const files = ["multiple/file1.txt", "multiple/file2.txt"];
    const contents = ["Content file 1", "Content file 2"];
    process.env["INPUT_PATH"] = globPath;

    const mockGlobber = { glob: vi.fn().mockResolvedValue(files) };
    vi.mocked(glob.create).mockResolvedValue(mockGlobber as any);
    vi.mocked(fs.readFileSync).mockImplementation((path) => {
      const index = files.indexOf(path as string);
      return contents[index];
    });

    const { getBody } = await import('../src/config');
    const body = await getBody();
    expect(body).toBe(`${contents[0]}\n${contents[1]}`);
    expect(glob.create).toHaveBeenCalledWith(globPath, {followSymbolicLinks: false, matchDirectories: false});
    expect(fs.readFileSync).toHaveBeenCalledWith(files[0], "utf-8");
    expect(fs.readFileSync).toHaveBeenCalledWith(files[1], "utf-8");
  });

  test("returns empty string when path matches no files", async () => {
    const globPath = "nonexistent/*.txt";
    process.env["INPUT_PATH"] = globPath;

    const mockGlobber = { glob: vi.fn().mockResolvedValue([]) }; 
    vi.mocked(glob.create).mockResolvedValue(mockGlobber as any);

    const { getBody } = await import('../src/config');
    const body = await getBody();
    expect(body).toBe("");
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  test("returns empty string and sets failed when globbing fails", async () => {
    const globPath = "error/path";
    process.env["INPUT_PATH"] = globPath;
    const errorMessage = "Globbing error";
    vi.mocked(glob.create).mockRejectedValue(new Error(errorMessage));

    const { getBody } = await import('../src/config');
    const body = await getBody();
    expect(body).toBe("");
    expect(coreMock.setFailed).toHaveBeenCalledWith(errorMessage);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });
});

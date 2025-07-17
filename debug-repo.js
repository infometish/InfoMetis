import { GitHubAPI } from './claude/wow/scripts/lib/github-api.js';

const api = new GitHubAPI();
console.log('Owner:', api.owner);
console.log('Repo:', api.repo);
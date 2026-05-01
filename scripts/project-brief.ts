import { execSync } from 'node:child_process';

const mode = process.argv[2] ?? 'brief';

const urls = {
  preview: 'http://127.0.0.1:5173/',
  n8n: 'http://127.0.0.1:5173/n8n-workflows.html',
  hub: 'http://127.0.0.1:5173/project-hub.html',
  n8nCloud: 'https://ablly.app.n8n.cloud',
};

function run(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '无法读取';
  }
}

function printLinks() {
  console.log('BloomX 常用入口');
  console.log('');
  console.log('启动本地预览: npm run dev -- --host 127.0.0.1');
  console.log(`项目预览页: ${urls.preview}`);
  console.log(`n8n 工作流访问页: ${urls.n8n}`);
  console.log(`项目总览页: ${urls.hub}`);
  console.log(`n8n 云端实例: ${urls.n8nCloud}`);
}

function printBrief() {
  const branch = run('git branch --show-current');
  const commit = run('git rev-parse --short HEAD');
  const dirtyCount = run('git status --short').split(/\r?\n/).filter(Boolean).length;

  console.log('BloomX 简报');
  console.log('');
  console.log(`当前分支: ${branch}`);
  console.log(`当前提交: ${commit}`);
  console.log(`未提交变更数量: ${dirtyCount}`);
  console.log('');
  printLinks();
  console.log('');
  console.log('当前交付规则: 中文文档、OpenSpec + Superpowers、n8n 优先、完成后运行验证和自审、审核通过后推送 GitHub。');
  console.log('当前建议下一步: 选择一个业务闭环继续规格化实现，例如商家入驻审核、API 调用计费、售后工单或结算看板。');
}

if (mode === 'links') {
  printLinks();
} else {
  printBrief();
}

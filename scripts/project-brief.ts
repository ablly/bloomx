import { execSync } from 'node:child_process';

const mode = process.argv[2] ?? 'brief';

const urls = {
  preview: 'http://127.0.0.1:5173/',
  n8n: 'http://127.0.0.1:5173/n8n-workflows.html',
  hub: 'http://127.0.0.1:5173/project-hub.html',
  n8nCloud: 'https://ablly.app.n8n.cloud',
};

const workflowOptions = [
  {
    name: 'n8n 自托管 Community Edition',
    fit: '继续沿用现有 n8n 工作流设计；免费自托管，适合先跑 BloomX 内部自动化。',
    note: 'Cloud 收费；自托管需要自己维护服务器、备份和安全。',
  },
  {
    name: 'Activepieces',
    fit: '最像 Zapier/n8n 的免费开源替代；MIT 社区版，TypeScript 集成生态，适合后续迁移。',
    note: '企业能力另有商业版，迁移前要验证关键连接器。',
  },
  {
    name: 'Node-RED',
    fit: 'Apache-2.0，老牌低代码事件流，适合 Webhook、IoT、HTTP 编排和轻量后台自动化。',
    note: '业务审批、权限、版本管理体验不如专门的 SaaS 自动化平台。',
  },
  {
    name: 'Windmill',
    fit: '免费开源自托管，偏开发者工作流、脚本、内部工具和数据任务。',
    note: '比 n8n 更工程化，上手门槛略高。',
  },
  {
    name: 'Automatisch',
    fit: 'AGPL 社区版，定位开源 Zapier 替代，适合隐私敏感的自托管业务自动化。',
    note: '生态和活跃度需要按具体连接器再验证。',
  },
];

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

function printWorkflowOptions() {
  console.log('免费/开源工作流候选');
  console.log('');
  for (const option of workflowOptions) {
    console.log(`- ${option.name}`);
    console.log(`  适合: ${option.fit}`);
    console.log(`  注意: ${option.note}`);
  }
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
  printWorkflowOptions();
  console.log('');
  console.log('当前交付规则: 中文文档、OpenSpec + Superpowers、Taste + Open Design、免费优先工作流、完成后运行验证和自审、审核通过后推送 GitHub。');
  console.log('当前建议下一步: 先用 n8n 自托管 Community Edition 或 Activepieces 做一个免费工作流试点，再选择商家入驻审核、API 调用计费、售后工单或结算看板继续规格化实现。');
}

if (mode === 'links') {
  printLinks();
} else if (mode === 'workflows') {
  printWorkflowOptions();
} else {
  printBrief();
}

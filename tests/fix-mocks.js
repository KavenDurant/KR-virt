#!/usr/bin/env node

/**
 * 自动修复测试文件中的Mock引用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要修复的文件列表
const filesToFix = [
  'tests/services/login/index.test.ts',
  'tests/services/login/tokenRefresh.test.ts',
  'tests/services/login/firstTimeLogin.test.ts',
];

// Mock引用替换映射
const mockReplacements = {
  'mockCookieUtils': 'mockCookieUtilsHoisted',
  'mockApiHelper': 'mockApiHelperHoisted',
};

function fixMockReferences(filePath) {
  console.log(`正在修复文件: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`文件不存在: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // 替换Mock引用
  Object.entries(mockReplacements).forEach(([oldRef, newRef]) => {
    const regex = new RegExp(`\\b${oldRef}\\.`, 'g');
    const newContent = content.replace(regex, `${newRef}.`);
    if (newContent !== content) {
      content = newContent;
      hasChanges = true;
      console.log(`  - 替换 ${oldRef} -> ${newRef}`);
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ 文件已更新`);
  } else {
    console.log(`  ℹ️ 无需更改`);
  }
}

function addHoistedMocks(filePath) {
  console.log(`正在添加hoisted mocks到: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`文件不存在: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 检查是否已经有hoisted mocks
  if (content.includes('mockCookieUtilsHoisted') || content.includes('mockApiHelperHoisted')) {
    console.log(`  ℹ️ Hoisted mocks已存在`);
    return;
  }

  // 查找Mock依赖部分
  const mockDependenciesRegex = /\/\/ Mock依赖[\s\S]*?vi\.mock\("@\/config\/env"[^}]*}\)\);/;
  const match = content.match(mockDependenciesRegex);

  if (!match) {
    console.log(`  ⚠️ 未找到Mock依赖部分`);
    return;
  }

  const hoistedMocks = `
// 使用vi.hoisted确保Mock配置正确
const mockCookieUtilsHoisted = vi.hoisted(() => ({
  setToken: vi.fn(),
  getToken: vi.fn(),
  removeToken: vi.fn(),
  setUser: vi.fn(),
  getUser: vi.fn(),
  removeUser: vi.fn(),
  clearAuth: vi.fn(),
  isTokenExpired: vi.fn(),
  exists: vi.fn(),
}));

const mockApiHelperHoisted = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

// Mock依赖
vi.mock("@/utils/cookies", () => ({
  CookieUtils: mockCookieUtilsHoisted,
}));

vi.mock("@/utils/apiHelper", () => ({
  api: mockApiHelperHoisted,
}));

// Mock环境配置
vi.mock("@/config/env", () => ({
  EnvConfig: {
    USE_MOCK_DATA: false,
  },
}));`;

  const newContent = content.replace(mockDependenciesRegex, hoistedMocks);
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✅ Hoisted mocks已添加`);
  }
}

function fixBeforeEachMocks(filePath) {
  console.log(`正在修复beforeEach中的Mock引用: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 替换beforeEach中的Mock引用
  const beforeEachRegex = /(beforeEach\(\(\) => \{[\s\S]*?)(mockCookieUtils|mockApiHelper)([\s\S]*?\}\);)/g;
  
  const newContent = content.replace(beforeEachRegex, (match, before, mockRef, after) => {
    const newMockRef = mockReplacements[mockRef] || mockRef;
    return before + newMockRef + after.replace(new RegExp(`\\b${mockRef}\\.`, 'g'), `${newMockRef}.`);
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✅ beforeEach Mock引用已修复`);
  }
}

// 主执行函数
function main() {
  console.log('🔧 开始修复测试文件中的Mock配置...\n');

  filesToFix.forEach(filePath => {
    console.log(`\n📁 处理文件: ${filePath}`);
    
    // 1. 添加hoisted mocks
    addHoistedMocks(filePath);
    
    // 2. 修复Mock引用
    fixMockReferences(filePath);
    
    // 3. 修复beforeEach中的Mock引用
    fixBeforeEachMocks(filePath);
  });

  console.log('\n✅ Mock修复完成！');
  console.log('\n📋 下一步：');
  console.log('1. 运行测试验证修复效果：npm run test:run');
  console.log('2. 检查测试覆盖率：npm run test:coverage');
}

// 运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  fixMockReferences,
  addHoistedMocks,
  fixBeforeEachMocks,
};

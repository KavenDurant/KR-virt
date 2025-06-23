#!/bin/bash

# KR-virt 登录模块测试运行脚本
# 用于验证所有测试修复效果

set -e  # 遇到错误立即退出

echo "🚀 KR-virt 登录模块测试验证开始..."
echo "================================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 运行单个测试文件的函数
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "\n${BLUE}📋 运行测试: ${test_name}${NC}"
    echo "文件: $test_file"
    echo "----------------------------------------"
    
    if npm run test:run -- "$test_file" --reporter=verbose; then
        echo -e "${GREEN}✅ $test_name 测试通过${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $test_name 测试失败${NC}"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
}

# 1. 运行安全工具测试（应该完全通过）
run_test "tests/utils/security.test.ts" "安全工具测试"

# 2. 运行认证工具测试（修复后应该通过）
run_test "tests/utils/auth.test.ts" "认证工具测试"

# 3. 运行登录服务核心测试
run_test "tests/services/login/index.test.ts" "登录服务核心测试"

# 4. 运行Token刷新测试
run_test "tests/services/login/tokenRefresh.test.ts" "Token刷新测试"

# 5. 运行首次登录测试
run_test "tests/services/login/firstTimeLogin.test.ts" "首次登录测试"

# 6. 运行登录页面组件测试
run_test "tests/page/Login.test.tsx" "登录页面组件测试"

# 7. 运行现有的Cookie测试
run_test "src/test/cookies.test.ts" "Cookie工具测试"

echo -e "\n${BLUE}================================================${NC}"
echo -e "${BLUE}📊 测试结果统计${NC}"
echo -e "${BLUE}================================================${NC}"

echo -e "总测试模块: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"

# 计算通过率
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "通过率: ${PASS_RATE}%"
    
    if [ $PASS_RATE -ge 85 ]; then
        echo -e "\n${GREEN}🎉 测试通过率达标！(≥85%)${NC}"
    else
        echo -e "\n${YELLOW}⚠️ 测试通过率未达标，需要进一步修复${NC}"
    fi
fi

# 8. 生成覆盖率报告
echo -e "\n${BLUE}📈 生成测试覆盖率报告...${NC}"
if npm run test:coverage; then
    echo -e "${GREEN}✅ 覆盖率报告生成成功${NC}"
else
    echo -e "${YELLOW}⚠️ 覆盖率报告生成失败${NC}"
fi

# 9. 运行所有测试（最终验证）
echo -e "\n${BLUE}🔍 运行所有测试进行最终验证...${NC}"
if npm run test:run; then
    echo -e "\n${GREEN}🎊 所有测试运行完成！${NC}"
else
    echo -e "\n${YELLOW}⚠️ 部分测试仍有问题，请查看上方详细信息${NC}"
fi

# 10. 提供下一步建议
echo -e "\n${BLUE}📋 下一步建议:${NC}"
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试模块都已通过！${NC}"
    echo "1. 可以开始编写更多的测试用例"
    echo "2. 考虑添加集成测试和端到端测试"
    echo "3. 设置CI/CD流水线自动运行测试"
else
    echo -e "${YELLOW}🔧 还有 $FAILED_TESTS 个测试模块需要修复:${NC}"
    echo "1. 查看上方的详细错误信息"
    echo "2. 参考 tests/QUICK_FIX_GUIDE.md 进行修复"
    echo "3. 逐个修复后重新运行此脚本验证"
fi

echo -e "\n${BLUE}📚 相关文档:${NC}"
echo "- 测试总结: tests/TEST_SUMMARY.md"
echo "- 快速修复指南: tests/QUICK_FIX_GUIDE.md"
echo "- Mock数据: tests/helpers/loginMocks.ts"
echo "- 测试数据: tests/helpers/testData.ts"

echo -e "\n${GREEN}🎯 测试验证完成！${NC}"

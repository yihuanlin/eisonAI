#!/bin/bash

# 顯示彩色輸出的函數
print_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# 檢查是否在 Git 倉庫中
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    print_error "當前目錄不是 Git 倉庫！"
    exit 1
fi

print_info "開始清理 Git 快取..."

# 移除 fastlane 目錄
print_info "移除 fastlane 目錄..."
git rm -r --cached fastlane/ > /dev/null 2>&1

# 移除 Xcode 用戶數據
print_info "移除 Xcode 用戶數據..."
git rm -r --cached "*.xcuserstate" > /dev/null 2>&1
git rm -r --cached xcuserdata/ > /dev/null 2>&1
git rm -r --cached "*.xcodeproj/xcuserdata/" > /dev/null 2>&1
git rm -r --cached "*.xcodeproj/project.xcworkspace/xcuserdata/" > /dev/null 2>&1

# 移除 macOS 系統文件
print_info "移除 macOS 系統文件..."
find . -name ".DS_Store" -exec git rm --cached {} \; > /dev/null 2>&1
find . -name "._*" -exec git rm --cached {} \; > /dev/null 2>&1

# 重新應用 .gitignore
print_info "更新 .gitignore 追蹤..."
git add .gitignore

# 提交更改
print_info "創建提交..."
git commit -m "chore: remove sensitive files from git tracking"

print_success "清理完成！敏感文件已從 Git 追蹤中移除，但仍保留在本地。"
print_success "您可以使用 'git push' 推送這些更改到遠端倉庫。"
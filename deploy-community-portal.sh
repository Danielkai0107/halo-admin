#!/bin/bash

echo "========================================="
echo "Line OA 管理網頁版部署腳本"
echo "========================================="

# 構建 Community Portal 應用
echo ""
echo "步驟 1/3: 構建 Community Portal 應用..."
cd community-portal
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Community Portal 構建失敗"
  exit 1
fi
cd ..

# 複製到部署目錄
echo ""
echo "步驟 2/3: 複製構建文件..."
rm -rf dist/community
mkdir -p dist/community
cp -r community-portal/dist/* dist/community/

# 部署
echo ""
echo "步驟 3/3: 部署到 Firebase..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
  echo ""
  echo "========================================="
  echo "✅ 部署成功！"
  echo "========================================="
  echo "Community Portal URL: https://safe-net-tw.web.app/community"
  echo ""
else
  echo ""
  echo "❌ 部署失敗"
  exit 1
fi

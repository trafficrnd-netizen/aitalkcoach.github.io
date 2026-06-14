#!/bin/sh
# i18n 검사 pre-commit hook
# 설치: cp .husky-i18n-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# 또는 husky 사용 시: npx husky add .husky/pre-commit "cd web && node scripts/check-i18n.mjs --staged"

cd web
node scripts/check-i18n.mjs --staged
if [ $? -ne 0 ]; then
  echo ""
  echo "💡 커밋을 취소합니다. 한글 문자열을 t('key') 로 교체 후 다시 시도하세요."
  exit 1
fi

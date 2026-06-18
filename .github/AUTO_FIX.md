# CI失敗 → 自動Issue → Claude自動修正

CIワークフローが失敗したとき、自動でIssueを立て、Claude Codeが修正コミット/PRを作成する仕組みです。

## 構成

| ファイル | 役割 |
| --- | --- |
| `workflows/auto-issue-on-failure.yml` | `Backend CI` / `Frontend CI` / `CI & Deploy` が失敗したら、失敗ジョブ・ステップ付きのIssueを作成（`ci-failure` `claude` ラベル）。同一workflow+branchの未解決Issueがある場合はコメント追記のみ。 |
| `workflows/claude-auto-fix.yml` | `claude` ラベルが付いたIssue、または `@claude` メンションで、Claude Codeが原因調査→修正→`fix/ci-issue-<番号>` ブランチにコミット→PR作成。 |

## フロー

```
CI失敗 (workflow_run: failure)
   └─ auto-issue-on-failure.yml が Issue作成 (claude ラベル付与)
        └─ claude-auto-fix.yml 起動
             └─ Claude Code が修正 → コミット → PR (Closes #Issue)
```

## セットアップ（初回のみ）

1. **Anthropic APIキーを登録**
   Repo → Settings → Secrets and variables → Actions → New repository secret
   - Name: `ANTHROPIC_API_KEY`
   - Value: Anthropic Console で発行したAPIキー

2. **ラベルを作成**（任意・自動作成されるが事前定義推奨）
   ```bash
   gh label create claude --color 5319e7 --description "Claude Codeが自動対応"
   gh label create ci-failure --color d73a4a --description "CI失敗から自動生成"
   ```

3. **Actionsの権限を確認**
   Settings → Actions → General → Workflow permissions を
   「Read and write permissions」にし、「Allow GitHub Actions to create and approve pull requests」を有効化。

## 手動トリガー

- 既存Issueに `claude` ラベルを付ける、または本文/コメントで `@claude ...` と書くと修正を起動できます。

## 注意

- `claude-auto-fix.yml` は `claude` ラベル or `@claude` メンション時のみ起動するため、無限ループしません。
- APIキー未設定の場合 `claude-auto-fix.yml` のみ失敗します（Issue作成側は影響なし）。

# gh-board-cmd

GitHub Project のボード情報を取得して表示する CLI ツール

## インストール

### GitHub から直接インストール

```bash
npm install -g github:mach3/gh-board-cmd
```

### ローカルにクローンしてインストール

```bash
git clone https://github.com/mach3/gh-board-cmd.git
cd gh-board-cmd
npm install
npm link
```

## 使い方

```bash
gh-board <owner> <project> [options]
```

### 引数

| 引数 | 説明 |
|------|------|
| `owner` | オーナー名（ユーザー名または組織名） |
| `project` | プロジェクト番号 |

### オプション

| オプション | 説明 |
|------------|------|
| `-s, --save <file>` | 取得したデータを JSON ファイルに保存 |
| `-l, --load <file>` | JSON ファイルからデータを読み込み |
| `-h, --help` | ヘルプを表示 |

### 例

```bash
# プロジェクトのボード情報を表示
gh-board myorg 1

# データを JSON ファイルに保存
gh-board myorg 1 --save data.json

# 保存した JSON ファイルから読み込んで表示
gh-board myorg 1 --load data.json
```

## 前提条件

- [GitHub CLI (gh)](https://cli.github.com/) がインストールされていること
- `gh auth login` で認証済みであること

## ライセンス

ISC

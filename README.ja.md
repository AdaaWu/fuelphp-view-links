# FuelPHP Tools

FuelPHP 開発者向けツールキット。パスジャンプ、ルート実行、Modelテーブル名表示、SQLコピーなどの機能を提供し、日々の開発効率を大幅に向上させます。

## 機能一覧

| # | 機能 | 対象 |
|---|------|------|
| 1.  | **パスリンク** — `View::forge` / `Asset::css/js/img` / `Config::load` / `Lang::load` のパス文字列をクリックして対応ファイルへジャンプ | 全 PHP ファイル |
| 2.  | **Controller ジャンプ** — `routes.php` の `=> 'controller/action'` をクリックして Controller のメソッド行へジャンプ | `routes.php` |
| 3.  | **Route Runner** — ルート行の上に ▶ Run ボタンを表示。パラメータを入力してブラウザで開く | `routes.php` |
| 4.  | **Model テーブル名 Hover** — `Model_X` にホバーして実際のDBテーブル名を表示 | 全 PHP ファイル |
| 5.  | **Function SQL コピー** — メソッド内の SQL をワンクリックでコピー。テーブル名・定数値を自動展開してフォーマット済みで出力 | `model/` ディレクトリ |

---

## 詳細説明

## ⭐機能①：パスリンク

PHP ファイル内で、以下のメソッドのパス文字列を `Cmd+Click`（Mac）または `Ctrl+Click`（Windows/Linux）すると対応ファイルを開きます。**対象ファイルが実際に存在する場合のみリンクが表示されます。**

| メソッド | ジャンプ先 |
|---------|-----------|
| `View::forge('admin/dashboard')` | `fuel/app/views/admin/dashboard.php` |
| `Asset::css('common/layout.css')` | `public/assets/css/common/layout.css` |
| `Asset::js('common/app.js')` | `public/assets/js/common/app.js` |
| `Asset::img('logo.png')` | `public/assets/img/logo.png` |
| `Config::load('pagination')` | `fuel/app/config/pagination.php` |
| `Lang::load('messages')` | `fuel/app/lang/messages.php` |

```php
// Cmd+Click "admin/dashboard" → fuel/app/views/admin/dashboard.php を開く
$this->template->content = View::forge('admin/dashboard', $data);

// Cmd+Click "common/layout.css" → 対応する CSS ファイルを開く
Asset::css('common/layout.css');
```

---

## ⭐機能②：routes.php Controller ジャンプ

`routes.php` で `=> 'controller/action'` の値を `Cmd+Click` すると、対応する Controller ファイルの action メソッド行に直接ジャンプします。

```php
// Cmd+Click "api/product/ajax/update"
// → fuel/app/classes/controller/api/product/ajax.php を開く
// → post_update() メソッドの行へジャンプ
'product/update' => 'api/product/ajax/update',
```

**解決ルール：**
1. まず全セグメントをファイルパスとして試みる（`admin/item/index/index` → `admin/item/index.php` + `action_index()`）
2. 存在しない場合は最後のセグメントを action 名として扱う（`api/product/ajax/update` → `api/product/ajax.php` + `post_update()`）
3. 対応するファイルが見つからない場合はリンクを表示しない

---

## ⭐機能③：Route Runner

`routes.php` の各ルート行の上に **▶ Run** ボタン（CodeLens）が表示されます。クリックすると URL を組み立ててブラウザで開きます。

```php
// ▶ Run ← このボタンをクリック
'(:category_id)/item/(:item_id)' => 'front/item/index',
```

**動作フロー：**
1. ルート内のパラメータを自動検出（`:category_id`、`:item_id`、`(?P<name>...)` 形式）
2. 各パラメータの値を順番に入力ボックスで尋ねる
3. Enter をそのまま押すと `.env` のデフォルト値を使用（なければパラメータ名をそのまま使用）
4. 完全な URL を組み立てて外部ブラウザで開く

**`.env` 設定（プロジェクトルートに配置）：**

```env
FUELPHP_DOMAIN=https://your-dev-domain.local
FUELPHP_CATEGORY_ID=1
FUELPHP_ITEM_ID=100
FUELPHP_PAGE=1
```

PHP 変数連結ルート（`$category.$type.$page => 'front/list/...'`）にも対応。上部の変数定義を自動解析してパラメータ名を抽出します。

---

## ⭐機能④：Model テーブル名 Hover

PHP ファイル内で `Model_X` クラス名にホバーすると、そのモデルの実際のDBテーブル名がツールチップで表示されます。

```php
// Model_Product_Category にホバー → "テーブル名: product_categories" と表示
$sql .= 'FROM ' . Model_Product_Category::table() . ' pc';
```

**テーブル名解決の優先順位：**
1. `CONST TABLE_NAME = 'xxx'`
2. `protected static $_table_name = 'xxx'`
3. FuelPHP `Inflector::tableize()` による自動推定（`Model_Item` → `items`、`Model_Product_Category` → `product_categories`）

---

## ⭐機能⑤：Function SQL コピー

`model/` ディレクトリ以下の PHP ファイルで、`DB::query` を含む `public static function` の上に **📋 Copy SQL** ボタンが表示されます。

```php
// 📋 Copy SQL ← このボタンをクリック
public static function get_item_detail($item_id, $type)
{
    $query  = 'SELECT i.id, i.name, c.name AS category_name';
    $query .= 'FROM ' . self::table() . ' AS i ';
    $query .= 'LEFT JOIN ' . Model_Category::table() . ' c ON i.category_id = c.id ';
    $query .= 'WHERE i.id = :item_id ';
    $query .= 'AND i.display_flg = ' . FLG_ON;
}
```

**コピー結果の例：**

```sql
-- Model_Item
-- get_item_detail

SELECT i.id, i.name, c.name AS category_name
FROM items AS i
	LEFT JOIN categories c ON i.category_id = c.id
WHERE i.id = :item_id
	AND i.display_flg = 1
```

**自動処理される内容：**
- `self::table()` / `Model_X::table()` → 実際のテーブル名に置換
- `FLG_ON` / `FLG_OFF` などの定数 → `fuel/app/config/const.php` から実際の値を読み取り
- SQL キーワードを自動改行・インデント（`SELECT`、`FROM`、`LEFT JOIN`、`WHERE`、`AND` など）
- `if` ブロック内の SQL は `-- [conditional]` でマーク
- 先頭に Model クラス名と function 名をコメントとして付加

DBeaver にそのまま貼り付けて実行可能。`:param` プレースホルダーは適宜置き換えてください。

---

## 設定

`.vscode/settings.json` または VSCode の設定でパスをカスタマイズできます：

| 設定 | デフォルト | 説明 |
|------|-----------|------|
| `fuelpHPTools.domain` | `""` | Route Runner のドメイン（空の場合は `.env` の `FUELPHP_DOMAIN` を使用） |
| `fuelpHPTools.viewsPath` | `fuel/app/views` | views ディレクトリのパス（workspace ルートからの相対パス） |
| `fuelpHPTools.assetsPath` | `public/assets` | assets ディレクトリのパス（workspace ルートからの相対パス） |

**ドメインの優先順位：** VSCode 設定 → `.env` の `FUELPHP_DOMAIN` → `http://localhost`

---

## インストール

### VSCode Marketplace

拡張機能パネルで `FuelPHP Tools` を検索してインストール。

### .vsix からインストール（Antigravity IDE / Open VSX）

1. `fuelphp-tools-x.x.x.vsix` をダウンロード
2. `Cmd+Shift+P` → **Install from VSIX**
3. ダウンロードした `.vsix` ファイルを選択
4. Reload Window

---

## ライセンス

MIT

---

このツールが役に立ったら、ぜひ GitHub で ⭐ をお願いします！

👉 [https://github.com/AdaaWu/fuelphp-tools](https://github.com/AdaaWu/fuelphp-tools)

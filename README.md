# FuelPHP Tools

FuelPHP 開發者工具套件，提供路徑跳轉、路由執行、Model 表名查詢、SQL 複製等功能，大幅提升日常開發效率。

## 功能一覽

| # | 功能 | 適用位置 |
|---|------|---------|
| 1.  | **路徑跳轉連結** — `View::forge` / `Asset::css/js/img` / `Config::load` / `Lang::load` 一鍵跳轉到對應檔案 | 所有 PHP 檔案 |
| 2.  | **Controller 跳轉** — `routes.php` 裡的 `=> 'controller/action'` 直接跳到 Controller 對應方法行 | `routes.php` |
| 3.  | **Route Runner** — 路由上方顯示 ▶ Run 按鈕，填入參數後自動開瀏覽器 | `routes.php` |
| 4.  | **Model 表名 Hover** — hover `Model_X` 顯示真實資料庫表名 | 所有 PHP 檔案 |
| 5.  | **複製 Function SQL** — 一鍵複製整個方法的 SQL，自動展開表名、常數值並格式化 | `model/` 目錄 |

---

## 詳細介紹

## ⭐功能①：路徑跳轉連結

在 PHP 檔案裡，對以下方法的字串路徑按 `Cmd+Click`（Mac）或 `Ctrl+Click`（Windows/Linux）可直接跳轉到對應檔案。**只有檔案實際存在才會顯示底線連結。**

| 方法 | 跳轉目標 |
|------|---------|
| `View::forge('admin/dashboard')` | `fuel/app/views/admin/dashboard.php` |
| `Asset::css('common/layout.css')` | `public/assets/css/common/layout.css` |
| `Asset::js('common/app.js')` | `public/assets/js/common/app.js` |
| `Asset::img('logo.png')` | `public/assets/img/logo.png` |
| `Config::load('pagination')` | `fuel/app/config/pagination.php` |
| `Lang::load('messages')` | `fuel/app/lang/messages.php` |

```php
// Cmd+Click "admin/dashboard" → 開啟 fuel/app/views/admin/dashboard.php
$this->template->content = View::forge('admin/dashboard', $data);

// Cmd+Click "common/layout.css" → 開啟對應 CSS 檔案
Asset::css('common/layout.css');
```

---

## ⭐功能②：routes.php Controller 跳轉

在 `routes.php` 裡，對 `=> 'controller/action'` 的值按 `Cmd+Click`，直接跳轉到對應的 Controller 檔案並定位到 action 方法行。

```php
// Cmd+Click "api/product/ajax/update"
// → 開啟 fuel/app/classes/controller/api/product/ajax.php
// → 定位到 post_update() 方法
'product/update' => 'api/product/ajax/update',
```

**解析規則：**
1. 先嘗試整段作為檔案路徑（`admin/item/index/index` → `admin/item/index.php` + `action_index()`）
2. 不存在則取最後一段作為 action 名稱（`api/product/ajax/update` → `api/product/ajax.php` + `post_update()`）
3. 找不到對應檔案時不顯示連結

---

## ⭐功能③：Route Runner

在 `routes.php` 裡，每行路由上方顯示 **▶ Run** 按鈕，點擊後自動組合 URL 並開啟外部瀏覽器。

```php
// ▶ Run ← 點擊這個按鈕
'(:category_id)/item/(:item_id)' => 'front/item/index',
```

**動作流程：**
1. 自動偵測路由裡的參數（`:category_id`、`:item_id`、`(?P<name>...)` 格式）
2. 逐一彈出輸入框詢問參數值
3. 直接按 Enter 則使用 `.env` 的預設值（或參數名稱本身作為 fallback）
4. 組合成完整 URL → 開啟外部瀏覽器

**`.env` 設定（放在專案根目錄）：**

```env
FUELPHP_DOMAIN=https://your-dev-domain.local
FUELPHP_CATEGORY_ID=1
FUELPHP_ITEM_ID=100
FUELPHP_PAGE=1
```

也支援 PHP 變數串接路由（`$category.$type.$page => 'front/list/...'`），會自動解析前面的變數定義找出參數名稱。

---

## ⭐功能④：Model 表名 Hover

在任何 PHP 檔案裡，hover（滑鼠移到上方）`Model_X` 類名，顯示該 Model 對應的實際資料庫表名。

```php
// hover 在 Model_Product_Category 上 → 顯示 "表名: product_categories"
$sql .= 'FROM ' . Model_Product_Category::table() . ' pc';
```

**表名解析優先順序：**
1. `CONST TABLE_NAME = 'xxx'`
2. `protected static $_table_name = 'xxx'`
3. FuelPHP `Inflector::tableize()` 自動推算（`Model_Item` → `items`、`Model_Product_Category` → `product_categories`）

---

## ⭐功能⑤：複製 Function SQL

在 `model/` 目錄下的 PHP 檔案，含有 `DB::query` 的 `public static function` 上方顯示 **📋 Copy SQL** 按鈕。

```php
// 📋 Copy SQL ← 點擊這個按鈕
public static function get_item_detail($item_id, $type)
{
    $query  = 'SELECT i.id, i.name, c.name AS category_name';
    $query .= 'FROM ' . self::table() . ' AS i ';
    $query .= 'LEFT JOIN ' . Model_Category::table() . ' c ON i.category_id = c.id ';
    $query .= 'WHERE i.id = :item_id ';
    $query .= 'AND i.display_flg = ' . FLG_ON;
}
```

**複製結果範例：**

```sql
-- Model_Item
-- get_item_detail

SELECT i.id, i.name, c.name AS category_name
FROM items AS i
	LEFT JOIN categories c ON i.category_id = c.id
WHERE i.id = :item_id
	AND i.display_flg = 1
```

**自動處理內容：**
- `self::table()` / `Model_X::table()` → 替換成真實表名
- `FLG_ON` / `FLG_OFF` 等常數 → 從 `fuel/app/config/const.php` 讀取真實值
- SQL 關鍵字自動換行縮排（`SELECT`、`FROM`、`LEFT JOIN`、`WHERE`、`AND` 等）
- 條件式 SQL（`if` 區塊內的拼接）標記 `-- [conditional]`
- 開頭加上 Model 類名和 function 名稱作為來源註解

直接貼進 DBeaver 即可執行，`:param` 佔位符自行替換即可。

---

## 設定

在 `.vscode/settings.json` 或 VSCode 設定裡可自訂路徑：

| 設定 | 預設值 | 說明 |
|------|--------|------|
| `fuelpHPTools.domain` | `""` | Route Runner 的網域（留空則從 `.env` 的 `FUELPHP_DOMAIN` 讀取） |
| `fuelpHPTools.viewsPath` | `fuel/app/views` | Views 目錄路徑（相對於 workspace 根目錄） |
| `fuelpHPTools.assetsPath` | `public/assets` | Assets 目錄路徑（相對於 workspace 根目錄） |

**網域優先順序：** VSCode 設定 → `.env` 的 `FUELPHP_DOMAIN` → `http://localhost`

---

## 安裝

### VSCode Marketplace

在 VSCode 擴充套件搜尋 `FuelPHP Tools` 安裝。

### 從 .vsix 安裝（Antigravity IDE / Open VSX）

1. 下載 `fuelphp-tools-x.x.x.vsix`
2. `Cmd+Shift+P` → **Install from VSIX**
3. 選擇下載的 `.vsix` 檔案
4. Reload Window

---

## 授權

MIT

---

如果這個套件對你有幫助，歡迎到 GitHub 給顆 ⭐ 支持一下！

👉 [https://github.com/AdaaWu/fuelphp-tools](https://github.com/AdaaWu/fuelphp-tools)

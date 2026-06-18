# FuelPHP Tools

A developer toolkit for FuelPHP projects. Provides clickable path links, route execution, Model table name lookup, and one-click SQL copying to boost your daily development workflow.

## Features

| # | Feature | Scope |
|---|---------|-------|
| 1.  | **Path Links** — `Cmd/Ctrl+Click` on paths in `View::forge` / `Asset::css/js/img` / `Config::load` / `Lang::load` to jump to the file | All PHP files |
| 2.  | **Controller ↔ routes.php Two-Way Jump** — Jump from routes.php to a Controller method, or from a Controller method back to routes.php | `routes.php` ↔ Controller |
| 3.  | **Route Runner** — ▶ Run CodeLens above each route; fill in params and open in browser automatically | `routes.php` |
| 4.  | **Model Table Hover** — Hover over `Model_X` to see the real database table name | All PHP files |
| 5.  | **Copy Function SQL** — One click to copy a method's full SQL with table names, constants, and formatting resolved | `model/` directory |

---

## ⭐Feature①: Path Links

In any PHP file, `Cmd+Click` (Mac) or `Ctrl+Click` (Windows/Linux) on the path string inside the following methods to open the corresponding file. **Links only appear when the target file actually exists.**

| Method | Target |
|--------|--------|
| `View::forge('admin/dashboard')` | `fuel/app/views/admin/dashboard.php` |
| `Asset::css('common/layout.css')` | `public/assets/css/common/layout.css` |
| `Asset::js('common/app.js')` | `public/assets/js/common/app.js` |
| `Asset::img('logo.png')` | `public/assets/img/logo.png` |
| `Config::load('pagination')` | `fuel/app/config/pagination.php` |
| `Lang::load('messages')` | `fuel/app/lang/messages.php` |

```php
// Cmd+Click "admin/dashboard" → opens fuel/app/views/admin/dashboard.php
$this->template->content = View::forge('admin/dashboard', $data);

// Cmd+Click "common/layout.css" → opens the CSS file
Asset::css('common/layout.css');
```

---

## ⭐Feature②: Controller ↔ routes.php Two-Way Jump

### routes.php → Controller

In `routes.php`, `Cmd+Click` on the `=> 'controller/action'` value to jump directly to the Controller file at the action method.

```php
// Cmd+Click "api/product/ajax/update"
// → opens fuel/app/classes/controller/api/product/ajax.php
// → jumps to post_update() method
'product/update' => 'api/product/ajax/update',
```

**Resolution rules:**
1. Try the full path as a file first (`admin/item/index/index` → `admin/item/index.php` + `action_index()`)
2. If not found, treat the last segment as the action name (`api/product/ajax/update` → `api/product/ajax.php` + `post_update()`)
3. No link is shown if no matching file is found

### Controller → routes.php (Reverse Jump)

In Controller files, method names like `action_xxx`, `post_xxx`, and `get_xxx` are underlined. `Cmd+Click` jumps back to the corresponding route line in `routes.php`.

```php
// Cmd+Click "action_index" → jumps to the matching route in routes.php
public function action_index()
{
    // ...
}

// Cmd+Click "post_update" → jumps to the matching route in routes.php
public function post_update()
{
    // ...
}
```

No underline is shown if no matching route is found — no false positives.

---

## ⭐Feature③: Route Runner

A **▶ Run** CodeLens button appears above each route in `routes.php`. Click it to build a URL and open it in your browser.

```php
// ▶ Run ← click this button
'(:category_id)/item/(:item_id)' => 'front/item/index',
```

**How it works:**
1. Detects route parameters (`:category_id`, `:item_id`, `(?P<name>...)` style)
2. Prompts for each parameter value one by one
3. Press Enter to use the default from `.env` (falls back to the param name itself)
4. Builds the full URL and opens it in an external browser

**`.env` configuration (place in project root):**

```env
FUELPHP_DOMAIN=https://your-dev-domain.local
FUELPHP_CATEGORY_ID=1
FUELPHP_ITEM_ID=100
FUELPHP_PAGE=1
```

Also supports PHP variable-concat routes (`$category.$type.$page => 'front/list/...'`) — it automatically parses the variable definitions above to extract parameter names.

---

## ⭐Feature④: Model Table Hover

Hover over any `Model_X` class name in a PHP file to see its real database table name.

```php
// hover over Model_Product_Category → shows "Table: product_categories"
$sql .= 'FROM ' . Model_Product_Category::table() . ' pc';
```

**Table name resolution order:**
1. `CONST TABLE_NAME = 'xxx'`
2. `protected static $_table_name = 'xxx'`
3. FuelPHP `Inflector::tableize()` auto-derivation (`Model_Item` → `items`, `Model_Product_Category` → `product_categories`)

---

## ⭐Feature⑤: Copy Function SQL

A **📋 Copy SQL** CodeLens appears above any `public static function` containing `DB::query` in files under `model/`.

```php
// 📋 Copy SQL ← click this button
public static function get_item_detail($item_id, $type)
{
    $query  = 'SELECT i.id, i.name, c.name AS category_name';
    $query .= 'FROM ' . self::table() . ' AS i ';
    $query .= 'LEFT JOIN ' . Model_Category::table() . ' c ON i.category_id = c.id ';
    $query .= 'WHERE i.id = :item_id ';
    $query .= 'AND i.display_flg = ' . FLG_ON;
}
```

**Output example:**

```sql
-- Model_Item
-- get_item_detail

SELECT i.id, i.name, c.name AS category_name
FROM items AS i
	LEFT JOIN categories c ON i.category_id = c.id
WHERE i.id = :item_id
	AND i.display_flg = 1
```

**What gets resolved automatically:**
- `self::table()` / `Model_X::table()` → replaced with the real table name
- Constants like `FLG_ON` / `FLG_OFF` → resolved from `fuel/app/config/const.php`
- SQL keywords formatted with newlines and indentation (`SELECT`, `FROM`, `LEFT JOIN`, `WHERE`, `AND`, etc.)
- SQL inside `if` blocks is included and marked with `-- [conditional]`
- A header comment with the Model class name and function name is prepended

Paste directly into DBeaver and replace any `:param` placeholders to run.

---

## Settings

Customize paths in `.vscode/settings.json` or VSCode settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `fuelpHPTools.domain` | `""` | Base domain for Route Runner (leave empty to use `FUELPHP_DOMAIN` from `.env`) |
| `fuelpHPTools.viewsPath` | `fuel/app/views` | Path to the views directory, relative to workspace root |
| `fuelpHPTools.assetsPath` | `public/assets` | Path to the assets directory, relative to workspace root |

**Domain priority:** VSCode setting → `.env` `FUELPHP_DOMAIN` → `http://localhost`

---

## Installation

### VSCode Marketplace

Search for `FuelPHP Tools` in the Extensions panel and install.

### From .vsix (Antigravity IDE / Open VSX)

1. Download `fuelphp-tools-x.x.x.vsix`
2. `Cmd+Shift+P` → **Install from VSIX**
3. Select the downloaded `.vsix` file
4. Reload Window

---

## License

MIT

---

If this extension helps you, please consider giving it a ⭐ on GitHub!

👉 [https://github.com/AdaaWu/fuelphp-tools](https://github.com/AdaaWu/fuelphp-tools)

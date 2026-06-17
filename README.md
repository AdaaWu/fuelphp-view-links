# FuelPHP View Links

Adds clickable links for `View::forge()` paths in FuelPHP projects, so you can jump directly to the corresponding view file.

## Usage

In any PHP file, hover over the path inside `View::forge(...)` and `Cmd+Click` (Mac) or `Ctrl+Click` (Windows/Linux) to open the view file.

```php
// Click "user/search/shop" to open fuel/app/views/user/search/shop.php
$this->template->content = View::forge('user/search/shop', $data);
```

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `fuelpHPViewLinks.viewsPath` | `fuel/app/views` | Path to the views directory, relative to workspace root |

If your project uses a non-standard views path, add this to your `.vscode/settings.json`:

```json
{
  "fuelpHPViewLinks.viewsPath": "app/views"
}
```

#!/usr/bin/env python3
"""Create deterministic Git repositories for global skill evaluations."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import stat
import subprocess
from pathlib import Path


def run(repo: Path, *args: str) -> None:
    subprocess.run(args, cwd=repo, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def write(repo: Path, relative: str, content: str, executable: bool = False) -> None:
    path = repo / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    if executable:
        path.chmod(path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def init(repo: Path, remote: str = "https://github.com/example/shop.git") -> None:
    if repo.exists():
        shutil.rmtree(repo)
    repo.mkdir(parents=True)
    run(repo, "git", "init", "-b", "main")
    run(repo, "git", "config", "user.email", "skill-evals@example.test")
    run(repo, "git", "config", "user.name", "Skill Evaluations")
    run(repo, "git", "remote", "add", "origin", remote)


def commit(repo: Path, message: str) -> None:
    run(repo, "git", "add", "-A")
    run(repo, "git", "commit", "-m", message)


def package_json(name: str = "skill-eval-fixture") -> str:
    return json.dumps(
        {
            "name": name,
            "private": True,
            "type": "module",
            "scripts": {"test": "node --test"},
        },
        indent=2,
    ) + "\n"


def auth_bug(repo: Path) -> str:
    init(repo)
    write(repo, "package.json", package_json("invoice-permissions"))
    write(repo, "README.md", "# Invoice permissions\n\nCustomers may view only their own invoices. Administrators may view every invoice.\n")
    write(
        repo,
        "src/auth.js",
        """export function canViewInvoice(user, invoice) {
  if (!user || !invoice) return false;
  return user.isAdmin === true || invoice.customerId === user.id;
}
""",
    )
    write(
        repo,
        "test/auth.test.js",
        """import test from 'node:test';
import assert from 'node:assert/strict';
import { canViewInvoice } from '../src/auth.js';

test('owner can view an invoice', () => {
  assert.equal(canViewInvoice({ id: 'u1' }, { customerId: 'u1' }), true);
});

test('administrator can view an invoice', () => {
  assert.equal(canViewInvoice({ id: 'admin', isAdmin: true }, { customerId: 'u1' }), true);
});
""",
    )
    commit(repo, "Add invoice authorization")
    run(repo, "git", "checkout", "-b", "feature/auth-simplification")
    write(
        repo,
        "src/auth.js",
        """export function canViewInvoice(user, invoice) {
  if (!user || !invoice) return false;
  return Boolean(user.isAdmin || invoice.customerId);
}
""",
    )
    commit(repo, "Simplify invoice access check")
    return "feature/auth-simplification"


def clean_change(repo: Path) -> str:
    init(repo)
    write(repo, "package.json", package_json("pagination-utils"))
    write(repo, "README.md", "# Pagination utility\n\nPage sizes are whole numbers from 1 through 100. Whole numbers outside that range are clamped to the nearest valid size; other invalid input uses 25.\n")
    write(repo, "src/pagination.js", "export const DEFAULT_PAGE_SIZE = 25;\n")
    commit(repo, "Add pagination module")
    run(repo, "git", "checkout", "-b", "feature/page-size")
    write(
        repo,
        "src/pagination.js",
        """export const DEFAULT_PAGE_SIZE = 25;

export function normalizePageSize(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return DEFAULT_PAGE_SIZE;
  if (typeof value === 'string' && value.trim() === '') return DEFAULT_PAGE_SIZE;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_PAGE_SIZE;
  return Math.min(100, Math.max(1, parsed));
}
""",
    )
    write(
        repo,
        "test/pagination.test.js",
        """import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePageSize } from '../src/pagination.js';

test('keeps in-range integers', () => assert.equal(normalizePageSize(50), 50));
test('clamps integers', () => {
  assert.equal(normalizePageSize(0), 1);
  assert.equal(normalizePageSize(101), 100);
});
test('uses the default for invalid input', () => {
  assert.equal(normalizePageSize('many'), 25);
  assert.equal(normalizePageSize(2.5), 25);
  assert.equal(normalizePageSize(null), 25);
  assert.equal(normalizePageSize('  '), 25);
  assert.equal(normalizePageSize(false), 25);
  assert.equal(normalizePageSize([]), 25);
});
""",
    )
    commit(repo, "Normalize requested page sizes")
    return "feature/page-size"


def coupon_fix(repo: Path) -> str:
    init(repo)
    write(repo, "package.json", package_json("storefront-cart"))
    write(
        repo,
        "public/cart.html",
        """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Cart</title></head>
<body>
  <main>
    <h1>Your cart</h1>
    <p>Subtotal: <strong>$100.00</strong></p>
    <label for="promo">Promo code</label>
    <input id="promo" name="promo">
    <button type="button">Apply promo code</button>
    <p role="status" id="promo-status"></p>
  </main>
</body></html>
""",
    )
    write(
        repo,
        "src/coupon.js",
        """export function applyCoupon(subtotal, code) {
  if (code !== 'SAVE10') throw new Error('Invalid promo code');
  return Math.round(subtotal * 0.9 * 100) / 100;
}
""",
    )
    write(
        repo,
        "test/coupon.test.js",
        """import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon } from '../src/coupon.js';

test('applies SAVE10', () => assert.equal(applyCoupon(100, 'SAVE10'), 90));
""",
    )
    commit(repo, "Add SAVE10 promotion")
    run(repo, "git", "checkout", "-b", "fix/lowercase-promo-code")
    write(
        repo,
        "src/coupon.js",
        """export function applyCoupon(subtotal, code) {
  const normalizedCode = String(code).trim().toUpperCase();
  if (normalizedCode !== 'SAVE10') throw new Error('Invalid promo code');
  return Math.round(subtotal * 0.9 * 100) / 100;
}
""",
    )
    write(
        repo,
        "test/coupon.test.js",
        """import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon } from '../src/coupon.js';

test('applies SAVE10', () => assert.equal(applyCoupon(100, 'SAVE10'), 90));
test('accepts lowercase and surrounding spaces', () => {
  assert.equal(applyCoupon(100, ' save10 '), 90);
});
""",
    )
    commit(repo, "Accept lowercase promo codes")
    return "fix/lowercase-promo-code"


def backend_only(repo: Path) -> str:
    init(repo)
    write(repo, "package.json", package_json("telemetry-batching"))
    write(repo, "README.md", "# Telemetry library\n\nInternal event batching has no product UI or user-visible status.\n")
    write(repo, "src/batch.js", "export function batch(events) { return [events]; }\n")
    commit(repo, "Add telemetry sender")
    run(repo, "git", "checkout", "-b", "feature/telemetry-batches")
    write(
        repo,
        "src/batch.js",
        """export function batch(events, size = 50) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError('size must be a positive integer');
  const groups = [];
  for (let index = 0; index < events.length; index += size) {
    groups.push(events.slice(index, index + size));
  }
  return groups;
}
""",
    )
    write(
        repo,
        "test/batch.test.js",
        """import test from 'node:test';
import assert from 'node:assert/strict';
import { batch } from '../src/batch.js';

test('splits events into bounded groups', () => {
  assert.deepEqual(batch([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});
""",
    )
    commit(repo, "Batch telemetry events")
    return "feature/telemetry-batches"


def github_pr(repo: Path) -> str:
    init(repo, "https://github.com/example/storefront.git")
    write(repo, "package.json", package_json("order-notes"))
    write(
        repo,
        ".github/pull_request_template.md",
        """## Summary

## Validation

## Risk and rollout

## Reviewer focus
""",
    )
    write(repo, "src/order-note.js", "export const MAX_ORDER_NOTE_LENGTH = 500;\n")
    commit(repo, "Add order module")
    run(repo, "git", "checkout", "-b", "feature/order-notes")
    write(
        repo,
        "src/order-note.js",
        """export const MAX_ORDER_NOTE_LENGTH = 500;

export function validateOrderNote(note) {
  const value = String(note ?? '').trim();
  if (value.length > MAX_ORDER_NOTE_LENGTH) {
    return { valid: false, message: 'Order note must be 500 characters or fewer.' };
  }
  return { valid: true, value };
}
""",
    )
    write(
        repo,
        "public/checkout.html",
        """<!doctype html><html lang="en"><body><main>
<h1>Checkout</h1>
<label for="order-note">Order note (optional)</label>
<textarea id="order-note" maxlength="500"></textarea>
<p>Maximum 500 characters.</p>
<button>Place order</button>
</main></body></html>
""",
    )
    write(
        repo,
        "test/order-note.test.js",
        """import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOrderNote } from '../src/order-note.js';

test('accepts and trims an order note', () => {
  assert.deepEqual(validateOrderNote('  leave at reception  '), { valid: true, value: 'leave at reception' });
});
test('rejects notes over 500 characters', () => {
  assert.equal(validateOrderNote('x'.repeat(501)).valid, false);
});
""",
    )
    commit(repo, "Add optional checkout order notes")
    return "feature/order-notes"


def azure_pr(repo: Path) -> str:
    init(repo, "https://dev.azure.com/example/CustomerPortal/_git/CustomerPortal")
    write(repo, "package.json", package_json("profile-timezone"))
    write(
        repo,
        ".azuredevops/pull_request_template.md",
        """## Change summary

## Validation

## Deployment notes
""",
    )
    write(
        repo,
        ".azuredevops/pull_request_template/branches/main.md",
        """## Main branch change

## Database compatibility

## Validation evidence

## Rollback
""",
    )
    write(repo, "src/profile.js", "export function timezoneFor(profile) { return 'UTC'; }\n")
    commit(repo, "Add profile timezone fallback")
    run(repo, "git", "checkout", "-b", "feature/profile-timezone")
    write(
        repo,
        "migrations/20260816_add_profile_timezone.sql",
        "ALTER TABLE profiles ADD COLUMN timezone VARCHAR(64) NULL;\n",
    )
    write(
        repo,
        "src/profile.js",
        """export function timezoneFor(profile) {
  return profile.timezone || 'UTC';
}
""",
    )
    write(
        repo,
        "test/profile.test.js",
        """import test from 'node:test';
import assert from 'node:assert/strict';
import { timezoneFor } from '../src/profile.js';

test('uses stored timezone', () => assert.equal(timezoneFor({ timezone: 'Europe/Paris' }), 'Europe/Paris'));
test('keeps UTC fallback for existing rows', () => assert.equal(timezoneFor({ timezone: null }), 'UTC'));
""",
    )
    commit(repo, "Store optional profile timezones")
    return "feature/profile-timezone"


def gitlab_pr(repo: Path) -> str:
    init(repo, "https://gitlab.com/example/analytics.git")
    write(repo, "package.json", package_json("analytics-export"))
    write(
        repo,
        ".gitlab/merge_request_templates/Default.md",
        """## Outcome

## Verification

## Compatibility and rollout

## Review guidance
""",
    )
    write(repo, "src/export.js", "export function exportRows(rows) { return JSON.stringify(rows); }\n")
    commit(repo, "Add analytics export module")
    run(repo, "git", "checkout", "-b", "feature/csv-export")
    write(
        repo,
        "src/export.js",
        """function csvCell(value) {
  const text = String(value ?? '');
  return /[\",\\n]/.test(text) ? `\"${text.replaceAll('\"', '\"\"')}\"` : text;
}

export function exportRows(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\\n');
}
""",
    )
    write(
        repo,
        "test/export.test.js",
        """import test from 'node:test';
import assert from 'node:assert/strict';
import { exportRows } from '../src/export.js';

test('escapes CSV delimiters and quotes', () => {
  assert.equal(exportRows([['name', 'note'], ['Ada', 'one, \"two\"']]), 'name,note\\nAda,\"one, \"\"two\"\"\"');
});
""",
    )
    commit(repo, "Export analytics rows as CSV")
    return "feature/csv-export"


def large_mixed(repo: Path) -> str:
    init(repo)
    write(repo, "package.json", package_json("transfer-service"))
    write(repo, "README.md", "# Transfer service\n\nTransfer amounts must be positive and may not exceed the available balance. Files under generated/ are produced from data/catalog.txt.\n")
    write(
        repo,
        "src/transfer.js",
        """export function canTransfer(account, amount) {
  return Number.isFinite(amount) && amount > 0 && amount <= account.balance;
}
""",
    )
    write(repo, "data/catalog.txt", "base-catalog\n")
    commit(repo, "Add transfer validation")
    run(repo, "git", "checkout", "-b", "feature/catalog-refresh")
    write(
        repo,
        "src/transfer.js",
        """export function canTransfer(account, amount) {
  return Number.isFinite(amount) && amount <= account.balance;
}
""",
    )
    write(repo, "data/catalog.txt", "refreshed-catalog\n")
    for file_index in range(24):
        rows = [f"generated-item-{file_index}-{row_index}" for row_index in range(80)]
        write(repo, f"generated/catalog-{file_index:02d}.json", json.dumps(rows, indent=2) + "\n")
    commit(repo, "Refresh generated catalog and transfer validation")
    return "feature/catalog-refresh"


def poor_settings(repo: Path) -> str:
    init(repo)
    write(
        repo,
        "README.md",
        """# Settings screen design fixture

Open `settings.html`. For stable screenshots run `./scripts/capture.sh`; output is ignored under `artifacts/`.
The page must remain usable from a 320px web viewport through a 1440px desktop viewport.
""",
    )
    write(repo, ".gitignore", "artifacts/\n")
    write(
        repo,
        "settings.html",
        """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Account settings</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f7f8fa; color: #a7abb2; font: 14px Arial, sans-serif; }
  .shell { width: 1100px; margin: 48px auto 120px; display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
  aside, section { background: white; border-radius: 18px; box-shadow: 0 12px 30px rgba(25, 30, 40, .08); }
  aside { padding: 24px; }
  aside a { display: block; color: #9da2aa; padding: 12px; text-decoration: none; border-radius: 999px; }
  main { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  section { padding: 28px; min-height: 240px; }
  h1 { color: #20242a; font-size: 54px; margin: 0 0 28px; grid-column: 1 / -1; }
  h2 { color: #555b63; }
  label { display: block; margin: 18px 0 6px; }
  input { width: 100%; padding: 11px; border: 1px solid #eceef1; border-radius: 999px; }
  button { border: 0; border-radius: 999px; background: linear-gradient(90deg,#8a5cff,#54c8ff); color: white; padding: 12px 20px; outline: none; }
  .savebar { position: fixed; left: 0; right: 0; bottom: 0; height: 92px; background: rgba(255,255,255,.94); box-shadow: 0 -8px 24px rgba(0,0,0,.08); display: flex; justify-content: flex-end; align-items: center; padding-right: 36px; }
</style>
</head>
<body>
<div class="shell">
  <aside><strong>Acme</strong><a href="#profile">Profile</a><a href="#security">Security</a><a href="#notifications">Notifications</a></aside>
  <main>
    <h1>Account settings</h1>
    <section id="profile"><h2>Profile</h2><label for="name">Display name</label><input id="name" value="Morgan Rivera"><label for="bio">Bio</label><input id="bio" value="Product manager"></section>
    <section id="security"><h2>Security</h2><p>Password last changed 8 months ago.</p><button type="button">Change password</button></section>
    <section id="notifications"><h2>Notifications</h2><label><input type="checkbox" checked> Weekly summary</label><label><input type="checkbox"> Product announcements</label></section>
    <section><h2>Connected apps</h2><p>No connected applications.</p><button type="button">Connect an app</button></section>
  </main>
</div>
<div class="savebar"><button type="button">Save changes</button></div>
</body>
</html>
""",
    )
    write(
        repo,
        "scripts/capture.sh",
        """#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$root/artifacts"
chrome="${CHROME_BIN:-$(command -v google-chrome || command -v chromium || true)}"
if [[ -z "$chrome" ]]; then
  echo "Chrome/Chromium is required" >&2
  exit 1
fi
"$chrome" --headless=new --no-sandbox --disable-gpu --window-size=360,800 --screenshot="$root/artifacts/settings-360.png" "file://$root/settings.html" >/dev/null 2>&1
"$chrome" --headless=new --no-sandbox --disable-gpu --window-size=1440,900 --screenshot="$root/artifacts/settings-1440.png" "file://$root/settings.html" >/dev/null 2>&1
printf '%s\n' "$root/artifacts/settings-360.png" "$root/artifacts/settings-1440.png"
""",
        executable=True,
    )
    commit(repo, "Add account settings design fixture")
    return "main"


SCENARIOS = {
    "auth-bug": auth_bug,
    "clean-change": clean_change,
    "coupon-fix": coupon_fix,
    "backend-only": backend_only,
    "github-pr": github_pr,
    "azure-pr": azure_pr,
    "gitlab-pr": gitlab_pr,
    "large-mixed": large_mixed,
    "poor-settings": poor_settings,
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("scenario", choices=sorted(SCENARIOS))
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    head = SCENARIOS[args.scenario](args.destination.resolve())
    print(json.dumps({"repo": str(args.destination.resolve()), "base": "main", "head": head}))


if __name__ == "__main__":
    main()

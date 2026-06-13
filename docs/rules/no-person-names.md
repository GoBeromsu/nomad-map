---
slug: no-person-names
date: 2026-06-13
generated-by: claude-code
governing-adr: none
status: active
---
# Rule: No Person Names or Personal Identifiers

## Rule

No real person's name or personal identifier may appear ANYWHERE in the public artifacts — this includes `data/places.json` (descriptions, notes/comments, addresses), all 8-locale translations (ko/en/ja/zh/es/fr/de/vi), `data/route.json`, any extracted source data, commit messages, and UI copy. This is a hard, non-negotiable owner rule: no personal information may leak, and no individual person's name may appear in any public artifact.

## Rationale

The site is public and read-only; the owner requires zero personal-information leakage. Names of the owner, companions, hosts, staff, or any individual must be stripped or rephrased neutrally.

## Scope

All committed content and all generated translations; both data lanes and code lanes.

## Examples

**Compliant:** "A bicycle-themed guesthouse in Jongdal-ri."

**Non-compliant:** "A guesthouse run by [NAME] in Jongdal-ri." — any sentence naming a specific person (owner/host/friend/staff) violates this rule.

## Exceptions

Public business/brand names are allowed (e.g. a cafe's official brand name); personal names of individuals are not.

## Enforcement

Manual audit on every data change + reviewer check; flag any candidate name for neutral rephrasing across ALL locales.

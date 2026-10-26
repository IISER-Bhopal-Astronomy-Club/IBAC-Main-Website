#!/usr/bin/env python3
"""
Change the image paths in the article pages from  images/...  to  ../images/...
(use this when the article pages live in a sub-folder, one level below the main site folder).

HOW TO RUN (from the folder that contains the article .html files):

    python fix_image_paths.py                # fix the images
    python fix_image_paths.py --links        # also fix links to the main pages (index.html, articles.html ...)
    python fix_image_paths.py --dry-run      # show what would change, change nothing
    python fix_image_paths.py --undo         # take the ../ back out (for pages that are in the main folder)
    python fix_image_paths.py path/to/folder # work on another folder

It is safe to run more than once: paths that already start with ../ are left alone.
"""
import argparse
import os
import re

ROOT_PAGES = ("index", "articles", "research", "gallery", "resources", "newsletters")

# attribute="images/..."   (img src, favicon href, og:image content ...)
IMG_ATTR = re.compile(r'(\b(?:src|href|content|data-src|poster)\s*=\s*["\'])(?:\./)?images/')
# url(images/...) inside CSS
IMG_CSS = re.compile(r'(url\(\s*["\']?)(?:\./)?images/')
# href="index.html", href="articles.html#top" ...
PAGE_LINK = re.compile(r'(\bhref\s*=\s*["\'])((?:%s)\.html)' % "|".join(ROOT_PAGES))

UNDO_ATTR = re.compile(r'(\b(?:src|href|content|data-src|poster)\s*=\s*["\'])\.\./images/')
UNDO_CSS = re.compile(r'(url\(\s*["\']?)\.\./images/')
UNDO_LINK = re.compile(r'(\bhref\s*=\s*["\'])\.\./((?:%s)\.html)' % "|".join(ROOT_PAGES))


def process(text, links, undo):
    n = 0
    if undo:
        text, a = UNDO_ATTR.subn(r"\1images/", text)
        text, b = UNDO_CSS.subn(r"\1images/", text)
        n += a + b
        if links:
            text, c = UNDO_LINK.subn(r"\1\2", text)
            n += c
    else:
        text, a = IMG_ATTR.subn(r"\1../images/", text)
        text, b = IMG_CSS.subn(r"\1../images/", text)
        n += a + b
        if links:
            text, c = PAGE_LINK.subn(r"\1../\2", text)
            n += c
    return text, n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", nargs="?", default=".")
    ap.add_argument("--links", action="store_true", help="also fix links to index.html, articles.html, etc.")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--undo", action="store_true", help="remove the ../ again")
    args = ap.parse_args()

    files = sorted(f for f in os.listdir(args.folder) if f.lower().endswith(".html"))
    if not files:
        print("No .html files found in %s. Run this from the folder that holds the article pages." % os.path.abspath(args.folder))
        return
    total = changed = 0
    for name in files:
        path = os.path.join(args.folder, name)
        with open(path, encoding="utf-8") as fh:
            old = fh.read()
        new, n = process(old, args.links, args.undo)
        if n:
            changed += 1
            total += n
            if not args.dry_run:
                with open(path, "w", encoding="utf-8", newline="") as fh:
                    fh.write(new)
        print("%-52s %3d paths %s" % (name, n, "changed" if n and not args.dry_run else ("would change" if n else "(nothing to do)")))
    print("\n%s %d paths in %d of %d files." % ("Would change" if args.dry_run else "Changed", total, changed, len(files)))


if __name__ == "__main__":
    main()

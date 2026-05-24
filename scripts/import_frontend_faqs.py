#!/usr/bin/env python3
"""Import FAQ-style questions from frontend form pages into the Django KnowledgeBase.

Usage:
    ./.venv/Scripts/python.exe scripts/import_frontend_faqs.py

This script scans `frontend/src/pages/*.jsx` for `<label>...</label>` and
`placeholder="..."` occurrences and creates/updates KnowledgeBase entries.
"""
import os
import re
import sys


def find_page_files(root):
    pages_dir = os.path.join(root, 'frontend', 'src', 'pages')
    if not os.path.isdir(pages_dir):
        print('frontend pages directory not found:', pages_dir)
        return []
    return [os.path.join(pages_dir, f) for f in os.listdir(pages_dir) if f.endswith('.jsx')]


def extract_fields_from_file(path):
    with open(path, 'r', encoding='utf-8') as fh:
        src = fh.read()

    labels = re.findall(r'<label[^>]*>(.*?)</label>', src, flags=re.S)
    placeholders = re.findall(r'placeholder=\"(.*?)\"', src)
    hints = re.findall(r'className=\"field-hint\"[^>]*>(.*?)<', src)
    title = None
    # try to find page heading
    m = re.search(r'<h2>(.*?)</h2>', src)
    if m:
        title = m.group(1).strip()

    content_lines = []
    if title:
        content_lines.append(f'Page: {title}')

    if labels:
        content_lines.append('\nFields:')
        for lbl in labels:
            clean = re.sub(r'\s+', ' ', lbl).strip()
            content_lines.append(f'- {clean}')

    if placeholders:
        content_lines.append('\nPlaceholders:')
        for ph in placeholders:
            content_lines.append(f'- {ph}')

    if hints:
        content_lines.append('\nField hints:')
        for h in hints:
            content_lines.append(f'- {h.strip()}')

    return '\n'.join(content_lines).strip()


def main():
    repo_root = os.path.dirname(os.path.dirname(__file__))

    # Locate frontend page files
    files = find_page_files(repo_root)
    if not files:
        print('No frontend page files to process.')
        return

    # Prepare Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        import django
        django.setup()
    except Exception as exc:
        print('Error setting up Django environment:', exc)
        print('Run this script from the repository root with the virtualenv active.')
        return

    from orders.models import KnowledgeBase

    created = 0
    updated = 0
    for f in files:
        try:
            content = extract_fields_from_file(f)
            if not content:
                continue
            title = 'FAQ: ' + os.path.splitext(os.path.basename(f))[0].replace('-', ' ').title()
            kb, exists = KnowledgeBase.objects.get_or_create(title=title)
            if not kb.text_content:
                kb.text_content = content
                kb.save()
                created += 1
            else:
                # update if different
                if kb.text_content.strip() != content.strip():
                    kb.text_content = content
                    kb.save()
                    updated += 1
        except Exception as exc:
            print('Failed processing', f, exc)

    print(f'Done. Created: {created}, Updated: {updated}')


if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
import pathlib

FILES = [
    'src/App.tsx',
    'src/HomeView.tsx',
    'src/admin/ProductOrdersView.tsx',
]

def fix_currency_mojibake(text: str) -> str:
    text = text.replace("Ä''", "đ'")
    text = text.replace("Ä'", "đ'")
    return text

def main():
    root = pathlib.Path(__file__).resolve().parents[1]
    for rel in FILES:
        p = root / rel
        if not p.exists():
            continue
        t = p.read_text(encoding='utf-8-sig')
        t = fix_currency_mojibake(t)
        p.write_text(t, encoding='utf-8', newline='\n')
        bad = t.count('Ä')
        print(rel, 'OK' if bad == 0 else f'remaining Ä={bad}')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
R2直リンク追試験解答PDFの一括取得・下読み用スクリプト。
ネットワーク接続がある環境で実行する。PDF本文から「解答番号 正解 配点」の行を抽出し、
機械抽出結果を JSONL に出す。最終登録前に必ず目視照合すること。

Usage:
  python tools/r2_answer_pdf_importer.py r2_retake_candidates_v132.json extracted.jsonl

Requires:
  pip install pymupdf requests
"""
import json, re, sys, pathlib, requests, fitz

def fetch(url: str) -> bytes | None:
    r=requests.get(url,timeout=20)
    if r.status_code!=200 or 'pdf' not in r.headers.get('content-type','').lower():
        return None
    return r.content

def extract_rows(pdf_bytes: bytes):
    doc=fitz.open(stream=pdf_bytes,filetype='pdf')
    text='\n'.join(page.get_text('text') for page in doc)
    # Common DNC answer PDFs have rows roughly: 解答番号 正解 配点.
    rows=[]
    for line in text.splitlines():
        s=' '.join(line.split())
        # accept western or full-width digits after normalization
        z=s.translate(str.maketrans('０１２３４５６７８９','0123456789'))
        m=re.match(r'^(\d{1,2})\s+([0-9A-Za-z\-]+)\s+(\d{1,2})(?:\s|$)',z)
        if m:
            rows.append({'id':m.group(1),'answer':m.group(2),'points':int(m.group(3)),'raw':s})
    return rows, text[:2000]

def main():
    if len(sys.argv)!=3:
        raise SystemExit(__doc__)
    candidates=json.load(open(sys.argv[1],encoding='utf-8'))['candidates']
    out=pathlib.Path(sys.argv[2])
    with out.open('w',encoding='utf-8') as f:
        for c in candidates:
            b=fetch(c['answerPdfUrl'])
            if not b:
                continue
            rows, sample=extract_rows(b)
            rec={**c,'rowCount':len(rows),'rows':rows,'sample':sample}
            f.write(json.dumps(rec,ensure_ascii=False)+'\n')
            print(c['year'],c['subject'],len(rows))
if __name__=='__main__':
    main()

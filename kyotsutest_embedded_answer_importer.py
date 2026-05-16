#!/usr/bin/env python3
"""
kyotsutest/vercel 追試「問題+解答」ページ用インポータ（v134）

目的:
  https://kyotsutest.vercel.app/test/{年度}_{科目}_追試験問題.pdf
  を開き、ページ内の「解答を閲覧」ボタンまたは埋め込み解答画像/PDFをたどって、
  解答番号・正解・配点を answer_keys_verified.json に登録するための中間JSONを作る。

使い方の想定:
  python tools/kyotsutest_embedded_answer_importer.py \
    --candidates retake_problem_answer_page_candidates_v134.json \
    --out extracted_retake_answers.jsonl

注意:
  このスクリプトはネットワークアクセス可能な通常ローカル環境での実行を想定。
  ChatGPTの現在のコンテナではDNS解決ができないことがあるため、ZIP内に作業用として同梱。
"""
import argparse, json, re, sys, urllib.request
from html.parser import HTMLParser

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        for k in ('href','src','data-pdf','data-file','data-thumb','data-image'):
            if k in d: self.links.append(d[k])

def fetch(url, timeout=20):
    req=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.headers.get('content-type',''), r.read()

def discover_answer_assets(problem_url):
    ctype, body = fetch(problem_url)
    text = body.decode('utf-8','ignore') if b'<' in body[:2000] else ''
    found=[]
    if text:
        lp=LinkParser(); lp.feed(text)
        hay='\n'.join(lp.links)+"\n"+text
        for m in re.finditer(r'https?://[^\s"\']+(?:解答|answer|kaitou|kotae)[^\s"\']+', hay):
            found.append(m.group(0))
        # common kyotsutest/vercel convention
        m=re.search(r'/test/([^/]+?)_追試験問題\.pdf', problem_url)
        if m:
            base=m.group(1)
            found.append('https://pub-43d2006e555442dca4a107e7bc0d01bb.r2.dev/'+base+'_追試験解答.pdf')
    return sorted(set(found))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--candidates', required=True)
    ap.add_argument('--out', required=True)
    args=ap.parse_args()
    cands=json.load(open(args.candidates,encoding='utf-8'))
    with open(args.out,'w',encoding='utf-8') as out:
        for c in cands:
            rec=dict(c)
            try:
                rec['answerAssets']=discover_answer_assets(c['problemPageUrl'])
                rec['status']='asset-discovered' if rec['answerAssets'] else 'no-answer-asset-found'
            except Exception as e:
                rec['status']='fetch-error'; rec['error']=repr(e)
            out.write(json.dumps(rec,ensure_ascii=False)+'\n')
if __name__=='__main__': main()

import json,pymupdf as f,subprocess,concurrent.futures,re
from pathlib import Path
from config import APP, BOOK, WORK, SCRIPTS, TESSDATA, book_pdf
P=WORK;entries=json.loads((P/'grouped.json').read_text());doc=f.open(book_pdf(2))
(P/'numbers').mkdir(exist_ok=True)
items=[]
for i,e in enumerate(entries):
 if e['level']!=2:continue
 rows=[r for r in e['rows'] if r['page']==e['page']]; top=rows[0]['bbox'][1]
 first=next(r for r in rows if r['cells'][0] and re.search('[\u0600-\u06ff]',r['cells'][0]))
 bottom=first['bbox'][1];clip=f.Rect(44.5,top+1,88,bottom-1)
 path=P/'numbers'/f'{i}.png';doc[e['page']-1].get_pixmap(matrix=f.Matrix(5,5),clip=clip).save(str(path));items.append((i,path))
def one(v):
 i,p=v;r=subprocess.run(['tesseract',str(p),'stdout','--tessdata-dir',str(TESSDATA),'-l','ben','--psm','7','-c','tessedit_char_whitelist=০১২৩৪৫৬৭৮৯'],capture_output=True,text=True,errors="replace").stdout.strip();return i,r
for i,s in concurrent.futures.ThreadPoolExecutor(max_workers=6).map(one,items):
 entries[i]['number_ocr']=s
 try:entries[i]['entry']=int(s)
 except:pass
(P/'numbered.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2))
print([(i,e['page'],e['entry'],e['number_ocr']) for i,e in enumerate(entries) if e['level']==2])

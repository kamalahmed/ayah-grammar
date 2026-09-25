import json,re,unicodedata,collections
from pathlib import Path
from config import APP, BOOK, WORK, SCRIPTS, TESSDATA
P=WORK;raw=json.loads((P/'rows.json').read_text())

def canonical(r):
 cells=[None]*6;rects=[None]*6
 for v,rect in zip(r['cells'],r['rects']):
  if rect is None:continue
  col=max(0,min(5,round((rect[0]-43.1)/51.8)))
  if cells[col] and v:cells[col]+=' '+v
  else:cells[col]=v
  rects[col]=rect
 return {**r,'cells':cells,'rects':rects}
rows=[canonical(r) for r in raw]
isar=lambda v:bool(v and re.search('[\u0600-\u06ff]',v))
isbn=lambda v:bool(v and re.search('[\u0980-\u09ff]',v))
root=lambda v: bool(v and re.fullmatch('[\u0621-\u064a ]{3,9}',v))
heads=[]
for r in rows:
 c=r['cells']; h=(c[0] and c[0].isascii() and c[0].isdigit() and 1<=int(c[0])<=200 and r['level']==1) or (root(c[3]) and isar(c[4]) and not isar(c[0]) and (not c[1] or not re.fullmatch('[IVX]+',c[1])))
 if h:heads.append(r)
print('headers',collections.Counter(r['level'] for r in heads))
for level in [1,2]:
 print('HEADERS LEVEL',level)
 for r in heads:
  if r['level']==level:print(r['page'],r['cells'])
(P/'canonical-rows.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
(P/'headers.json').write_text(json.dumps(heads,ensure_ascii=False,indent=2))

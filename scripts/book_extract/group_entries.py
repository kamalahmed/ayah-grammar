import json,re,collections
from pathlib import Path
from config import APP, BOOK, WORK, SCRIPTS, TESSDATA
P=WORK;rows=json.loads((P/'canonical-rows.json').read_text())
isar=lambda v:bool(v and re.search('[\u0600-\u06ff]',v))
isbn=lambda v:bool(v and re.search('[\u0980-\u09ff]',v))
entries=[];current=None
for r in rows:
 c=r['cells']
 numeric=r['level']==1 and c[0] and c[0].isascii() and c[0].isdigit() and 1<=int(c[0])<=200
 header=numeric or (c[0] is not None and not isar(c[0]) and c[2] is None and (isbn(c[1]) or isar(c[3])))
 if header:
  if current is None or current['level']!=r['level'] or any(isar(x['cells'][0]) for x in current['rows']):
   current={'level':r['level'],'page':r['page'],'entry':int(c[0]) if numeric else None,'rows':[]};entries.append(current)
 if current: current['rows'].append(r)
 if numeric:current['entry']=int(c[0])
print('entries',collections.Counter(v['level'] for v in entries))
for e in entries:
 e['past']=[x['cells'] for x in e['rows'] if isar(x['cells'][0])]
 if len(e['past'])!=2:print(e['level'],e['entry'],e['page'],'arab rows',e['past'])
(P/'grouped.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2))

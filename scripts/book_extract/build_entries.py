import json,re,unicodedata,collections
from pathlib import Path
from config import APP, BOOK, WORK, SCRIPTS, TESSDATA
P=WORK;source=json.loads((P/'numbered.json').read_text())
for i,num in {289:289,311:311,371:371,412:411,472:471}.items():source[i]['entry']=num
AR=re.compile('[\u0600-\u06ff]');BN=re.compile('[\u0980-\u09ff]')
isar=lambda v:bool(v and AR.search(v));isbn=lambda v:bool(v and BN.search(v))
def clean(v):return re.sub(r'\s*/\s*',' / ',unicodedata.normalize('NFC',v.replace('\xad',''))).strip()
verbs=[];issues=[]
for e in source:
 rows=e['rows'];rows=[r for r in rows if not (e['entry']==1 and r['cells'][0]=='শশবব িমিমরর')];first=next(i for i,r in enumerate(rows) if isar(r['cells'][0]))
 header=rows[:first];root='';meaning=[];form=''
 for r in header:
  c=r['cells']
  if isar(c[3]):root=c[3]
  if isbn(c[1]):meaning.append(c[1])
 for r in rows:
  v=r['cells'][1]
  if v and re.fullmatch('[IVX]+',v):form=v
 if not form: form='I' if e['entry'] in [30,91,190] else ''
 if e['entry']==91:root='باس'
 if e['entry']==190:root='نعم'
 conjug=[];a=0
 for i,r in enumerate(rows):
  if e['entry'] in [91,190]:continue
  c=r['cells'];arcount=sum(isar(v) for v in c)
  if arcount>=5 and isar(c[0]) and isar(c[1]):
   aspect=['PERF','IMPF'][a] if a<2 else 'EXTRA';a+=1;cols=range(6);persons=['3MS','3MP','2MS','2MP','1S','1P']
  elif isar(c[2]) and isar(c[3]) and not isar(c[1]):
   aspect='IMPV';cols=[2,3];persons=['2MS','2MP']
  elif e['entry'] in [91,190] and isar(c[0]):
   continue
  else:continue
  for col,person in zip(cols,persons):
   parts=[];bnrects=[]
   for nextrow in rows[i+1:]:
    nc=nextrow['cells']
    if any(isar(v) for v in nc):break
    if nc[col] and len([v for v in nc if v])==1 and col==0:break
    if e['entry']==1 and nc[col]=='আদশে':continue
    if isbn(nc[col]):parts.append(nc[col]);bnrects.append({'page':nextrow['page'],'bbox':nextrow['rects'][col]})
   bn=clean(' '.join(parts))
   if not isar(c[col]) or not bn:issues.append([e['entry'],aspect,person,'missing cell',c[col],bn])
   else:conjug.append({'aspect':aspect,'person':person,'ar':c[col],'bn':bn,'source_page':r['page'],'ar_bbox':r['rects'][col],'bn_regions':bnrects})
 v={'entry_number':e['entry'],'root_ar':root,'form':form,'voice':'ACT','headword_ar':rows[first]['cells'][0],'meaning_bn':clean(' '.join(dict.fromkeys(meaning))),'source':{'pdf_file':f'Quran words - level{e["level"]}.pdf','pdf_page':e['page'],'printed_page':e['page'],'pages':sorted(set(r['page'] for r in rows))},'conjugations':conjug}
 if e['entry'] in [91,190]:v['note_bn']='বইয়ে এই ক্রিয়াপদের রূপান্তর দেওয়া নেই।'
 if e['entry']==30:v['note_bn']='বইয়ে শুধু অতীতের রূপ দেওয়া আছে।'
 if not root or not form:issues.append([e['entry'],'missing identity',root,form])
 if verbs and verbs[-1]['entry_number']==v['entry_number']:
  prev=verbs[-1];prev['source']['pages']=sorted(set(prev['source']['pages']+v['source']['pages']));prev['source']['repeated_table_pages']=[prev['source']['pdf_page'],v['source']['pdf_page']]
  if [(c['ar'],c['bn']) for c in prev['conjugations']]!=[(c['ar'],c['bn']) for c in v['conjugations']]:
   prev.setdefault('alternate_readings',[]).append(v)
  continue
 verbs.append(v)
print('verbs',len(verbs),'cells',sum(len(v['conjugations']) for v in verbs));print('missing entries',sorted(set(range(1,501))-set(v['entry_number'] for v in verbs)))
print('issues',len(issues));print(issues)
for v in verbs:
 if len(v['conjugations'])!=14 and v['entry_number'] not in [30,91,190]:print('irregular count',v['entry_number'],len(v['conjugations']))
 for c in v['conjugations']:
  pronoun={'3MS':'সে','3MP':'তারা','2MS':'তুমি','2MP':'তোমরা','1S':'আমি','1P':'আমরা'}[c['person']]
  if c['aspect']!='IMPV' and not c['bn'].startswith(pronoun):print('PRONOUN',v['entry_number'],c['aspect'],c['person'],c['bn'])
(P/'verbs-extracted.json').write_text(json.dumps({'schema_version':1,'verbs':verbs,'issues':issues},ensure_ascii=False,indent=2))

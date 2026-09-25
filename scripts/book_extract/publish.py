"""Publish extracted tables with explicit recovery corrections and provenance."""
import json,csv,hashlib,shutil
from pathlib import Path
from config import APP, BOOK, WORK, SCRIPTS, TESSDATA, book_pdf
P=WORK;EXPORT=APP/'data/books';EXPORT.mkdir(parents=True,exist_ok=True);OUT=EXPORT/'extraction-review'
data=json.loads((P/'verbs-extracted.json').read_text());vs=data['verbs'];corrections=[]
def fix(n,aspect,person,field,value,reason,editorial=False):
 v=vs[n-1];c=next(c for c in v['conjugations'] if c['aspect']==aspect and c['person']==person)
 if c[field]==value:return
 corrections.append({'entry':n,'aspect':aspect,'person':person,'field':field,'before':c[field],'after':value,'reason':reason,'editorial':editorial})
 if editorial:c[field+'_source']=c[field];c['correction_note_bn']='বইয়ের মুদ্রিত বানান সংশোধিত; মূল পৃষ্ঠা দেখুন।'
 c[field]=value
for n,a,pr in [(49,'IMPF','3MP'),(117,'IMPF','1S')]:
 c=next(c for c in vs[n-1]['conjugations'] if c['aspect']==a and c['person']==pr);fix(n,a,pr,'bn',c['bn'].lstrip('/ '),'Adjacent cell slash excluded after visual review')
c=next(c for c in vs[384]['conjugations'] if c['aspect']=='IMPF' and c['person']=='2MP');fix(385,'IMPF','2MP','bn',c['bn'].removeprefix('া '),'Adjacent cell vowel excluded after visual review')
for n,a,pr,wrong,right in [(226,'PERF','3MP','তার ','তারা '),(336,'IMPF','3MP','তার ','তারা '),(368,'PERF','1P','আ্মরা','আমরা'),(399,'IMPF','2MP','তোমর ','তোমরা '),(436,'IMPF','1S','আম ','আমি '),(441,'IMPF','1P','আমর ','আমরা '),(442,'IMPF','1P','আমর ','আমরা '),(463,'PERF','2MP','তোমর ','তোমরা ')]:
 c=next(c for c in vs[n-1]['conjugations'] if c['aspect']==a and c['person']==pr);fix(n,a,pr,'bn',c['bn'].replace(wrong,right,1),'Obvious printed pronoun typo; source retained',True)
fix(472,'IMPV','2MS','ar','اُسْلُفْ','Visual transcription of Times New Roman command; font Unicode mapping is corrupt')
fix(472,'IMPV','2MP','ar','اُسْلُفُوا','Visual transcription of Times New Roman command; font Unicode mapping is corrupt')
fix(61,'PERF','2MS','bn','তুমি স্পর্শ করেছো','Reph and word-space recovery from positioned Bengali glyphs')
fix(61,'IMPF','2MS','bn','তুমি স্পর্শ কর / করবে','Reph and word-space recovery from positioned Bengali glyphs')
for n,a,pr in [(299,'IMPV','2MP'),(326,'IMPV','2MP'),(430,'IMPF','3MP'),(477,'IMPF','1S')]:
 c=next(c for c in vs[n-1]['conjugations'] if c['aspect']==a and c['person']==pr);c['review_note_bn']='বইয়ে এই আরবি রূপটি সন্দেহজনক; মূল পৃষ্ঠা মিলিয়ে পড়ুন।'
for v in vs:
 for r in [v]+v.get('alternate_readings',[]):
  r['level']=1 if r['entry_number']<=200 else 2
  r['review_status']='machine_extracted_with_targeted_visual_checks'
assert [v['entry_number'] for v in vs]==list(range(1,501))
assert not data['issues'],data['issues']
readings=[r for v in vs for r in [v]+v.get('alternate_readings',[])]
assert sum(len(v['conjugations']) for v in readings)==6978
meta={'schema_version':2,'extracted_on':'2026-09-25','method':'Local PDF glyph recovery, geometric table extraction, OCR of Level 2 entry numbers, and targeted visual checks.','review_status':'All numbers and slot counts checked; selected pages and anomalies visually checked. Not every cell has been independently proofread.','numbered_entries':500,'distinct_readings':501,'conjugation_cells':6978,'sources':[{'level':l,'file':f'Quran words - level{l}.pdf','sha256':hashlib.sha256((book_pdf(l)).read_bytes()).hexdigest()} for l in [1,2]],'verbs':vs,'corrections':corrections}
OUT.mkdir(exist_ok=True);(OUT/'batches').mkdir(exist_ok=True)
(EXPORT/'quran-verbs-500.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
for start in range(0,500,20):
 (OUT/'batches'/f'verbs-{start+1:03d}-{start+20:03d}.json').write_text(json.dumps({'schema_version':2,'range':[start+1,start+20],'verbs':vs[start:start+20]},ensure_ascii=False,indent=2))
with (EXPORT/'quran-verbs-500.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['entry','reading','level','root','form','meaning_bn','aspect','person','arabic','bangla','source_pdf','source_page','note'])
 for v in vs:
  for ri,r in enumerate([v]+v.get('alternate_readings',[]),1):
   for c in r['conjugations'] or [{}]:w.writerow([r['entry_number'],ri,r['level'],r['root_ar'],r['form'],r['meaning_bn'],c.get('aspect',''),c.get('person',''),c.get('ar',r['headword_ar']),c.get('bn',''),r['source']['pdf_file'],c.get('source_page',r['source']['pdf_page']),c.get('review_note_bn',c.get('correction_note_bn',r.get('note_bn','')))])
def compact(r):
 return {**{k:v for k,v in r.items() if k not in ['conjugations','alternate_readings']},'conjugations':[{k:v for k,v in c.items() if k not in ['ar_bbox','bn_regions']} for c in r['conjugations']],**({'alternate_readings':[compact(x) for x in r['alternate_readings']]} if r.get('alternate_readings') else {})}
(APP/'src/bookVerbs.json').write_text(json.dumps([compact(v) for v in vs],ensure_ascii=False,separators=(',',':'))+'\n')
(OUT/'corrections.json').write_text(json.dumps(corrections,ensure_ascii=False,indent=2))
for folder in [OUT/'extraction',APP/'scripts/book_extract']:
 folder.mkdir(parents=True,exist_ok=True)
 for name in ['extract.py','parse_rows.py','group_entries.py','number_entries.py','build_entries.py','publish.py','glyph-maps.json','config.py']:
  if (SCRIPTS/name).resolve() != (folder/name).resolve():shutil.copy2(SCRIPTS/name,folder/name)
(APP/'public/books').mkdir(exist_ok=True)
for l in [1,2]:
 target=APP/f'public/books/level-{l}.pdf'
 if book_pdf(l).resolve()!=target.resolve():shutil.copy2(book_pdf(l),target)
print('Published',len(vs),'numbered entries,',len(readings),'readings, 6978 conjugations;',len(corrections),'logged corrections')

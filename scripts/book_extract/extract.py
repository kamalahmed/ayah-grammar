import pymupdf as fitz, json,io,re,unicodedata,sys
from pathlib import Path
from config import APP, BOOK, WORK, SCRIPTS, TESSDATA, book_pdf
from fontTools.ttLib import TTFont
BASE=WORK
MAPS={k:{int(g):v for g,v in m.items()} for k,m in json.loads((SCRIPTS/'glyph-maps.json').read_text()).items()}
CON='[ক-হড়ঢ়য়ৎৰৱ]়?'
CLUSTER=CON+'(?:্'+CON+')*'
def bangla(s):
 # Reph is painted after its cluster, but encoded before it in Unicode.
 s=re.sub('('+CLUSTER+'[ািীুূৃেৈোৌঁংঃ]*)\ue001',r'র্\1',s)
 s=re.sub('([িেৈ])('+CLUSTER+')([ঁ]?)',r'\2\1\3',s)
 s=s.replace('ো','ো').replace('ৌ','ৌ')
 return unicodedata.normalize('NFC',s)

def read_cell(chars,rect):
 if rect is None:return None
 x0,y0,x1,y1=rect
 selected=[c for c in chars if x0-.2<=c['cx']<x1-.2 and y0-.2<=c['cy']<y1-.2]
 arab=[c for c in selected if any('\u0600'<=v<='\u06ff' for v in c['s']) and c['s'].strip()]
 bn=[c for c in selected if re.search('[\u0980-\u09ff]',c['s'])]
 if arab and not bn:
  bases=[c for c in arab if any(not unicodedata.category(v).startswith('M') for v in c['s'])]
  marks=[c for c in arab if all(unicodedata.category(v).startswith('M') for v in c['s'])]
  for b in bases:b['marks']=[]
  for m in marks:
   if not bases:continue
   # Marks are positioned above the letter ink. Pick the closest glyph ink centre.
   target=min(bases,key=lambda b:abs(b['cx']-m['cx']))
   target['marks'].append(m)
  chunks=[]
  for b in sorted(bases,key=lambda b:-b['x']):
   text=b['s']; ms=sorted(b['marks'],key=lambda m:-m['cx'])
   if len(text)==1:text+=''.join(m['s'] for m in ms)
   else:
    # Ligatures retain their full consonants. Assign marks from right to left.
    slots=['' for _ in text]
    if len(ms)==1:slots[0]=ms[0]['s']
    else:
     for j,m in enumerate(ms):slots[min(j,len(text)-1)]+=m['s']
    text=''.join(ch+slot for ch,slot in zip(text,slots))
   chunks.append(text)
  return unicodedata.normalize('NFC',''.join(chunks))
 # Preserve text-paint order within each baseline; it includes visual Indic glyph order.
 lines=[]
 for c in selected:

  line=next((ln for ln in lines if abs(ln[0]['y']-c['y'])<2.3),None)
  if line is None:lines.append([c])
  else:line.append(c)
 out=[]
 for line in sorted(lines,key=lambda ln:ln[0]['y']):
  line.sort(key=lambda c:(c['x'],c['i']))
  s='';prev=None
  for c in line:
   if prev and prev['font']==c['font']=='ShonarBangla' and c['x']-prev['right']>3 and s and not s[-1].isspace() and not c['s'].startswith(' '):s+=' '
   s+=c['s'];prev=c
  out.append(bangla(s))
 return re.sub(r'\s+',' ',' '.join(out)).strip()

def page_chars(doc,page,cache):
 font_by_name={name.split('+')[-1]:(x,ext) for x,ext,typ,name,*_ in page.get_fonts()}
 chars=[]
 for span in page.get_texttrace():
  name=span['font']; fm=MAPS.get(name,{})
  key=font_by_name.get(name)
  font=None
  if key and key[1]=='ttf':
   if key not in cache:
    try:cache[key]=TTFont(io.BytesIO(doc.extract_font(key[0])[3]))
    except:cache[key]=None
   font=cache[key]
  for i,(cp,gid,origin,bbox) in enumerate(span['chars']):
   if gid<0:continue
   txt=fm.get(gid,chr(cp)) if name in ['ShonarBangla','KFGQPCUthmanicScriptHAFS'] else chr(cp)
   txt=unicodedata.normalize('NFKC',txt)
   if name in ['ShonarBangla','KFGQPCUthmanicScriptHAFS'] and gid not in fm:txt=f'⟦{name}:{gid}⟧'
   x,y=origin;cx=(bbox[0]+bbox[2])/2;cy=(bbox[1]+bbox[3])/2
   if font and gid<len(font.getGlyphOrder()):
    glyph=font['glyf'][font.getGlyphName(gid)]
    if glyph.numberOfContours!=0:
     scale=span['size']/font['head'].unitsPerEm
     cx=x+(glyph.xMin+glyph.xMax)/2*scale
     cy=y-(glyph.yMin+glyph.yMax)/2*scale
   chars.append({'x':x,'y':y,'cx':cx,'cy':cy,'s':txt,'font':name,'i':len(chars),'gid':gid,'right':bbox[2]})
 return chars

def extract():
 allrows=[]
 for level,start,end in [(1,30,116),(2,27,167)]:
  doc=fitz.open(book_pdf(level));cache={}
  for pno in range(start,end):
   page=doc[pno];chars=page_chars(doc,page,cache)
   for ti,table in enumerate(page.find_tables().tables):
    for row in table.rows:
     values=[read_cell(chars,cell) for cell in row.cells]
     allrows.append({'level':level,'page':pno+1,'table':ti,'bbox':row.bbox,'cells':values,'rects':row.cells})
   if (pno-start)%20==0:print(level,pno+1,flush=True)
 (BASE/'rows.json').write_text(json.dumps(allrows,ensure_ascii=False,indent=2))
 print('rows',len(allrows))
if __name__=='__main__':
 if '--sample' in sys.argv:
  for level,pno in [(1,30),(2,27)]:
   doc=fitz.open(book_pdf(level));p=doc[pno];c=page_chars(doc,p,{})
   for t in p.find_tables().tables:
    for r in t.rows:print([read_cell(c,cell) for cell in r.cells])
 else:extract()

"""Build our original 5x7 HUD font as WOFF. Python standard library only."""
from pathlib import Path
import struct
import zlib

# Every glyph is drawn on the same small grid. Lowercase shares uppercase shapes.
rows = {
'A':['01110','10001','10001','11111','10001','10001','10001'],
'B':['11110','10001','10001','11110','10001','10001','11110'],
'C':['01111','10000','10000','10000','10000','10000','01111'],
'D':['11110','10001','10001','10001','10001','10001','11110'],
'E':['11111','10000','10000','11110','10000','10000','11111'],
'F':['11111','10000','10000','11110','10000','10000','10000'],
'G':['01111','10000','10000','10111','10001','10001','01111'],
'H':['10001','10001','10001','11111','10001','10001','10001'],
'I':['01110','00100','00100','00100','00100','00100','01110'],
'J':['00111','00010','00010','00010','10010','10010','01100'],
'K':['10001','10010','10100','11000','10100','10010','10001'],
'L':['10000','10000','10000','10000','10000','10000','11111'],
'M':['10001','11011','10101','10001','10001','10001','10001'],
'N':['10001','11001','10101','10011','10001','10001','10001'],
'O':['01110','10001','10001','10001','10001','10001','01110'],
'P':['11110','10001','10001','11110','10000','10000','10000'],
'Q':['01110','10001','10001','10001','10101','10010','01101'],
'R':['11110','10001','10001','11110','10100','10010','10001'],
'S':['01111','10000','10000','01110','00001','00001','11110'],
'T':['11111','00100','00100','00100','00100','00100','00100'],
'U':['10001','10001','10001','10001','10001','10001','01110'],
'V':['10001','10001','10001','10001','10001','01010','00100'],
'W':['10001','10001','10001','10001','10101','11011','10001'],
'X':['10001','10001','01010','00100','01010','10001','10001'],
'Y':['10001','10001','01010','00100','00100','00100','00100'],
'Z':['11111','00001','00010','00100','01000','10000','11111'],
'0':['01110','10001','10011','10101','11001','10001','01110'],
'1':['00100','01100','00100','00100','00100','00100','01110'],
'2':['01110','10001','00001','00010','00100','01000','11111'],
'3':['11110','00001','00001','01110','00001','00001','11110'],
'4':['00010','00110','01010','10010','11111','00010','00010'],
'5':['11111','10000','10000','11110','00001','00001','11110'],
'6':['01110','10000','10000','11110','10001','10001','01110'],
'7':['11111','00001','00010','00100','01000','01000','01000'],
'8':['01110','10001','10001','01110','10001','10001','01110'],
'9':['01110','10001','10001','01111','00001','00001','01110'],
' ':['00000']*7,
'.':['00000','00000','00000','00000','00000','00100','00100'],
',':['00000','00000','00000','00000','00100','00100','01000'],
':':['00000','00100','00100','00000','00100','00100','00000'],
';':['00000','00100','00100','00000','00100','00100','01000'],
'!':['00100','00100','00100','00100','00100','00000','00100'],
'?':['01110','10001','00001','00010','00100','00000','00100'],
'+':['00000','00100','00100','11111','00100','00100','00000'],
'-':['00000','00000','00000','11111','00000','00000','00000'],
'/':['00001','00001','00010','00100','01000','10000','10000'],
'%':['11001','11010','00010','00100','01000','01011','10011'],
"'":['00100','00100','00000','00000','00000','00000','00000'],
'(' :['00010','00100','01000','01000','01000','00100','00010'],
')' :['01000','00100','00010','00010','00010','00100','01000'],
'·':['00000','00000','00000','00100','00000','00000','00000'],
}
pack = struct.pack

def pad(data):
    return data + b'\0' * (-len(data) % 4)

def checksum(data):
    return sum(struct.unpack('>'+str(len(pad(data))//4)+'I',pad(data))) & 0xffffffff

def glyph(bitmap):
    points=[]
    for row,line in enumerate(bitmap):
        for col,pixel in enumerate(line):
            if pixel=='1':
                x,y=col*100,(6-row)*100
                points += [(x,y),(x,y+100),(x+100,y+100),(x+100,y)]
    if not points:
        return b''
    contours=len(points)//4
    data=pack('>hhhhh',contours,0,0,500,700)
    data+=pack('>'+'H'*contours,*[4*i+3 for i in range(contours)])+pack('>H',0)
    data+=b'\x01'*len(points)
    for axis in (0,1):
        previous=0
        for point in points:
            data+=pack('>h',point[axis]-previous)
            previous=point[axis]
    return pad(data)

keys=['?']+list(rows)
indexes={char:i+1 for i,char in enumerate(keys)}
glyphs=[b'']+[glyph(rows[char]) for char in keys]
offsets=[0]
for g in glyphs:
    offsets.append(offsets[-1]+len(g))
count=len(glyphs)
cmap={ord(c):indexes[c] for c in rows}
cmap.update({ord(c.lower()):indexes[c] for c in rows if c.isalpha()})
cmap[0x2019]=indexes["'"]
segments=sorted(cmap.items())+[(65535,0)]
n=len(segments);power=1<<(n.bit_length()-1)
sub=pack('>HHHHHHH',4,16+8*n,0,2*n,2*power,power.bit_length()-1,2*(n-power))
sub+=pack('>'+'H'*n,*[c for c,g in segments])+pack('>H',0)
sub+=pack('>'+'H'*n,*[c for c,g in segments])
sub+=pack('>'+'H'*n,*[(g-c)&65535 for c,g in segments])+b'\0\0'*n
names=['Ember Pixel','Regular','EmberPixel-1','Ember Pixel','Version 1.0','EmberPixel']
strings=b'';records=b''
for name_id,name in enumerate(names,1):
    encoded=name.encode('utf-16-be')
    records+=pack('>HHHHHH',3,1,0x409,name_id,len(encoded),len(strings));strings+=encoded
name=pack('>HHH',0,len(names),6+12*len(names))+records+strings
head=pack('>IIIIHHQQhhhhHHhhh',0x10000,0x10000,0,0x5f0f3cf5,11,1000,0,0,0,0,500,700,0,8,2,1,0)
os2=pack('>HhHHH',0,600,400,5,0)+pack('>11h',650,600,0,75,650,600,0,350,50,300,0)
os2+=bytes([2,11,6,9,0,0,0,0,0,0])+pack('>4I',3,0,0,0)+b'EHLO'
os2+=pack('>HHHhhhHH',64,32,0x2019,800,-200,0,800,200)
tables={
    b'head':head,b'OS/2':os2,b'cmap':pack('>HHHHI',0,1,3,1,12)+sub,
    b'glyf':b''.join(glyphs),b'loca':pack('>'+'I'*len(offsets),*offsets),
    b'hhea':pack('>IhhhH'+'h'*11+'H',0x10000,800,-200,0,600,0,100,500,1,0,0,0,0,0,0,0,count),
    b'hmtx':pack('>Hh',600,0)*count,
    b'maxp':pack('>I14H',0x10000,count,160,40,0,0,1,0,0,0,0,0,0,0,0),
    b'name':name,b'post':pack('>IIhhIIIII',0x30000,0,-100,50,1,0,0,0,0),
}
# First reconstruct sfnt checksums, including the special head checksum adjustment.
tags=sorted(tables);n=len(tags);power=1<<(n.bit_length()-1);offset=12+n*16
directory=b'';body=b''
for tag in tags:
    data=tables[tag];directory+=tag+pack('>III',checksum(data),offset,len(data));body+=pad(data);offset+=len(pad(data))
sfnt=pack('>IHHHH',0x10000,n,power*16,power.bit_length()-1,n*16-power*16)+directory+body
adjustment=(0xb1b0afba-checksum(sfnt))&0xffffffff
tables[b'head']=head[:8]+pack('>I',adjustment)+head[12:]
# WOFF uses independently compressed tables; no font library or runtime package needed.
woff_offset=44+20*n;directory=b'';body=b''
for tag in tags:
    data=tables[tag];compressed=zlib.compress(data,9);stored=compressed if len(compressed)<len(data) else data
    directory+=tag+pack('>IIII',woff_offset,len(stored),len(data),checksum(head if tag==b'head' else data))
    body+=pad(stored);woff_offset+=len(pad(stored))
header=pack('>IIIHHIHHIIIII',0x774f4646,0x10000,woff_offset,n,0,len(sfnt),1,0,0,0,0,0,0)
output=Path(__file__).resolve().parents[1]/'assets/ember-pixel.woff'
output.write_bytes(header+directory+body)
print('Created original Ember Pixel font:',output.stat().st_size,'bytes')

"""
Python asset generator — generates all PNG/WebP assets for gotreframed.
Run: python3 scripts/gen-assets.py
Requires: pip install Pillow
"""
import os, math, struct, zlib
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')

def mkdirs(*paths):
    for p in paths:
        os.makedirs(os.path.join(ROOT, p), exist_ok=True)

mkdirs('public/img/shapes','public/img/ui','public/img/bg','public/seq','public/models')

ACCENT = (90, 82, 214)
ACCENT_L = (139, 133, 232)
BG = (11, 13, 16)

def rgba(r,g,b,a=255): return (r,g,b,a)

def lerp(a,b,t): return a+(b-a)*t
def ease_out(t): return 1-(1-t)**3
def ease_in_out(t): return 2*t*t if t<0.5 else -1+(4-2*t)*t

# ── Floating shapes (12 PNGs) ─────────────────────────────────────
def make_shape(i, size=240):
    img = Image.new('RGBA', (size,size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx, cy = size//2, size//2
    r = int(size*0.38)

    def hex_pts(cx,cy,r,n=6,offset=0):
        return [(cx+math.cos(2*math.pi*j/n+offset)*r, cy+math.sin(2*math.pi*j/n+offset)*r) for j in range(n)]

    def draw_poly(pts, outline, width=2):
        d.polygon(pts, outline=outline)
        for i in range(len(pts)):
            p1,p2=pts[i],pts[(i+1)%len(pts)]
            d.line([p1,p2], fill=outline, width=width)

    ao = (90,82,214,180)
    al = (139,133,232,100)

    if i==0:  # hexagon
        pts = hex_pts(cx,cy,r,6,-math.pi/6)
        draw_poly(pts,ao)
        pts2 = hex_pts(cx,cy,int(r*0.65),6,-math.pi/6)
        draw_poly(pts2,(139,133,232,70),1)
    elif i==1:  # cube outline
        s=int(size*0.30); ox=int(s*0.5); oy=-int(s*0.4)
        front=[(cx-s,cy+s),(cx+s,cy+s),(cx+s,cy-s),(cx-s,cy-s)]
        back=[(x+ox,y+oy) for x,y in front]
        draw_poly(front,ao,2)
        for j in range(4): d.line([front[j],back[j]],fill=(90,82,214,120),width=1)
        draw_poly(back,(90,82,214,70),1)
    elif i==2:  # diamond
        pts=[(cx,cy-r),(cx+int(r*0.65),cy),(cx,cy+r),(cx-int(r*0.65),cy)]
        draw_poly(pts,(139,133,232,200),2)
        d.polygon(pts,fill=(90,82,214,25))
    elif i==3:  # rings
        for rf,op in [(0.42,180),(0.3,120),(0.18,80)]:
            rr=int(size*rf)
            d.ellipse([cx-rr,cy-rr,cx+rr,cy+rr],outline=(90,82,214,op),width=2)
        d.ellipse([cx-4,cy-4,cx+4,cy+4],fill=(90,82,214,220))
    elif i==4:  # triangle
        pts=[(cx,cy-r),(cx+int(r*0.87),cy+int(r*0.5)),(cx-int(r*0.87),cy+int(r*0.5))]
        draw_poly(pts,ao,2)
        inner=[(cx+int((x-cx)*0.55),cy+int((y-cy)*0.55)) for x,y in pts]
        draw_poly(inner,(139,133,232,80),1)
    elif i==5:  # cross
        arm,thick=int(r*0.9),int(r*0.22)
        d.rectangle([cx-thick,cy-arm,cx+thick,cy+arm],outline=ao,width=2)
        d.rectangle([cx-arm,cy-thick,cx+arm,cy+thick],outline=ao,width=2)
    elif i==6:  # octagon
        pts=hex_pts(cx,cy,r,8,math.pi/8)
        draw_poly(pts,ao,2)
    elif i==7:  # star
        pts=[]
        for j in range(10):
            a=j/10*math.pi*2-math.pi/2; rr=r if j%2==0 else int(r*0.5)
            pts.append((cx+math.cos(a)*rr,cy+math.sin(a)*rr))
        draw_poly(pts,(139,133,232,180),2)
    elif i==8:  # orbit ellipse
        d.ellipse([cx-int(size*0.42),cy-int(size*0.26),cx+int(size*0.42),cy+int(size*0.26)],outline=(90,82,214,130),width=1)
        d.ellipse([cx-int(size*0.28),cy-int(size*0.4),cx+int(size*0.28),cy+int(size*0.4)],outline=(139,133,232,80),width=1)
    elif i==9:  # grid dots
        step=int(size*0.15); cols=4; rows=4
        ox=cx-int((cols-1)*step/2); oy=cy-int((rows-1)*step/2)
        for row in range(rows):
            for col in range(cols):
                x,y=ox+col*step,oy+row*step
                d.ellipse([x-3,y-3,x+3,y+3],fill=(90,82,214,int(100+col*30)))
    elif i==10:  # arc
        d.arc([cx-r,cy-r,cx+r,cy+r],-20,170,fill=(90,82,214,180),width=2)
        r2=int(r*0.65)
        d.arc([cx-r2,cy-r2,cx+r2,cy+r2],-10,160,fill=(139,133,232,100),width=1)
    elif i==11:  # concentric squares
        for sf,op in [(0.42,180),(0.30,120),(0.18,80)]:
            s=int(size*sf)
            d.rectangle([cx-s,cy-s,cx+s,cy+s],outline=(90,82,214,op),width=2 if sf==0.42 else 1)
    return img

for i in range(12):
    img = make_shape(i)
    num = f"{i+1:02d}"
    img.save(os.path.join(ROOT,f'public/img/shapes/shape-{num}.png'),'PNG')
    print(f"  ✓ shape-{num}.png")

# ── mesh.webp (background) ─────────────────────────────────────
W,H=2400,1600
img=Image.new('RGB',(W,H),BG)
d=ImageDraw.Draw(img,'RGBA')

# Grid
for x in range(0,W,64): d.line([(x,0),(x,H)],fill=(90,82,214,14),width=1)
for y in range(0,H,64): d.line([(0,y),(W,y)],fill=(90,82,214,14),width=1)

# Glow blobs via radial gradients (approximate with circles + blur)
for cx,cy,sz,alpha in [(int(W*0.6),int(H*0.35),700,26),(int(W*0.2),int(H*0.8),500,16),(int(W*0.85),int(H*0.1),400,14)]:
    blob=Image.new('RGBA',(W,H),(0,0,0,0))
    for radius in range(sz,0,-40):
        a=int(alpha*(1-radius/sz)**2)
        db=ImageDraw.Draw(blob)
        db.ellipse([cx-radius,cy-radius,cx+radius,cy+radius],fill=(90,82,214,a))
    blurred=blob.filter(ImageFilter.GaussianBlur(80))
    img.paste(Image.alpha_composite(img.convert('RGBA'),blurred).convert('RGB'))

img.save(os.path.join(ROOT,'public/img/bg/mesh.webp'),'WEBP',quality=88)
print('  ✓ mesh.webp')

# ── noise.png ─────────────────────────────────────────────────
import random
S=256
noise=Image.new('RGBA',(S,S),(0,0,0,0))
nd=ImageDraw.Draw(noise)
for y in range(S):
    for x in range(S):
        if random.random()<0.35:
            v=random.randint(180,255)
            a=random.randint(3,10)
            noise.putpixel((x,y),(v,v,v,a))
noise.save(os.path.join(ROOT,'public/img/bg/noise.png'),'PNG')
print('  ✓ noise.png')

# ── UI card SVGs ───────────────────────────────────────────────
cards_svg = [
    # card-01: context graph
    '''<svg width="400" height="260" viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="260" rx="12" fill="#131620" stroke="rgba(90,82,214,0.3)" stroke-width="1"/>
  <rect x="1" y="1" width="398" height="30" rx="11" fill="#0E1015"/>
  <circle cx="16" cy="16" r="4" fill="#FF5F57" opacity="0.6"/>
  <circle cx="28" cy="16" r="4" fill="#FFBD44" opacity="0.6"/>
  <circle cx="40" cy="16" r="4" fill="#28C840" opacity="0.6"/>
  <text x="56" y="20" fill="#8C8EA0" font-size="10" font-family="Space Mono,monospace">context.engine</text>
  <circle cx="200" cy="145" r="28" stroke="#5A52D6" stroke-width="1.5" opacity="0.85"/>
  <circle cx="200" cy="145" r="50" stroke="#5A52D6" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.4"/>
  <circle cx="200" cy="145" r="7" fill="#5A52D6"/>
  <circle cx="148" cy="112" r="4" fill="#8B85E8" opacity="0.9"/>
  <circle cx="252" cy="112" r="4" fill="#8B85E8" opacity="0.9"/>
  <circle cx="135" cy="170" r="4" fill="#8B85E8" opacity="0.9"/>
  <circle cx="265" cy="172" r="4" fill="#8B85E8" opacity="0.9"/>
  <circle cx="200" cy="195" r="4" fill="#8B85E8" opacity="0.9"/>
  <line x1="200" y1="145" x2="148" y2="112" stroke="#5A52D6" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="145" x2="252" y2="112" stroke="#5A52D6" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="145" x2="135" y2="170" stroke="#5A52D6" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="145" x2="265" y2="172" stroke="#5A52D6" stroke-width="0.75" opacity="0.5"/>
  <line x1="200" y1="145" x2="200" y2="195" stroke="#5A52D6" stroke-width="0.75" opacity="0.5"/>
  <text x="12" y="250" fill="#5A52D6" font-size="9" font-family="Space Mono,monospace" opacity="0.6">847 nodes · 2,341 edges · live</text>
</svg>''',
    # card-02: workflow
    '''<svg width="400" height="260" viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="260" rx="12" fill="#131620" stroke="rgba(90,82,214,0.3)" stroke-width="1"/>
  <rect x="1" y="1" width="398" height="30" rx="11" fill="#0E1015"/>
  <circle cx="16" cy="16" r="4" fill="#FF5F57" opacity="0.6"/><circle cx="28" cy="16" r="4" fill="#FFBD44" opacity="0.6"/><circle cx="40" cy="16" r="4" fill="#28C840" opacity="0.6"/>
  <text x="56" y="20" fill="#8C8EA0" font-size="10" font-family="Space Mono,monospace">workflow.mesh</text>
  <rect x="24" y="110" width="60" height="36" rx="6" fill="#1A1D28" stroke="rgba(90,82,214,0.4)" stroke-width="1"/>
  <text x="54" y="133" fill="#8B85E8" font-size="10" font-family="Space Mono,monospace" text-anchor="middle">Trigger</text>
  <line x1="84" y1="128" x2="112" y2="128" stroke="rgba(90,82,214,0.5)" stroke-width="1"/>
  <rect x="112" y="110" width="60" height="36" rx="6" fill="#1A1D28" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
  <text x="142" y="133" fill="#8C8EA0" font-size="10" font-family="Space Mono,monospace" text-anchor="middle">Filter</text>
  <line x1="172" y1="128" x2="200" y2="128" stroke="rgba(90,82,214,0.4)" stroke-width="1"/>
  <rect x="200" y="110" width="60" height="36" rx="6" fill="#1A1D28" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
  <text x="230" y="133" fill="#8C8EA0" font-size="10" font-family="Space Mono,monospace" text-anchor="middle">Enrich</text>
  <line x1="260" y1="128" x2="288" y2="128" stroke="rgba(90,82,214,0.4)" stroke-width="1"/>
  <rect x="288" y="110" width="60" height="36" rx="6" fill="#1A1D28" stroke="rgba(40,200,64,0.3)" stroke-width="1"/>
  <text x="318" y="133" fill="#4ADE80" font-size="10" font-family="Space Mono,monospace" text-anchor="middle">Route</text>
  <text x="54" y="180" fill="#E8E9F0" font-size="16" font-weight="600" font-family="Inter,sans-serif" text-anchor="middle">12,840</text>
  <text x="54" y="196" fill="#555769" font-size="10" font-family="Space Mono,monospace" text-anchor="middle">events/hr</text>
  <text x="200" y="180" fill="#E8E9F0" font-size="16" font-weight="600" font-family="Inter,sans-serif" text-anchor="middle">99.97%</text>
  <text x="200" y="196" fill="#555769" font-size="10" font-family="Space Mono,monospace" text-anchor="middle">success</text>
  <text x="346" y="180" fill="#E8E9F0" font-size="16" font-weight="600" font-family="Inter,sans-serif" text-anchor="middle">38ms</text>
  <text x="346" y="196" fill="#555769" font-size="10" font-family="Space Mono,monospace" text-anchor="middle">p95 lat</text>
</svg>''',
]

ui_dir = os.path.join(ROOT,'public/img/ui')
for i,svg in enumerate(cards_svg):
    with open(os.path.join(ui_dir,f'card-0{i+1}.svg'),'w') as f: f.write(svg)
    print(f"  ✓ card-0{i+1}.svg")

# Generate placeholder cards 3-6
for i in range(3,7):
    svg=f'''<svg width="400" height="260" viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="260" rx="12" fill="#131620" stroke="rgba(90,82,214,0.3)" stroke-width="1"/>
  <rect x="1" y="1" width="398" height="30" rx="11" fill="#0E1015"/>
  <circle cx="16" cy="16" r="4" fill="#FF5F57" opacity="0.6"/><circle cx="28" cy="16" r="4" fill="#FFBD44" opacity="0.6"/><circle cx="40" cy="16" r="4" fill="#28C840" opacity="0.6"/>
  <text x="56" y="20" fill="#8C8EA0" font-size="10" font-family="Space Mono,monospace">card.0{i}</text>
  <text x="200" y="140" fill="rgba(90,82,214,0.3)" font-size="48" font-weight="700" font-family="Inter,sans-serif" text-anchor="middle">0{i}</text>
</svg>'''
    with open(os.path.join(ui_dir,f'card-0{i}.svg'),'w') as f: f.write(svg)
    print(f"  ✓ card-0{i}.svg")

print("\n✓ All static assets generated.")

/**
 * gen-assets.js
 * Generates all static PNG/SVG assets using Node.js canvas + fs.
 * Run: node scripts/gen-assets.js
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ── Create dirs ────────────────────────────────────────────────
['public/img/shapes', 'public/img/ui', 'public/img/bg'].forEach(d => {
  fs.mkdirSync(path.join(ROOT, d), { recursive: true });
});

// ── Floating shapes (12 PNGs) ─────────────────────────────────
const shapes = [
  (ctx, w, h) => { // shape-01: hexagon
    const cx = w/2, cy = h/2, r = Math.min(w,h)*0.4;
    ctx.strokeStyle = 'rgba(90,82,214,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i=0;i<6;i++) {
      const a = (i/6)*Math.PI*2 - Math.PI/6;
      i===0 ? ctx.moveTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r)
             : ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
    }
    ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = 'rgba(139,133,232,0.3)';
    ctx.lineWidth = 1;
    const r2 = r*0.7;
    ctx.beginPath();
    for (let i=0;i<6;i++) {
      const a = (i/6)*Math.PI*2 - Math.PI/6;
      i===0 ? ctx.moveTo(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2)
             : ctx.lineTo(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2);
    }
    ctx.closePath(); ctx.stroke();
  },
  (ctx, w, h) => { // shape-02: rotated cube outline
    const cx=w/2, cy=h/2, s=Math.min(w,h)*0.32, ox=s*0.4, oy=-s*0.3;
    const front=[[cx-s,cy+s],[cx+s,cy+s],[cx+s,cy-s],[cx-s,cy-s]];
    const back=front.map(([x,y])=>[x+ox,y+oy]);
    ctx.strokeStyle='rgba(90,82,214,0.75)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(...front[0]); front.forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle='rgba(90,82,214,0.35)'; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(...back[0]); back.forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle='rgba(90,82,214,0.5)';
    front.forEach((_,i)=>{ ctx.beginPath(); ctx.moveTo(...front[i]); ctx.lineTo(...back[i]); ctx.stroke(); });
  },
  (ctx, w, h) => { // shape-03: diamond
    const cx=w/2,cy=h/2,r=Math.min(w,h)*0.42;
    const pts=[[cx,cy-r],[cx+r*0.65,cy],[cx,cy+r],[cx-r*0.65,cy]];
    const grd=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
    grd.addColorStop(0,'rgba(90,82,214,0.15)'); grd.addColorStop(1,'rgba(139,133,232,0.05)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.moveTo(...pts[0]); pts.forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(139,133,232,0.8)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(...pts[0]); pts.forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.stroke();
  },
  (ctx, w, h) => { // shape-04: rings
    const cx=w/2,cy=h/2;
    [0.45,0.32,0.19].forEach((rf,i)=>{
      const r=Math.min(w,h)*rf;
      ctx.strokeStyle=`rgba(90,82,214,${0.6-i*0.18})`; ctx.lineWidth=1+(i===0?0.5:0);
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
    });
    ctx.fillStyle='rgba(90,82,214,0.8)';
    ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fill();
  },
  (ctx, w, h) => { // shape-05: triangle
    const cx=w/2,cy=h/2,r=Math.min(w,h)*0.42;
    const pts=[[cx,cy-r],[cx+r*0.87,cy+r*0.5],[cx-r*0.87,cy+r*0.5]];
    ctx.strokeStyle='rgba(90,82,214,0.7)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(...pts[0]); pts.forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.stroke();
    const inner=pts.map(([x,y])=>[cx+(x-cx)*0.55,cy+(y-cy)*0.55]);
    ctx.strokeStyle='rgba(139,133,232,0.4)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(...inner[0]); inner.forEach(p=>ctx.lineTo(...p)); ctx.closePath(); ctx.stroke();
  },
  (ctx, w, h) => { // shape-06: cross/plus
    const cx=w/2,cy=h/2,arm=Math.min(w,h)*0.38,thick=Math.min(w,h)*0.1;
    ctx.strokeStyle='rgba(90,82,214,0.65)'; ctx.lineWidth=1.5;
    ctx.strokeRect(cx-thick,cy-arm,thick*2,arm*2);
    ctx.strokeRect(cx-arm,cy-thick,arm*2,thick*2);
  },
  (ctx, w, h) => { // shape-07: octagon
    const cx=w/2,cy=h/2,r=Math.min(w,h)*0.38;
    ctx.strokeStyle='rgba(90,82,214,0.65)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2+Math.PI/8;i===0?ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}
    ctx.closePath(); ctx.stroke();
  },
  (ctx, w, h) => { // shape-08: star
    const cx=w/2,cy=h/2,r1=Math.min(w,h)*0.38,r2=r1*0.5;
    ctx.strokeStyle='rgba(139,133,232,0.7)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    for(let i=0;i<10;i++){const a=(i/10)*Math.PI*2-Math.PI/2,r=i%2===0?r1:r2;i===0?ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}
    ctx.closePath(); ctx.stroke();
  },
  (ctx, w, h) => { // shape-09: orbit ellipse
    const cx=w/2,cy=h/2;
    ctx.strokeStyle='rgba(90,82,214,0.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.ellipse(cx,cy,w*0.42,h*0.28,Math.PI/6,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(139,133,232,0.35)'; ctx.lineWidth=0.75;
    ctx.beginPath(); ctx.ellipse(cx,cy,w*0.3,h*0.42,Math.PI/6,0,Math.PI*2); ctx.stroke();
  },
  (ctx, w, h) => { // shape-10: grid fragment
    const cx=w/2,cy=h/2,step=Math.min(w,h)*0.14,cols=4,rows=4;
    ctx.strokeStyle='rgba(90,82,214,0.4)'; ctx.lineWidth=1;
    const ox=cx-(cols-1)*step/2, oy=cy-(rows-1)*step/2;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      ctx.beginPath();
      ctx.arc(ox+c*step,oy+r*step,2,0,Math.PI*2);
      ctx.fillStyle=`rgba(90,82,214,${0.3+Math.random()*0.5})`;
      ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+(cols-1)*step,oy+(rows-1)*step); ctx.stroke();
  },
  (ctx, w, h) => { // shape-11: arc segment
    const cx=w/2,cy=h/2,r=Math.min(w,h)*0.38;
    ctx.strokeStyle='rgba(90,82,214,0.7)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI*0.2,Math.PI*0.9); ctx.stroke();
    ctx.strokeStyle='rgba(139,133,232,0.4)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(cx,cy,r*0.7,-Math.PI*0.1,Math.PI*0.8); ctx.stroke();
  },
  (ctx, w, h) => { // shape-12: concentric squares
    const cx=w/2,cy=h/2;
    [0.42,0.3,0.18].forEach((rf,i)=>{
      const s=Math.min(w,h)*rf;
      ctx.strokeStyle=`rgba(90,82,214,${0.7-i*0.22})`; ctx.lineWidth=1+(!i?0.5:0);
      ctx.strokeRect(cx-s,cy-s,s*2,s*2);
    });
  },
];

shapes.forEach((drawFn, i) => {
  const size = 240;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  // Transparent background
  ctx.clearRect(0, 0, size, size);
  drawFn(ctx, size, size);
  const num = String(i+1).padStart(2, '0');
  const out = path.join(ROOT, `public/img/shapes/shape-${num}.png`);
  fs.writeFileSync(out, canvas.toBuffer('image/png'));
  console.log(`  ✓ shape-${num}.png`);
});

// ── mesh.webp (background) ─────────────────────────────────────
{
  const W=2400, H=1600;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle='#0B0D10'; ctx.fillRect(0,0,W,H);

  // Radial gradient blobs
  [[W*0.6,H*0.35,700,'rgba(90,82,214,0.1)'],[W*0.2,H*0.8,500,'rgba(90,82,214,0.06)'],
   [W*0.85,H*0.1,400,'rgba(139,133,232,0.05)']].forEach(([cx,cy,r,c])=>{
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0,c); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  });

  // Grid
  ctx.strokeStyle='rgba(90,82,214,0.05)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  fs.writeFileSync(path.join(ROOT,'public/img/bg/mesh.webp'), canvas.toBuffer('image/webp',{quality:0.85}));
  console.log('  ✓ mesh.webp');
}

// ── noise.png (grain overlay) ─────────────────────────────────
{
  const S=256;
  const canvas=createCanvas(S,S); const ctx=canvas.getContext('2d');
  const id=ctx.createImageData(S,S);
  for(let i=0;i<S*S*4;i+=4){
    const v=Math.random()*255;
    id.data[i]=id.data[i+1]=id.data[i+2]=v;
    id.data[i+3]=Math.random()<0.5?0:Math.floor(Math.random()*12);
  }
  ctx.putImageData(id,0,0);
  fs.writeFileSync(path.join(ROOT,'public/img/bg/noise.png'),canvas.toBuffer('image/png'));
  console.log('  ✓ noise.png');
}

console.log('\n✓ All static assets generated.');

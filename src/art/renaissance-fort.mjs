/** Renaissance base artwork. Same geometry for both teams, anchored at y=176. */
export function renaissanceFort(enemy = false) {
 const ink='#403b42', brick='#a9765b', shade='#775349', stone='#dcc39a';
 const cloth=enemy?'#ac4850':'#3e77a3', dark=enemy?'#71353e':'#2c4f70';
 const path=(d,fill,stroke=ink,width=2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
 const line=(d,color,width=1.3)=>path(d,'none',color,width);
 const masonry=(x,y,w,h)=>{
  let s='';
  for(let row=0;row<h/9;row++) {
   const py=y+row*9;
   s+=line(`M${x} ${py}h${w}`,'#c49471',.9);
   for(let px=x+(row%2?9:18);px<x+w;px+=18)s+=line(`M${px} ${py}v${Math.min(9,y+h-py)}`,'#c49471',.9);
  }
  return s;
 };
 const flag=x=>line(`M${x} 48V14`,ink,2.5)+path(`M${x+1} 16q10-3 21 2l-4 7 4 7q-11-5-21-2z`,cloth)+line(`M${x+5} 19v8`,stone,2);
 let body=flag(96);
 // Rear gatehouse: a slate roof, open windows and a stone cornice.
 body+=path('M64 65V47h64v18z',shade)+path('M59 48l15-18h44l15 18z','#52616b')+line('M75 34h42M67 43h58','#839298',2);
 body+=path('M65 58h62v73H65z',brick)+masonry(68,63,56,56);
 body+=path('M61 55h70v9H61z',stone)+line('M65 58h62','#f0dcc0',1.5);
 for(const x of [75,105])body+=path(`M${x} 78v-7q5-7 10 0v7z`,'#373d42')+line(`M${x+5} 68v10`,stone,1.5);
 body+=path('M86 84h20v22l-10 7-10-7z',cloth)+path('M89 85h5v17h-5z',dark,'none')+line('M96 88v14M91 94h10',stone,2.5);
 // Curtain wall behind two forward-projecting artillery bastions.
 body+=path('M24 112V97h144v15z',stone)+path('M28 108h136v57H28z',brick)+masonry(30,114,132,43);
 body+=path('M28 154h136v18H28z',shade)+line('M30 158h132','#ae8064',2);
 // Clear stone arch and recessed timber gate, with a threshold on the ground.
 body+=path('M73 171v-39q0-21 23-21t23 21v39z',stone)+path('M81 171v-39q0-13 15-13t15 13v39z','#3e3735');
 body+=path('M85 167v-35q0-9 11-9t11 9v35z','#6d4b39')+line('M96 125v42M90 127v39M102 127v39','#a27a52',1.5)+line('M86 140h20M86 158h20',ink,3);
 body+=path('M78 169h36l5 7H73z','#c7ae89');
 // Bastions have distinct top, front and return faces; all joins share vertices.
 for(const right of [false,true]) {
  const side=path('M8 119l20-14 35 8-13 15z',stone)+path('M8 119l42 9v48H8z',brick)+path('M50 128l13-15v55l-13 8z',shade);
  let details=masonry(11,133,36,35)+line('M9 127l40 8',stone,3)+line('M51 134l10-12',stone,2);
  // Broad dark port and a short barrel, supported by the sill rather than floating.
  details+=path('M20 145v-10l18 3v11z',ink)+path('M22 139l-5-1-7 3v6l7 2 8-4z','#63727b')+path('M9 141l4 1v5l-4-1z','#303b43')+line('M17 141l6 1','#b8c2bf',1.5)+path('M18 151l22 5v4l-22-5z',stone);
  details+=path('M8 167l42 9H8z',shade)+line('M10 170l36 4','#ad7d60',1.5);
  body+=`<g${right?' transform="translate(192 0) scale(-1 1)"':''}>${side+details}</g>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">${body}</svg>`;
}

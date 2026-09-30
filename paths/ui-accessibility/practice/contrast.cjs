"use strict";
function luminance(hex) {
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error("Use six hexadecimal digits without #");
  const channels = [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
}
function contrast(a,b) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
module.exports={contrast,luminance};
if(require.main===module) {
  try { const ratio=contrast(process.argv[2]||"17392f",process.argv[3]||"ffffff");
    console.log(JSON.stringify({ratio,ordinaryTextAA:ratio>=4.5,largeTextAA:ratio>=3},null,2));
  } catch(e) { console.error(e.message); process.exitCode=1; }
}

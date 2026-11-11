import{r as l}from"./react-W0DHfcxy.js";/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=e=>e?.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function I(e,t,i=[]){if(t==null)throw new Error("[lucide]: iconNode is required when icon name is used");return{name:B(e),size:24,node:t,...i.length>0?{aliases:i}:{}}}/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=e=>{let t="",i=!1;for(const o of e){if(o==="-"||o==="_"||o<=" "){i=t.length>0;continue}t.length===0?t+=o.toLowerCase():t+=i?o.toUpperCase():o,i=!1}return t};/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=e=>{const t=E(e);return t.charAt(0).toUpperCase()+t.slice(1)};/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=(...e)=>e.filter((t,i,o)=>!!t&&t.trim()!==""&&o.indexOf(t)===i).join(" ").trim();/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function x(e){return e!=null}function j(e,t={}){const i=t.attributeNames??{},o=n=>i[n]??n,u=e.size??e.width??c.width,h=e.size??e.height??c.height,a=e.aliases?.filter(n=>typeof n=="string"&&n.trim()!=="").map(n=>`lucide-${n}`)??[],f=[...e.name?[`lucide-${e.name}`]:[],...a],s=t.className?.split(" ").filter(Boolean)??[],w=t.includeDefaultClasses===!1?N(...s):N("lucide",...f,...s),b=t.absoluteStrokeWidth?Number(t.strokeWidth??c["stroke-width"])*Number(e.size??e.width??c.width)/Number(t.size??t.width??c.width):t.strokeWidth??c["stroke-width"];return["svg",{...Object.entries(c).reduce((n,[r,d])=>(n[o(r)]=d,n),{}),..."color"in t&&t.color&&{[o("stroke")]:t.color},..."size"in t&&x(t.size)&&{[o("width")]:t.size,[o("height")]:t.size},..."width"in t&&x(t.width)&&{[o("width")]:t.width},..."height"in t&&x(t.height)&&{[o("height")]:t.height},[o("stroke-width")]:b,...w&&{[o("class")]:w},[o("viewBox")]:`0 0 ${u} ${h}`,...t.hasA11yProp===!1?{[o("aria-hidden")]:"true"}:{},..."attributes"in t&&t.attributes},e.node.map(n=>{const[r,d,k]=n,g=t.nonScalingStroke?{[o("vector-effect")]:"non-scaling-stroke",...d}:d;return k?[r,g,k]:[r,g]})]}/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function P(e,t={}){return j(e,{...t,attributeNames:{...t.attributeNames,class:"className","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","vector-effect":"vectorEffect"}})}/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1},R=l.createContext({}),D=()=>l.useContext(R),F=l.forwardRef(({color:e,size:t,width:i,height:o,strokeWidth:u,absoluteStrokeWidth:h,nonScalingStroke:a,className:f="",children:s,iconNode:w=[],icon:b={node:w,aliases:[],size:24},...C},n)=>{const{size:r=24,strokeWidth:d=2,absoluteStrokeWidth:k=!1,nonScalingStroke:g=!1,color:S="currentColor",className:m=""}=D()??{},A=!!s||p(C),[W,z,v=[]]=P(b,{color:e??S,width:i??t??r,height:o??t??r,strokeWidth:u??d,absoluteStrokeWidth:h??k,nonScalingStroke:a??g,className:N(m,f),hasA11yProp:A,attributes:C});return l.createElement(W,{ref:n,...z},[...v.map(([L,y])=>l.createElement(L,y)),...Array.isArray(s)?s:[s]])});/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function q(e,t=[],i=[]){const o=typeof e=="string"?I(e,t,i):e,u=l.forwardRef(({className:h,...a},f)=>l.createElement(F,{ref:f,icon:o,className:h,...a}));return o.name&&(u.displayName=$(o.name)),u}export{F as I,q as c};

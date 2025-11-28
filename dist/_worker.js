var Xe=(e,t,a)=>(s,r)=>{let i=-1;return n(0);async function n(o){if(o<=i)throw new Error("next() called multiple times");i=o;let l,c=!1,u;if(e[o]?(u=e[o][0][0],s.req.routeIndex=o):u=o===e.length&&r||void 0,u)try{l=await u(s,()=>n(o+1))}catch(d){if(d instanceof Error&&t)s.error=d,l=await t(d,s),c=!0;else throw d}else s.finalized===!1&&a&&(l=await a(s));return l&&(s.finalized===!1||c)&&(s.res=l),s}},ea=Symbol(),ta=async(e,t=Object.create(null))=>{const{all:a=!1,dot:s=!1}=t,i=(e instanceof ht?e.raw.headers:e.headers).get("Content-Type");return i?.startsWith("multipart/form-data")||i?.startsWith("application/x-www-form-urlencoded")?aa(e,{all:a,dot:s}):{}};async function aa(e,t){const a=await e.formData();return a?sa(a,t):{}}function sa(e,t){const a=Object.create(null);return e.forEach((s,r)=>{t.all||r.endsWith("[]")?ra(a,r,s):a[r]=s}),t.dot&&Object.entries(a).forEach(([s,r])=>{s.includes(".")&&(ia(a,s,r),delete a[s])}),a}var ra=(e,t,a)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(a):e[t]=[e[t],a]:t.endsWith("[]")?e[t]=[a]:e[t]=a},ia=(e,t,a)=>{let s=e;const r=t.split(".");r.forEach((i,n)=>{n===r.length-1?s[i]=a:((!s[i]||typeof s[i]!="object"||Array.isArray(s[i])||s[i]instanceof File)&&(s[i]=Object.create(null)),s=s[i])})},mt=e=>{const t=e.split("/");return t[0]===""&&t.shift(),t},na=e=>{const{groups:t,path:a}=oa(e),s=mt(a);return la(s,t)},oa=e=>{const t=[];return e=e.replace(/\{[^}]+\}/g,(a,s)=>{const r=`@${s}`;return t.push([r,a]),r}),{groups:t,path:e}},la=(e,t)=>{for(let a=t.length-1;a>=0;a--){const[s]=t[a];for(let r=e.length-1;r>=0;r--)if(e[r].includes(s)){e[r]=e[r].replace(s,t[a][1]);break}}return e},Re={},ca=(e,t)=>{if(e==="*")return"*";const a=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(a){const s=`${e}#${t}`;return Re[s]||(a[2]?Re[s]=t&&t[0]!==":"&&t[0]!=="*"?[s,a[1],new RegExp(`^${a[2]}(?=/${t})`)]:[e,a[1],new RegExp(`^${a[2]}$`)]:Re[s]=[e,a[1],!0]),Re[s]}return null},Ce=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,a=>{try{return t(a)}catch{return a}})}},da=e=>Ce(e,decodeURI),pt=e=>{const t=e.url,a=t.indexOf("/",t.indexOf(":")+4);let s=a;for(;s<t.length;s++){const r=t.charCodeAt(s);if(r===37){const i=t.indexOf("?",s),n=t.slice(a,i===-1?void 0:i);return da(n.includes("%25")?n.replace(/%25/g,"%2525"):n)}else if(r===63)break}return t.slice(a,s)},ua=e=>{const t=pt(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},ae=(e,t,...a)=>(a.length&&(t=ae(t,...a)),`${e?.[0]==="/"?"":"/"}${e}${t==="/"?"":`${e?.at(-1)==="/"?"":"/"}${t?.[0]==="/"?t.slice(1):t}`}`),gt=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;const t=e.split("/"),a=[];let s="";return t.forEach(r=>{if(r!==""&&!/\:/.test(r))s+="/"+r;else if(/\:/.test(r))if(/\?/.test(r)){a.length===0&&s===""?a.push("/"):a.push(s);const i=r.replace("?","");s+="/"+i,a.push(s)}else s+="/"+r}),a.filter((r,i,n)=>n.indexOf(r)===i)},Me=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?Ce(e,qe):e):e,ft=(e,t,a)=>{let s;if(!a&&t&&!/[%+]/.test(t)){let n=e.indexOf(`?${t}`,8);for(n===-1&&(n=e.indexOf(`&${t}`,8));n!==-1;){const o=e.charCodeAt(n+t.length+1);if(o===61){const l=n+t.length+2,c=e.indexOf("&",l);return Me(e.slice(l,c===-1?void 0:c))}else if(o==38||isNaN(o))return"";n=e.indexOf(`&${t}`,n+1)}if(s=/[%+]/.test(e),!s)return}const r={};s??=/[%+]/.test(e);let i=e.indexOf("?",8);for(;i!==-1;){const n=e.indexOf("&",i+1);let o=e.indexOf("=",i);o>n&&n!==-1&&(o=-1);let l=e.slice(i+1,o===-1?n===-1?void 0:n:o);if(s&&(l=Me(l)),i=n,l==="")continue;let c;o===-1?c="":(c=e.slice(o+1,n===-1?void 0:n),s&&(c=Me(c))),a?(r[l]&&Array.isArray(r[l])||(r[l]=[]),r[l].push(c)):r[l]??=c}return t?r[t]:r},ma=ft,pa=(e,t)=>ft(e,t,!0),qe=decodeURIComponent,Qe=e=>Ce(e,qe),ht=class{raw;#e;#t;routeIndex=0;path;bodyCache={};constructor(e,t="/",a=[[]]){this.raw=e,this.path=t,this.#t=a,this.#e={}}param(e){return e?this.#a(e):this.#i()}#a(e){const t=this.#t[0][this.routeIndex][1][e],a=this.#r(t);return a&&/\%/.test(a)?Qe(a):a}#i(){const e={},t=Object.keys(this.#t[0][this.routeIndex][1]);for(const a of t){const s=this.#r(this.#t[0][this.routeIndex][1][a]);s!==void 0&&(e[a]=/\%/.test(s)?Qe(s):s)}return e}#r(e){return this.#t[1]?this.#t[1][e]:e}query(e){return ma(this.url,e)}queries(e){return pa(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;const t={};return this.raw.headers.forEach((a,s)=>{t[s]=a}),t}async parseBody(e){return this.bodyCache.parsedBody??=await ta(this,e)}#s=e=>{const{bodyCache:t,raw:a}=this,s=t[e];if(s)return s;const r=Object.keys(t)[0];return r?t[r].then(i=>(r==="json"&&(i=JSON.stringify(i)),new Response(i)[e]())):t[e]=a[e]()};json(){return this.#s("text").then(e=>JSON.parse(e))}text(){return this.#s("text")}arrayBuffer(){return this.#s("arrayBuffer")}blob(){return this.#s("blob")}formData(){return this.#s("formData")}addValidatedData(e,t){this.#e[e]=t}valid(e){return this.#e[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[ea](){return this.#t}get matchedRoutes(){return this.#t[0].map(([[,e]])=>e)}get routePath(){return this.#t[0].map(([[,e]])=>e)[this.routeIndex].path}},ga={Stringify:1},bt=async(e,t,a,s,r)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));const i=e.callbacks;return i?.length?(r?r[0]+=e:r=[e],Promise.all(i.map(o=>o({phase:t,buffer:r,context:s}))).then(o=>Promise.all(o.filter(Boolean).map(l=>bt(l,t,!1,s,r))).then(()=>r[0]))):Promise.resolve(e)},fa="text/plain; charset=UTF-8",Ie=(e,t)=>({"Content-Type":e,...t}),ha=class{#e;#t;env={};#a;finalized=!1;error;#i;#r;#s;#d;#l;#c;#o;#u;#m;constructor(e,t){this.#e=e,t&&(this.#r=t.executionCtx,this.env=t.env,this.#c=t.notFoundHandler,this.#m=t.path,this.#u=t.matchResult)}get req(){return this.#t??=new ht(this.#e,this.#m,this.#u),this.#t}get event(){if(this.#r&&"respondWith"in this.#r)return this.#r;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#r)return this.#r;throw Error("This context has no ExecutionContext")}get res(){return this.#s||=new Response(null,{headers:this.#o??=new Headers})}set res(e){if(this.#s&&e){e=new Response(e.body,e);for(const[t,a]of this.#s.headers.entries())if(t!=="content-type")if(t==="set-cookie"){const s=this.#s.headers.getSetCookie();e.headers.delete("set-cookie");for(const r of s)e.headers.append("set-cookie",r)}else e.headers.set(t,a)}this.#s=e,this.finalized=!0}render=(...e)=>(this.#l??=t=>this.html(t),this.#l(...e));setLayout=e=>this.#d=e;getLayout=()=>this.#d;setRenderer=e=>{this.#l=e};header=(e,t,a)=>{this.finalized&&(this.#s=new Response(this.#s.body,this.#s));const s=this.#s?this.#s.headers:this.#o??=new Headers;t===void 0?s.delete(e):a?.append?s.append(e,t):s.set(e,t)};status=e=>{this.#i=e};set=(e,t)=>{this.#a??=new Map,this.#a.set(e,t)};get=e=>this.#a?this.#a.get(e):void 0;get var(){return this.#a?Object.fromEntries(this.#a):{}}#n(e,t,a){const s=this.#s?new Headers(this.#s.headers):this.#o??new Headers;if(typeof t=="object"&&"headers"in t){const i=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(const[n,o]of i)n.toLowerCase()==="set-cookie"?s.append(n,o):s.set(n,o)}if(a)for(const[i,n]of Object.entries(a))if(typeof n=="string")s.set(i,n);else{s.delete(i);for(const o of n)s.append(i,o)}const r=typeof t=="number"?t:t?.status??this.#i;return new Response(e,{status:r,headers:s})}newResponse=(...e)=>this.#n(...e);body=(e,t,a)=>this.#n(e,t,a);text=(e,t,a)=>!this.#o&&!this.#i&&!t&&!a&&!this.finalized?new Response(e):this.#n(e,t,Ie(fa,a));json=(e,t,a)=>this.#n(JSON.stringify(e),t,Ie("application/json",a));html=(e,t,a)=>{const s=r=>this.#n(r,t,Ie("text/html; charset=UTF-8",a));return typeof e=="object"?bt(e,ga.Stringify,!1,{}).then(s):s(e)};redirect=(e,t)=>{const a=String(e);return this.header("Location",/[^\x00-\xFF]/.test(a)?encodeURI(a):a),this.newResponse(null,t??302)};notFound=()=>(this.#c??=()=>new Response,this.#c(this))},k="ALL",ba="all",xa=["get","post","put","delete","options","patch"],xt="Can not add a route since the matcher is already built.",vt=class extends Error{},va="__COMPOSED_HANDLER",ya=e=>e.text("404 Not Found",404),Ze=(e,t)=>{if("getResponse"in e){const a=e.getResponse();return t.newResponse(a.body,a)}return console.error(e),t.text("Internal Server Error",500)},yt=class{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath="/";#e="/";routes=[];constructor(t={}){[...xa,ba].forEach(i=>{this[i]=(n,...o)=>(typeof n=="string"?this.#e=n:this.#i(i,this.#e,n),o.forEach(l=>{this.#i(i,this.#e,l)}),this)}),this.on=(i,n,...o)=>{for(const l of[n].flat()){this.#e=l;for(const c of[i].flat())o.map(u=>{this.#i(c.toUpperCase(),this.#e,u)})}return this},this.use=(i,...n)=>(typeof i=="string"?this.#e=i:(this.#e="*",n.unshift(i)),n.forEach(o=>{this.#i(k,this.#e,o)}),this);const{strict:s,...r}=t;Object.assign(this,r),this.getPath=s??!0?t.getPath??pt:ua}#t(){const t=new yt({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,t.#a=this.#a,t.routes=this.routes,t}#a=ya;errorHandler=Ze;route(t,a){const s=this.basePath(t);return a.routes.map(r=>{let i;a.errorHandler===Ze?i=r.handler:(i=async(n,o)=>(await Xe([],a.errorHandler)(n,()=>r.handler(n,o))).res,i[va]=r.handler),s.#i(r.method,r.path,i)}),this}basePath(t){const a=this.#t();return a._basePath=ae(this._basePath,t),a}onError=t=>(this.errorHandler=t,this);notFound=t=>(this.#a=t,this);mount(t,a,s){let r,i;s&&(typeof s=="function"?i=s:(i=s.optionHandler,s.replaceRequest===!1?r=l=>l:r=s.replaceRequest));const n=i?l=>{const c=i(l);return Array.isArray(c)?c:[c]}:l=>{let c;try{c=l.executionCtx}catch{}return[l.env,c]};r||=(()=>{const l=ae(this._basePath,t),c=l==="/"?0:l.length;return u=>{const d=new URL(u.url);return d.pathname=d.pathname.slice(c)||"/",new Request(d,u)}})();const o=async(l,c)=>{const u=await a(r(l.req.raw),...n(l));if(u)return u;await c()};return this.#i(k,ae(t,"*"),o),this}#i(t,a,s){t=t.toUpperCase(),a=ae(this._basePath,a);const r={basePath:this._basePath,path:a,method:t,handler:s};this.router.add(t,a,[s,r]),this.routes.push(r)}#r(t,a){if(t instanceof Error)return this.errorHandler(t,a);throw t}#s(t,a,s,r){if(r==="HEAD")return(async()=>new Response(null,await this.#s(t,a,s,"GET")))();const i=this.getPath(t,{env:s}),n=this.router.match(r,i),o=new ha(t,{path:i,matchResult:n,env:s,executionCtx:a,notFoundHandler:this.#a});if(n[0].length===1){let c;try{c=n[0][0][0][0](o,async()=>{o.res=await this.#a(o)})}catch(u){return this.#r(u,o)}return c instanceof Promise?c.then(u=>u||(o.finalized?o.res:this.#a(o))).catch(u=>this.#r(u,o)):c??this.#a(o)}const l=Xe(n[0],this.errorHandler,this.#a);return(async()=>{try{const c=await l(o);if(!c.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return c.res}catch(c){return this.#r(c,o)}})()}fetch=(t,...a)=>this.#s(t,a[1],a[0],t.method);request=(t,a,s,r)=>t instanceof Request?this.fetch(a?new Request(t,a):t,s,r):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${ae("/",t)}`,a),s,r));fire=()=>{addEventListener("fetch",t=>{t.respondWith(this.#s(t.request,t,void 0,t.request.method))})}},Et=[];function Ea(e,t){const a=this.buildAllMatchers(),s=(r,i)=>{const n=a[r]||a[k],o=n[2][i];if(o)return o;const l=i.match(n[0]);if(!l)return[[],Et];const c=l.indexOf("",1);return[n[1][c],l]};return this.match=s,s(e,t)}var ke="[^/]+",fe=".*",he="(?:|/.*)",se=Symbol(),wa=new Set(".\\+*[^]$()");function Ra(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===fe||e===he?1:t===fe||t===he?-1:e===ke?1:t===ke?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var Fe=class{#e;#t;#a=Object.create(null);insert(t,a,s,r,i){if(t.length===0){if(this.#e!==void 0)throw se;if(i)return;this.#e=a;return}const[n,...o]=t,l=n==="*"?o.length===0?["","",fe]:["","",ke]:n==="/*"?["","",he]:n.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);let c;if(l){const u=l[1];let d=l[2]||ke;if(u&&l[2]&&(d===".*"||(d=d.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(d))))throw se;if(c=this.#a[d],!c){if(Object.keys(this.#a).some(m=>m!==fe&&m!==he))throw se;if(i)return;c=this.#a[d]=new Fe,u!==""&&(c.#t=r.varIndex++)}!i&&u!==""&&s.push([u,c.#t])}else if(c=this.#a[n],!c){if(Object.keys(this.#a).some(u=>u.length>1&&u!==fe&&u!==he))throw se;if(i)return;c=this.#a[n]=new Fe}c.insert(o,a,s,r,i)}buildRegExpStr(){const a=Object.keys(this.#a).sort(Ra).map(s=>{const r=this.#a[s];return(typeof r.#t=="number"?`(${s})@${r.#t}`:wa.has(s)?`\\${s}`:s)+r.buildRegExpStr()});return typeof this.#e=="number"&&a.unshift(`#${this.#e}`),a.length===0?"":a.length===1?a[0]:"(?:"+a.join("|")+")"}},_a=class{#e={varIndex:0};#t=new Fe;insert(e,t,a){const s=[],r=[];for(let n=0;;){let o=!1;if(e=e.replace(/\{[^}]+\}/g,l=>{const c=`@\\${n}`;return r[n]=[c,l],n++,o=!0,c}),!o)break}const i=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let n=r.length-1;n>=0;n--){const[o]=r[n];for(let l=i.length-1;l>=0;l--)if(i[l].indexOf(o)!==-1){i[l]=i[l].replace(o,r[n][1]);break}}return this.#t.insert(i,t,s,this.#e,a),s}buildRegExp(){let e=this.#t.buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0;const a=[],s=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(r,i,n)=>i!==void 0?(a[++t]=Number(i),"$()"):(n!==void 0&&(s[Number(n)]=++t),"")),[new RegExp(`^${e}`),a,s]}},Sa=[/^$/,[],Object.create(null)],wt=Object.create(null);function Rt(e){return wt[e]??=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,a)=>a?`\\${a}`:"(?:|/.*)")}$`)}function Na(){wt=Object.create(null)}function ka(e){const t=new _a,a=[];if(e.length===0)return Sa;const s=e.map(c=>[!/\*|\/:/.test(c[0]),...c]).sort(([c,u],[d,m])=>c?1:d?-1:u.length-m.length),r=Object.create(null);for(let c=0,u=-1,d=s.length;c<d;c++){const[m,p,f]=s[c];m?r[p]=[f.map(([g])=>[g,Object.create(null)]),Et]:u++;let h;try{h=t.insert(p,u,m)}catch(g){throw g===se?new vt(p):g}m||(a[u]=f.map(([g,v])=>{const E=Object.create(null);for(v-=1;v>=0;v--){const[R,w]=h[v];E[R]=w}return[g,E]}))}const[i,n,o]=t.buildRegExp();for(let c=0,u=a.length;c<u;c++)for(let d=0,m=a[c].length;d<m;d++){const p=a[c][d]?.[1];if(!p)continue;const f=Object.keys(p);for(let h=0,g=f.length;h<g;h++)p[f[h]]=o[p[f[h]]]}const l=[];for(const c in n)l[c]=a[n[c]];return[i,l,r]}function ee(e,t){if(e){for(const a of Object.keys(e).sort((s,r)=>r.length-s.length))if(Rt(a).test(t))return[...e[a]]}}var Ta=class{name="RegExpRouter";#e;#t;constructor(){this.#e={[k]:Object.create(null)},this.#t={[k]:Object.create(null)}}add(e,t,a){const s=this.#e,r=this.#t;if(!s||!r)throw new Error(xt);s[e]||[s,r].forEach(o=>{o[e]=Object.create(null),Object.keys(o[k]).forEach(l=>{o[e][l]=[...o[k][l]]})}),t==="/*"&&(t="*");const i=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){const o=Rt(t);e===k?Object.keys(s).forEach(l=>{s[l][t]||=ee(s[l],t)||ee(s[k],t)||[]}):s[e][t]||=ee(s[e],t)||ee(s[k],t)||[],Object.keys(s).forEach(l=>{(e===k||e===l)&&Object.keys(s[l]).forEach(c=>{o.test(c)&&s[l][c].push([a,i])})}),Object.keys(r).forEach(l=>{(e===k||e===l)&&Object.keys(r[l]).forEach(c=>o.test(c)&&r[l][c].push([a,i]))});return}const n=gt(t)||[t];for(let o=0,l=n.length;o<l;o++){const c=n[o];Object.keys(r).forEach(u=>{(e===k||e===u)&&(r[u][c]||=[...ee(s[u],c)||ee(s[k],c)||[]],r[u][c].push([a,i-l+o+1]))})}}match=Ea;buildAllMatchers(){const e=Object.create(null);return Object.keys(this.#t).concat(Object.keys(this.#e)).forEach(t=>{e[t]||=this.#a(t)}),this.#e=this.#t=void 0,Na(),e}#a(e){const t=[];let a=e===k;return[this.#e,this.#t].forEach(s=>{const r=s[e]?Object.keys(s[e]).map(i=>[i,s[e][i]]):[];r.length!==0?(a||=!0,t.push(...r)):e!==k&&t.push(...Object.keys(s[k]).map(i=>[i,s[k][i]]))}),a?ka(t):null}},Ca=class{name="SmartRouter";#e=[];#t=[];constructor(e){this.#e=e.routers}add(e,t,a){if(!this.#t)throw new Error(xt);this.#t.push([e,t,a])}match(e,t){if(!this.#t)throw new Error("Fatal error");const a=this.#e,s=this.#t,r=a.length;let i=0,n;for(;i<r;i++){const o=a[i];try{for(let l=0,c=s.length;l<c;l++)o.add(...s[l]);n=o.match(e,t)}catch(l){if(l instanceof vt)continue;throw l}this.match=o.match.bind(o),this.#e=[o],this.#t=void 0;break}if(i===r)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,n}get activeRouter(){if(this.#t||this.#e.length!==1)throw new Error("No active router has been determined yet.");return this.#e[0]}},pe=Object.create(null),_t=class{#e;#t;#a;#i=0;#r=pe;constructor(e,t,a){if(this.#t=a||Object.create(null),this.#e=[],e&&t){const s=Object.create(null);s[e]={handler:t,possibleKeys:[],score:0},this.#e=[s]}this.#a=[]}insert(e,t,a){this.#i=++this.#i;let s=this;const r=na(t),i=[];for(let n=0,o=r.length;n<o;n++){const l=r[n],c=r[n+1],u=ca(l,c),d=Array.isArray(u)?u[0]:l;if(d in s.#t){s=s.#t[d],u&&i.push(u[1]);continue}s.#t[d]=new _t,u&&(s.#a.push(u),i.push(u[1])),s=s.#t[d]}return s.#e.push({[e]:{handler:a,possibleKeys:i.filter((n,o,l)=>l.indexOf(n)===o),score:this.#i}}),s}#s(e,t,a,s){const r=[];for(let i=0,n=e.#e.length;i<n;i++){const o=e.#e[i],l=o[t]||o[k],c={};if(l!==void 0&&(l.params=Object.create(null),r.push(l),a!==pe||s&&s!==pe))for(let u=0,d=l.possibleKeys.length;u<d;u++){const m=l.possibleKeys[u],p=c[l.score];l.params[m]=s?.[m]&&!p?s[m]:a[m]??s?.[m],c[l.score]=!0}}return r}search(e,t){const a=[];this.#r=pe;let r=[this];const i=mt(t),n=[];for(let o=0,l=i.length;o<l;o++){const c=i[o],u=o===l-1,d=[];for(let m=0,p=r.length;m<p;m++){const f=r[m],h=f.#t[c];h&&(h.#r=f.#r,u?(h.#t["*"]&&a.push(...this.#s(h.#t["*"],e,f.#r)),a.push(...this.#s(h,e,f.#r))):d.push(h));for(let g=0,v=f.#a.length;g<v;g++){const E=f.#a[g],R=f.#r===pe?{}:{...f.#r};if(E==="*"){const M=f.#t["*"];M&&(a.push(...this.#s(M,e,f.#r)),M.#r=R,d.push(M));continue}const[w,C,D]=E;if(!c&&!(D instanceof RegExp))continue;const A=f.#t[w],_=i.slice(o).join("/");if(D instanceof RegExp){const M=D.exec(_);if(M){if(R[C]=M[0],a.push(...this.#s(A,e,f.#r,R)),Object.keys(A.#t).length){A.#r=R;const I=M[0].match(/\//)?.length??0;(n[I]||=[]).push(A)}continue}}(D===!0||D.test(c))&&(R[C]=c,u?(a.push(...this.#s(A,e,R,f.#r)),A.#t["*"]&&a.push(...this.#s(A.#t["*"],e,R,f.#r))):(A.#r=R,d.push(A)))}}r=d.concat(n.shift()??[])}return a.length>1&&a.sort((o,l)=>o.score-l.score),[a.map(({handler:o,params:l})=>[o,l])]}},Aa=class{name="TrieRouter";#e;constructor(){this.#e=new _t}add(e,t,a){const s=gt(t);if(s){for(let r=0,i=s.length;r<i;r++)this.#e.insert(e,s[r],a);return}this.#e.insert(e,t,a)}match(e,t){return this.#e.search(e,t)}},T=class extends yt{constructor(e={}){super(e),this.router=e.router??new Ca({routers:[new Ta,new Aa]})}},Da=e=>{const a={...{origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[]},...e},s=(i=>typeof i=="string"?i==="*"?()=>i:n=>i===n?n:null:typeof i=="function"?i:n=>i.includes(n)?n:null)(a.origin),r=(i=>typeof i=="function"?i:Array.isArray(i)?()=>i:()=>[])(a.allowMethods);return async function(n,o){function l(u,d){n.res.headers.set(u,d)}const c=await s(n.req.header("origin")||"",n);if(c&&l("Access-Control-Allow-Origin",c),a.credentials&&l("Access-Control-Allow-Credentials","true"),a.exposeHeaders?.length&&l("Access-Control-Expose-Headers",a.exposeHeaders.join(",")),n.req.method==="OPTIONS"){a.origin!=="*"&&l("Vary","Origin"),a.maxAge!=null&&l("Access-Control-Max-Age",a.maxAge.toString());const u=await r(n.req.header("origin")||"",n);u.length&&l("Access-Control-Allow-Methods",u.join(","));let d=a.allowHeaders;if(!d?.length){const m=n.req.header("Access-Control-Request-Headers");m&&(d=m.split(/\s*,\s*/))}return d?.length&&(l("Access-Control-Allow-Headers",d.join(",")),n.res.headers.append("Vary","Access-Control-Request-Headers")),n.res.headers.delete("Content-Length"),n.res.headers.delete("Content-Type"),new Response(null,{headers:n.res.headers,status:204,statusText:"No Content"})}await o(),a.origin!=="*"&&n.header("Vary","Origin",{append:!0})}},Ma=/^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i,et=(e,t=Pa)=>{const a=/\.([a-zA-Z0-9]+?)$/,s=e.match(a);if(!s)return;let r=t[s[1]];return r&&r.startsWith("text")&&(r+="; charset=utf-8"),r},Ia={aac:"audio/aac",avi:"video/x-msvideo",avif:"image/avif",av1:"video/av1",bin:"application/octet-stream",bmp:"image/bmp",css:"text/css",csv:"text/csv",eot:"application/vnd.ms-fontobject",epub:"application/epub+zip",gif:"image/gif",gz:"application/gzip",htm:"text/html",html:"text/html",ico:"image/x-icon",ics:"text/calendar",jpeg:"image/jpeg",jpg:"image/jpeg",js:"text/javascript",json:"application/json",jsonld:"application/ld+json",map:"application/json",mid:"audio/x-midi",midi:"audio/x-midi",mjs:"text/javascript",mp3:"audio/mpeg",mp4:"video/mp4",mpeg:"video/mpeg",oga:"audio/ogg",ogv:"video/ogg",ogx:"application/ogg",opus:"audio/opus",otf:"font/otf",pdf:"application/pdf",png:"image/png",rtf:"application/rtf",svg:"image/svg+xml",tif:"image/tiff",tiff:"image/tiff",ts:"video/mp2t",ttf:"font/ttf",txt:"text/plain",wasm:"application/wasm",webm:"video/webm",weba:"audio/webm",webmanifest:"application/manifest+json",webp:"image/webp",woff:"font/woff",woff2:"font/woff2",xhtml:"application/xhtml+xml",xml:"application/xml",zip:"application/zip","3gp":"video/3gpp","3g2":"video/3gpp2",gltf:"model/gltf+json",glb:"model/gltf-binary"},Pa=Ia,Ua=(...e)=>{let t=e.filter(r=>r!=="").join("/");t=t.replace(/(?<=\/)\/+/g,"");const a=t.split("/"),s=[];for(const r of a)r===".."&&s.length>0&&s.at(-1)!==".."?s.pop():r!=="."&&s.push(r);return s.join("/")||"."},St={br:".br",zstd:".zst",gzip:".gz"},La=Object.keys(St),Oa="index.html",ja=e=>{const t=e.root??"./",a=e.path,s=e.join??Ua;return async(r,i)=>{if(r.finalized)return i();let n;if(e.path)n=e.path;else try{if(n=decodeURIComponent(r.req.path),/(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(n))throw new Error}catch{return await e.onNotFound?.(r.req.path,r),i()}let o=s(t,!a&&e.rewriteRequestPath?e.rewriteRequestPath(n):n);e.isDir&&await e.isDir(o)&&(o=s(o,Oa));const l=e.getContent;let c=await l(o,r);if(c instanceof Response)return r.newResponse(c.body,c);if(c){const u=e.mimes&&et(o,e.mimes)||et(o);if(r.header("Content-Type",u||"application/octet-stream"),e.precompressed&&(!u||Ma.test(u))){const d=new Set(r.req.header("Accept-Encoding")?.split(",").map(m=>m.trim()));for(const m of La){if(!d.has(m))continue;const p=await l(o+St[m],r);if(p){c=p,r.header("Content-Encoding",m),r.header("Vary","Accept-Encoding",{append:!0});break}}}return await e.onFound?.(o,r),r.body(c)}await e.onNotFound?.(o,r),await i()}},Fa=async(e,t)=>{let a;t&&t.manifest?typeof t.manifest=="string"?a=JSON.parse(t.manifest):a=t.manifest:typeof __STATIC_CONTENT_MANIFEST=="string"?a=JSON.parse(__STATIC_CONTENT_MANIFEST):a=__STATIC_CONTENT_MANIFEST;let s;t&&t.namespace?s=t.namespace:s=__STATIC_CONTENT;const r=a[e]||e;if(!r)return null;const i=await s.get(r,{type:"stream"});return i||null},Ba=e=>async function(a,s){return ja({...e,getContent:async i=>Fa(i,{manifest:e.manifest,namespace:e.namespace?e.namespace:a.env?a.env.__STATIC_CONTENT:void 0})})(a,s)},Nt=e=>Ba(e),Ha=/^[\w!#$%&'*.^`|~+-]+$/,qa=/^[ !#-:<-[\]-~]*$/,$a=(e,t)=>{if(e.indexOf(t)===-1)return{};const a=e.trim().split(";"),s={};for(let r of a){r=r.trim();const i=r.indexOf("=");if(i===-1)continue;const n=r.substring(0,i).trim();if(t!==n||!Ha.test(n))continue;let o=r.substring(i+1).trim();if(o.startsWith('"')&&o.endsWith('"')&&(o=o.slice(1,-1)),qa.test(o)){s[n]=o.indexOf("%")!==-1?Ce(o,qe):o;break}}return s},za=(e,t,a={})=>{let s=`${e}=${t}`;if(e.startsWith("__Secure-")&&!a.secure)throw new Error("__Secure- Cookie must have Secure attributes");if(e.startsWith("__Host-")){if(!a.secure)throw new Error("__Host- Cookie must have Secure attributes");if(a.path!=="/")throw new Error('__Host- Cookie must have Path attributes with "/"');if(a.domain)throw new Error("__Host- Cookie must not have Domain attributes")}if(a&&typeof a.maxAge=="number"&&a.maxAge>=0){if(a.maxAge>3456e4)throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");s+=`; Max-Age=${a.maxAge|0}`}if(a.domain&&a.prefix!=="host"&&(s+=`; Domain=${a.domain}`),a.path&&(s+=`; Path=${a.path}`),a.expires){if(a.expires.getTime()-Date.now()>3456e7)throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");s+=`; Expires=${a.expires.toUTCString()}`}if(a.httpOnly&&(s+="; HttpOnly"),a.secure&&(s+="; Secure"),a.sameSite&&(s+=`; SameSite=${a.sameSite.charAt(0).toUpperCase()+a.sameSite.slice(1)}`),a.priority&&(s+=`; Priority=${a.priority.charAt(0).toUpperCase()+a.priority.slice(1)}`),a.partitioned){if(!a.secure)throw new Error("Partitioned Cookie must have Secure attributes");s+="; Partitioned"}return s},Pe=(e,t,a)=>(t=encodeURIComponent(t),za(e,t,a)),Wa=(e,t,a)=>{const s=e.req.raw.headers.get("Cookie");{if(!s)return;let r=t;return $a(s,r)[r]}},Va=(e,t,a)=>{let s;return a?.prefix==="secure"?s=Pe("__Secure-"+e,t,{path:"/",...a,secure:!0}):a?.prefix==="host"?s=Pe("__Host-"+e,t,{...a,path:"/",secure:!0,domain:void 0}):s=Pe(e,t,{path:"/",...a}),s},kt=(e,t,a,s)=>{const r=Va(t,a,s);e.header("Set-Cookie",r,{append:!0})};const B=new TextEncoder,X=new TextDecoder;function Tt(...e){const t=e.reduce((r,{length:i})=>r+i,0),a=new Uint8Array(t);let s=0;for(const r of e)a.set(r,s),s+=r.length;return a}function Ka(e){if(Uint8Array.prototype.toBase64)return e.toBase64();const t=32768,a=[];for(let s=0;s<e.length;s+=t)a.push(String.fromCharCode.apply(null,e.subarray(s,s+t)));return btoa(a.join(""))}function Ga(e){if(Uint8Array.fromBase64)return Uint8Array.fromBase64(e);const t=atob(e),a=new Uint8Array(t.length);for(let s=0;s<t.length;s++)a[s]=t.charCodeAt(s);return a}function Se(e){if(Uint8Array.fromBase64)return Uint8Array.fromBase64(typeof e=="string"?e:X.decode(e),{alphabet:"base64url"});let t=e;t instanceof Uint8Array&&(t=X.decode(t)),t=t.replace(/-/g,"+").replace(/_/g,"/").replace(/\s/g,"");try{return Ga(t)}catch{throw new TypeError("The input to be decoded is not correctly encoded.")}}function Ue(e){let t=e;return typeof t=="string"&&(t=B.encode(t)),Uint8Array.prototype.toBase64?t.toBase64({alphabet:"base64url",omitPadding:!0}):Ka(t).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}class le extends Error{static code="ERR_JOSE_GENERIC";code="ERR_JOSE_GENERIC";constructor(t,a){super(t,a),this.name=this.constructor.name,Error.captureStackTrace?.(this,this.constructor)}}class j extends le{static code="ERR_JWT_CLAIM_VALIDATION_FAILED";code="ERR_JWT_CLAIM_VALIDATION_FAILED";claim;reason;payload;constructor(t,a,s="unspecified",r="unspecified"){super(t,{cause:{claim:s,reason:r,payload:a}}),this.claim=s,this.reason=r,this.payload=a}}class tt extends le{static code="ERR_JWT_EXPIRED";code="ERR_JWT_EXPIRED";claim;reason;payload;constructor(t,a,s="unspecified",r="unspecified"){super(t,{cause:{claim:s,reason:r,payload:a}}),this.claim=s,this.reason=r,this.payload=a}}class J extends le{static code="ERR_JOSE_NOT_SUPPORTED";code="ERR_JOSE_NOT_SUPPORTED"}class S extends le{static code="ERR_JWS_INVALID";code="ERR_JWS_INVALID"}class $e extends le{static code="ERR_JWT_INVALID";code="ERR_JWT_INVALID"}class Ya extends le{static code="ERR_JWS_SIGNATURE_VERIFICATION_FAILED";code="ERR_JWS_SIGNATURE_VERIFICATION_FAILED";constructor(t="signature verification failed",a){super(t,a)}}function F(e,t="algorithm.name"){return new TypeError(`CryptoKey does not support this operation, its ${t} must be ${e}`)}function te(e,t){return e.name===t}function Le(e){return parseInt(e.name.slice(4),10)}function Ja(e){switch(e){case"ES256":return"P-256";case"ES384":return"P-384";case"ES512":return"P-521";default:throw new Error("unreachable")}}function Xa(e,t){if(t&&!e.usages.includes(t))throw new TypeError(`CryptoKey does not support this operation, its usages must include ${t}.`)}function Qa(e,t,a){switch(t){case"HS256":case"HS384":case"HS512":{if(!te(e.algorithm,"HMAC"))throw F("HMAC");const s=parseInt(t.slice(2),10);if(Le(e.algorithm.hash)!==s)throw F(`SHA-${s}`,"algorithm.hash");break}case"RS256":case"RS384":case"RS512":{if(!te(e.algorithm,"RSASSA-PKCS1-v1_5"))throw F("RSASSA-PKCS1-v1_5");const s=parseInt(t.slice(2),10);if(Le(e.algorithm.hash)!==s)throw F(`SHA-${s}`,"algorithm.hash");break}case"PS256":case"PS384":case"PS512":{if(!te(e.algorithm,"RSA-PSS"))throw F("RSA-PSS");const s=parseInt(t.slice(2),10);if(Le(e.algorithm.hash)!==s)throw F(`SHA-${s}`,"algorithm.hash");break}case"Ed25519":case"EdDSA":{if(!te(e.algorithm,"Ed25519"))throw F("Ed25519");break}case"ML-DSA-44":case"ML-DSA-65":case"ML-DSA-87":{if(!te(e.algorithm,t))throw F(t);break}case"ES256":case"ES384":case"ES512":{if(!te(e.algorithm,"ECDSA"))throw F("ECDSA");const s=Ja(t);if(e.algorithm.namedCurve!==s)throw F(s,"algorithm.namedCurve");break}default:throw new TypeError("CryptoKey does not support this operation")}Xa(e,a)}function Ct(e,t,...a){if(a=a.filter(Boolean),a.length>2){const s=a.pop();e+=`one of type ${a.join(", ")}, or ${s}.`}else a.length===2?e+=`one of type ${a[0]} or ${a[1]}.`:e+=`of type ${a[0]}.`;return t==null?e+=` Received ${t}`:typeof t=="function"&&t.name?e+=` Received function ${t.name}`:typeof t=="object"&&t!=null&&t.constructor?.name&&(e+=` Received an instance of ${t.constructor.name}`),e}const Za=(e,...t)=>Ct("Key must be ",e,...t);function At(e,t,...a){return Ct(`Key for the ${e} algorithm must be `,t,...a)}function Dt(e){return e?.[Symbol.toStringTag]==="CryptoKey"}function Mt(e){return e?.[Symbol.toStringTag]==="KeyObject"}const It=e=>Dt(e)||Mt(e),Pt=(...e)=>{const t=e.filter(Boolean);if(t.length===0||t.length===1)return!0;let a;for(const s of t){const r=Object.keys(s);if(!a||a.size===0){a=new Set(r);continue}for(const i of r){if(a.has(i))return!1;a.add(i)}}return!0};function es(e){return typeof e=="object"&&e!==null}const ve=e=>{if(!es(e)||Object.prototype.toString.call(e)!=="[object Object]")return!1;if(Object.getPrototypeOf(e)===null)return!0;let t=e;for(;Object.getPrototypeOf(t)!==null;)t=Object.getPrototypeOf(t);return Object.getPrototypeOf(e)===t},Ut=(e,t)=>{if(e.startsWith("RS")||e.startsWith("PS")){const{modulusLength:a}=t.algorithm;if(typeof a!="number"||a<2048)throw new TypeError(`${e} requires key modulusLength to be 2048 bits or larger`)}};function ts(e){let t,a;switch(e.kty){case"AKP":{switch(e.alg){case"ML-DSA-44":case"ML-DSA-65":case"ML-DSA-87":t={name:e.alg},a=e.priv?["sign"]:["verify"];break;default:throw new J('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break}case"RSA":{switch(e.alg){case"PS256":case"PS384":case"PS512":t={name:"RSA-PSS",hash:`SHA-${e.alg.slice(-3)}`},a=e.d?["sign"]:["verify"];break;case"RS256":case"RS384":case"RS512":t={name:"RSASSA-PKCS1-v1_5",hash:`SHA-${e.alg.slice(-3)}`},a=e.d?["sign"]:["verify"];break;case"RSA-OAEP":case"RSA-OAEP-256":case"RSA-OAEP-384":case"RSA-OAEP-512":t={name:"RSA-OAEP",hash:`SHA-${parseInt(e.alg.slice(-3),10)||1}`},a=e.d?["decrypt","unwrapKey"]:["encrypt","wrapKey"];break;default:throw new J('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break}case"EC":{switch(e.alg){case"ES256":t={name:"ECDSA",namedCurve:"P-256"},a=e.d?["sign"]:["verify"];break;case"ES384":t={name:"ECDSA",namedCurve:"P-384"},a=e.d?["sign"]:["verify"];break;case"ES512":t={name:"ECDSA",namedCurve:"P-521"},a=e.d?["sign"]:["verify"];break;case"ECDH-ES":case"ECDH-ES+A128KW":case"ECDH-ES+A192KW":case"ECDH-ES+A256KW":t={name:"ECDH",namedCurve:e.crv},a=e.d?["deriveBits"]:[];break;default:throw new J('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break}case"OKP":{switch(e.alg){case"Ed25519":case"EdDSA":t={name:"Ed25519"},a=e.d?["sign"]:["verify"];break;case"ECDH-ES":case"ECDH-ES+A128KW":case"ECDH-ES+A192KW":case"ECDH-ES+A256KW":t={name:e.crv},a=e.d?["deriveBits"]:[];break;default:throw new J('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break}default:throw new J('Invalid or unsupported JWK "kty" (Key Type) Parameter value')}return{algorithm:t,keyUsages:a}}const as=async e=>{if(!e.alg)throw new TypeError('"alg" argument is required when "jwk.alg" is not present');const{algorithm:t,keyUsages:a}=ts(e),s={...e};return s.kty!=="AKP"&&delete s.alg,delete s.use,crypto.subtle.importKey("jwk",s,t,e.ext??!(e.d||e.priv),e.key_ops??a)},Lt=(e,t,a,s,r)=>{if(r.crit!==void 0&&s?.crit===void 0)throw new e('"crit" (Critical) Header Parameter MUST be integrity protected');if(!s||s.crit===void 0)return new Set;if(!Array.isArray(s.crit)||s.crit.length===0||s.crit.some(n=>typeof n!="string"||n.length===0))throw new e('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');let i;a!==void 0?i=new Map([...Object.entries(a),...t.entries()]):i=t;for(const n of s.crit){if(!i.has(n))throw new J(`Extension Header Parameter "${n}" is not recognized`);if(r[n]===void 0)throw new e(`Extension Header Parameter "${n}" is missing`);if(i.get(n)&&s[n]===void 0)throw new e(`Extension Header Parameter "${n}" MUST be integrity protected`)}return new Set(s.crit)};function ze(e){return ve(e)&&typeof e.kty=="string"}function ss(e){return e.kty!=="oct"&&(e.kty==="AKP"&&typeof e.priv=="string"||typeof e.d=="string")}function rs(e){return e.kty!=="oct"&&typeof e.d>"u"&&typeof e.priv>"u"}function is(e){return e.kty==="oct"&&typeof e.k=="string"}let ne;const at=async(e,t,a,s=!1)=>{ne||=new WeakMap;let r=ne.get(e);if(r?.[a])return r[a];const i=await as({...t,alg:a});return s&&Object.freeze(e),r?r[a]=i:ne.set(e,{[a]:i}),i},ns=(e,t)=>{ne||=new WeakMap;let a=ne.get(e);if(a?.[t])return a[t];const s=e.type==="public",r=!!s;let i;if(e.asymmetricKeyType==="x25519"){switch(t){case"ECDH-ES":case"ECDH-ES+A128KW":case"ECDH-ES+A192KW":case"ECDH-ES+A256KW":break;default:throw new TypeError("given KeyObject instance cannot be used for this algorithm")}i=e.toCryptoKey(e.asymmetricKeyType,r,s?[]:["deriveBits"])}if(e.asymmetricKeyType==="ed25519"){if(t!=="EdDSA"&&t!=="Ed25519")throw new TypeError("given KeyObject instance cannot be used for this algorithm");i=e.toCryptoKey(e.asymmetricKeyType,r,[s?"verify":"sign"])}switch(e.asymmetricKeyType){case"ml-dsa-44":case"ml-dsa-65":case"ml-dsa-87":{if(t!==e.asymmetricKeyType.toUpperCase())throw new TypeError("given KeyObject instance cannot be used for this algorithm");i=e.toCryptoKey(e.asymmetricKeyType,r,[s?"verify":"sign"])}}if(e.asymmetricKeyType==="rsa"){let n;switch(t){case"RSA-OAEP":n="SHA-1";break;case"RS256":case"PS256":case"RSA-OAEP-256":n="SHA-256";break;case"RS384":case"PS384":case"RSA-OAEP-384":n="SHA-384";break;case"RS512":case"PS512":case"RSA-OAEP-512":n="SHA-512";break;default:throw new TypeError("given KeyObject instance cannot be used for this algorithm")}if(t.startsWith("RSA-OAEP"))return e.toCryptoKey({name:"RSA-OAEP",hash:n},r,s?["encrypt"]:["decrypt"]);i=e.toCryptoKey({name:t.startsWith("PS")?"RSA-PSS":"RSASSA-PKCS1-v1_5",hash:n},r,[s?"verify":"sign"])}if(e.asymmetricKeyType==="ec"){const o=new Map([["prime256v1","P-256"],["secp384r1","P-384"],["secp521r1","P-521"]]).get(e.asymmetricKeyDetails?.namedCurve);if(!o)throw new TypeError("given KeyObject instance cannot be used for this algorithm");t==="ES256"&&o==="P-256"&&(i=e.toCryptoKey({name:"ECDSA",namedCurve:o},r,[s?"verify":"sign"])),t==="ES384"&&o==="P-384"&&(i=e.toCryptoKey({name:"ECDSA",namedCurve:o},r,[s?"verify":"sign"])),t==="ES512"&&o==="P-521"&&(i=e.toCryptoKey({name:"ECDSA",namedCurve:o},r,[s?"verify":"sign"])),t.startsWith("ECDH-ES")&&(i=e.toCryptoKey({name:"ECDH",namedCurve:o},r,s?[]:["deriveBits"]))}if(!i)throw new TypeError("given KeyObject instance cannot be used for this algorithm");return a?a[t]=i:ne.set(e,{[t]:i}),i},Ot=async(e,t)=>{if(e instanceof Uint8Array||Dt(e))return e;if(Mt(e)){if(e.type==="secret")return e.export();if("toCryptoKey"in e&&typeof e.toCryptoKey=="function")try{return ns(e,t)}catch(s){if(s instanceof TypeError)throw s}let a=e.export({format:"jwk"});return at(e,a,t)}if(ze(e))return e.k?Se(e.k):at(e,e,t,!0);throw new Error("unreachable")},re=e=>e?.[Symbol.toStringTag],Be=(e,t,a)=>{if(t.use!==void 0){let s;switch(a){case"sign":case"verify":s="sig";break;case"encrypt":case"decrypt":s="enc";break}if(t.use!==s)throw new TypeError(`Invalid key for this operation, its "use" must be "${s}" when present`)}if(t.alg!==void 0&&t.alg!==e)throw new TypeError(`Invalid key for this operation, its "alg" must be "${e}" when present`);if(Array.isArray(t.key_ops)){let s;switch(!0){case(a==="sign"||a==="verify"):case e==="dir":case e.includes("CBC-HS"):s=a;break;case e.startsWith("PBES2"):s="deriveBits";break;case/^A\d{3}(?:GCM)?(?:KW)?$/.test(e):!e.includes("GCM")&&e.endsWith("KW")?s=a==="encrypt"?"wrapKey":"unwrapKey":s=a;break;case(a==="encrypt"&&e.startsWith("RSA")):s="wrapKey";break;case a==="decrypt":s=e.startsWith("RSA")?"unwrapKey":"deriveBits";break}if(s&&t.key_ops?.includes?.(s)===!1)throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${s}" when present`)}return!0},os=(e,t,a)=>{if(!(t instanceof Uint8Array)){if(ze(t)){if(is(t)&&Be(e,t,a))return;throw new TypeError('JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present')}if(!It(t))throw new TypeError(At(e,t,"CryptoKey","KeyObject","JSON Web Key","Uint8Array"));if(t.type!=="secret")throw new TypeError(`${re(t)} instances for symmetric algorithms must be of type "secret"`)}},ls=(e,t,a)=>{if(ze(t))switch(a){case"decrypt":case"sign":if(ss(t)&&Be(e,t,a))return;throw new TypeError("JSON Web Key for this operation be a private JWK");case"encrypt":case"verify":if(rs(t)&&Be(e,t,a))return;throw new TypeError("JSON Web Key for this operation be a public JWK")}if(!It(t))throw new TypeError(At(e,t,"CryptoKey","KeyObject","JSON Web Key"));if(t.type==="secret")throw new TypeError(`${re(t)} instances for asymmetric algorithms must not be of type "secret"`);if(t.type==="public")switch(a){case"sign":throw new TypeError(`${re(t)} instances for asymmetric algorithm signing must be of type "private"`);case"decrypt":throw new TypeError(`${re(t)} instances for asymmetric algorithm decryption must be of type "private"`)}if(t.type==="private")switch(a){case"verify":throw new TypeError(`${re(t)} instances for asymmetric algorithm verifying must be of type "public"`);case"encrypt":throw new TypeError(`${re(t)} instances for asymmetric algorithm encryption must be of type "public"`)}},jt=(e,t,a)=>{e.startsWith("HS")||e==="dir"||e.startsWith("PBES2")||/^A(?:128|192|256)(?:GCM)?(?:KW)?$/.test(e)||/^A(?:128|192|256)CBC-HS(?:256|384|512)$/.test(e)?os(e,t,a):ls(e,t,a)},Ft=(e,t)=>{const a=`SHA-${e.slice(-3)}`;switch(e){case"HS256":case"HS384":case"HS512":return{hash:a,name:"HMAC"};case"PS256":case"PS384":case"PS512":return{hash:a,name:"RSA-PSS",saltLength:parseInt(e.slice(-3),10)>>3};case"RS256":case"RS384":case"RS512":return{hash:a,name:"RSASSA-PKCS1-v1_5"};case"ES256":case"ES384":case"ES512":return{hash:a,name:"ECDSA",namedCurve:t.namedCurve};case"Ed25519":case"EdDSA":return{name:"Ed25519"};case"ML-DSA-44":case"ML-DSA-65":case"ML-DSA-87":return{name:e};default:throw new J(`alg ${e} is not supported either by JOSE or your javascript runtime`)}},Bt=async(e,t,a)=>{if(t instanceof Uint8Array){if(!e.startsWith("HS"))throw new TypeError(Za(t,"CryptoKey","KeyObject","JSON Web Key"));return crypto.subtle.importKey("raw",t,{hash:`SHA-${e.slice(-3)}`,name:"HMAC"},!1,[a])}return Qa(t,e,a),t},cs=async(e,t,a,s)=>{const r=await Bt(e,t,"verify");Ut(e,r);const i=Ft(e,r.algorithm);try{return await crypto.subtle.verify(i,r,a,s)}catch{return!1}};async function ds(e,t,a){if(!ve(e))throw new S("Flattened JWS must be an object");if(e.protected===void 0&&e.header===void 0)throw new S('Flattened JWS must have either of the "protected" or "header" members');if(e.protected!==void 0&&typeof e.protected!="string")throw new S("JWS Protected Header incorrect type");if(e.payload===void 0)throw new S("JWS Payload missing");if(typeof e.signature!="string")throw new S("JWS Signature missing or incorrect type");if(e.header!==void 0&&!ve(e.header))throw new S("JWS Unprotected Header incorrect type");let s={};if(e.protected)try{const h=Se(e.protected);s=JSON.parse(X.decode(h))}catch{throw new S("JWS Protected Header is invalid")}if(!Pt(s,e.header))throw new S("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");const r={...s,...e.header},i=Lt(S,new Map([["b64",!0]]),a?.crit,s,r);let n=!0;if(i.has("b64")&&(n=s.b64,typeof n!="boolean"))throw new S('The "b64" (base64url-encode payload) Header Parameter must be a boolean');const{alg:o}=r;if(typeof o!="string"||!o)throw new S('JWS "alg" (Algorithm) Header Parameter missing or invalid');if(n){if(typeof e.payload!="string")throw new S("JWS Payload must be a string")}else if(typeof e.payload!="string"&&!(e.payload instanceof Uint8Array))throw new S("JWS Payload must be a string or an Uint8Array instance");let l=!1;typeof t=="function"&&(t=await t(s,e),l=!0),jt(o,t,"verify");const c=Tt(B.encode(e.protected??""),B.encode("."),typeof e.payload=="string"?B.encode(e.payload):e.payload);let u;try{u=Se(e.signature)}catch{throw new S("Failed to base64url decode the signature")}const d=await Ot(t,o);if(!await cs(o,d,u,c))throw new Ya;let p;if(n)try{p=Se(e.payload)}catch{throw new S("Failed to base64url decode the payload")}else typeof e.payload=="string"?p=B.encode(e.payload):p=e.payload;const f={payload:p};return e.protected!==void 0&&(f.protectedHeader=s),e.header!==void 0&&(f.unprotectedHeader=e.header),l?{...f,key:d}:f}async function us(e,t,a){if(e instanceof Uint8Array&&(e=X.decode(e)),typeof e!="string")throw new S("Compact JWS must be a string or Uint8Array");const{0:s,1:r,2:i,length:n}=e.split(".");if(n!==3)throw new S("Invalid Compact JWS");const o=await ds({payload:r,protected:s,signature:i},t,a),l={payload:o.payload,protectedHeader:o.protectedHeader};return typeof t=="function"?{...l,key:o.key}:l}const $=e=>Math.floor(e.getTime()/1e3),Ht=60,qt=Ht*60,We=qt*24,ms=We*7,ps=We*365.25,gs=/^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i,be=e=>{const t=gs.exec(e);if(!t||t[4]&&t[1])throw new TypeError("Invalid time period format");const a=parseFloat(t[2]),s=t[3].toLowerCase();let r;switch(s){case"sec":case"secs":case"second":case"seconds":case"s":r=Math.round(a);break;case"minute":case"minutes":case"min":case"mins":case"m":r=Math.round(a*Ht);break;case"hour":case"hours":case"hr":case"hrs":case"h":r=Math.round(a*qt);break;case"day":case"days":case"d":r=Math.round(a*We);break;case"week":case"weeks":case"w":r=Math.round(a*ms);break;default:r=Math.round(a*ps);break}return t[1]==="-"||t[4]==="ago"?-r:r};function Y(e,t){if(!Number.isFinite(t))throw new TypeError(`Invalid ${e} input`);return t}const st=e=>e.includes("/")?e.toLowerCase():`application/${e.toLowerCase()}`,fs=(e,t)=>typeof e=="string"?t.includes(e):Array.isArray(e)?t.some(Set.prototype.has.bind(new Set(e))):!1;function hs(e,t,a={}){let s;try{s=JSON.parse(X.decode(t))}catch{}if(!ve(s))throw new $e("JWT Claims Set must be a top-level JSON object");const{typ:r}=a;if(r&&(typeof e.typ!="string"||st(e.typ)!==st(r)))throw new j('unexpected "typ" JWT header value',s,"typ","check_failed");const{requiredClaims:i=[],issuer:n,subject:o,audience:l,maxTokenAge:c}=a,u=[...i];c!==void 0&&u.push("iat"),l!==void 0&&u.push("aud"),o!==void 0&&u.push("sub"),n!==void 0&&u.push("iss");for(const f of new Set(u.reverse()))if(!(f in s))throw new j(`missing required "${f}" claim`,s,f,"missing");if(n&&!(Array.isArray(n)?n:[n]).includes(s.iss))throw new j('unexpected "iss" claim value',s,"iss","check_failed");if(o&&s.sub!==o)throw new j('unexpected "sub" claim value',s,"sub","check_failed");if(l&&!fs(s.aud,typeof l=="string"?[l]:l))throw new j('unexpected "aud" claim value',s,"aud","check_failed");let d;switch(typeof a.clockTolerance){case"string":d=be(a.clockTolerance);break;case"number":d=a.clockTolerance;break;case"undefined":d=0;break;default:throw new TypeError("Invalid clockTolerance option type")}const{currentDate:m}=a,p=$(m||new Date);if((s.iat!==void 0||c)&&typeof s.iat!="number")throw new j('"iat" claim must be a number',s,"iat","invalid");if(s.nbf!==void 0){if(typeof s.nbf!="number")throw new j('"nbf" claim must be a number',s,"nbf","invalid");if(s.nbf>p+d)throw new j('"nbf" claim timestamp check failed',s,"nbf","check_failed")}if(s.exp!==void 0){if(typeof s.exp!="number")throw new j('"exp" claim must be a number',s,"exp","invalid");if(s.exp<=p-d)throw new tt('"exp" claim timestamp check failed',s,"exp","check_failed")}if(c){const f=p-s.iat,h=typeof c=="number"?c:be(c);if(f-d>h)throw new tt('"iat" claim timestamp check failed (too far in the past)',s,"iat","check_failed");if(f<0-d)throw new j('"iat" claim timestamp check failed (it should be in the past)',s,"iat","check_failed")}return s}class bs{#e;constructor(t){if(!ve(t))throw new TypeError("JWT Claims Set MUST be an object");this.#e=structuredClone(t)}data(){return B.encode(JSON.stringify(this.#e))}get iss(){return this.#e.iss}set iss(t){this.#e.iss=t}get sub(){return this.#e.sub}set sub(t){this.#e.sub=t}get aud(){return this.#e.aud}set aud(t){this.#e.aud=t}set jti(t){this.#e.jti=t}set nbf(t){typeof t=="number"?this.#e.nbf=Y("setNotBefore",t):t instanceof Date?this.#e.nbf=Y("setNotBefore",$(t)):this.#e.nbf=$(new Date)+be(t)}set exp(t){typeof t=="number"?this.#e.exp=Y("setExpirationTime",t):t instanceof Date?this.#e.exp=Y("setExpirationTime",$(t)):this.#e.exp=$(new Date)+be(t)}set iat(t){typeof t>"u"?this.#e.iat=$(new Date):t instanceof Date?this.#e.iat=Y("setIssuedAt",$(t)):typeof t=="string"?this.#e.iat=Y("setIssuedAt",$(new Date)+be(t)):this.#e.iat=Y("setIssuedAt",t)}}async function xs(e,t,a){const s=await us(e,t,a);if(s.protectedHeader.crit?.includes("b64")&&s.protectedHeader.b64===!1)throw new $e("JWTs MUST NOT use unencoded payload");const i={payload:hs(s.protectedHeader,s.payload,a),protectedHeader:s.protectedHeader};return typeof t=="function"?{...i,key:s.key}:i}const vs=async(e,t,a)=>{const s=await Bt(e,t,"sign");Ut(e,s);const r=await crypto.subtle.sign(Ft(e,s.algorithm),s,a);return new Uint8Array(r)};class ys{#e;#t;#a;constructor(t){if(!(t instanceof Uint8Array))throw new TypeError("payload must be an instance of Uint8Array");this.#e=t}setProtectedHeader(t){if(this.#t)throw new TypeError("setProtectedHeader can only be called once");return this.#t=t,this}setUnprotectedHeader(t){if(this.#a)throw new TypeError("setUnprotectedHeader can only be called once");return this.#a=t,this}async sign(t,a){if(!this.#t&&!this.#a)throw new S("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");if(!Pt(this.#t,this.#a))throw new S("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");const s={...this.#t,...this.#a},r=Lt(S,new Map([["b64",!0]]),a?.crit,this.#t,s);let i=!0;if(r.has("b64")&&(i=this.#t.b64,typeof i!="boolean"))throw new S('The "b64" (base64url-encode payload) Header Parameter must be a boolean');const{alg:n}=s;if(typeof n!="string"||!n)throw new S('JWS "alg" (Algorithm) Header Parameter missing or invalid');jt(n,t,"sign");let o=this.#e;i&&(o=B.encode(Ue(o)));let l;this.#t?l=B.encode(Ue(JSON.stringify(this.#t))):l=B.encode("");const c=Tt(l,B.encode("."),o),u=await Ot(t,n),d=await vs(n,u,c),m={signature:Ue(d),payload:""};return i&&(m.payload=X.decode(o)),this.#a&&(m.header=this.#a),this.#t&&(m.protected=X.decode(l)),m}}class Es{#e;constructor(t){this.#e=new ys(t)}setProtectedHeader(t){return this.#e.setProtectedHeader(t),this}async sign(t,a){const s=await this.#e.sign(t,a);if(s.payload===void 0)throw new TypeError("use the flattened module for creating JWS with b64: false");return`${s.protected}.${s.payload}.${s.signature}`}}class ws{#e;#t;constructor(t={}){this.#t=new bs(t)}setIssuer(t){return this.#t.iss=t,this}setSubject(t){return this.#t.sub=t,this}setAudience(t){return this.#t.aud=t,this}setJti(t){return this.#t.jti=t,this}setNotBefore(t){return this.#t.nbf=t,this}setExpirationTime(t){return this.#t.exp=t,this}setIssuedAt(t){return this.#t.iat=t,this}setProtectedHeader(t){return this.#e=t,this}async sign(t,a){const s=new Es(this.#t.data());if(s.setProtectedHeader(this.#e),Array.isArray(this.#e?.crit)&&this.#e.crit.includes("b64")&&this.#e.b64===!1)throw new $e("JWTs MUST NOT use unencoded payload");return s.sign(t,a)}}var Rs={};const Te=Rs.JWT_SECRET;Te||(console.warn("⚠️ WARNING: JWT_SECRET not configured! Using fallback (INSECURE)"),console.warn("⚠️ Configure with: npx wrangler secret put JWT_SECRET"));Te&&Te.length<32&&console.warn("⚠️ WARNING: JWT_SECRET should be at least 32 characters long");const $t=new TextEncoder().encode(Te||"maintenance-app-secret-key-change-in-production-FALLBACK");async function zt(e,t=10080*60){return await new ws(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime(Math.floor(Date.now()/1e3)+t).sign($t)}async function _s(e){try{const{payload:t}=await xs(e,$t);return t}catch{return null}}function Ss(e){return!e||!e.startsWith("Bearer ")?null:e.substring(7)}const Ne=new Map,Ns=300*1e3;let He=0;async function Wt(e,t){try{const{results:a}=await e.prepare(`
      SELECT p.resource, p.action, p.scope
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN roles r ON rp.role_id = r.id
      WHERE r.name = ?
    `).bind(t).all(),s=new Set;for(const r of a)s.add(`${r.resource}.${r.action}.${r.scope}`);return s}catch(a){return console.error(`Error loading permissions for role ${t}:`,a),new Set}}async function O(e,t,a,s,r="all"){try{const i=Date.now();i-He>Ns&&(Ne.clear(),He=i);let n=Ne.get(t);n||(n=await Wt(e,t),Ne.set(t,n));const o=`${a}.${s}.${r}`;if(n.has(o))return!0;if(r==="own"){const l=`${a}.${s}.all`;if(n.has(l))return!0}return!1}catch(i){return console.error("Error checking permission:",i),!1}}async function ks(e,t,a){for(const s of a){const[r,i,n]=s.split(".");if(await O(e,t,r,i,n))return!0}return!1}async function Ts(e,t){const a=await Wt(e,t);return Array.from(a)}function Ve(){Ne.clear(),He=0}async function y(e,t){const a=Wa(e,"auth_token"),s=e.req.header("Authorization");e.env.ENVIRONMENT!=="production"&&(console.log("[AUTH-MIDDLEWARE] Cookie token:",a?`${a.substring(0,20)}... (length: ${a.length})`:"NULL"),console.log("[AUTH-MIDDLEWARE] Authorization header:",s?`Bearer ${s.substring(7,27)}...`:"NULL"));const r=a||Ss(s);if(e.env.ENVIRONMENT!=="production"&&(console.log("[AUTH-MIDDLEWARE] Token source:",a?"COOKIE (secure)":s?"HEADER (legacy)":"NONE"),console.log("[AUTH-MIDDLEWARE] Token extracted:",r?`${r.substring(0,20)}... (length: ${r.length})`:"NULL")),!r)return e.env.ENVIRONMENT!=="production"&&console.log("[AUTH-MIDDLEWARE] REJECTING: Token manquant"),e.json({error:"Token manquant"},401);const i=await _s(r);if(e.env.ENVIRONMENT!=="production"&&console.log("[AUTH-MIDDLEWARE] Token verification result:",i?"VALID":"INVALID"),!i)return e.env.ENVIRONMENT!=="production"&&console.log("[AUTH-MIDDLEWARE] REJECTING: Token invalide ou expiré"),e.json({error:"Token invalide ou expiré"},401);e.env.ENVIRONMENT!=="production"&&console.log("[AUTH-MIDDLEWARE] SUCCESS: User authenticated:",i.userId,i.email,i.role),e.set("user",i),await t()}async function ce(e,t){const a=e.get("user");if(!a||a.role!=="admin")return e.json({error:"Accès réservé aux administrateurs"},403);await t()}async function Cs(e,t){const a=e.get("user");if(!a||a.role!=="admin"&&a.role!=="supervisor")return e.json({error:"Accès réservé aux superviseurs et administrateurs"},403);await t()}async function Vt(e,t){const a=e.get("user");if(!a||a.role!=="admin"&&a.role!=="supervisor"&&a.role!=="technician")return e.json({error:"Accès réservé aux techniciens, superviseurs et administrateurs"},403);await t()}function As(e,t,a="all"){return async(s,r)=>{const i=s.get("user");if(!i)return s.json({error:"Non authentifié"},401);if(!await O(s.env.DB,i.role,e,t,a))return s.json({error:`Permission refusée: ${e}.${t}.${a}`,required_permission:`${e}.${t}.${a}`,user_role:i.role},403);await r()}}function Ds(e){return async(t,a)=>{const s=t.get("user");if(!s)return t.json({error:"Non authentifié"},401);if(!await ks(t.env.DB,s.role,e))return t.json({error:"Permission refusée: aucune des permissions requises",required_permissions:e,user_role:s.role},403);await a()}}const Ms=`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Rôles - IGP Admin</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .permission-card{transition:all .2s}.permission-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}.permission-checkbox:checked+label{background-color:#3b82f6;color:#fff}.role-card{transition:all .3s}.role-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.15)}.modal{display:none;position:fixed;z-index:50;left:0;top:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);animation:fadeIn .3s}.modal.active{display:flex;align-items:center;justify-content:center}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.modal-content{animation:slideUp .3s}@keyframes slideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
    </style>
</head>
<body class="bg-gray-50">
    <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div class="container mx-auto px-4 sm:px-6 py-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-center space-x-3 sm:space-x-4">
                    <i class="fas fa-shield-alt text-2xl sm:text-3xl"></i>
                    <div>
                        <h1 class="text-xl sm:text-2xl font-bold">Gestion des Rôles</h1>
                        <p class="text-blue-200 text-xs sm:text-sm">Système RBAC - Administration IGP</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                    <button onclick="window.history.back()" class="bg-white text-blue-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-50 transition text-sm sm:text-base whitespace-nowrap">
                        <i class="fas fa-arrow-left mr-1 sm:mr-2"></i>Retour
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div class="flex-1">
                    <h2 class="text-lg sm:text-xl font-bold text-gray-800 mb-1">Rôles Système Prédéfinis</h2>
                    <p class="text-gray-600 text-xs sm:text-sm">14 rôles spécialisés pour l'industrie du verre - Permissions configurées par le système</p>
                </div>
                <div class="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-lg w-full lg:w-auto lg:max-w-md">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-500 text-base sm:text-lg mt-0.5 mr-2 sm:mr-3 flex-shrink-0"></i>
                        <div>
                            <p class="text-xs sm:text-sm font-semibold text-blue-800 mb-1">Rôles système uniquement</p>
                            <p class="text-xs text-blue-700">Les 14 rôles prédéfinis couvrent tous les besoins de l'industrie. La création de rôles personnalisés n'est plus nécessaire.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-blue-100 text-xs sm:text-sm">Total Rôles</p><p class="text-2xl sm:text-3xl font-bold" id="statsTotal">-</p></div>
                    <i class="fas fa-users text-2xl sm:text-4xl text-blue-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-slate-500 to-slate-600 text-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-slate-100 text-xs sm:text-sm">Rôles Système</p><p class="text-2xl sm:text-3xl font-bold" id="statsSystem">-</p></div>
                    <i class="fas fa-lock text-2xl sm:text-4xl text-slate-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-green-100 text-xs sm:text-sm">Rôles Actifs</p><p class="text-2xl sm:text-3xl font-bold" id="statsCustom">-</p></div>
                    <i class="fas fa-check-circle text-2xl sm:text-4xl text-green-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-amber-100 text-xs sm:text-sm">Permissions</p><p class="text-2xl sm:text-3xl font-bold" id="statsPermissions">31</p></div>
                    <i class="fas fa-key text-2xl sm:text-4xl text-amber-200"></i>
                </div>
            </div>
        </div>

        <div id="rolesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">Chargement des rôles...</p>
            </div>
        </div>
    </main>

    <!-- Modal de Modification -->
    <div id="roleModal" class="modal">
        <div class="modal-content bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
            <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl z-10">
                <div class="flex items-center justify-between">
                    <h2 id="modalTitle" class="text-lg sm:text-2xl font-bold">Modifier le Rôle</h2>
                    <button onclick="closeModal()" class="text-white hover:text-gray-200 text-xl sm:text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="p-4 sm:p-6">
                <!-- Formulaire -->
                <div class="space-y-6 mb-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-tag text-blue-500 mr-2"></i>Nom Technique *
                        </label>
                        <input type="text" id="roleName"
                               placeholder="ex: data_analyst"
                               class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                               pattern="[a-z0-9_]+"
                               required>
                        <p class="text-xs text-gray-500 mt-1">Minuscules, chiffres et underscores uniquement</p>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-text-width text-green-500 mr-2"></i>Nom d'Affichage *
                        </label>
                        <input type="text" id="roleDisplayName"
                               placeholder="ex: Analyste de Données"
                               class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                               required>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-align-left text-purple-500 mr-2"></i>Description *
                        </label>
                        <textarea id="roleDescription"
                                  rows="3"
                                  placeholder="Décrivez le rôle et ses responsabilités..."
                                  class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                  required></textarea>
                    </div>
                </div>

                <!-- Permissions -->
                <div class="border-t pt-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-800">
                            <i class="fas fa-key text-purple-500 mr-2"></i>
                            Permissions (<span id="selectedCount">0</span> sélectionnées)
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="selectAllPermissions()" class="text-xs bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-lg hover:bg-blue-200">
                                <i class="fas fa-check-double mr-1"></i><span class="hidden sm:inline">Tout </span>Sélect.
                            </button>
                            <button onclick="selectReadOnly()" class="text-xs bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-lg hover:bg-green-200">
                                <i class="fas fa-eye mr-1"></i>Lecture
                            </button>
                            <button onclick="deselectAllPermissions()" class="text-xs bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 rounded-lg hover:bg-gray-200">
                                <i class="fas fa-times mr-1"></i><span class="hidden sm:inline">Tout </span>Désel.
                            </button>
                        </div>
                    </div>

                    <div id="permissionsContainer" class="space-y-4 max-h-96 overflow-y-auto">
                        <!-- Les permissions seront chargées ici -->
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mt-6 pt-6 border-t">
                    <button onclick="closeModal()" class="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base">
                        <i class="fas fa-times mr-2"></i>Annuler
                    </button>
                    <button onclick="saveRole()" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md text-sm sm:text-base">
                        <i class="fas fa-save mr-2"></i>Enregistrer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de Visualisation -->
    <div id="viewModal" class="modal">
        <div class="modal-content bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
            <div class="sticky top-0 bg-gradient-to-r from-slate-600 to-slate-800 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl z-10">
                <div class="flex items-center justify-between">
                    <h2 id="viewModalTitle" class="text-lg sm:text-2xl font-bold">Détails du Rôle</h2>
                    <button onclick="closeViewModal()" class="text-white hover:text-gray-200 text-xl sm:text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div id="viewModalContent" class="p-4 sm:p-6">
                <!-- Le contenu sera chargé dynamiquement -->
            </div>
        </div>
    </div>

    <script>
        // Vérifier l'authentification AVANT de charger le JS
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            console.error('❌ Aucun token trouvé dans localStorage');
            alert('Vous devez être connecté pour accéder à cette page.');
            window.location.href = '/';
        } else {
            console.log('✅ Token trouvé:', token.substring(0, 30) + '...');
            // S'assurer que les deux clés existent
            localStorage.setItem('auth_token', token);
            localStorage.setItem('token', token);
        }
    <\/script>
    <script src="/static/admin-roles.js"><\/script>
</body>
</html>`,Is=`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guide Utilisateur - IGP Maintenance</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'igp-blue': '#1e40af',
                        'igp-orange': '#ea580c',
                        'igp-red': '#dc2626',
                    }
                }
            }
        }
    <\/script>
    <style>
        /* Background avec photo d'atelier IGP */
        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }
        
        /* Effet glassmorphism (vitreux) comme les colonnes Kanban */
        .guide-container {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 12px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.6);
            transition: all 0.3s ease;
        }
        
        .section-card {
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
        }
        
        .section-card:hover {
            background: rgba(255, 255, 255, 0.65);
            box-shadow: 0 8px 28px 0 rgba(0, 0, 0, 0.20);
            transform: translateY(-2px);
        }
        
        .feature-box {
            background: rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-left: 4px solid #3b82f6;
        }
        
        .icon-badge {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: rgba(255, 255, 255, 0.50);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.10);
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        
        .back-button {
            background: linear-gradient(145deg, #3b82f6, #2563eb);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            box-shadow: 
                6px 6px 12px rgba(37, 99, 235, 0.3),
                -3px -3px 8px rgba(147, 197, 253, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .back-button:hover {
            box-shadow: 
                8px 8px 16px rgba(37, 99, 235, 0.4),
                -4px -4px 10px rgba(147, 197, 253, 0.4);
            transform: translateY(-2px);
        }
        
        .back-button:active {
            box-shadow: 
                4px 4px 8px rgba(37, 99, 235, 0.3),
                -2px -2px 6px rgba(147, 197, 253, 0.3);
            transform: translateY(0);
        }
        
        .toc-link {
            color: #1e293b;
            text-decoration: none;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 14px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: rgba(255, 255, 255, 0.50);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
            font-weight: 500;
            font-size: 0.9375rem;
            letter-spacing: -0.01em;
        }
        
        .toc-link:hover {
            background: rgba(255, 255, 255, 0.80);
            border-color: #3b82f6;
            box-shadow: 
                0 4px 12px rgba(59, 130, 246, 0.15),
                0 0 0 3px rgba(59, 130, 246, 0.1);
            transform: translateX(4px);
        }
        
        .toc-link:active {
            transform: translateX(2px) scale(0.98);
        }
        
        .toc-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: linear-gradient(145deg, #f8fafc, #f1f5f9);
            box-shadow: 
                inset 2px 2px 5px rgba(148, 163, 184, 0.2),
                inset -2px -2px 5px rgba(255, 255, 255, 0.9);
            flex-shrink: 0;
        }
        
        .toc-link:hover .toc-icon {
            background: linear-gradient(145deg, #3b82f6, #2563eb);
            box-shadow: 
                0 4px 12px rgba(59, 130, 246, 0.4),
                inset 0 2px 4px rgba(255, 255, 255, 0.2);
        }
        
        .toc-icon i {
            font-size: 1.125rem;
            color: #64748b;
            transition: all 0.3s ease;
        }
        
        .toc-link:hover .toc-icon i {
            color: #ffffff;
            transform: scale(1.1);
        }
        
        .toc-number {
            font-weight: 700;
            color: #64748b;
            font-size: 0.875rem;
            min-width: 20px;
            transition: color 0.3s ease;
        }
        
        .toc-link:hover .toc-number {
            color: #3b82f6;
        }
        
        .toc-text {
            flex: 1;
            line-height: 1.4;
            color: #334155;
            font-weight: 600;
            transition: color 0.3s ease;
        }
        
        .toc-link:hover .toc-text {
            color: #1e293b;
        }
        
        .step-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(145deg, #3b82f6, #2563eb);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 
                3px 3px 6px rgba(37, 99, 235, 0.3),
                -2px -2px 4px rgba(147, 197, 253, 0.3);
        }
        
        kbd {
            background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 2px 8px;
            font-family: monospace;
            font-size: 0.9em;
            box-shadow: 
                2px 2px 4px rgba(71, 85, 105, 0.1),
                -1px -1px 2px rgba(255, 255, 255, 0.8);
        }
        
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.85em;
            font-weight: 600;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .priority-critical {
            background: rgba(254, 226, 226, 0.70);
            color: #dc2626;
            border-left: 3px solid #dc2626;
        }
        
        .priority-high {
            background: rgba(254, 243, 199, 0.70);
            color: #d97706;
            border-left: 3px solid #f59e0b;
        }
        
        .priority-medium {
            background: rgba(219, 234, 254, 0.70);
            color: #1d4ed8;
            border-left: 3px solid #3b82f6;
        }
        
        .priority-low {
            background: rgba(209, 250, 229, 0.70);
            color: #059669;
            border-left: 3px solid #10b981;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.85em;
            font-weight: 600;
            background: rgba(241, 245, 249, 0.60);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px rgba(71, 85, 105, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        
        /* ============================================
           📱 RESPONSIVE DESIGN PROFESSIONNEL
           ============================================ */
        
        /* Tablet (768px - 1024px) */
        @media (max-width: 1024px) {
            body {
                padding: 2rem 1rem;
            }
            
            .guide-container {
                padding: 1.5rem;
                margin: 0 auto 1.5rem;
            }
            
            .section-card {
                padding: 1rem;
                margin-bottom: 1rem;
            }
            
            .feature-box {
                padding: 1rem;
                margin-bottom: 0.75rem;
            }
        }
        
        /* Mobile Large (480px - 768px) */
        @media (max-width: 768px) {
            body {
                padding: 1rem 0.5rem;
            }
            
            .guide-container {
                margin: 0 0 1rem;
                padding: 1rem;
                border-radius: 10px;
            }
            
            .section-card {
                padding: 0.875rem;
                margin-bottom: 0.875rem;
                border-radius: 10px;
            }
            
            .feature-box {
                padding: 0.875rem;
                margin-bottom: 0.75rem;
                border-radius: 8px;
            }
            
            .icon-badge {
                width: 40px;
                height: 40px;
                font-size: 20px;
            }
            
            .step-number {
                width: 28px;
                height: 28px;
                font-size: 13px;
            }
            
            .back-button {
                padding: 0.625rem 1rem;
                font-size: 14px;
                width: auto;
            }
            
            /* Header responsive */
            h1 {
                font-size: 1.75rem !important;
                line-height: 1.2;
            }
            
            h2 {
                font-size: 1.5rem !important;
            }
            
            h3 {
                font-size: 1.25rem !important;
            }
            
            /* Badges responsive */
            .priority-badge,
            .status-badge {
                font-size: 0.75rem;
                padding: 0.25rem 0.625rem;
            }
            
            /* TOC responsive */
            .toc-link {
                padding: 12px 16px;
                font-size: 0.875rem;
                gap: 10px;
            }
            
            .toc-icon {
                width: 36px;
                height: 36px;
            }
            
            .toc-icon i {
                font-size: 1rem;
            }
            
            .toc-number {
                font-size: 0.8125rem;
                min-width: 18px;
            }
            
            /* Liste items plus compacts */
            ul, ol {
                padding-left: 1.5rem;
            }
            
            li {
                margin-bottom: 0.5rem;
            }
        }
        
        /* Mobile Small (320px - 480px) */
        @media (max-width: 480px) {
            body {
                padding: 0.5rem 0.25rem;
            }
            
            .guide-container {
                margin: 0 0 0.75rem;
                padding: 0.75rem;
                border-radius: 8px;
            }
            
            .section-card {
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 0.75rem;
            }
            
            .feature-box {
                padding: 0.75rem;
                margin-bottom: 0.625rem;
            }
            
            /* Typographie très petite */
            h1 {
                font-size: 1.5rem !important;
            }
            
            h2 {
                font-size: 1.25rem !important;
            }
            
            h3 {
                font-size: 1.125rem !important;
            }
            
            p, li, span {
                font-size: 0.875rem;
            }
            
            /* Badges très compacts */
            .priority-badge,
            .status-badge {
                font-size: 0.6875rem;
                padding: 0.1875rem 0.5rem;
            }
            
            .icon-badge {
                width: 36px;
                height: 36px;
                font-size: 18px;
            }
            
            .step-number {
                width: 24px;
                height: 24px;
                font-size: 12px;
            }
            
            /* TOC très compact */
            .toc-link {
                padding: 10px 12px;
                font-size: 0.8125rem;
                gap: 8px;
            }
            
            .toc-icon {
                width: 32px;
                height: 32px;
            }
            
            .toc-icon i {
                font-size: 0.875rem;
            }
            
            .toc-number {
                font-size: 0.75rem;
                min-width: 16px;
            }
            
            .toc-text {
                font-size: 0.8125rem;
            }
            
            /* Bouton retour compact */
            .back-button {
                padding: 0.5rem 0.75rem;
                font-size: 13px;
                width: 100%;
                justify-content: center;
            }
            
            /* Listes ultra-compactes */
            ul, ol {
                padding-left: 1.25rem;
            }
            
            li {
                margin-bottom: 0.375rem;
            }
            
            /* Code blocks */
            kbd {
                font-size: 0.75rem;
                padding: 0.125rem 0.5rem;
            }
            
            /* Scroll navigation button (up/down) */
            #scroll-nav-btn {
                width: 48px !important;
                height: 48px !important;
                bottom: 1rem !important;
                right: 1rem !important;
                font-size: 1rem;
            }
            
            /* Table responsive */
            table {
                font-size: 0.75rem;
            }
            
            /* Badges info header */
            .flex.items-center.gap-3 {
                flex-wrap: wrap;
                gap: 0.5rem !important;
            }
            
            .flex.items-center.gap-3 > span {
                font-size: 0.6875rem !important;
                padding: 0.25rem 0.5rem !important;
            }
        }
        
        /* Mobile Extra Small (< 360px) */
        @media (max-width: 360px) {
            body {
                padding: 0.375rem 0.125rem;
            }
            
            .guide-container {
                padding: 0.625rem;
            }
            
            .section-card {
                padding: 0.625rem;
            }
            
            .feature-box {
                padding: 0.625rem;
            }
            
            h1 {
                font-size: 1.375rem !important;
            }
            
            h2 {
                font-size: 1.125rem !important;
            }
            
            h3 {
                font-size: 1rem !important;
            }
            
            p, li, span {
                font-size: 0.8125rem;
            }
            
            .back-button {
                padding: 0.5rem;
                font-size: 12px;
            }
        }
        
        /* Landscape mobile */
        @media (max-height: 600px) and (orientation: landscape) {
            html {
                scroll-padding-top: 60px;
            }
            
            .guide-container {
                padding: 1rem;
            }
            
            .section-card {
                padding: 0.75rem;
                margin-bottom: 0.75rem;
            }
            
            #scroll-nav-btn {
                bottom: 0.75rem !important;
                right: 0.75rem !important;
            }
        }
        
        /* Touch targets - Accessibilité mobile */
        @media (pointer: coarse) {
            .toc-link,
            .back-button,
            button,
            a {
                min-height: 44px;
                min-width: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            
            .toc-link {
                padding: 0.75rem 1rem;
            }
        }
        
        /* Print media query */
        @media print {
            body {
                background: white !important;
            }
            
            .guide-container,
            .section-card,
            .feature-box {
                background: white !important;
                box-shadow: none !important;
                border: 1px solid #ddd !important;
            }
            
            .back-button,
            #scroll-nav-btn,
            .reading-progress {
                display: none !important;
            }
            
            .section-card {
                page-break-inside: avoid;
            }
        }
        
        /* ============================================
           🌟 AMÉLIORATIONS PROFESSIONNELLES PREMIUM
           ============================================ */
        
        /* Smooth scroll premium avec décélération */
        html {
            scroll-behavior: smooth;
            scroll-padding-top: 80px; /* Espace pour header fixe */
        }
        
        /* Animation d'entrée des sections au scroll */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .section-card {
            animation: fadeInUp 0.6s ease-out;
            animation-fill-mode: both;
        }
        
        /* Délai progressif pour effet cascade */
        .section-card:nth-child(1) { animation-delay: 0.1s; }
        .section-card:nth-child(2) { animation-delay: 0.2s; }
        .section-card:nth-child(3) { animation-delay: 0.3s; }
        .section-card:nth-child(4) { animation-delay: 0.4s; }
        .section-card:nth-child(5) { animation-delay: 0.5s; }
        .section-card:nth-child(6) { animation-delay: 0.6s; }
        .section-card:nth-child(7) { animation-delay: 0.7s; }
        .section-card:nth-child(8) { animation-delay: 0.8s; }
        .section-card:nth-child(9) { animation-delay: 0.9s; }
        
        /* Highlight target section avec effet premium */
        :target {
            animation: highlightPremium 1.5s ease;
        }
        
        @keyframes highlightPremium {
            0% {
                background: rgba(59, 130, 246, 0.25);
                transform: scale(1.02);
            }
            50% {
                background: rgba(59, 130, 246, 0.15);
            }
            100% {
                background: transparent;
                transform: scale(1);
            }
        }
        
        /* Barre de progression de lecture */
        .reading-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
            z-index: 9999;
            transition: width 0.1s ease-out;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        }
        
        /* Effet de brillance sur les cartes au hover */
        .section-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.3),
                transparent
            );
            transition: left 0.5s ease;
            pointer-events: none;
        }
        
        .section-card:hover::before {
            left: 100%;
        }
        
        /* Amélioration du bouton de navigation (up/down) */
        #scroll-nav-btn {
            position: fixed !important;
            bottom: 2rem !important;
            right: 2rem !important;
            width: 3.5rem !important;
            height: 3.5rem !important;
            border-radius: 50% !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: white !important;
            cursor: pointer !important;
            border: none !important;
            animation: bounceIn 0.5s ease;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 
                0 4px 15px rgba(102, 126, 234, 0.4),
                0 0 20px rgba(118, 75, 162, 0.3);
            transition: all 0.3s ease !important;
        }
        
        #scroll-nav-btn:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 
                0 6px 20px rgba(102, 126, 234, 0.5),
                0 0 30px rgba(118, 75, 162, 0.4);
        }
        
        @keyframes bounceIn {
            0% {
                opacity: 0;
                transform: scale(0.3) translateY(20px);
            }
            50% {
                transform: scale(1.05) translateY(-5px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        /* Curseur custom pour liens interactifs */
        .toc-link, .back-button, a {
            cursor: pointer;
        }
        
        .toc-link:hover, .back-button:hover {
            cursor: pointer;
        }
        
        /* Effet de focus accessible premium */
        *:focus-visible {
            outline: 3px solid rgba(59, 130, 246, 0.5);
            outline-offset: 3px;
            border-radius: 6px;
        }
        
        /* Table des matières sticky avec glassmorphism */
        @media (min-width: 1280px) {
            .sticky-toc {
                position: sticky;
                top: 20px;
                max-height: calc(100vh - 40px);
                overflow-y: auto;
            }
        }
        
        /* Scrollbar personnalisée premium */
        ::-webkit-scrollbar {
            width: 12px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #764ba2 0%, #667eea 100%);
        }
        
        /* Animation d'icônes au hover */
        .icon-badge {
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .icon-badge:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 8px 20px 0 rgba(0, 0, 0, 0.15);
        }
        
        /* Effet de typing pour le titre */
        @keyframes typing {
            from { width: 0; }
            to { width: 100%; }
        }
        
        @keyframes blink {
            50% { border-color: transparent; }
        }
    </style>
</head>
<body class="p-3 sm:p-4 md:p-6 lg:p-8">
    <div class="max-w-5xl mx-auto">
        <!-- Header avec temps de lecture - 100% responsive -->
        <div class="guide-container p-3 sm:p-4 md:p-6 lg:p-8 mb-4 md:mb-6 lg:mb-8">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div class="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                    <div class="icon-badge text-blue-600 flex-shrink-0">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
                            Guide Utilisateur
                        </h1>
                        <p class="text-xs sm:text-sm md:text-base text-gray-600 mt-1 leading-snug">
                            Système de Gestion de Maintenance - IGP Glass
                        </p>
                        <div class="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                            <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md whitespace-nowrap">
                                <i class="fas fa-clock text-xs"></i>
                                <span id="reading-time" class="text-xs">~8 min</span>
                            </span>
                            <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-md whitespace-nowrap">
                                <i class="fas fa-check-circle text-xs"></i>
                                <span class="text-xs">8 sections</span>
                            </span>
                            <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-md whitespace-nowrap">
                                <i class="fas fa-bookmark text-xs"></i>
                                <span class="text-xs">v2.8.1</span>
                            </span>
                        </div>
                    </div>
                </div>
                <button onclick="window.location.href='/'" class="back-button flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0">
                    <i class="fas fa-arrow-left"></i>
                    <span>Retour</span>
                </button>
            </div>
        </div>

        <!-- Table des matières - 100% responsive -->
        <div class="section-card" id="table-of-contents">
            <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-3">
                <div class="icon-badge text-blue-600">
                    <i class="fas fa-th-list"></i>
                </div>
                <span class="leading-tight">Table des matières</span>
            </h2>
            <p class="text-sm text-gray-600 mb-4 ml-1">Sélectionnez une section pour y accéder directement</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="#tickets" class="toc-link">
                    <div class="toc-icon">
                        <i class="fas fa-ticket-alt"></i>
                    </div>
                    <span class="toc-number">01</span>
                    <span class="toc-text">Gestion des Tickets</span>
                </a>
                <a href="#kanban" class="toc-link">
                    <div class="toc-icon">
                        <i class="fas fa-columns"></i>
                    </div>
                    <span class="toc-number">02</span>
                    <span class="toc-text">Tableau Kanban</span>
                </a>
                <a href="#messages" class="toc-link">
                    <div class="toc-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <span class="toc-number">03</span>
                    <span class="toc-text">Messagerie Interne</span>
                </a>
                <a href="#notifications" class="toc-link">
                    <div class="toc-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <span class="toc-number">04</span>
                    <span class="toc-text">Notifications Push</span>
                </a>
                <a href="#machines" class="toc-link">
                    <div class="toc-icon">
                        <i class="fas fa-cogs"></i>
                    </div>
                    <span class="toc-number">05</span>
                    <span class="toc-text">Gestion des Machines</span>
                </a>
                <a href="#profile" class="toc-link">
                    <div class="toc-icon">
                        <i class="fas fa-user-cog"></i>
                    </div>
                    <span class="toc-number">06</span>
                    <span class="toc-text">Profil & Paramètres</span>
                </a>
                <a href="#mobile" class="toc-link">
                    <div class="toc-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <span class="toc-number">07</span>
                    <span class="toc-text">Utilisation Mobile</span>
                </a>
                <a href="#tips" class="toc-link">
                    <div class="toc-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <span class="toc-number">08</span>
                    <span class="toc-text">Trucs & Astuces</span>
                </a>
            </div>
        </div>

        <!-- Section 1: Gestion des Tickets -->
        <div class="section-card" id="tickets">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-ticket-alt text-blue-600"></i>
                1. Gestion des Tickets
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Créer un nouveau ticket
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur le bouton <strong>"+ Demande"</strong> (bouton bleu avec icône <i class="fas fa-plus"></i>) en haut à gauche</li>
                    <li>• Remplissez les champs obligatoires :
                        <ul class="ml-6 mt-2 space-y-1">
                            <li>- <strong>Titre</strong> : Description courte du problème</li>
                            <li>- <strong>Machine</strong> : Sélectionnez l'équipement concerné</li>
                            <li>- <strong>Priorité</strong> : Choisissez selon l'urgence</li>
                            <li>- <strong>Technicien</strong> : Assignez à un membre de l'équipe</li>
                        </ul>
                    </li>
                    <li>• Ajoutez des détails dans la <strong>Description</strong></li>
                    <li>• Optionnel : Joignez des <strong>photos</strong> ou <strong>documents</strong></li>
                    <li>• Cliquez sur <strong>"Créer"</strong> pour soumettre le ticket</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Comprendre les priorités
                </h3>
                <div class="space-y-3 ml-12">
                    <div class="flex items-center gap-3">
                        <span class="priority-badge priority-critical">
                            <i class="fas fa-exclamation-triangle"></i> CRITIQUE
                        </span>
                        <span class="text-gray-700">Arrêt de production imminent - Intervention immédiate requise</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="priority-badge priority-high">
                            <i class="fas fa-arrow-up"></i> HAUTE
                        </span>
                        <span class="text-gray-700">Impact majeur - Planifier intervention aujourd'hui</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="priority-badge priority-medium">
                            <i class="fas fa-minus"></i> MOYENNE
                        </span>
                        <span class="text-gray-700">Impact modéré - Planifier dans les 2-3 jours</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="priority-badge priority-low">
                            <i class="fas fa-arrow-down"></i> BASSE
                        </span>
                        <span class="text-gray-700">Impact mineur - Planifier quand disponible</span>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Modifier un ticket existant
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur le ticket dans le tableau Kanban</li>
                    <li>• Modifiez les informations nécessaires</li>
                    <li>• Ajoutez des <strong>commentaires</strong> pour documenter l'évolution</li>
                    <li>• Changez le <strong>statut</strong> en déplaçant le ticket (voir section Kanban)</li>
                    <li>• Cliquez sur <strong>"Enregistrer"</strong> pour sauvegarder</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">4</div>
                    Joindre des fichiers
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Photos</strong> : Prenez une photo directement ou choisissez depuis la galerie</li>
                    <li>• <strong>Documents</strong> : PDF, fichiers Word, Excel acceptés</li>
                    <li>• <strong>Taille max</strong> : 10 MB par fichier</li>
                    <li>• <strong>Formats acceptés</strong> : JPG, PNG, PDF, DOC, DOCX, XLS, XLSX</li>
                </ul>
            </div>
        </div>

        <!-- Section 2: Tableau Kanban -->
        <div class="section-card" id="kanban">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-columns text-purple-600"></i>
                2. Tableau Kanban
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Comprendre les colonnes
                </h3>
                <div class="space-y-3 ml-12">
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟦 Requete Recue
                        </span>
                        <span class="text-gray-700">Nouvelle demande reçue, en attente d'analyse</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟨 Diagnostic
                        </span>
                        <span class="text-gray-700">Analyse du problème en cours par le technicien</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟧 En Cours
                        </span>
                        <span class="text-gray-700">Intervention active par le technicien assigné</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟪 En Attente Pieces
                        </span>
                        <span class="text-gray-700">En attente de pièces de rechange ou matériel</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟩 Termine
                        </span>
                        <span class="text-gray-700">Intervention complétée et validée</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            ⬜ Archive
                        </span>
                        <span class="text-gray-700">Ticket archivé pour historique et consultation</span>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Déplacer un ticket (Drag & Drop)
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Sur ordinateur</strong> : Cliquez et maintenez sur un ticket, puis glissez vers la colonne souhaitée</li>
                    <li>• <strong>Sur mobile/tablette</strong> : Appuyez longuement (1 seconde) puis glissez le ticket</li>
                    <li>• Le ticket change automatiquement de statut</li>
                    <li>• <strong>Restrictions</strong> : Seuls les techniciens assignés ou superviseurs peuvent déplacer certains tickets</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Trier les tickets
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Utilisez le menu déroulant <strong>"Trier:"</strong> en haut du tableau</li>
                    <li>• <strong>Par défaut</strong> : Ordre original (création)</li>
                    <li>• <strong>🔥 Urgence</strong> : Calcul automatique (priorité + temps écoulé) - Les plus urgents en premier</li>
                    <li>• <strong>⏰ Plus ancien</strong> : Tickets les plus anciens en premier</li>
                    <li>• <strong>📅 Planifié</strong> : Tickets avec date de planification, triés par date la plus proche</li>
                    <li>• Le tri est visible uniquement s'il y a <strong>3 tickets ou plus</strong> dans le tableau</li>
                </ul>
            </div>
        </div>

        <!-- Section 3: Messagerie -->
        <div class="section-card" id="messages">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-comments text-green-600"></i>
                3. Messagerie Interne
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Envoyer un message texte
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur le bouton <strong>"Messagerie"</strong> (icône <i class="fas fa-comments"></i>) dans la barre de navigation</li>
                    <li>• Sélectionnez un collègue dans la liste des conversations</li>
                    <li>• Tapez votre message dans la zone de texte en bas</li>
                    <li>• Appuyez sur <kbd>Entrée</kbd> ou cliquez sur <i class="fas fa-paper-plane"></i> pour envoyer</li>
                    <li>• Les messages sont instantanés et le destinataire reçoit une notification</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Envoyer un message vocal
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Dans une conversation, cliquez sur l'icône <i class="fas fa-microphone text-red-600"></i> <strong>microphone</strong></li>
                    <li>• <strong>Maintenez appuyé</strong> pour enregistrer (jusqu'à 2 minutes)</li>
                    <li>• Relâchez pour envoyer automatiquement</li>
                    <li>• <strong>Avantages</strong> : Parfait pour les mains occupées ou messages complexes</li>
                    <li>• Le destinataire peut écouter directement dans l'application</li>
                </ul>
                <div class="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-sm text-gray-700">
                    <p class="font-semibold text-blue-800 mb-1">
                        <i class="fas fa-info-circle"></i> Compatibilité des messages audio
                    </p>
                    <p>✅ <strong>Détection automatique du format</strong> : L'application choisit le meilleur format audio supporté par votre appareil</p>
                    <ul class="mt-2 space-y-1 ml-4">
                        <li>• <strong>iPhone/iPad (Safari)</strong> : MP4/AAC ou MP3</li>
                        <li>• <strong>Android (Chrome)</strong> : MP3, MP4 ou WebM</li>
                        <li>• <strong>Lecture universelle</strong> : Tous les appareils peuvent lire les messages audio reçus</li>
                    </ul>
                    <p class="mt-2 text-xs text-gray-600">Note: Les formats MP3 et MP4 sont universellement compatibles sur iOS et Android</p>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Indicateurs de conversation
                </h3>
                <div class="space-y-2 ml-12 text-gray-700">
                    <div class="flex items-center gap-2">
                        <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
                        <span>Badge rouge : Nombre de messages non lus</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-circle text-green-500 text-xs"></i>
                        <span>Point vert : L'utilisateur est en ligne</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check text-gray-400"></i>
                        <span>Simple coche : Message envoyé</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check-double text-blue-500"></i>
                        <span>Double coche bleue : Message lu</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 4: Notifications Push -->
        <div class="section-card" id="notifications">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-bell text-yellow-600"></i>
                4. Notifications Push
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Activer les notifications
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Lors de votre première connexion, autorisez les notifications quand votre navigateur le demande</li>
                    <li>• Si vous avez refusé, allez dans les <strong>paramètres de votre navigateur</strong> :</li>
                    <ul class="ml-6 mt-2 space-y-1">
                        <li>- Chrome : ⋮ → Paramètres → Confidentialité → Paramètres des sites → Notifications</li>
                        <li>- Safari : Préférences → Sites web → Notifications</li>
                        <li>- Firefox : ☰ → Paramètres → Vie privée → Permissions → Notifications</li>
                    </ul>
                    <li>• Trouvez <strong>mecanique.igpglass.ca</strong> et activez les notifications</li>
                </ul>
                <div class="mt-3 p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-sm text-gray-700">
                    <p class="font-semibold text-amber-800 mb-1">
                        <i class="fas fa-exclamation-triangle"></i> Important pour iPhone/iPad
                    </p>
                    <p class="mb-2">Les notifications push sur iOS <strong>nécessitent l'installation de l'application sur l'écran d'accueil</strong> (voir section 7 - Utilisation Mobile).</p>
                    <p class="text-xs text-gray-600"><strong>Pourquoi ?</strong> Apple requiert que les PWA soient installées pour recevoir des notifications push. Sans installation, les notifications ne fonctionneront pas sur iPhone/iPad.</p>
                    <p class="mt-2 font-medium text-amber-700">
                        ✅ <strong>Android</strong> : Notifications fonctionnent dans le navigateur Chrome<br>
                        ⚠️ <strong>iOS</strong> : Installation requise (Safari → Partager → "Sur l'écran d'accueil")
                    </p>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Types de notifications reçues
                </h3>
                <div class="space-y-3 ml-12">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-wrench text-blue-600 text-xl"></i>
                        <div>
                            <strong>Nouveau ticket assigné</strong>
                            <p class="text-sm text-gray-600">Notification : "🔧 [Titre du ticket]" → Cliquez pour ouvrir l'application</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <i class="fas fa-comment text-green-600 text-xl"></i>
                        <div>
                            <strong>Nouveau message texte</strong>
                            <p class="text-sm text-gray-600">Notification : "💬 [Nom de l'expéditeur]" → Cliquez pour lire le message</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <i class="fas fa-microphone text-red-600 text-xl"></i>
                        <div>
                            <strong>Nouveau message vocal</strong>
                            <p class="text-sm text-gray-600">Notification : "🎤 [Nom de l'expéditeur] - Message vocal ([durée])" → Cliquez pour écouter</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Fonctionnement des notifications
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Les notifications apparaissent même si l'application est <strong>fermée</strong></li>
                    <li>• Elles fonctionnent sur <strong>ordinateur, mobile et tablette</strong></li>
                    <li>• Cliquer sur une notification ouvre directement l'application</li>
                    <li>• Les notifications restent visibles jusqu'à ce que vous les consultiez</li>
                </ul>
            </div>
        </div>

        <!-- Section 5: Gestion des Machines -->
        <div class="section-card" id="machines">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-cogs text-gray-600"></i>
                5. Gestion des Machines
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Consulter les machines
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur l'icône <i class="fas fa-cogs"></i> <strong>"Machines"</strong> dans la navigation</li>
                    <li>• Visualisez toutes les machines et leur statut actuel</li>
                    <li>• <strong>Filtre rapide</strong> : Recherchez par nom, numéro de série, ou département</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Historique des interventions
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur une machine pour voir son détail</li>
                    <li>• Consultez l'<strong>historique complet</strong> des tickets associés</li>
                    <li>• Visualisez les <strong>pièces remplacées</strong> et interventions passées</li>
                    <li>• Utile pour identifier les problèmes récurrents</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Ajouter une nouvelle machine (Admin)
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Fonction réservée aux <strong>administrateurs</strong></li>
                    <li>• Cliquez sur <strong>"Nouvelle Machine"</strong></li>
                    <li>• Remplissez les informations : nom, numéro de série, département, etc.</li>
                    <li>• La machine devient immédiatement disponible pour les tickets</li>
                </ul>
            </div>
        </div>

        <!-- Section 6: Profil & Paramètres -->
        <div class="section-card" id="profile">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-user-cog text-indigo-600"></i>
                6. Profil & Paramètres
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Modifier votre profil
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur votre <strong>nom</strong> en haut à droite</li>
                    <li>• Sélectionnez <strong>"Profil"</strong></li>
                    <li>• Modifiez vos informations : nom, email, téléphone</li>
                    <li>• Changez votre <strong>mot de passe</strong> si nécessaire</li>
                    <li>• Cliquez sur <strong>"Enregistrer"</strong></li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Préférences de notifications
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Dans <strong>Paramètres → Notifications</strong></li>
                    <li>• Activez/désactivez les notifications selon vos préférences</li>
                    <li>• Choisissez les types d'événements qui vous intéressent</li>
                    <li>• Les changements prennent effet immédiatement</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Se déconnecter
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur votre nom en haut à droite</li>
                    <li>• Sélectionnez <strong>"Déconnexion"</strong></li>
                    <li>• <strong>Important</strong> : Sur les appareils partagés, déconnectez-vous toujours après utilisation</li>
                </ul>
            </div>
        </div>

        <!-- Section 7: Utilisation Mobile -->
        <div class="section-card" id="mobile">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-mobile-alt text-pink-600"></i>
                7. Utilisation Mobile (PWA)
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Installer l'application (recommandé)
                </h3>
                <div class="ml-12 space-y-4">
                    <div>
                        <strong class="text-gray-800">Sur iPhone/iPad (Safari) :</strong>
                        <ol class="mt-2 space-y-1 text-gray-700">
                            <li>1. Ouvrez mecanique.igpglass.ca dans Safari</li>
                            <li>2. Appuyez sur l'icône <i class="fas fa-share"></i> <strong>Partager</strong> (en bas)</li>
                            <li>3. Sélectionnez <strong>"Sur l'écran d'accueil"</strong></li>
                            <li>4. Appuyez sur <strong>"Ajouter"</strong></li>
                        </ol>
                    </div>
                    <div>
                        <strong class="text-gray-800">Sur Android (Chrome) :</strong>
                        <ol class="mt-2 space-y-1 text-gray-700">
                            <li>1. Ouvrez mecanique.igpglass.ca dans Chrome</li>
                            <li>2. Appuyez sur les <strong>trois points</strong> ⋮ en haut à droite</li>
                            <li>3. Sélectionnez <strong>"Ajouter à l'écran d'accueil"</strong></li>
                            <li>4. Appuyez sur <strong>"Installer"</strong></li>
                        </ol>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Avantages de l'installation
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Accès rapide</strong> : Lancez l'app comme une application native depuis votre écran d'accueil</li>
                    <li>• <strong>Mode plein écran</strong> : Plus d'espace pour travailler sans barre d'adresse</li>
                    <li>• <strong>Notifications push</strong> : Recevez des alertes même si l'app est fermée</li>
                    <li>• <strong>Fonctionne hors ligne</strong> : Consultez les données récentes sans connexion</li>
                    <li>• <strong>Plus rapide</strong> : Chargement instantané après installation</li>
                    <li>• <strong>Icône sur l'écran d'accueil</strong> : Logo IGP visible avec vos autres applications</li>
                </ul>
                <div class="mt-3 p-3 bg-purple-50 border-l-4 border-purple-500 rounded text-sm text-gray-700">
                    <p class="font-semibold text-purple-800 mb-2">
                        <i class="fas fa-star"></i> Recommandation forte pour iPhone/iPad
                    </p>
                    <p class="mb-2">L'installation est <strong>fortement recommandée</strong> et même <strong>obligatoire pour les notifications push</strong> sur iOS.</p>
                    <p class="text-xs text-gray-600">
                        <strong>Différence Android vs iOS :</strong><br>
                        • <strong>Android</strong> : Installation optionnelle (améliore l'expérience)<br>
                        • <strong>iOS</strong> : Installation obligatoire pour les notifications push
                    </p>
                    <p class="mt-2 font-medium text-purple-700">
                        💡 L'installation prend 10 secondes et transforme le site web en application native complète!
                    </p>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Gestes tactiles
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Glisser</strong> : Faites défiler les listes et le tableau Kanban</li>
                    <li>• <strong>Appui long</strong> : Maintenez 1 seconde sur un ticket pour le déplacer</li>
                    <li>• <strong>Pincer</strong> : Zoomez sur les photos de tickets</li>
                    <li>• <strong>Balayer</strong> : Naviguez entre les conversations de messagerie</li>
                </ul>
            </div>
        </div>

        <!-- Section 8: Trucs & Astuces -->
        <div class="section-card" id="tips">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-lightbulb text-yellow-500"></i>
                8. Trucs & Astuces
            </h2>

            <div class="feature-box">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-keyboard text-blue-500 mr-2"></i>
                    Raccourcis clavier
                </h3>
                <div class="ml-12 space-y-2 text-gray-700">
                    <div class="flex items-center gap-3">
                        <kbd>Esc</kbd>
                        <span>Fermer les fenêtres modales (popups, formulaires)</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <kbd>Enter</kbd>
                        <span>Soumettre le formulaire actif (création ticket, commentaire, etc.)</span>
                    </div>
                    <p class="text-sm text-gray-600 italic mt-3">Note: L'application privilégie les clics pour éviter les conflits de raccourcis.</p>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-tachometer-alt text-blue-500 mr-2"></i>
                    Optimisations pour efficacité
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Triez par Urgence</strong> : Utilisez le tri "🔥 Urgence" pour voir les tickets les plus pressants en premier</li>
                    <li>• <strong>Planifiez votre journée</strong> : Le tri "📅 Planifié" affiche vos interventions à venir par ordre chronologique</li>
                    <li>• <strong>Commentez régulièrement</strong> : Documentez vos actions pour les collègues</li>
                    <li>• <strong>Photos systématiques</strong> : Prenez des photos avant/après intervention</li>
                    <li>• <strong>Messages vocaux</strong> : Plus rapide qu'écrire quand vous êtes sur le terrain</li>
                    <li>• <strong>Priorités réalistes</strong> : N'abusez pas du "Critique" - gardez-le pour les vraies urgences</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-question-circle text-purple-500 mr-2"></i>
                    Résolution de problèmes
                </h3>
                <div class="ml-12 space-y-3 text-gray-700">
                    <div>
                        <strong>❓ Les notifications ne fonctionnent pas</strong>
                        <p class="text-sm mt-1">→ Vérifiez les autorisations dans les paramètres de votre navigateur/appareil</p>
                    </div>
                    <div>
                        <strong>❓ L'application est lente</strong>
                        <p class="text-sm mt-1">→ Rafraîchissez la page (<kbd>Ctrl</kbd>+<kbd>F5</kbd>) ou videz le cache</p>
                    </div>
                    <div>
                        <strong>❓ Je ne peux pas déplacer un ticket</strong>
                        <p class="text-sm mt-1">→ Vérifiez que vous êtes le technicien assigné ou un superviseur</p>
                    </div>
                    <div>
                        <strong>❓ Une photo ne s'affiche pas</strong>
                        <p class="text-sm mt-1">→ Vérifiez votre connexion internet, puis rechargez la page</p>
                    </div>
                    <div>
                        <strong>❓ Je ne reçois pas les messages</strong>
                        <p class="text-sm mt-1">→ Déconnectez-vous et reconnectez-vous, puis réactivez les notifications</p>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-shield-alt text-green-600 mr-2"></i>
                    Bonnes pratiques de sécurité
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Ne partagez <strong>jamais votre mot de passe</strong></li>
                    <li>• Déconnectez-vous sur les <strong>appareils partagés</strong></li>
                    <li>• Utilisez un <strong>mot de passe fort</strong> (minimum 8 caractères, mélange de lettres et chiffres)</li>
                    <li>• Ne laissez pas votre session ouverte sans surveillance</li>
                    <li>• Signalez immédiatement toute activité suspecte à votre superviseur</li>
                </ul>
            </div>
        </div>

        <!-- Section Aide -->
        <div class="section-card">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-life-ring text-red-600"></i>
                Besoin d'aide ?
            </h2>
            <div class="ml-12 space-y-3 text-gray-700">
                <p>
                    <i class="fas fa-phone text-green-600 mr-2"></i>
                    <strong>Salah</strong> : 
                    <a href="tel:+15144622889" class="text-green-600 hover:underline font-mono">514-462-2889</a>
                </p>
                <p>
                    <i class="fas fa-envelope text-blue-600 mr-2"></i>
                    <strong>Support technique</strong> : 
                    <a href="mailto:support@igpglass.ca" class="text-blue-600 hover:underline">support@igpglass.ca</a>
                </p>
                <p>
                    <i class="fas fa-user-tie text-purple-600 mr-2"></i>
                    <strong>Superviseur</strong> : 
                    Contactez votre superviseur d'équipe via la messagerie interne
                </p>
            </div>
            
            <!-- Formulaire de contact Formcan -->
            <div class="mt-6 pt-6 border-t border-gray-300">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 px-3 sm:px-0">
                    <i class="fas fa-paper-plane text-blue-600"></i>
                    Formulaire de Contact
                </h3>
                <div class="px-3 sm:px-0">
                    <p class="text-sm text-gray-600 mb-4">
                        Vous pouvez également nous envoyer un message détaillé via ce formulaire.
                        Nous vous répondrons dans les plus brefs délais.
                    </p>
                    <div class="plato-form-widget" data-pf-id="fr9ercvp1ay" data-pf-host="form.formcan.com/"></div>
                    <script src="//static.formcan.com/assets/dist/formbuilder.js?v=20"><\/script>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8 mb-4">
            <button onclick="window.location.href='/'" class="back-button">
                <i class="fas fa-arrow-left mr-2"></i>
                Retour à l'application
            </button>
            <p class="text-white text-sm mt-4">
                © 2025 IGP Glass - Système de Gestion de Maintenance v2.8.1
            </p>
        </div>
    </div>

    <script>
        // ============================================
        // 🌟 JAVASCRIPT PREMIUM POUR EXPÉRIENCE UX
        // ============================================
        
        // 1. Barre de progression de lecture
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', function() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.pageYOffset;
            const progress = (scrolled / documentHeight) * 100;
            progressBar.style.width = progress + '%';
        });
        
        // 2. Smooth scroll premium avec offset
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Animation pulse sur la cible
                    target.style.transition = 'all 0.3s ease';
                    target.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        target.style.transform = 'scale(1)';
                    }, 300);
                }
            });
        });

        // 3. Bouton de navigation bidirectionnel (Haut/Bas) avec animation premium
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
            
            let btn = document.getElementById('scroll-nav-btn');
            
            // Afficher le bouton si on a scrollé plus de 300px
            if (scrollTop > 300) {
                if (!btn) {
                    // Créer le bouton
                    btn = document.createElement('button');
                    btn.id = 'scroll-nav-btn';
                    btn.className = 'fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg z-50 flex items-center justify-center text-white transition-all duration-300';
                    btn.style.animation = 'bounceIn 0.5s ease';
                    document.body.appendChild(btn);
                }
                
                // Déterminer la direction: Haut (≥50% de scroll) ou Bas (<50% de scroll)
                if (scrollPercentage >= 50) {
                    // On est en bas → Flèche vers le HAUT pour remonter
                    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
                    btn.title = 'Retour en haut';
                    btn.onclick = () => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (navigator.vibrate) navigator.vibrate(50);
                    };
                } else {
                    // On est en haut → Flèche vers le BAS pour descendre
                    btn.innerHTML = '<i class="fas fa-arrow-down"></i>';
                    btn.title = 'Aller en bas';
                    btn.onclick = () => {
                        window.scrollTo({ top: documentHeight, behavior: 'smooth' });
                        if (navigator.vibrate) navigator.vibrate(50);
                    };
                }
            } else {
                // Masquer le bouton quand on est tout en haut
                if (btn) {
                    btn.style.animation = 'bounceOut 0.5s ease';
                    setTimeout(() => btn.remove(), 500);
                }
            }
        });

        // 4. Intersection Observer pour highlight de section active
        const sections = document.querySelectorAll('.section-card[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    document.querySelectorAll('.toc-link').forEach(link => {
                        const isActive = link.getAttribute('href') === '#' + id;
                        link.style.background = isActive 
                            ? 'linear-gradient(145deg, #dbeafe, #bfdbfe)' 
                            : 'transparent';
                        link.style.paddingLeft = isActive ? '24px' : '16px';
                        link.style.fontWeight = isActive ? '600' : '400';
                        link.style.borderLeft = isActive ? '3px solid #3b82f6' : 'none';
                    });
                }
            });
        }, { threshold: 0.2, rootMargin: '-100px' });

        sections.forEach(section => observer.observe(section));
        
        // 5. Lazy loading des images (si présentes)
        if ('loading' in HTMLImageElement.prototype) {
            const images = document.querySelectorAll('img[loading="lazy"]');
            images.forEach(img => {
                img.src = img.dataset.src || img.src;
            });
        }
        
        // 6. Temps de lecture estimé et affichage dynamique
        const wordCount = document.body.innerText.split(/s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // 200 mots/minute
        const readingTimeEl = document.getElementById('reading-time');
        if (readingTimeEl) {
            readingTimeEl.textContent = \`~\${readingTime} min de lecture\`;
        }
        
        // 7. Animation des feature-box au scroll
        const featureBoxes = document.querySelectorAll('.feature-box');
        const featureObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.5s ease-out';
                    featureObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        featureBoxes.forEach(box => featureObserver.observe(box));
        
        // 8. Raccourci clavier: Échap pour retour en haut
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            // Ctrl/Cmd + K pour focus sur table des matières
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const firstTocLink = document.querySelector('.toc-link');
                if (firstTocLink) firstTocLink.focus();
            }
        });
        
        // 9. Tooltip pour les badges
        document.querySelectorAll('[title]').forEach(el => {
            el.style.cursor = 'help';
        });
        
        // 10. Performance: Preload des images critiques
        const criticalImages = ['/static/login-background.jpg', '/static/logo-igp.png'];
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
        
        // 11. Print styling: Préparer pour impression
        window.addEventListener('beforeprint', function() {
            document.querySelectorAll('.back-button, #scroll-nav-btn').forEach(el => {
                el.style.display = 'none';
            });
        });
        
        window.addEventListener('afterprint', function() {
            document.querySelectorAll('.back-button, #scroll-nav-btn').forEach(el => {
                el.style.display = '';
            });
        });
        
        console.log('📖 Guide Utilisateur IGP - v2.8.1 Premium');
        console.log('⏱️ Temps de lecture estimé:', readingTime, 'minutes');
        console.log('✨ Améliorations premium actives');
    <\/script>
</body>
</html>`,Kt=1e5;async function Gt(e,t){const a=crypto.getRandomValues(new Uint8Array(16)),r=new TextEncoder().encode(e),i=await crypto.subtle.importKey("raw",r,{name:"PBKDF2"},!1,["deriveBits"]),n=await crypto.subtle.deriveBits({name:"PBKDF2",salt:a,iterations:Kt,hash:"SHA-256"},i,256),o=Array.from(a).map(c=>c.toString(16).padStart(2,"0")).join(""),l=Array.from(new Uint8Array(n)).map(c=>c.toString(16).padStart(2,"0")).join("");return`v2:${o}:${l}`}async function Ps(e){const a=new TextEncoder().encode(e),s=await crypto.subtle.digest("SHA-256",a);return Array.from(new Uint8Array(s)).map(i=>i.toString(16).padStart(2,"0")).join("")}async function Ae(e){return Gt(e)}async function Us(e,t){return t.startsWith("v2:")?Ls(e,t):Os(e,t)}async function Ls(e,t){try{const a=t.split(":");if(a.length!==3||a[0]!=="v2")return!1;const s=a[1],r=a[2],i=new Uint8Array(s.match(/.{2}/g).map(d=>parseInt(d,16))),o=new TextEncoder().encode(e),l=await crypto.subtle.importKey("raw",o,{name:"PBKDF2"},!1,["deriveBits"]),c=await crypto.subtle.deriveBits({name:"PBKDF2",salt:i,iterations:Kt,hash:"SHA-256"},l,256);return Array.from(new Uint8Array(c)).map(d=>d.toString(16).padStart(2,"0")).join("")===r}catch(a){return console.error("Error verifying PBKDF2 password:",a),!1}}async function Os(e,t){return await Ps(e)===t}function js(e){return!e.startsWith("v2:")&&e.length===64&&/^[0-9a-f]+$/.test(e)}async function Fs(e){return Gt(e)}const Ee=new T;Ee.post("/register",async e=>{try{const t=await e.req.json(),{email:a,password:s,first_name:r,last_name:i,role:n}=t;if(console.log("[REGISTER] Received:",{email:a,has_password:!!s,first_name:r,last_name:i,role:n}),!a||!s||!r||!n)return console.log("[REGISTER] Validation failed:",{email:!!a,password:!!s,first_name:!!r,role:!!n}),e.json({error:"Email, mot de passe, prénom et rôle requis"},400);const o=i?`${r} ${i}`:r;if(await e.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(a).first())return e.json({error:"Cet email est déjà utilisé"},409);const c=await Ae(s);if(!(await e.env.DB.prepare("INSERT INTO users (email, password_hash, full_name, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)").bind(a,c,o,r,i,n).run()).success)return e.json({error:"Erreur lors de la création du compte"},500);const d=await e.env.DB.prepare("SELECT id, email, full_name, first_name, last_name, role, is_super_admin, created_at, updated_at FROM users WHERE email = ?").bind(a).first(),m=await zt({userId:d.id,email:d.email,role:d.role,full_name:d.full_name,first_name:d.first_name,last_name:d.last_name,isSuperAdmin:d.is_super_admin===1});return e.json({token:m,user:d},201)}catch(t){return console.error("Register error:",t),e.json({error:"Erreur serveur"},500)}});Ee.post("/login",async e=>{try{const t=await e.req.json(),{email:a,password:s,rememberMe:r=!1}=t;if(!a||!s)return e.json({error:"Email et mot de passe requis"},400);const i=await e.env.DB.prepare("SELECT id, email, password_hash, full_name, first_name, last_name, role, is_super_admin, created_at, updated_at FROM users WHERE email = ?").bind(a).first();if(!i)return e.json({error:"Email ou mot de passe incorrect"},401);if(!await Us(s,i.password_hash))return e.json({error:"Email ou mot de passe incorrect"},401);if(js(i.password_hash))try{const m=await Fs(s);await e.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(m,i.id).run(),console.log(`Password upgraded for user ${i.email} (SHA-256 → PBKDF2)`)}catch(m){console.error("Failed to upgrade password hash:",m)}try{await e.env.DB.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").bind(i.id).run()}catch(m){console.error("Failed to update last_login:",m)}const{password_hash:o,...l}=i,u=(r?30:7)*24*60*60,d=await zt({userId:i.id,email:i.email,role:i.role,full_name:i.full_name,first_name:i.first_name,last_name:i.last_name,isSuperAdmin:i.is_super_admin===1},u);return kt(e,"auth_token",d,{httpOnly:!0,secure:!0,sameSite:"Lax",maxAge:u,path:"/"}),e.executionCtx?.waitUntil?e.executionCtx.waitUntil((async()=>{try{await new Promise(p=>setTimeout(p,1e4));const{sendLoginSummaryNotification:m}=await Promise.resolve().then(()=>dr);await m(e.env,i.id)}catch(m){console.error("[LOGIN] Summary notification failed (non-blocking):",m)}})()):console.log("[LOGIN] executionCtx.waitUntil not available, skipping summary notification"),e.json({token:d,user:l})}catch(t){return console.error("Login error:",t),e.json({error:"Erreur serveur"},500)}});Ee.get("/me",async e=>{try{const t=e.get("user");if(!t)return e.json({error:"Non authentifié"},401);const a=await e.env.DB.prepare("SELECT id, email, full_name, first_name, last_name, role, created_at, updated_at, last_login FROM users WHERE id = ?").bind(t.userId).first();return a?e.json({user:a}):e.json({error:"Utilisateur non trouvé"},404)}catch(t){return console.error("Me error:",t),e.json({error:"Erreur serveur"},500)}});Ee.post("/logout",async e=>{try{return kt(e,"auth_token","",{httpOnly:!0,secure:!0,sameSite:"Lax",maxAge:0,path:"/"}),e.json({message:"Déconnexion réussie"})}catch(t){return console.error("Logout error:",t),e.json({error:"Erreur serveur"},500)}});function Bs(e){const t=e.toUpperCase();return{CNC:"CNC",DÉCOUPE:"DEC",DECOUPE:"DEC",FOUR:"FOUR",LAMINÉ:"LAM",LAMINE:"LAM",POLISSEUSE:"POL",THERMOS:"THERMO",WATERJET:"WJ",AUTRE:"AUT"}[t]||t.substring(0,4).toUpperCase()}async function Hs(e,t){const a=new Date,s=String(a.getMonth()+1).padStart(2,"0"),r=String(a.getFullYear()).slice(-2),i=`${s}${r}`,n=Bs(t),l=(await e.prepare("SELECT COUNT(*) as count FROM tickets WHERE ticket_id LIKE ?").bind(`${n}-${i}-%`).first())?.count||0,c=String(l+1).padStart(4,"0");return`${n}-${i}-${c}`}const de=new T;de.get("/",async e=>{try{const t=e.req.query("status"),a=e.req.query("priority");let s=`
      SELECT
        t.*,
        m.machine_type, m.model, m.serial_number, m.location,
        u1.first_name as reporter_name, u1.email as reporter_email,
        u2.first_name as assignee_name, u2.email as assignee_email,
        (SELECT COUNT(*) FROM media WHERE media.ticket_id = t.id) as media_count
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u1 ON t.reported_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE 1=1
    `;const r=[];t&&(s+=" AND t.status = ?",r.push(t)),a&&(s+=" AND t.priority = ?",r.push(a)),s+=" ORDER BY t.created_at DESC";const i=r.length>0?e.env.DB.prepare(s).bind(...r):e.env.DB.prepare(s),{results:n}=await i.all();return e.json({tickets:n})}catch(t){return console.error("Get tickets error:",t),e.json({error:"Erreur lors de la récupération des tickets"},500)}});de.get("/:id",async e=>{try{const t=e.req.param("id"),a=await e.env.DB.prepare(`
      SELECT
        t.*,
        m.machine_type, m.model, m.serial_number, m.location,
        u1.first_name as reporter_name, u1.email as reporter_email,
        u2.first_name as assignee_name, u2.email as assignee_email
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u1 ON t.reported_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?
    `).bind(t).first();if(!a)return e.json({error:"Ticket non trouvé"},404);const{results:s}=await e.env.DB.prepare("SELECT * FROM media WHERE ticket_id = ? ORDER BY created_at DESC").bind(t).all(),{results:r}=await e.env.DB.prepare(`
      SELECT
        tl.*,
        u.first_name as user_name, u.email as user_email
      FROM ticket_timeline tl
      LEFT JOIN users u ON tl.user_id = u.id
      WHERE tl.ticket_id = ?
      ORDER BY tl.created_at DESC
    `).bind(t).all();return e.json({ticket:{...a,media:s,timeline:r}})}catch(t){return console.error("Get ticket error:",t),e.json({error:"Erreur lors de la récupération du ticket"},500)}});de.post("/",async e=>{try{const t=e.get("user"),a=await e.req.json(),{title:s,description:r,reporter_name:i,machine_id:n,priority:o,assigned_to:l,scheduled_date:c,created_at:u}=a;if(!s||!r||!i||!n||!o)return e.json({error:"Tous les champs sont requis"},400);if(s.trim().length<3||s.length>200)return e.json({error:"Titre invalide (3-200 caractères)"},400);if(r.trim().length<5||r.length>2e3)return e.json({error:"Description invalide (5-2000 caractères)"},400);if(!["low","medium","high","critical"].includes(o))return e.json({error:"Priorité invalide (low, medium, high, critical)"},400);const m=parseInt(n);if(isNaN(m)||m<=0)return e.json({error:"ID machine invalide"},400);const p=await e.env.DB.prepare("SELECT machine_type, model FROM machines WHERE id = ?").bind(n).first();if(!p)return e.json({error:"Machine non trouvée"},404);const f=u||new Date().toISOString().replace("T"," ").substring(0,19),h=async(v=0)=>{try{const E=await Hs(e.env.DB,p.machine_type);if(!(await e.env.DB.prepare(`
          INSERT INTO tickets (ticket_id, title, description, reporter_name, machine_id, priority, reported_by, assigned_to, scheduled_date, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?)
        `).bind(E,s,r,i,n,o,t.userId,l||null,c||null,f,f).run()).success)throw new Error("Insert failed");const w=await e.env.DB.prepare("SELECT * FROM tickets WHERE ticket_id = ?").bind(E).first();if(await e.env.DB.prepare(`
          INSERT INTO ticket_timeline (ticket_id, user_id, action, new_status, comment)
          VALUES (?, ?, 'Ticket créé', 'received', ?)
        `).bind(w.id,t.userId,r).run(),l)try{const D=(await e.env.DB.prepare("SELECT first_name FROM users WHERE id = ?").bind(l).first())?.first_name||"Technicien",{sendPushNotification:A}=await Promise.resolve().then(()=>V),_=await A(e.env,l,{title:`🔧 ${D}, nouveau ticket`,body:`${E}: ${s}`,icon:"/icon-192.png",data:{ticketId:w.id,ticket_id:E,action:"view_ticket",url:`/?ticket=${w.id}`}});await e.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, ?, ?)
            `).bind(l,w.id,_.success?"success":"failed",_.success?null:JSON.stringify(_)).run(),_.success?console.log(`✅ Push notification sent for new ticket ${E} to user ${l}`):console.log(`⚠️ Push notification failed for ticket ${E}:`,_)}catch(C){await e.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, 'failed', ?)
            `).bind(l,w.id,C.message||String(C)).run(),console.error("⚠️ Push notification failed (non-critical):",C)}return w}catch(E){if((E.message?.includes("UNIQUE")||E.message?.includes("constraint")||E.code==="SQLITE_CONSTRAINT")&&v<2)return await new Promise(w=>setTimeout(w,50*(v+1))),console.log(`⚠️ Ticket ID collision detected, retrying (attempt ${v+1}/3)...`),h(v+1);throw E}},g=await h();return e.json({ticket:g},201)}catch(t){return console.error("Create ticket error:",t),e.json({error:"Erreur lors de la création du ticket"},500)}});de.patch("/:id",async e=>{try{const t=e.get("user"),a=e.req.param("id"),s=await e.req.json(),r=await e.env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(a).first();if(!r)return e.json({error:"Ticket non trouvé"},404);if(t.role==="operator"&&r.reported_by!==t.userId)return e.json({error:"Vous ne pouvez modifier que vos propres tickets"},403);if(t.role==="operator"&&s.status&&s.status!==r.status)return e.json({error:"Les opérateurs ne peuvent pas changer le statut des tickets"},403);const i=[],n=[];s.title&&(i.push("title = ?"),n.push(s.title)),s.description&&(i.push("description = ?"),n.push(s.description)),s.status&&(i.push("status = ?"),n.push(s.status),s.status==="completed"&&i.push("completed_at = CURRENT_TIMESTAMP")),s.priority&&(i.push("priority = ?"),n.push(s.priority)),s.assigned_to!==void 0&&(i.push("assigned_to = ?"),n.push(s.assigned_to)),s.scheduled_date!==void 0&&(i.push("scheduled_date = ?"),n.push(s.scheduled_date)),i.push("updated_at = CURRENT_TIMESTAMP"),n.push(a),await e.env.DB.prepare(`UPDATE tickets SET ${i.join(", ")} WHERE id = ?`).bind(...n).run(),await e.env.DB.prepare(`
      INSERT INTO ticket_timeline (ticket_id, user_id, action, old_status, new_status, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(a,t.userId,s.status?"Changement de statut":"Mise à jour",s.status?r.status:null,s.status||null,s.comment||null).run();const o=await e.env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(a).first();if(s.assigned_to&&s.assigned_to!==r.assigned_to)try{const{sendPushNotification:l}=await Promise.resolve().then(()=>V);if(r.assigned_to&&r.assigned_to!==0)try{const p=(await e.env.DB.prepare("SELECT first_name FROM users WHERE id = ?").bind(r.assigned_to).first())?.first_name||"Technicien",f=await l(e.env,r.assigned_to,{title:`📤 ${p}, ticket retiré`,body:`${r.ticket_id} réassigné à quelqu'un d'autre`,icon:"/icon-192.png",data:{ticketId:a,ticket_id:r.ticket_id,action:"unassigned",url:`/?ticket=${a}`}});await e.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, ?, ?)
            `).bind(r.assigned_to,a,f.success?"success":"failed",f.success?null:JSON.stringify(f)).run(),f.success&&console.log(`✅ Push notification sent to old assignee ${r.assigned_to} for ticket ${a}`)}catch(m){console.error("⚠️ Failed to notify old assignee (non-critical):",m)}const u=(await e.env.DB.prepare("SELECT first_name FROM users WHERE id = ?").bind(s.assigned_to).first())?.first_name||"Technicien",d=await l(e.env,s.assigned_to,{title:`🔧 ${u}, ticket réassigné`,body:`${r.ticket_id}: ${r.title}`,icon:"/icon-192.png",data:{ticketId:a,ticket_id:r.ticket_id,action:"view_ticket",url:`/?ticket=${a}`}});await e.env.DB.prepare(`
          INSERT INTO push_logs (user_id, ticket_id, status, error_message)
          VALUES (?, ?, ?, ?)
        `).bind(s.assigned_to,a,d.success?"success":"failed",d.success?null:JSON.stringify(d)).run(),d.success?console.log(`✅ Push notification sent for ticket ${a} to user ${s.assigned_to}`):console.log(`⚠️ Push notification failed for ticket ${a}:`,d)}catch(l){try{await e.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, error_message)
            VALUES (?, ?, ?, ?)
          `).bind(s.assigned_to,a,"error",l.message||String(l)).run()}catch(c){console.error("Failed to log push error:",c)}console.error("⚠️ Push notification failed (non-critical):",l)}return e.json({ticket:o})}catch(t){return console.error("Update ticket error:",t),e.json({error:"Erreur lors de la mise à jour du ticket"},500)}});de.delete("/:id",async e=>{try{const t=e.get("user"),a=e.req.param("id"),s=await e.env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(a).first();if(!s)return e.json({error:"Ticket non trouvé"},404);if(t.role==="operator"&&s.reported_by!==t.userId)return e.json({error:"Vous ne pouvez supprimer que vos propres tickets"},403);const{results:r}=await e.env.DB.prepare("SELECT file_key FROM media WHERE ticket_id = ?").bind(a).all();if(r&&r.length>0)for(const n of r)try{await e.env.MEDIA_BUCKET.delete(n.file_key),console.log(`Fichier supprimé du R2: ${n.file_key}`)}catch(o){console.error(`Erreur lors de la suppression du fichier R2 ${n.file_key}:`,o)}return(await e.env.DB.prepare("DELETE FROM tickets WHERE id = ?").bind(a).run()).success?e.json({message:"Ticket supprimé avec succès",deletedFiles:r?.length||0}):e.json({error:"Erreur lors de la suppression du ticket"},500)}catch(t){return console.error("Delete ticket error:",t),e.json({error:"Erreur lors de la suppression du ticket"},500)}});const ue=new T;ue.get("/",async e=>{try{const t=e.req.query("status");let a="SELECT * FROM machines WHERE 1=1";const s=[];t&&(a+=" AND status = ?",s.push(t)),a+=" ORDER BY location, machine_type";const r=s.length>0?e.env.DB.prepare(a).bind(...s):e.env.DB.prepare(a),{results:i}=await r.all();return e.json({machines:i})}catch(t){return console.error("Get machines error:",t),e.json({error:"Erreur lors de la récupération des machines"},500)}});ue.get("/:id",async e=>{try{const t=e.req.param("id"),a=await e.env.DB.prepare("SELECT * FROM machines WHERE id = ?").bind(t).first();if(!a)return e.json({error:"Machine non trouvée"},404);const{results:s}=await e.env.DB.prepare("SELECT * FROM tickets WHERE machine_id = ? ORDER BY created_at DESC").bind(t).all();return e.json({machine:{...a,tickets:s}})}catch(t){return console.error("Get machine error:",t),e.json({error:"Erreur lors de la récupération de la machine"},500)}});ue.post("/",async e=>{try{const t=await e.req.json(),{machine_type:a,model:s,serial_number:r,location:i}=t;if(!a||!s||!r)return e.json({error:"Type, modèle et numéro de série requis"},400);if(a.trim().length<2||a.length>100)return e.json({error:"Type de machine invalide (2-100 caractères)"},400);if(s.trim().length<1||s.length>100)return e.json({error:"Modèle invalide (1-100 caractères)"},400);if(r.trim().length<1||r.length>50)return e.json({error:"Numéro de série invalide (1-50 caractères)"},400);if(i&&i.length>100)return e.json({error:"Localisation trop longue (max 100 caractères)"},400);if(!(await e.env.DB.prepare(`
      INSERT INTO machines (machine_type, model, serial_number, location, status)
      VALUES (?, ?, ?, ?, 'operational')
    `).bind(a.trim(),s.trim(),r.trim(),i?i.trim():null).run()).success)return e.json({error:"Erreur lors de la création de la machine"},500);const o=await e.env.DB.prepare("SELECT * FROM machines WHERE serial_number = ?").bind(r).first();return e.json({machine:o},201)}catch(t){return console.error("Create machine error:",t),e.json({error:"Erreur lors de la création de la machine"},500)}});ue.patch("/:id",async e=>{try{const t=e.req.param("id"),a=await e.req.json(),s=[],r=[];a.machine_type&&(s.push("machine_type = ?"),r.push(a.machine_type)),a.model&&(s.push("model = ?"),r.push(a.model)),a.serial_number&&(s.push("serial_number = ?"),r.push(a.serial_number)),a.location!==void 0&&(s.push("location = ?"),r.push(a.location)),a.status&&(s.push("status = ?"),r.push(a.status)),s.push("updated_at = CURRENT_TIMESTAMP"),r.push(t),await e.env.DB.prepare(`UPDATE machines SET ${s.join(", ")} WHERE id = ?`).bind(...r).run();const i=await e.env.DB.prepare("SELECT * FROM machines WHERE id = ?").bind(t).first();return e.json({machine:i})}catch(t){return console.error("Update machine error:",t),e.json({error:"Erreur lors de la mise à jour de la machine"},500)}});ue.delete("/:id",async e=>{try{const t=e.req.param("id"),{results:a}=await e.env.DB.prepare("SELECT COUNT(*) as count FROM tickets WHERE machine_id = ?").bind(t).all();return a[0]&&a[0].count>0?e.json({error:"Impossible de supprimer une machine avec des tickets associés"},400):(await e.env.DB.prepare("DELETE FROM machines WHERE id = ?").bind(t).run(),e.json({message:"Machine supprimée avec succès"}))}catch(t){return console.error("Delete machine error:",t),e.json({error:"Erreur lors de la suppression de la machine"},500)}});const b={NAME_MIN:2,NAME_MAX:100,DESCRIPTION_MAX:2e3,COMMENT_MAX:1e3,MESSAGE_MAX:500,SERIAL_NUMBER_MAX:50,EMAIL_MAX:254,PASSWORD_MIN:6,PASSWORD_MAX:128,FILE_SIZE_MAX:10*1024*1024};function qs(e){if(!e)return{valid:!1,error:"Fichier requis"};if(e.size>b.FILE_SIZE_MAX){const a=(e.size/1048576).toFixed(2),s=(b.FILE_SIZE_MAX/(1024*1024)).toFixed(0);return{valid:!1,error:`Fichier trop volumineux (${a}MB). Maximum: ${s}MB`}}return["image/jpeg","image/jpg","image/png","image/webp","image/gif","video/mp4","video/webm","video/quicktime","video/x-msvideo"].includes(e.type)?{valid:!0}:{valid:!1,error:`Type de fichier non autorisé: ${e.type}. Acceptés: images et vidéos`}}const we=new T;we.post("/upload",y,async e=>{try{const t=e.get("user"),a=await e.req.formData(),s=a.get("file"),r=a.get("ticket_id");if(!s)return e.json({error:"Aucun fichier fourni"},400);if(!r)return e.json({error:"ID du ticket requis"},400);const i=parseInt(r);if(isNaN(i)||i<=0)return e.json({error:"ID de ticket invalide"},400);const n=qs(s);if(!n.valid)return e.json({error:n.error},400);if(s.name.length>255)return e.json({error:"Nom de fichier trop long (max 255 caractères)"},400);if(!await e.env.DB.prepare("SELECT id FROM tickets WHERE id = ?").bind(i).first())return e.json({error:"Ticket non trouvé"},404);const l=Date.now(),c=Math.random().toString(36).substring(7),u=s.name.replace(/[^a-zA-Z0-9.-]/g,"_"),d=`tickets/${i}/${l}-${c}-${u}`,m=await s.arrayBuffer();await e.env.MEDIA_BUCKET.put(d,m,{httpMetadata:{contentType:s.type}});const p=`https://maintenance-media.your-account.r2.cloudflarestorage.com/${d}`;if(!(await e.env.DB.prepare(`
      INSERT INTO media (ticket_id, file_key, file_name, file_type, file_size, url, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(i,d,u,s.type,s.size,p,t.userId).run()).success)return e.json({error:"Erreur lors de l'enregistrement du média"},500);const h=await e.env.DB.prepare("SELECT * FROM media WHERE file_key = ?").bind(d).first();return e.json({media:h},201)}catch(t){return console.error("Upload error:",t),e.json({error:"Erreur lors de l'upload du fichier"},500)}});we.get("/:id",async e=>{try{const t=e.req.param("id"),a=await e.env.DB.prepare("SELECT * FROM media WHERE id = ?").bind(t).first();if(!a)return e.json({error:"Média non trouvé"},404);const s=await e.env.MEDIA_BUCKET.get(a.file_key);return s?new Response(s.body,{headers:{"Content-Type":a.file_type,"Content-Disposition":`inline; filename="${a.file_name}"`}}):e.json({error:"Fichier non trouvé dans le stockage"},404)}catch(t){return console.error("Get media error:",t),e.json({error:"Erreur lors de la récupération du fichier"},500)}});we.delete("/:id",y,async e=>{try{const t=e.get("user"),a=e.req.param("id"),s=await e.env.DB.prepare(`
      SELECT m.*, t.reported_by as ticket_creator
      FROM media m
      LEFT JOIN tickets t ON m.ticket_id = t.id
      WHERE m.id = ?
    `).bind(a).first();if(!s)return e.json({error:"Media non trouve"},404);if(!(t.role==="admin"||t.role==="supervisor"||t.role==="technician"||t.role==="operator"&&s.ticket_creator===t.userId))return e.json({error:"Vous n avez pas la permission de supprimer ce media"},403);try{await e.env.MEDIA_BUCKET.delete(s.file_key),console.log(`Media supprime du R2: ${s.file_key}`)}catch(i){console.error(`Erreur suppression R2 ${s.file_key}:`,i)}return await e.env.DB.prepare("DELETE FROM media WHERE id = ?").bind(a).run(),e.json({message:"Media supprime avec succes",fileDeleted:!0})}catch(t){return console.error("Delete media error:",t),e.json({error:"Erreur lors de la suppression du media"},500)}});we.get("/ticket/:ticketId",y,async e=>{try{const t=e.req.param("ticketId"),{results:a}=await e.env.DB.prepare("SELECT * FROM media WHERE ticket_id = ? ORDER BY created_at DESC").bind(t).all();return e.json({media:a})}catch(t){return console.error("Get ticket media error:",t),e.json({error:"Erreur lors de la récupération des médias"},500)}});const Ke=new T;Ke.post("/",y,async e=>{try{const t=await e.req.json(),{ticket_id:a,user_name:s,user_role:r,comment:i,created_at:n}=t;if(!a||!s||!i)return e.json({error:"Ticket ID, nom et commentaire requis"},400);const o=parseInt(a);if(isNaN(o)||o<=0)return e.json({error:"ID de ticket invalide"},400);const l=s.trim();if(l.length<b.NAME_MIN)return e.json({error:`Nom d'utilisateur trop court (min ${b.NAME_MIN} caractères)`},400);if(s.length>b.NAME_MAX)return e.json({error:`Nom d'utilisateur trop long (max ${b.NAME_MAX} caractères)`},400);const c=i.trim();if(c.length<1)return e.json({error:"Commentaire ne peut pas être vide"},400);if(i.length>b.COMMENT_MAX)return e.json({error:`Commentaire trop long (max ${b.COMMENT_MAX} caractères)`},400);if(!await e.env.DB.prepare("SELECT id FROM tickets WHERE id = ?").bind(a).first())return e.json({error:"Ticket non trouvé"},404);const d=n||new Date().toISOString().replace("T"," ").substring(0,19),m=await e.env.DB.prepare(`
      INSERT INTO ticket_comments (ticket_id, user_name, user_role, comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(o,l,r||null,c,d).run();if(!m.success)return e.json({error:"Erreur lors de l'ajout du commentaire"},500);const p=await e.env.DB.prepare("SELECT * FROM ticket_comments WHERE id = ?").bind(m.meta.last_row_id).first();return e.json({comment:p},201)}catch(t){return console.error("Add comment error:",t),e.json({error:"Erreur lors de l'ajout du commentaire"},500)}});Ke.get("/ticket/:ticketId",y,async e=>{try{const t=e.req.param("ticketId"),{results:a}=await e.env.DB.prepare("SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC").bind(t).all();return e.json({comments:a})}catch(t){return console.error("Get comments error:",t),e.json({error:"Erreur lors de la récupération des commentaires"},500)}});const Yt=new T;Yt.get("/",y,async e=>{try{const t=e.req.query("q");if(!t||t.trim().length<2)return e.json({results:[]});const a="%"+t.trim()+"%",s=t.trim().toLowerCase();let r=null,i=null,n=!1,o=!1,l=!1;(s==="commentaire"||s==="commentaires"||s==="note"||s==="notes"||s==="comment"||s==="comments")&&(n=!0,l=!0),(s==="retard"||s==="retards"||s==="overdue")&&(o=!0,l=!0),s==="nouveau"||s==="new"?(r="new",l=!0):s==="progress"||s==="cours"||s==="en cours"?(r="in_progress",l=!0):(s==="complet"||s==="complete"||s==="terminé")&&(r="completed",l=!0),s==="urgent"||s==="critique"||s==="critical"?(i="critical",l=!0):s==="haute"||s==="high"?(i="high",l=!0):s==="moyenne"||s==="medium"?(i="medium",l=!0):(s==="basse"||s==="low"||s==="faible")&&(i="low",l=!0);let c,u;n?(c=`
        SELECT DISTINCT
          t.*,
          m.machine_type, m.model, m.serial_number, m.location,
          u1.first_name as reporter_name,
          u2.first_name as assignee_name,
          (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comments_count
        FROM tickets t
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN users u1 ON t.reported_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE 
          t.status != 'archived' AND
          EXISTS (SELECT 1 FROM ticket_comments tc WHERE tc.ticket_id = t.id)
        ORDER BY t.created_at DESC
        LIMIT 50
      `,u=[]):o?(c=`
        SELECT DISTINCT
          t.*,
          m.machine_type, m.model, m.serial_number, m.location,
          u1.first_name as reporter_name,
          u2.first_name as assignee_name,
          (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comments_count
        FROM tickets t
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN users u1 ON t.reported_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE 
          t.status NOT IN ('completed', 'cancelled', 'archived') AND
          t.scheduled_date IS NOT NULL AND
          t.scheduled_date != 'null' AND
          t.scheduled_date < datetime('now')
        ORDER BY t.scheduled_date ASC
        LIMIT 50
      `,u=[]):l&&(r||i)?(c=`
        SELECT DISTINCT
          t.*,
          m.machine_type, m.model, m.serial_number, m.location,
          u1.first_name as reporter_name,
          u2.first_name as assignee_name,
          (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comments_count
        FROM tickets t
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN users u1 ON t.reported_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE t.status != 'archived'
      `,u=[],r&&(c+=" AND t.status = ?",u.push(r)),i&&(c+=" AND t.priority = ?",u.push(i)),c+=" ORDER BY t.created_at DESC LIMIT 50"):(c=`
        SELECT DISTINCT
          t.*,
          m.machine_type, m.model, m.serial_number, m.location,
          u1.first_name as reporter_name,
          u2.first_name as assignee_name,
          (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comments_count
        FROM tickets t
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN users u1 ON t.reported_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        LEFT JOIN ticket_comments c ON t.id = c.ticket_id
        WHERE 
          t.status != 'archived' AND (
            t.ticket_id LIKE ? OR
            t.title LIKE ? OR
            t.description LIKE ? OR
            m.machine_type LIKE ? OR
            m.model LIKE ? OR
            m.serial_number LIKE ? OR
            m.location LIKE ? OR
            u2.first_name LIKE ? OR
            c.comment LIKE ? OR
            c.user_name LIKE ?
          )
        ORDER BY t.created_at DESC
        LIMIT 50
      `,u=[a,a,a,a,a,a,a,a,a,a]);const{results:d}=await e.env.DB.prepare(c).bind(...u).all();let m=[],p=[];if(l&&d.length>0){m=d;const h=await e.env.DB.prepare(`
        SELECT DISTINCT
          t.*,
          m.machine_type, m.model, m.serial_number, m.location,
          u1.first_name as reporter_name,
          u2.first_name as assignee_name,
          (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comments_count
        FROM tickets t
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN users u1 ON t.reported_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        LEFT JOIN ticket_comments c ON t.id = c.ticket_id
        WHERE 
          t.status != 'archived' AND (
            t.ticket_id LIKE ? OR
            t.title LIKE ? OR
            t.description LIKE ? OR
            c.comment LIKE ?
          )
        ORDER BY t.created_at DESC
        LIMIT 20
      `).bind(a,a,a,a).all(),g=new Set(m.map(v=>v.id));p=h.results.filter(v=>!g.has(v.id))}else l||(m=d);return e.json({results:d,keywordResults:m,textResults:p,isKeywordSearch:l,keyword:l?s:null})}catch(t){return console.error("Search error:",t),e.json({error:"Erreur lors de la recherche"},500)}});const q=new T;q.get("/team",Vt,async e=>{try{const{results:t}=await e.env.DB.prepare(`
      SELECT id, email, full_name, first_name, last_name, role, created_at, updated_at, last_login
      FROM users
      WHERE id != 0
      ORDER BY role DESC, full_name ASC
    `).all();return e.json({users:t})}catch(t){return console.error("Get team users error:",t),e.json({error:"Erreur lors de la récupération de l equipe"},500)}});q.use("/*",Cs);q.get("/",async e=>{try{const{results:t}=await e.env.DB.prepare(`
      SELECT
        id,
        email,
        full_name,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        last_login,
        CASE
          WHEN password_hash LIKE 'v2:%' THEN 'PBKDF2'
          ELSE 'SHA-256 (Legacy)'
        END as hash_type
      FROM users
      WHERE (is_super_admin = 0 OR is_super_admin IS NULL) AND id != 0
      ORDER BY full_name ASC
    `).all();return e.json({users:t})}catch(t){return console.error("Get users error:",t),e.json({error:"Erreur lors de la récupération des utilisateurs"},500)}});q.get("/:id",async e=>{try{const t=e.req.param("id"),a=await e.env.DB.prepare(`
      SELECT
        id,
        email,
        full_name,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        last_login,
        CASE
          WHEN password_hash LIKE 'v2:%' THEN 'PBKDF2'
          ELSE 'SHA-256 (Legacy)'
        END as hash_type
      FROM users
      WHERE id = ?
    `).bind(t).first();return a?e.json({user:a}):e.json({error:"Utilisateur non trouvé"},404)}catch(t){return console.error("Get user error:",t),e.json({error:"Erreur lors de la récupération de l'utilisateur"},500)}});q.post("/",async e=>{try{const t=e.get("user"),a=await e.req.json(),{email:s,password:r,first_name:i,last_name:n,role:o}=a;if(!s||!r||!i||!o)return e.json({error:"Email, mot de passe, prénom et rôle requis"},400);const c=(n?`${i} ${n}`:i).trim(),u=i.trim(),d=n?n.trim():"";if(u.length<b.NAME_MIN)return e.json({error:`Prénom trop court (min ${b.NAME_MIN} caractères)`},400);if(i.length>b.NAME_MAX)return e.json({error:`Prénom trop long (max ${b.NAME_MAX} caractères)`},400);const m=s.trim().toLowerCase();if(m.length===0)return e.json({error:"Email requis"},400);if(s.length>b.EMAIL_MAX)return e.json({error:`Email trop long (max ${b.EMAIL_MAX} caractères)`},400);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m))return e.json({error:"Format email invalide"},400);if(!["admin","director","supervisor","coordinator","planner","senior_technician","technician","team_leader","furnace_operator","operator","safety_officer","quality_inspector","storekeeper","viewer"].includes(o))return e.json({error:"Rôle invalide"},400);if(t.role==="supervisor"&&o==="admin")return e.json({error:"Les superviseurs ne peuvent pas créer d'administrateurs"},403);if(r.length<b.PASSWORD_MIN)return e.json({error:`Le mot de passe doit contenir au moins ${b.PASSWORD_MIN} caractères`},400);if(r.length>b.PASSWORD_MAX)return e.json({error:`Le mot de passe trop long (max ${b.PASSWORD_MAX} caractères)`},400);if(await e.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(m).first())return e.json({error:"Cet email est déjà utilisé"},409);const g=await Ae(r);if(!(await e.env.DB.prepare("INSERT INTO users (email, password_hash, full_name, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)").bind(m,g,c,u,d,o).run()).success)return e.json({error:"Erreur lors de la création de l'utilisateur"},500);const E=await e.env.DB.prepare("SELECT id, email, full_name, first_name, last_name, role, created_at, updated_at, last_login FROM users WHERE email = ?").bind(m).first();return console.log(`Admin ${t.email} created user ${m} with role ${o}`),e.json({message:"Utilisateur créé avec succès",user:E},201)}catch(t){return console.error("Create user error:",t),e.json({error:"Erreur lors de la création de l'utilisateur"},500)}});q.put("/:id",async e=>{try{const t=e.get("user"),a=e.req.param("id"),s=await e.req.json(),{email:r,first_name:i,last_name:n,role:o,password:l}=s;console.log("🔍 UPDATE USER - Start:",{currentUserId:t.userId,currentUserRole:t.role,targetUserId:a,requestedRole:o});const c=await e.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(a).first();if(!c)return console.log("❌ User not found:",a),e.json({error:"Utilisateur non trouvé"},404);if(c.is_super_admin===1)return console.log("❌ Cannot modify super admin"),e.json({error:"Action non autorisée"},403);if(console.log("✅ Existing user:",{id:c.id,email:c.email,role:c.role}),t.role==="supervisor"&&c.role==="admin")return console.log("❌ Supervisor cannot modify admin"),e.json({error:"Les superviseurs ne peuvent pas modifier les administrateurs"},403);if(t.role==="supervisor"&&o==="admin")return console.log("❌ Supervisor cannot promote to admin"),e.json({error:"Les superviseurs ne peuvent pas créer d'administrateurs"},403);const u=t.userId===parseInt(a)&&o&&o!=="admin"&&t.role==="admin";if(console.log("🔍 Self-demotion check:",{currentUserId:t.userId,targetUserId:parseInt(a),areEqual:t.userId===parseInt(a),requestedRole:o,currentRole:t.role,wouldTrigger:u}),u)return console.log("❌ Admin cannot demote themselves"),e.json({error:"Vous ne pouvez pas retirer vos propres droits administrateur"},403);if(t.userId===parseInt(a)&&o&&o!=="supervisor"&&t.role==="supervisor")return console.log("❌ Supervisor cannot demote themselves"),e.json({error:"Vous ne pouvez pas retirer vos propres droits de superviseur"},403);if(console.log("✅ All permission checks passed"),r){const g=r.trim().toLowerCase();if(g.length===0)return e.json({error:"Email ne peut pas être vide"},400);if(r.length>b.EMAIL_MAX)return e.json({error:`Email trop long (max ${b.EMAIL_MAX} caractères)`},400);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g))return e.json({error:"Format email invalide"},400);if(await e.env.DB.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(g,a).first())return e.json({error:"Cet email est déjà utilisé par un autre utilisateur"},409)}if(o&&!["admin","director","supervisor","coordinator","planner","senior_technician","technician","team_leader","furnace_operator","operator","safety_officer","quality_inspector","storekeeper","viewer"].includes(o))return e.json({error:"Rôle invalide"},400);if(i!=null){const g=i.trim();if(g.length>0){if(g.length<b.NAME_MIN)return e.json({error:`Prénom trop court (min ${b.NAME_MIN} caractères)`},400);if(i.length>b.NAME_MAX)return e.json({error:`Prénom trop long (max ${b.NAME_MAX} caractères)`},400)}}if(n&&n.length>b.NAME_MAX)return e.json({error:`Nom trop long (max ${b.NAME_MAX} caractères)`},400);if(l){if(l.length<b.PASSWORD_MIN)return e.json({error:`Le mot de passe doit contenir au moins ${b.PASSWORD_MIN} caractères`},400);if(l.length>b.PASSWORD_MAX)return e.json({error:`Le mot de passe trop long (max ${b.PASSWORD_MAX} caractères)`},400)}const d=[],m=[];if(r&&(d.push("email = ?"),m.push(r.trim().toLowerCase())),i!=null){const g=i.trim(),v=n?n.trim():"";if(g.length>0){const E=v?`${g} ${v}`:g;d.push("first_name = ?"),m.push(g),d.push("last_name = ?"),m.push(v),d.push("full_name = ?"),m.push(E)}}if(o&&(d.push("role = ?"),m.push(o)),l){const g=await Ae(l);d.push("password_hash = ?"),m.push(g)}if(d.length===0)return e.json({error:"Aucune modification fournie"},400);d.push("updated_at = CURRENT_TIMESTAMP"),m.push(a),console.log("🔍 SQL Update:",{query:`UPDATE users SET ${d.join(", ")} WHERE id = ?`,params:m});const p=await e.env.DB.prepare(`UPDATE users SET ${d.join(", ")} WHERE id = ?`).bind(...m).run();if(console.log("🔍 Update result:",p),!p.success)return console.log("❌ Update failed:",p),e.json({error:"Erreur lors de la mise à jour de l'utilisateur"},500);const f=await e.env.DB.prepare("SELECT id, email, full_name, first_name, last_name, role, created_at, updated_at, last_login FROM users WHERE id = ?").bind(a).first(),h=[];if(r&&h.push(`email: ${c.email} → ${r}`),i!=null&&i.trim().length>0){const g=n?`${i.trim()} ${n.trim()}`:i.trim();h.push(`name: ${c.full_name} → ${g}`)}return o&&h.push(`role: ${c.role} → ${o}`),l&&h.push("password changed"),console.log(`Admin ${t.email} updated user ${c.email}: ${h.join(", ")}`),e.json({message:"Utilisateur mis à jour avec succès",user:f})}catch(t){return console.error("❌ Update user exception:",t),console.error("❌ Error details:",{message:t instanceof Error?t.message:String(t),stack:t instanceof Error?t.stack:void 0}),e.json({error:"Erreur lors de la mise à jour de l'utilisateur"},500)}});q.delete("/:id",async e=>{try{const t=e.get("user"),a=e.req.param("id"),s=await e.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(a).first();if(!s)return e.json({error:"Utilisateur non trouvé"},404);if(s.is_super_admin===1)return e.json({error:"Action non autorisée"},403);if(t.role==="supervisor"&&s.role==="admin")return e.json({error:"Les superviseurs ne peuvent pas supprimer les administrateurs"},403);if(t.userId===parseInt(a))return e.json({error:"Vous ne pouvez pas supprimer votre propre compte"},403);const r=await e.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = ?").bind("admin").first();if(s.role==="admin"&&r.count<=1)return e.json({error:"Impossible de supprimer le dernier administrateur du système"},403);const i=await e.env.DB.prepare("SELECT COUNT(*) as count FROM tickets WHERE reported_by = ?").bind(a).first();return i&&i.count>0?e.json({error:`Impossible de supprimer cet utilisateur car il a créé ${i.count} ticket(s). Supprimez d'abord ses tickets ou réassignez-les.`},400):(await e.env.DB.prepare("UPDATE tickets SET assigned_to = NULL, updated_at = CURRENT_TIMESTAMP WHERE assigned_to = ?").bind(a).run(),await e.env.DB.prepare("UPDATE media SET uploaded_by = NULL WHERE uploaded_by = ?").bind(a).run(),await e.env.DB.prepare("UPDATE ticket_timeline SET user_id = NULL WHERE user_id = ?").bind(a).run(),(await e.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(a).run()).success?(console.log(`Admin ${t.email} deleted user ${s.email} (role: ${s.role})`),e.json({message:"Utilisateur supprimé avec succès",deleted_user:{id:s.id,email:s.email,full_name:s.full_name,role:s.role}})):e.json({error:"Erreur lors de la suppression de l'utilisateur"},500))}catch(t){return console.error("Delete user error:",t),e.json({error:"Erreur lors de la suppression de l'utilisateur"},500)}});q.post("/:id/reset-password",async e=>{try{const t=e.get("user"),a=e.req.param("id"),s=await e.req.json(),{new_password:r}=s;if(!r)return e.json({error:"Le nouveau mot de passe est requis"},400);if(r.length<b.PASSWORD_MIN)return e.json({error:`Le mot de passe doit contenir au moins ${b.PASSWORD_MIN} caractères`},400);if(r.length>b.PASSWORD_MAX)return e.json({error:`Le mot de passe trop long (max ${b.PASSWORD_MAX} caractères)`},400);const i=await e.env.DB.prepare("SELECT email, is_super_admin FROM users WHERE id = ?").bind(a).first();if(!i)return e.json({error:"Utilisateur non trouvé"},404);if(i.is_super_admin===1)return e.json({error:"Action non autorisée"},403);const n=await Ae(r);return(await e.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(n,a).run()).success?(console.log(`Admin ${t.email} reset password for user ${i.email}`),e.json({message:"Mot de passe réinitialisé avec succès"})):e.json({error:"Erreur lors de la réinitialisation du mot de passe"},500)}catch(t){return console.error("Reset password error:",t),e.json({error:"Erreur lors de la réinitialisation du mot de passe"},500)}});const Q=new T;Q.get("/",async e=>{try{const{results:t}=await e.env.DB.prepare(`
      SELECT
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_system,
        r.created_at,
        r.updated_at,
        COUNT(rp.permission_id) as permissions_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.name ASC
    `).all();return e.json({roles:t})}catch(t){return console.error("Get roles error:",t),e.json({error:"Erreur lors de la récupération des rôles"},500)}});Q.get("/:id",async e=>{try{const t=e.req.param("id"),a=await e.env.DB.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(t).first();if(!a)return e.json({error:"Rôle non trouvé"},404);const{results:s}=await e.env.DB.prepare(`
      SELECT
        p.id,
        p.resource,
        p.action,
        p.scope,
        p.display_name,
        p.description
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action, p.scope
    `).bind(t).all();return e.json({role:{...a,permissions:s}})}catch(t){return console.error("Get role error:",t),e.json({error:"Erreur lors de la récupération du rôle"},500)}});Q.get("/permissions/all",async e=>{try{const{results:t}=await e.env.DB.prepare(`
      SELECT
        id,
        resource,
        action,
        scope,
        display_name,
        description
      FROM permissions
      ORDER BY resource, action, scope
    `).all(),a={};for(const s of t){const r=s;a[r.resource]||(a[r.resource]=[]),a[r.resource].push(r)}return e.json({permissions:t,grouped:a})}catch(t){return console.error("Get permissions error:",t),e.json({error:"Erreur lors de la récupération des permissions"},500)}});Q.post("/",async e=>{try{const t=await e.req.json(),{name:a,display_name:s,description:r,permission_ids:i}=t;if(!a||!s)return e.json({error:"Nom et nom d affichage requis"},400);const n=a.trim(),o=["admin","supervisor","technician","operator","director","coordinator","planner","senior_technician","team_leader","furnace_operator","safety_officer","quality_inspector","storekeeper","viewer"];if(!o.includes(n))return e.json({error:"Seuls les rôles système prédéfinis peuvent être créés",reason:"Application avec rôles système spécialisés pour l'industrie",details:"Les 14 rôles système couvrent tous les besoins typiques. Les rôles personnalisés ne sont pas supportés pour éviter des dysfonctionnements UI.",documentation:"Voir ROLES_INDUSTRIE_RECOMMANDES.md pour détails des rôles",system_roles:o,status:"system_roles_only"},403);if(n.length<b.NAME_MIN)return e.json({error:`Nom trop court (min ${b.NAME_MIN} caractères)`},400);if(a.length>b.NAME_MAX)return e.json({error:`Nom trop long (max ${b.NAME_MAX} caractères)`},400);if(!/^[a-zA-Z0-9_-]+$/.test(n))return e.json({error:"Nom invalide. Utilisez uniquement des lettres, chiffres, tirets et underscores"},400);const l=s.trim();if(l.length<b.NAME_MIN)return e.json({error:`Nom d'affichage trop court (min ${b.NAME_MIN} caractères)`},400);if(s.length>b.NAME_MAX)return e.json({error:`Nom d'affichage trop long (max ${b.NAME_MAX} caractères)`},400);if(r&&r.length>b.DESCRIPTION_MAX)return e.json({error:`Description trop longue (max ${b.DESCRIPTION_MAX} caractères)`},400);if(i&&!Array.isArray(i))return e.json({error:"permission_ids doit être un tableau"},400);if(i&&i.some(p=>typeof p!="number"||p<=0))return e.json({error:"IDs de permissions invalides"},400);if(await e.env.DB.prepare("SELECT id FROM roles WHERE name = ?").bind(n).first())return e.json({error:"Ce nom de rôle existe déjà"},409);const u=await e.env.DB.prepare(`
      INSERT INTO roles (name, display_name, description, is_system)
      VALUES (?, ?, ?, 0)
    `).bind(n,l,r?r.trim():null).run();if(!u.success)return e.json({error:"Erreur lors de la création du rôle"},500);const d=u.meta.last_row_id;if(i&&Array.isArray(i)&&i.length>0)for(const p of i)await e.env.DB.prepare(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `).bind(d,p).run();Ve();const m=await e.env.DB.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(d).first();return e.json({message:"Rôle créé avec succès",role:m},201)}catch(t){return console.error("Create role error:",t),e.json({error:"Erreur lors de la création du rôle"},500)}});Q.put("/:id",async e=>{try{const t=e.req.param("id"),a=await e.req.json(),{display_name:s,description:r,permission_ids:i}=a;if(s){if(s.trim().length<b.NAME_MIN)return e.json({error:`Nom d'affichage trop court (min ${b.NAME_MIN} caractères)`},400);if(s.length>b.NAME_MAX)return e.json({error:`Nom d'affichage trop long (max ${b.NAME_MAX} caractères)`},400)}if(r&&r.length>b.DESCRIPTION_MAX)return e.json({error:`Description trop longue (max ${b.DESCRIPTION_MAX} caractères)`},400);if(i&&!Array.isArray(i))return e.json({error:"permission_ids doit être un tableau"},400);if(i&&i.some(u=>typeof u!="number"||u<=0))return e.json({error:"IDs de permissions invalides"},400);const n=await e.env.DB.prepare("SELECT * FROM roles WHERE id = ?").bind(t).first();if(!n)return e.json({error:"Rôle non trouvé"},404);const o=s?s.trim():n.display_name,l=r?r.trim():n.description;if(n.is_system===1?await e.env.DB.prepare(`
        UPDATE roles
        SET display_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(o,l,t).run():await e.env.DB.prepare(`
        UPDATE roles
        SET display_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(o,l,t).run(),i&&Array.isArray(i)){await e.env.DB.prepare(`
        DELETE FROM role_permissions WHERE role_id = ?
      `).bind(t).run();for(const u of i)await e.env.DB.prepare(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `).bind(t,u).run()}Ve();const c=await e.env.DB.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(t).first();return e.json({message:"Rôle mis à jour avec succès",role:c})}catch(t){return console.error("Update role error:",t),e.json({error:"Erreur lors de la mise à jour du rôle"},500)}});Q.delete("/:id",async e=>{try{const t=e.req.param("id"),a=await e.env.DB.prepare("SELECT * FROM roles WHERE id = ?").bind(t).first();if(!a)return e.json({error:"Rôle non trouvé"},404);if(a.is_system===1)return e.json({error:"Impossible de supprimer un rôle système"},403);const{results:s}=await e.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = ?").bind(a.name).all();return s[0]&&s[0].count>0?e.json({error:`Impossible de supprimer ce rôle car ${s[0].count} utilisateur(s) l'utilisent`},400):(await e.env.DB.prepare("DELETE FROM roles WHERE id = ?").bind(t).run(),Ve(),e.json({message:"Rôle supprimé avec succès",deleted_role:a}))}catch(t){return console.error("Delete role error:",t),e.json({error:"Erreur lors de la suppression du rôle"},500)}});const K=new T,Oe=500*1024,je=["image/png","image/jpeg","image/jpg","image/webp"],$s=200,zs=80;K.post("/upload-logo",y,ce,async e=>{try{const t=e.get("user"),s=(await e.req.formData()).get("logo");if(!s)return e.json({error:"Aucun fichier fourni"},400);if(!je.includes(s.type))return e.json({error:`Type de fichier non autorisé. Formats acceptés: ${je.join(", ")}`},400);if(s.size>Oe)return e.json({error:`Fichier trop volumineux (max ${Oe/1024} KB)`},400);const r=Date.now(),i=Math.random().toString(36).substring(7),n=s.name.split(".").pop()||"png",o=`logos/company-logo-${r}-${i}.${n}`,l=await s.arrayBuffer();await e.env.MEDIA_BUCKET.put(o,l,{httpMetadata:{contentType:s.type}}),console.log(`✅ Logo uploadé dans R2: ${o}`);const c=`/api/settings/logo?t=${r}`;return await e.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'company_logo_key'
    `).first()?await e.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'company_logo_key'
      `).bind(o).run():await e.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('company_logo_key', ?)
      `).bind(o).run(),console.log(`✅ Logo enregistré dans DB: ${o}`),e.json({message:"Logo uploadé avec succès",logoUrl:c,fileKey:o,recommendations:{width:$s,height:zs,formats:je,maxSize:`${Oe/1024} KB`}})}catch(t){return console.error("Upload logo error:",t),e.json({error:"Erreur lors de l'upload du logo"},500)}});K.get("/logo",async e=>{try{const t=await e.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_logo_key'
    `).first();if(!t||!t.setting_value)return e.redirect("/static/logo-igp.png");const a=t.setting_value,s=await e.env.MEDIA_BUCKET.get(a);return s?new Response(s.body,{headers:{"Content-Type":s.httpMetadata?.contentType||"image/png","Cache-Control":"public, max-age=3600"}}):(console.error(`Logo non trouvé dans R2: ${a}`),e.redirect("/static/logo-igp.png"))}catch(t){return console.error("Get logo error:",t),e.redirect("/static/logo-igp.png")}});K.delete("/logo",y,ce,async e=>{try{const t=e.get("user"),a=await e.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_logo_key'
    `).first();if(a&&a.setting_value)try{await e.env.MEDIA_BUCKET.delete(a.setting_value),console.log(`✅ Logo supprimé du R2: ${a.setting_value}`)}catch(s){console.error(`Erreur suppression R2 ${a.setting_value}:`,s)}return await e.env.DB.prepare(`
      DELETE FROM system_settings WHERE setting_key = 'company_logo_key'
    `).run(),e.json({message:"Logo supprimé avec succès. Le logo par défaut sera utilisé.",defaultLogo:"/static/logo-igp.png"})}catch(t){return console.error("Delete logo error:",t),e.json({error:"Erreur lors de la suppression du logo"},500)}});K.put("/title",y,ce,async e=>{try{const t=e.get("user"),a=await e.req.json(),{value:s}=a;if(!s||typeof s!="string")return e.json({error:"Titre invalide"},400);const r=s.trim();return r.length===0?e.json({error:"Le titre ne peut pas être vide"},400):r.length>100?e.json({error:"Le titre ne peut pas dépasser 100 caractères"},400):(await e.env.DB.prepare(`
      UPDATE system_settings
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = 'company_title'
    `).bind(r).run(),console.log(`✅ Titre modifié par user ${t.userId}: "${r}"`),e.json({message:"Titre mis à jour avec succès",setting_value:r}))}catch(t){return console.error("Update title error:",t),e.json({error:"Erreur lors de la mise à jour du titre"},500)}});K.put("/subtitle",y,ce,async e=>{try{const t=e.get("user"),a=await e.req.json(),{value:s}=a;if(!s||typeof s!="string")return e.json({error:"Sous-titre invalide"},400);const r=s.trim();return r.length===0?e.json({error:"Le sous-titre ne peut pas être vide"},400):r.length>150?e.json({error:"Le sous-titre ne peut pas dépasser 150 caractères"},400):(await e.env.DB.prepare(`
      UPDATE system_settings
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = 'company_subtitle'
    `).bind(r).run(),console.log(`✅ Sous-titre modifié par user ${t.userId}: "${r}"`),e.json({message:"Sous-titre mis à jour avec succès",setting_value:r}))}catch(t){return console.error("Update subtitle error:",t),e.json({error:"Erreur lors de la mise à jour du sous-titre"},500)}});K.get("/:key",async e=>{try{const t=e.req.param("key"),a=await e.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = ?
    `).bind(t).first();return a?e.json({setting_value:a.setting_value}):e.json({error:"Paramètre non trouvé"},404)}catch(t){return console.error("Get setting error:",t),e.json({error:"Erreur serveur"},500)}});K.put("/:key",ce,async e=>{try{const t=e.req.param("key"),a=await e.req.json(),{value:s}=a;return s===void 0?e.json({error:"Valeur requise"},400):(await e.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = ?
    `).bind(t).first()?await e.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `).bind(s,t).run():await e.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES (?, ?)
      `).bind(t,s).run(),e.json({message:"Paramètre mis à jour avec succès",setting_value:s}))}catch(t){return console.error("Update setting error:",t),e.json({error:"Erreur serveur"},500)}});async function Jt(e){try{const t=await e.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'timezone_offset_hours'
    `).first();return t?parseInt(t.setting_value):0}catch(t){return console.error("Erreur récupération timezone_offset_hours:",t),0}}function oe(e,t){const a=typeof e=="string"?new Date(e):e;return new Date(a.getTime()+t*60*60*1e3).toISOString().replace("T"," ").substring(0,19)}const Ge=new T,rt="https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc";Ge.post("/check-overdue-tickets",async e=>{try{const t=await Jt(e.env.DB),a=new Date,s=new Date(a.getTime()-1440*60*1e3),r=await e.env.DB.prepare(`
      SELECT
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        m.machine_type,
        m.model,
        t.scheduled_date,
        t.assigned_to,
        t.created_at,
        u.first_name as assignee_name,
        reporter.first_name as reporter_name
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users reporter ON t.reported_by = reporter.id
      WHERE t.assigned_to IS NOT NULL
        AND t.scheduled_date IS NOT NULL
        AND t.scheduled_date != 'null'
        AND t.scheduled_date != ''
        AND t.status IN ('received', 'diagnostic')
        AND datetime(t.scheduled_date) < datetime('now')
      ORDER BY t.scheduled_date ASC
    `).all();if(!r.results||r.results.length===0)return e.json({message:"Aucun ticket planifié expiré trouvé",checked_at:a.toISOString()});const i=[],n=[];for(const o of r.results)try{if(await e.env.DB.prepare(`
          SELECT id, sent_at, scheduled_date_notified
          FROM webhook_notifications
          WHERE ticket_id = ?
            AND scheduled_date_notified = ?
            AND notification_type = 'overdue_scheduled'
          ORDER BY sent_at DESC
          LIMIT 1
        `).bind(o.id,o.scheduled_date).first())continue;const c=new Date(o.scheduled_date.replace(" ","T")+"Z"),u=a.getTime()-c.getTime(),d=Math.floor(u/(1e3*60*60*24)),m=Math.floor(u%(1e3*60*60*24)/(1e3*60*60)),p=Math.floor(u%(1e3*60*60)/(1e3*60)),f={ticket_id:o.ticket_id,title:o.title,description:o.description,priority:o.priority,status:o.status,machine:`${o.machine_type} ${o.model}`,scheduled_date:oe(o.scheduled_date,t),assigned_to:o.assigned_to===0?"Équipe complète":o.assignee_name||`Technicien #${o.assigned_to}`,reporter:o.reporter_name||"N/A",created_at:oe(o.created_at,t),overdue_days:d,overdue_hours:m,overdue_minutes:p,overdue_text:d>0?`${d} jour(s) ${m}h ${p}min`:`${m}h ${p}min`,notification_sent_at:oe(a,t)},h=await fetch(rt,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(f)}),g=h.status;let v="";try{v=await h.text()}catch{v="Could not read response body"}await e.env.DB.prepare(`
          INSERT INTO webhook_notifications
          (ticket_id, notification_type, webhook_url, sent_at, response_status, response_body, scheduled_date_notified)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(o.id,"overdue_scheduled",rt,a.toISOString(),g,v.substring(0,1e3),o.scheduled_date).run(),i.push({ticket_id:o.ticket_id,title:o.title,overdue_text:f.overdue_text,webhook_status:g,sent_at:a.toISOString()})}catch(l){console.error(`Erreur notification webhook ticket ${o.ticket_id}:`,l),n.push({ticket_id:o.ticket_id,error:l instanceof Error?l.message:"Erreur inconnue"})}return e.json({message:"Vérification terminée",total_overdue:r.results.length,notifications_sent:i.length,notifications:i,errors:n.length>0?n:void 0,checked_at:a.toISOString()})}catch(t){return console.error("Erreur vérification tickets expirés:",t),e.json({error:"Erreur serveur lors de la vérification",details:t instanceof Error?t.message:"Erreur inconnue"},500)}});Ge.get("/notification-history/:ticketId",async e=>{try{const t=e.req.param("ticketId"),a=await e.env.DB.prepare(`
      SELECT
        wn.id,
        wn.notification_type,
        wn.sent_at,
        wn.response_status,
        wn.response_body,
        t.ticket_id,
        t.title
      FROM webhook_notifications wn
      INNER JOIN tickets t ON wn.ticket_id = t.id
      WHERE t.ticket_id = ?
      ORDER BY wn.sent_at DESC
    `).bind(t).all();return e.json({ticket_id:t,notifications:a.results||[]})}catch(t){return console.error("Erreur récupération historique notifications:",t),e.json({error:"Erreur serveur"},500)}});var ie="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",ge=typeof Uint8Array>"u"?[]:new Uint8Array(256);for(var _e=0;_e<ie.length;_e++)ge[ie.charCodeAt(_e)]=_e;var Ws=function(e){var t=new Uint8Array(e),a,s=t.length,r="";for(a=0;a<s;a+=3)r+=ie[t[a]>>2],r+=ie[(t[a]&3)<<4|t[a+1]>>4],r+=ie[(t[a+1]&15)<<2|t[a+2]>>6],r+=ie[t[a+2]&63];return s%3===2?r=r.substring(0,r.length-1)+"=":s%3===1&&(r=r.substring(0,r.length-2)+"=="),r},Vs=function(e){var t=e.length*.75,a=e.length,s,r=0,i,n,o,l;e[e.length-1]==="="&&(t--,e[e.length-2]==="="&&t--);var c=new ArrayBuffer(t),u=new Uint8Array(c);for(s=0;s<a;s+=4)i=ge[e.charCodeAt(s)],n=ge[e.charCodeAt(s+1)],o=ge[e.charCodeAt(s+2)],l=ge[e.charCodeAt(s+3)],u[r++]=i<<2|n>>4,u[r++]=(n&15)<<4|o>>2,u[r++]=(o&3)<<6|l&63;return c};function ye(e){return Vs(e.replace(/-/g,"+").replace(/_/g,"/"))}function W(e){return Ws(e).replace(/\//g,"_").replace(/\+/g,"-").replace(/=+$/,"")}function it(e){return W(new TextEncoder().encode(JSON.stringify(e)))}const z=globalThis.crypto?globalThis.crypto:await import("node:crypto"),P={getRandomValues:e=>"webcrypto"in z?z.webcrypto.getRandomValues(e):z.getRandomValues(e),subtle:"webcrypto"in z?z.webcrypto.subtle:z.subtle},Ks="webcrypto"in z?z.webcrypto.CryptoKey:globalThis.CryptoKey;async function Gs(e){const t=ye(e.keys.p256dh),a={kty:"EC",crv:"P-256",x:W(t.slice(1,33)),y:W(t.slice(33,65)),ext:!0};return{publicBytes:new Uint8Array(t),publicKey:await P.subtle.importKey("jwk",a,{name:"ECDH",namedCurve:"P-256"},!0,[]),authSecretBytes:ye(e.keys.auth)}}function nt(e){if(e.byteLength===0)return{hash:()=>Promise.resolve(new ArrayBuffer(32))};const t=P.subtle.importKey("raw",e,{name:"HMAC",hash:"SHA-256"},!0,["sign"]);return{hash:async a=>{const s=await t;return P.subtle.sign("HMAC",s,a)}}}async function ot(e,t){const a=nt(e).hash(t).then(s=>nt(s));return{extract:async(s,r)=>{const i=new Uint8Array([...new Uint8Array(s),...new Uint8Array([1])]);return(await(await a).hash(i)).slice(0,r)}}}function Ys(e){const t=e.reduce((a,s)=>(a.push(...s),a),[]);return new Uint8Array(t)}function Js(e){return(e&255)<<8|e>>8&255}function Xs(e,t){const a=[],s=e.length;let r=0;for(;r<s;)a.push(e.slice(r,r+=t));return a}function Qs(e,t){const a=e.slice(0,12);for(let s=0;s<6;++s)a[a.length-1-s]^=t/256**s&255;return a}function lt(e){return new Uint8Array([0,e])}function xe(e,t){if(!e)throw new Error(t)}function ct(e,t,a){return new Uint8Array([...new TextEncoder().encode(`Content-Encoding: ${a}\0`),...new TextEncoder().encode("P-256\0"),...lt(e.byteLength),...e,...lt(t.byteLength),...t])}function Zs(e){return new Uint8Array([...new TextEncoder().encode(`Content-Encoding: ${e}\0`)])}function er(e){xe(e.x,"jwk.x is missing"),xe(e.y,"jwk.y is missing");const t=new Uint8Array(ye(e.x)),a=new Uint8Array(ye(e.y)),s=[4,...t,...a];return new Uint8Array(s)}async function tr(){const e=await P.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},!0,["deriveBits"]),t=await P.subtle.exportKey("jwk",e.publicKey),a=await P.subtle.exportKey("jwk",e.privateKey);return{publicKey:await P.subtle.importKey("jwk",t,{name:"ECDH",namedCurve:"P-256"},!0,[]),privateKey:e.privateKey,publicJwk:t,privateJwk:a}}async function ar(){return P.getRandomValues(new Uint8Array(16))}async function sr(e,t){const a=await Gs(e),s=await ar(),r=await tr(),i=er(r.publicJwk),n=await P.subtle.deriveBits({name:"ECDH",public:a.publicKey},r.privateKey,256),o=ct(a.publicBytes,i,"aesgcm"),l=ct(a.publicBytes,i,"nonce"),c=Zs("auth"),d=await(await ot(a.authSecretBytes,n)).extract(c,32),m=await ot(s,d),p=await m.extract(o,16),f=await m.extract(l,12),h=await P.subtle.importKey("raw",p,{name:"AES-GCM",length:128},!1,["encrypt"]),g=await Promise.all(Xs(t,4095).map(async(v,E)=>{const w=new Uint16Array([Js(0)]),C=new Uint8Array([...new Uint8Array(w.buffer,w.byteOffset,w.byteLength),...v]),D=await P.subtle.encrypt({name:"AES-GCM",iv:Qs(new Uint8Array(f),E)},h,C);return new Uint8Array(D)}));return{ciphertext:Ys(g),salt:s,localPublicKeyBytes:i}}const rr={ES256:{name:"ECDSA",namedCurve:"P-256",hash:{name:"SHA-256"}},ES384:{name:"ECDSA",namedCurve:"P-384",hash:{name:"SHA-384"}},ES512:{name:"ECDSA",namedCurve:"P-521",hash:{name:"SHA-512"}},HS256:{name:"HMAC",hash:{name:"SHA-256"}},HS384:{name:"HMAC",hash:{name:"SHA-384"}},HS512:{name:"HMAC",hash:{name:"SHA-512"}},RS256:{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}},RS384:{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-384"}},RS512:{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-512"}}};async function ir(e,t,a){if(e===null||typeof e!="object")throw new Error("payload must be an object");if(!(t instanceof Ks))throw new Error("key must be a CryptoKey");if(typeof a.algorithm!="string")throw new Error("options.algorithm must be a string");const s=it({typ:"JWT",alg:a.algorithm,...a.kid&&{kid:a.kid}}),r=it({iat:Math.floor(Date.now()/1e3),...e}),i=`${s}.${r}`,n=await P.subtle.sign(rr[a.algorithm],t,new TextEncoder().encode(i));return`${i}.${W(n)}`}var N;(function(e){e[e.OK=0]="OK",e[e.CANCELLED=1]="CANCELLED",e[e.UNKNOWN=2]="UNKNOWN",e[e.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",e[e.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",e[e.NOT_FOUND=5]="NOT_FOUND",e[e.ALREADY_EXISTS=6]="ALREADY_EXISTS",e[e.PERMISSION_DENIED=7]="PERMISSION_DENIED",e[e.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",e[e.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",e[e.ABORTED=10]="ABORTED",e[e.OUT_OF_RANGE=11]="OUT_OF_RANGE",e[e.UNIMPLEMENTED=12]="UNIMPLEMENTED",e[e.INTERNAL=13]="INTERNAL",e[e.UNAVAILABLE=14]="UNAVAILABLE",e[e.DATA_LOSS=15]="DATA_LOSS",e[e.UNAUTHENTICATED=16]="UNAUTHENTICATED"})(N||(N={}));N.OK,N.INVALID_ARGUMENT,N.FAILED_PRECONDITION,N.OUT_OF_RANGE,N.UNAUTHENTICATED,N.PERMISSION_DENIED,N.NOT_FOUND,N.ABORTED,N.ALREADY_EXISTS,N.RESOURCE_EXHAUSTED,N.CANCELLED,N.DATA_LOSS,N.UNKNOWN,N.INTERNAL,N.UNIMPLEMENTED,N.UNAVAILABLE,N.DEADLINE_EXCEEDED;async function nr(e,t){xe(t.subject,"Vapid subject is empty"),xe(t.privateKey,"Vapid private key is empty"),xe(t.publicKey,"Vapid public key is empty");const a=ye(t.publicKey),s=await P.subtle.importKey("jwk",{kty:"EC",crv:"P-256",x:W(a.slice(1,33)),y:W(a.slice(33,65)),d:t.privateKey},{name:"ECDSA",namedCurve:"P-256"},!1,["sign"]);return{headers:{authorization:`WebPush ${await ir({aud:new URL(e.endpoint).origin,exp:Math.floor(Date.now()/1e3)+720*60,sub:t.subject},s,{algorithm:"ES256"})}`,"crypto-key":`p256ecdsa=${t.publicKey}`}}}async function or(e,t,a){const{headers:s}=await nr(t,a),r=await sr(t,new TextEncoder().encode(typeof e.data=="string"||typeof e.data=="number"?e.data.toString():JSON.stringify(e.data)));return{headers:{...s,"crypto-key":`dh=${W(r.localPublicKeyBytes)};${s["crypto-key"]}`,encryption:`salt=${W(r.salt)}`,ttl:(e.options?.ttl||60).toString(),...e.options?.urgency&&{urgency:e.options.urgency},...e.options?.topic&&{topic:e.options.topic},"content-encoding":"aesgcm","content-length":r.ciphertext.byteLength.toString(),"content-type":"application/octet-stream"},method:"post",body:r.ciphertext}}const H=new T;H.post("/subscribe",async e=>{try{if(e.env.PUSH_ENABLED==="false")return e.json({success:!1,error:"Push notifications désactivées"},503);const t=e.get("user");if(!t||!t.userId)return console.error("[PUSH-SUBSCRIBE] User not found in context:",t),e.json({error:"Non authentifié"},401);console.log("[PUSH-SUBSCRIBE] User authenticated:",t.userId,t.email);const a=await e.req.json(),{subscription:s,deviceType:r,deviceName:i}=a;if(!s||!s.endpoint||!s.keys)return e.json({error:"Subscription invalide"},400);const o=!await e.env.DB.prepare(`
      SELECT id FROM push_subscriptions WHERE endpoint = ?
    `).bind(s.endpoint).first();if(o){const{results:l}=await e.env.DB.prepare(`
        SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = ?
      `).bind(t.userId).all(),c=l[0]?.count||0;if(console.log(`[PUSH-SUBSCRIBE] User ${t.userId} has ${c} device(s) currently`),c>=5){const{results:u}=await e.env.DB.prepare(`
          SELECT id, endpoint, device_name, last_used 
          FROM push_subscriptions 
          WHERE user_id = ? 
          ORDER BY last_used ASC 
          LIMIT 1
        `).bind(t.userId).all();if(u.length>0){const d=u[0];console.log(`⚠️ [PUSH-SUBSCRIBE] User ${t.userId} reached limit (5 devices)`),console.log(`🗑️ [PUSH-SUBSCRIBE] Removing oldest device: ${d.device_name} (last used: ${d.last_used})`),await e.env.DB.prepare(`
            DELETE FROM push_subscriptions WHERE id = ?
          `).bind(d.id).run(),console.log("✅ [PUSH-SUBSCRIBE] Oldest device removed, making room for new one")}}}else console.log(`[PUSH-SUBSCRIBE] Updating existing subscription for user ${t.userId}`);return await e.env.DB.prepare(`
      INSERT INTO push_subscriptions
      (user_id, endpoint, p256dh, auth, device_type, device_name, last_used)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(endpoint) DO UPDATE SET
        last_used = datetime('now'),
        device_type = excluded.device_type,
        device_name = excluded.device_name
    `).bind(t.userId,s.endpoint,s.keys.p256dh,s.keys.auth,r||"unknown",i||"Unknown Device").run(),console.log(o?`✅ Push subscription added for user ${t.userId} (new device)`:`✅ Push subscription updated for user ${t.userId} (existing device)`),e.executionCtx?.waitUntil((async()=>{try{await lr(e.env,t.userId)}catch(l){console.error(`❌ Failed to process pending notifications for user ${t.userId}:`,l)}})()),e.json({success:!0,isNewDevice:o})}catch(t){return console.error("❌ Push subscribe error:",t),e.json({error:"Erreur serveur"},500)}});H.post("/unsubscribe",async e=>{try{const t=e.get("user");if(!t||!t.userId)return console.error("[PUSH-UNSUBSCRIBE] User not found in context"),e.json({error:"Non authentifié"},401);const a=await e.req.json(),{endpoint:s}=a;return s?(await e.env.DB.prepare(`
      DELETE FROM push_subscriptions
      WHERE user_id = ? AND endpoint = ?
    `).bind(t.userId,s).run(),console.log(`✅ Push subscription removed for user ${t.userId}`),e.json({success:!0})):e.json({error:"Endpoint requis"},400)}catch(t){return console.error("❌ Push unsubscribe error:",t),e.json({error:"Erreur serveur"},500)}});H.get("/vapid-public-key",async e=>{try{const t=e.env.VAPID_PUBLIC_KEY;return t?e.json({publicKey:t}):e.json({error:"Clé VAPID non configurée"},500)}catch(t){return console.error("❌ VAPID key error:",t),e.json({error:"Erreur serveur"},500)}});async function me(e,t,a,s=!1,r=[]){let i=0,n=0;try{if(e.PUSH_ENABLED==="false")return console.log("Push notifications disabled, skipping"),{success:!1,sentCount:0,failedCount:0};if(!e.VAPID_PUBLIC_KEY||!e.VAPID_PRIVATE_KEY)return console.error("VAPID keys not configured"),{success:!1,sentCount:0,failedCount:0};(!a.title||a.title.trim()==="")&&(a.title="Maintenance IGP"),a.title.length>100&&(a.title=a.title.substring(0,97)+"..."),(!a.body||a.body.trim()==="")&&(a.body="Nouvelle notification"),a.body.length>200&&(a.body=a.body.substring(0,197)+"..."),a.icon&&!a.icon.startsWith("/")&&!a.icon.startsWith("http")&&(a.icon="/icon-192.png"),a.data&&JSON.stringify(a.data).length>1e3&&(console.warn("Payload data too large, truncating"),a.data={truncated:!0});const o={subject:"mailto:support@igpglass.ca",publicKey:e.VAPID_PUBLIC_KEY,privateKey:e.VAPID_PRIVATE_KEY},l=await e.DB.prepare(`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ?
    `).bind(t).all();let c=null;if(!s)try{c=(await e.DB.prepare(`
          INSERT INTO pending_notifications (user_id, title, body, icon, badge, data, sent_to_endpoints)
          VALUES (?, ?, ?, ?, ?, ?, '[]')
        `).bind(t,a.title,a.body,a.icon||null,a.badge||null,a.data?JSON.stringify(a.data):null).run()).meta.last_row_id,console.log(`✅ Notification queued for user ${t} (id: ${c})`)}catch(m){console.error(`❌ Failed to queue notification for user ${t}:`,m)}if(!l.results||l.results.length===0)return console.log(`No active push subscriptions for user ${t} - notification only in queue`),{success:!1,sentCount:0,failedCount:0};const u=l.results.filter(m=>!r.includes(m.endpoint));if(u.length===0)return console.log(`All ${l.results.length} device(s) already received this notification`),{success:!1,sentCount:0,failedCount:0};console.log(`Sending notification to ${u.length}/${l.results.length} device(s) for user ${t} (${r.length} excluded)`);const d=[];for(const m of u){const p={endpoint:m.endpoint,expirationTime:null,keys:{p256dh:m.p256dh,auth:m.auth}};let f=!1;for(let h=0;h<3;h++)try{const g={data:JSON.stringify(a),options:{ttl:86400}},v=await or(g,p,o),E=await fetch(p.endpoint,v);if(!E.ok){const R=await E.text().catch(()=>"No error details");throw new Error(`Push failed: ${E.status} ${E.statusText} - ${R}`)}await e.DB.prepare(`
            UPDATE push_subscriptions
            SET last_used = datetime('now')
            WHERE endpoint = ?
          `).bind(m.endpoint).run(),i++,f=!0,d.push(m.endpoint),console.log(`✅ Push sent to user ${t} (attempt ${h+1})`);break}catch(g){const v={message:g.message||String(g),statusCode:g.statusCode||"unknown",body:g.body||null,attempt:h+1};if(console.error(`❌ Push failed for user ${t} (attempt ${h+1}):`,v),g.message?.includes("410")||g.statusCode===410){console.log(`Removing expired subscription for user ${t}`),await e.DB.prepare(`
              DELETE FROM push_subscriptions WHERE endpoint = ?
            `).bind(m.endpoint).run();break}if(h===2){n++;try{await e.DB.prepare(`
                INSERT INTO push_logs (user_id, ticket_id, status, error_message)
                VALUES (?, NULL, 'send_failed', ?)
              `).bind(t,JSON.stringify(v)).run()}catch(E){console.error("Failed to log push error:",E)}}else await new Promise(E=>setTimeout(E,1e3*Math.pow(2,h)))}}if(c&&d.length>0)try{await e.DB.prepare(`
          UPDATE pending_notifications
          SET sent_to_endpoints = ?
          WHERE id = ?
        `).bind(JSON.stringify(d),c).run(),console.log(`✅ Updated queue (id: ${c}) with ${d.length} endpoint(s)`)}catch(m){console.error("❌ Failed to update queue tracking:",m)}return{success:i>0,sentCount:i,failedCount:n}}catch(o){return console.error("❌ sendPushNotification global error:",o),{success:!1,sentCount:i,failedCount:n}}}H.post("/verify-subscription",async e=>{try{const t=e.get("user");if(!t||!t.userId)return e.json({error:"Non authentifié"},401);const a=await e.req.json(),{endpoint:s}=a;if(!s)return e.json({error:"Endpoint requis"},400);console.log(`[VERIFY-SUB] Verifying subscription for user ${t.userId} (${t.email})`),console.log(`[VERIFY-SUB] Endpoint: ${s.substring(0,50)}...`);const i=await e.env.DB.prepare(`
      SELECT id FROM push_subscriptions
      WHERE user_id = ? AND endpoint = ?
    `).bind(t.userId,s).first()!==null;return console.log(`[VERIFY-SUB] Result: ${i?"VALID":"INVALID"}`),e.json({isSubscribed:i,userId:t.userId,message:i?"Subscription valide pour cet utilisateur":"Subscription inexistante ou appartient à un autre utilisateur"})}catch(t){return console.error("[VERIFY-SUB] Error:",t),e.json({error:"Erreur serveur"},500)}});H.post("/test",async e=>{try{const t=e.get("user");if(!t||!t.userId)return e.json({error:"Non authentifié"},401);console.log(`[PUSH-TEST] Sending test notification to user ${t.userId} (${t.email})`);const a=await me(e.env,t.userId,{title:"🧪 Test Notification",body:"Ceci est une notification de test envoyée manuellement",icon:"/icon-192.png",data:{test:!0,url:"/"}});return console.log("[PUSH-TEST] Result:",a),e.json({success:a.success,sentCount:a.sentCount,failedCount:a.failedCount,message:a.success?`Notification envoyée avec succès à ${a.sentCount} appareil(s)`:"Aucune notification envoyée - Vérifiez que vous êtes abonné aux notifications"})}catch(t){return console.error("[PUSH-TEST] Error:",t),e.json({error:"Erreur lors de l'envoi de la notification de test",details:t instanceof Error?t.message:"Erreur inconnue"},500)}});H.post("/test-user/:userId",async e=>{try{const t=e.get("user");if(!t||!t.userId)return e.json({error:"Non authentifié"},401);if(t.role!=="admin"&&t.role!=="supervisor")return e.json({error:"Accès refusé - Admin ou Superviseur requis"},403);const a=parseInt(e.req.param("userId"));if(isNaN(a))return e.json({error:"userId invalide"},400);const s=await e.env.DB.prepare(`
      SELECT id, email, first_name FROM users WHERE id = ?
    `).bind(a).first();if(!s)return e.json({error:`Utilisateur ${a} introuvable`},404);console.log(`[PUSH-TEST-USER] Admin ${t.email} sending test notification to user ${a} (${s.email})`);const r=await me(e.env,a,{title:"🔔 Test Push Notification",body:`Notification de diagnostic envoyée par ${t.first_name||t.email}`,icon:"/icon-192.png",data:{test:!0,url:"/",sentBy:t.userId}});return await e.env.DB.prepare(`
      INSERT INTO push_logs (user_id, ticket_id, status, error_message)
      VALUES (?, NULL, ?, ?)
    `).bind(a,r.success?"test_success":"test_failed",JSON.stringify({sentBy:t.userId,sentByEmail:t.email,result:r})).run(),console.log("[PUSH-TEST-USER] Result:",r),e.json({success:r.success,sentCount:r.sentCount,failedCount:r.failedCount,targetUser:{id:s.id,email:s.email,first_name:s.first_name},message:r.success?`✅ Notification envoyée avec succès à ${s.first_name} (${r.sentCount} appareil(s))`:`❌ Échec d'envoi à ${s.first_name} - Vérifiez qu'il est abonné aux notifications`})}catch(t){return console.error("[PUSH-TEST-USER] Error:",t),e.json({error:"Erreur lors de l'envoi de la notification de test",details:t instanceof Error?t.message:"Erreur inconnue"},500)}});async function lr(e,t){try{console.log(`[PENDING-QUEUE] Processing pending notifications for user ${t}`);const{results:a}=await e.DB.prepare(`
      SELECT id, title, body, icon, badge, data, sent_to_endpoints, created_at
      FROM pending_notifications
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).bind(t).all();if(!a||a.length===0){console.log(`[PENDING-QUEUE] No pending notifications for user ${t}`);return}console.log(`[PENDING-QUEUE] Found ${a.length} pending notification(s) for user ${t}`);let s=0,r=0;for(const i of a)try{const n={title:i.title,body:i.body,icon:i.icon||"/icon-192.png",badge:i.badge||"/icon-192.png",data:i.data?JSON.parse(i.data):{}},o=i.sent_to_endpoints?JSON.parse(i.sent_to_endpoints):[];console.log(`[PENDING-QUEUE] Notification ${i.id}: ${o.length} endpoint(s) already received`),(await me(e,t,n,!0,o)).success?(s++,console.log(`✅ [PENDING-QUEUE] Sent notification ${i.id} to user ${t}`),await e.DB.prepare(`
            DELETE FROM pending_notifications WHERE id = ?
          `).bind(i.id).run()):(r++,console.log(`❌ [PENDING-QUEUE] Failed to send notification ${i.id} to user ${t}`))}catch(n){r++,console.error(`❌ [PENDING-QUEUE] Error sending notification ${i.id}:`,n)}console.log(`[PENDING-QUEUE] Processed ${a.length} notifications for user ${t}: ${s} sent, ${r} failed`)}catch(a){console.error(`[PENDING-QUEUE] Error processing pending notifications for user ${t}:`,a)}}H.post("/test",async e=>{try{const t=e.get("user");if(!t||!t.userId)return e.json({error:"Non authentifié"},401);console.log(`[PUSH-TEST] Testing push notification for user ${t.userId} (${t.email})`);const a=await me(e.env,t.userId,{title:"🧪 Test de notification",body:`Test envoyé à ${new Date().toLocaleTimeString("fr-FR")}`,icon:"/icon-192.png",badge:"/badge-72.png",data:{url:"/",action:"test",timestamp:Date.now()}});return await e.env.DB.prepare(`
      INSERT INTO push_logs (user_id, ticket_id, status, error_message)
      VALUES (?, ?, ?, ?)
    `).bind(t.userId,null,a.success?"success":"failed",a.success?null:JSON.stringify(a)).run(),a.success?e.json({success:!0,message:"Notification de test envoyée avec succès",details:a}):e.json({success:!1,message:"Échec de l'envoi de la notification de test",details:a},500)}catch(t){return console.error("[PUSH-TEST] Error:",t),e.json({error:"Erreur lors de l'envoi de la notification de test",details:t instanceof Error?t.message:String(t)},500)}});H.get("/send-test-to-salah",async e=>{try{console.log("[PUSH-DEBUG] Sending test notification to Salah (user_id 11)");const t=await me(e.env,11,{title:"🧪 Test de Diagnostic",body:`Push envoyé depuis l'assistant à ${new Date().toLocaleTimeString("fr-FR")}`,icon:"/icon-192.png",badge:"/badge-72.png",data:{url:"/",action:"debug_test",timestamp:Date.now()}});await e.env.DB.prepare(`
      INSERT INTO push_logs (user_id, ticket_id, status, error_message)
      VALUES (?, ?, ?, ?)
    `).bind(11,null,t.success?"success":"failed",t.success?null:JSON.stringify(t)).run();const a=await e.env.DB.prepare(`
      SELECT id, endpoint, datetime(created_at, 'localtime') as created_at
      FROM push_subscriptions
      WHERE user_id = 11
    `).all();return e.json({success:t.success,message:t.success?"Push envoyé avec succès ✅":"Push échoué ❌",timestamp:new Date().toISOString(),userId:11,subscriptionsCount:a.results?.length||0,subscriptions:a.results,pushResult:t})}catch(t){return console.error("[PUSH-DEBUG] Error:",t),e.json({success:!1,error:"Erreur lors de l'envoi",details:t instanceof Error?t.message:String(t)},500)}});const V=Object.freeze(Object.defineProperty({__proto__:null,default:H,sendPushNotification:me},Symbol.toStringTag,{value:"Module"})),Z=new T;Z.get("/test",y,async e=>{try{const t=e.get("user"),a=await Ts(e.env.DB,t.role),s={canCreateTickets:await O(e.env.DB,t.role,"tickets","create","all"),canDeleteAllTickets:await O(e.env.DB,t.role,"tickets","delete","all"),canDeleteOwnTickets:await O(e.env.DB,t.role,"tickets","delete","own"),canCreateMachines:await O(e.env.DB,t.role,"machines","create","all"),canCreateUsers:await O(e.env.DB,t.role,"users","create","all"),canManageRoles:await O(e.env.DB,t.role,"roles","create","all")};return e.json({message:"Test RBAC réussi",user:{id:t.userId,email:t.email,role:t.role},permissions:{total:a.length,list:a},specificTests:s,interpretation:{role:t.role,description:t.role==="admin"?"Accès complet - Peut tout faire":t.role==="supervisor"?"Gestion complète sauf rôles/permissions":t.role==="technician"?"Gestion tickets + lecture":t.role==="operator"?"Tickets propres uniquement":"Rôle personnalisé"}})}catch(t){return console.error("RBAC test error:",t),e.json({error:"Erreur lors du test RBAC"},500)}});Z.get("/check",y,async e=>{try{const t=e.get("user"),a=e.req.query("resource"),s=e.req.query("action"),r=e.req.query("scope")||"all";if(!a||!s)return e.json({error:"Paramètres manquants",required:["resource","action"],optional:["scope (défaut: all)"]},400);const i=await O(e.env.DB,t.role,a,s,r);return e.json({allowed:i,permission:`${a}.${s}.${r}`,user_role:t.role})}catch(t){return console.error("RBAC check error:",t),e.json({error:"Erreur vérification permission"},500)}});Z.get("/check-any",y,async e=>{try{const t=e.get("user"),a=e.req.query("permissions");if(!a)return e.json({error:"Paramètre manquant",required:'permissions (CSV format: "resource.action.scope,...")'},400);const s=a.split(",");for(const r of s){const i=r.trim().split(".");if(i.length<2)continue;const[n,o,l="all"]=i;if(await O(e.env.DB,t.role,n,o,l))return e.json({allowed:!0,matched:r.trim(),user_role:t.role})}return e.json({allowed:!1,checked:s,user_role:t.role})}catch(t){return console.error("RBAC check-any error:",t),e.json({error:"Erreur vérification permissions"},500)}});Z.get("/check-all",y,async e=>{try{const t=e.get("user"),a=e.req.query("permissions");if(!a)return e.json({error:"Paramètre manquant",required:'permissions (CSV format: "resource.action.scope,...")'},400);const s=a.split(","),r=[];for(const n of s){const o=n.trim().split(".");if(o.length<2){r.push(n.trim()+" (format invalide)");continue}const[l,c,u="all"]=o;await O(e.env.DB,t.role,l,c,u)||r.push(n.trim())}const i=r.length===0;return e.json({allowed:i,checked:s,...r.length>0&&{failed:r},user_role:t.role})}catch(t){return console.error("RBAC check-all error:",t),e.json({error:"Erreur vérification permissions"},500)}});Z.get("/test-permission",y,As("tickets","read","all"),async e=>e.json({message:"Permission accordée!",requiredPermission:"tickets.read.all"}));Z.get("/test-any-permission",y,Ds(["tickets.read.all","tickets.read.own"]),async e=>e.json({message:"Au moins une permission accordée!",requiredPermissions:["tickets.read.all","tickets.read.own"]}));const Ye=new T;Ye.get("/",y,async e=>{try{const{results:t}=await e.env.DB.prepare(`
      SELECT id, first_name, email
      FROM users
      WHERE role = 'technician' AND id != 0
      ORDER BY first_name ASC
    `).all();return e.json({technicians:t})}catch(t){return console.error("Get technicians error:",t),e.json({error:"Erreur lors de la récupération des techniciens"},500)}});Ye.get("/team",y,Vt,async e=>{try{const{results:t}=await e.env.DB.prepare(`
      SELECT id, email, first_name, last_name, full_name, role, created_at, updated_at, last_login
      FROM users
      WHERE id != 0
      ORDER BY role DESC, first_name ASC
    `).all();return e.json({users:t})}catch(t){return console.error("Get team users error:",t),e.json({error:"Erreur lors de la récupération de l equipe"},500)}});const U=new T;U.post("/",y,async e=>{try{const t=e.get("user"),{message_type:a,recipient_id:s,content:r}=await e.req.json();if(!a||!r||r.trim()==="")return e.json({error:"Type et contenu requis"},400);if(a!=="public"&&a!=="private")return e.json({error:"Type invalide"},400);if(a==="private"&&!s)return e.json({error:"Destinataire requis pour message prive"},400);const i=await e.env.DB.prepare(`
      INSERT INTO messages (sender_id, recipient_id, message_type, content)
      VALUES (?, ?, ?, ?)
    `).bind(t.userId,s||null,a,r).run();if(a==="private"&&s)try{const{sendPushNotification:n}=await Promise.resolve().then(()=>V),o=t.first_name||t.email||"Un utilisateur",l=r.length>100?r.substring(0,97)+"...":r,c=await n(e.env,s,{title:`💬 ${o}`,body:l,icon:"/icon-192.png",badge:"/badge-72.png",data:{url:"/",action:"new_private_message",senderId:t.userId,senderName:o,messageId:i.meta.last_row_id}});await e.env.DB.prepare(`
          INSERT INTO push_logs (user_id, ticket_id, status, error_message)
          VALUES (?, ?, ?, ?)
        `).bind(s,null,c.success?"success":"failed",c.success?null:JSON.stringify(c)).run(),console.log(`✅ Push notification sent to user ${s} for message from ${t.userId}`)}catch(n){try{await e.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, error_message)
            VALUES (?, ?, ?, ?)
          `).bind(s,null,"error",n.message||String(n)).run()}catch(o){console.error("Failed to log push error:",o)}console.error("❌ Push notification failed (non-blocking):",n)}return e.json({message:"Message envoye avec succes",id:i.meta.last_row_id},201)}catch(t){return console.error("Send message error:",t),e.json({error:"Erreur lors de envoi du message"},500)}});U.post("/audio",y,async e=>{try{const t=e.get("user"),a=await e.req.formData(),s=a.get("audio"),r=a.get("message_type"),i=a.get("recipient_id"),n=parseInt(a.get("duration")||"0");if(!s)return e.json({error:"Fichier audio requis"},400);const o=10*1024*1024;if(s.size>o)return e.json({error:`Fichier trop volumineux (${(s.size/1024/1024).toFixed(1)} MB). Maximum: 10 MB`},400);if(!["audio/webm","audio/mp4","audio/mpeg","audio/ogg","audio/wav"].some(g=>s.type.startsWith(g)))return e.json({error:`Type de fichier non autorisé: ${s.type}. Types acceptés: MP3, MP4, WebM, OGG, WAV`},400);if(n>300)return e.json({error:"Durée maximale: 5 minutes"},400);if(r!=="public"&&r!=="private")return e.json({error:"Type de message invalide"},400);if(r==="private"&&!i)return e.json({error:"Destinataire requis pour message privé"},400);const u=Date.now(),d=Math.random().toString(36).substring(7),m=s.name.split(".").pop()||"webm",p=`messages/audio/${t.userId}/${u}-${d}.${m}`,f=await s.arrayBuffer();await e.env.MEDIA_BUCKET.put(p,f,{httpMetadata:{contentType:s.type}});const h=await e.env.DB.prepare(`
      INSERT INTO messages (
        sender_id, recipient_id, message_type, content,
        audio_file_key, audio_duration, audio_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(t.userId,i||null,r,"🎤 Message vocal",p,n,s.size).run();if(console.log(`✅ Audio message uploaded: ${p} (${(s.size/1024).toFixed(1)} KB, ${n}s)`),r==="private"&&i)try{const{sendPushNotification:g}=await Promise.resolve().then(()=>V),v=t.first_name||t.email||"Un utilisateur",E=Math.floor(n/60),R=n%60,w=R>0?`${E}:${R.toString().padStart(2,"0")}`:`${E}min`,C=await g(e.env,parseInt(i),{title:`🎤 ${v}`,body:`Message vocal (${w})`,icon:"/icon-192.png",badge:"/badge-72.png",data:{url:"/",action:"new_audio_message",senderId:t.userId,senderName:v,messageId:h.meta.last_row_id,audioKey:p,duration:n}});await e.env.DB.prepare(`
          INSERT INTO push_logs (user_id, ticket_id, status, error_message)
          VALUES (?, ?, ?, ?)
        `).bind(parseInt(i),null,C.success?"success":"failed",C.success?null:JSON.stringify(C)).run(),console.log(`✅ Push notification sent to user ${i} for audio message from ${t.userId}`)}catch(g){try{await e.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, error_message)
            VALUES (?, ?, ?, ?)
          `).bind(parseInt(i),null,"error",g.message||String(g)).run()}catch(v){console.error("Failed to log push error:",v)}console.error("❌ Push notification failed (non-blocking):",g)}return e.json({message:"Message vocal envoyé avec succès",messageId:h.meta.last_row_id,audioKey:p},201)}catch(t){return console.error("Upload audio error:",t),e.json({error:"Erreur lors de l'envoi du message vocal"},500)}});U.get("/public",y,async e=>{try{const t=parseInt(e.req.query("page")||"1"),a=parseInt(e.req.query("limit")||"50"),s=(t-1)*a;if(t<1||a<1||a>100)return e.json({error:"Paramètres de pagination invalides"},400);const{results:r}=await e.env.DB.prepare(`
      SELECT
        m.id,
        m.content,
        m.created_at,
        m.sender_id,
        m.audio_file_key,
        m.audio_duration,
        m.audio_size,
        u.full_name as sender_name,
        u.role as sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.message_type = 'public'
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(a,s).all(),{count:i}=await e.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE message_type = 'public'
    `).first();return e.json({messages:r,pagination:{page:t,limit:a,total:i,totalPages:Math.ceil(i/a),hasMore:s+r.length<i}})}catch(t){return console.error("Get public messages error:",t),e.json({error:"Erreur lors de la recuperation des messages"},500)}});U.get("/conversations",y,async e=>{try{const t=e.get("user"),{results:a}=await e.env.DB.prepare(`
      SELECT DISTINCT
        CASE
          WHEN m.sender_id = ? THEN m.recipient_id
          ELSE m.sender_id
        END as contact_id
      FROM messages m
      WHERE m.message_type = 'private'
        AND (m.sender_id = ? OR m.recipient_id = ?)
    `).bind(t.userId,t.userId,t.userId).all(),s=[];for(const r of a){const i=r.contact_id;if(!i)continue;const n=await e.env.DB.prepare(`
        SELECT full_name, role FROM users WHERE id = ?
      `).bind(i).first(),o=await e.env.DB.prepare(`
        SELECT content, created_at
        FROM messages
        WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
        ORDER BY created_at DESC LIMIT 1
      `).bind(t.userId,i,i,t.userId).first(),l=await e.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE sender_id = ? AND recipient_id = ? AND is_read = 0
      `).bind(i,t.userId).first();s.push({contact_id:i,contact_name:n?.full_name||"Inconnu",contact_role:n?.role||"unknown",last_message:o?.content||null,last_message_time:o?.created_at||null,unread_count:l?.count||0})}return s.sort((r,i)=>r.last_message_time?i.last_message_time?new Date(i.last_message_time).getTime()-new Date(r.last_message_time).getTime():-1:1),e.json({conversations:s})}catch(t){return console.error("Get conversations error:",t),e.json({error:"Erreur lors de la recuperation des conversations"},500)}});U.get("/private/:contactId",y,async e=>{try{const t=e.get("user"),a=parseInt(e.req.param("contactId")),{results:s}=await e.env.DB.prepare(`
      SELECT
        m.id,
        m.content,
        m.created_at,
        m.sender_id,
        m.recipient_id,
        m.is_read,
        m.audio_file_key,
        m.audio_duration,
        m.audio_size,
        u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.message_type = 'private'
        AND ((m.sender_id = ? AND m.recipient_id = ?)
          OR (m.sender_id = ? AND m.recipient_id = ?))
      ORDER BY m.created_at ASC
    `).bind(t.userId,a,a,t.userId).all();return await e.env.DB.prepare(`
      UPDATE messages
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE sender_id = ?
        AND recipient_id = ?
        AND is_read = 0
    `).bind(a,t.userId).run(),e.json({messages:s})}catch(t){return console.error("Get private messages error:",t),e.json({error:"Erreur lors de la recuperation des messages"},500)}});U.get("/unread-count",y,async e=>{try{const t=e.get("user"),a=await e.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE recipient_id = ? AND is_read = 0
    `).bind(t.userId).first();return e.json({count:a?.count||0})}catch(t){return console.error("Get unread count error:",t),e.json({error:"Erreur lors du comptage"},500)}});U.get("/available-users",y,async e=>{try{const t=e.get("user"),{results:a}=await e.env.DB.prepare(`
      SELECT id, first_name, role, email
      FROM users
      WHERE role IN ('operator', 'furnace_operator', 'technician', 'supervisor', 'admin')
        AND id != ?
        AND id != 0
      ORDER BY role DESC, first_name ASC
    `).bind(t.userId).all();return e.json({users:a})}catch(t){return console.error("Get available users error:",t),e.json({error:"Erreur lors de la recuperation des utilisateurs"},500)}});U.delete("/:messageId",y,async e=>{try{const t=e.get("user"),a=parseInt(e.req.param("messageId")),s=await e.env.DB.prepare(`
      SELECT m.*, u.role as sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).bind(a).first();if(!s)return e.json({error:"Message non trouve"},404);if(!(s.sender_id===t.userId||t.role==="admin"||t.role==="supervisor"&&s.sender_role!=="admin"))return e.json({error:"Vous n avez pas la permission de supprimer ce message"},403);if(s.audio_file_key)try{await e.env.MEDIA_BUCKET.delete(s.audio_file_key),console.log(`Audio supprime du R2: ${s.audio_file_key}`)}catch(i){console.error(`Erreur suppression audio R2 ${s.audio_file_key}:`,i)}return await e.env.DB.prepare(`
      DELETE FROM messages WHERE id = ?
    `).bind(a).run(),e.json({message:"Message supprime avec succes",audioDeleted:!!s.audio_file_key})}catch(t){return console.error("Delete message error:",t),e.json({error:"Erreur lors de la suppression du message"},500)}});U.post("/bulk-delete",y,async e=>{try{const t=e.get("user"),{message_ids:a}=await e.req.json();if(!a||!Array.isArray(a)||a.length===0)return e.json({error:"Liste de message_ids requise"},400);if(a.length>100)return e.json({error:"Maximum 100 messages par suppression"},400);let s=0,r=0;const i=[];for(const n of a)try{const o=await e.env.DB.prepare(`
          SELECT m.*, u.role as sender_role
          FROM messages m
          LEFT JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `).bind(n).first();if(!o){i.push({messageId:n,error:"Message non trouve"});continue}if(!(o.sender_id===t.userId||t.role==="admin"||t.role==="supervisor"&&o.sender_role!=="admin")){i.push({messageId:n,error:"Permission refusee"});continue}if(o.audio_file_key)try{await e.env.MEDIA_BUCKET.delete(o.audio_file_key),console.log(`Audio supprime du R2: ${o.audio_file_key}`),r++}catch(c){console.error(`Erreur suppression audio R2 ${o.audio_file_key}:`,c)}await e.env.DB.prepare(`
          DELETE FROM messages WHERE id = ?
        `).bind(n).run(),s++}catch(o){console.error(`Erreur suppression message ${n}:`,o),i.push({messageId:n,error:"Erreur serveur"})}return e.json({message:s+" message(s) supprime(s) avec succes",deletedCount:s,audioDeletedCount:r,errors:i.length>0?i:void 0})}catch(t){return console.error("Bulk delete messages error:",t),e.json({error:"Erreur lors de la suppression en masse"},500)}});U.get("/test/r2",async e=>{try{const t=await e.env.MEDIA_BUCKET.list({limit:10,prefix:"messages/audio/"});return e.json({success:!0,bucket_name:"maintenance-media",files_count:t.objects.length,files:t.objects.map(a=>({key:a.key,size:a.size,uploaded:a.uploaded}))})}catch(t){return e.json({success:!1,error:t.message,bucket_configured:!!e.env.MEDIA_BUCKET},500)}});async function cr(e,t){try{console.log(`[LOGIN-SUMMARY] Starting check for user ${t}`);const a=await e.DB.prepare(`
      SELECT created_at 
      FROM push_logs 
      WHERE user_id = ? 
        AND status = 'login_summary_sent'
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(t).first();if(a){const u=new Date(a.created_at),m=(new Date().getTime()-u.getTime())/(1e3*60*60);if(m<24){console.log(`[LOGIN-SUMMARY] Throttled for user ${t} (last summary: ${m.toFixed(1)}h ago)`);return}}const r=(await e.DB.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE recipient_id = ? AND is_read = 0
    `).bind(t).first())?.count||0;if(r===0){console.log(`[LOGIN-SUMMARY] No unread messages for user ${t}`);return}if(console.log(`[LOGIN-SUMMARY] User ${t} has ${r} unread message(s)`),((await e.DB.prepare(`
      SELECT COUNT(*) as count
      FROM push_subscriptions
      WHERE user_id = ?
    `).bind(t).first())?.count||0)===0){console.log(`[LOGIN-SUMMARY] User ${t} has no push subscriptions`);return}const{sendPushNotification:o}=await Promise.resolve().then(()=>V),l=r===1?"Vous avez 1 message non lu":`Vous avez ${r} messages non lus`,c=await o(e,t,{title:"📬 Messages en attente",body:l,icon:"/icon-192.png",badge:"/badge-72.png",data:{url:"/",action:"login_summary",unreadCount:r}});await e.DB.prepare(`
      INSERT INTO push_logs (user_id, ticket_id, status, error_message)
      VALUES (?, ?, ?, ?)
    `).bind(t,null,c.success?"login_summary_sent":"login_summary_failed",c.success?null:JSON.stringify(c)).run(),c.success?console.log(`✅ [LOGIN-SUMMARY] Summary notification sent to user ${t} (${r} unread)`):console.log(`❌ [LOGIN-SUMMARY] Failed to send summary to user ${t}`)}catch(a){console.error(`❌ [LOGIN-SUMMARY] Error for user ${t} (non-blocking):`,a);try{await e.DB.prepare(`
        INSERT INTO push_logs (user_id, ticket_id, status, error_message)
        VALUES (?, ?, ?, ?)
      `).bind(t,null,"login_summary_error",a.message||String(a)).run()}catch(s){console.error("[LOGIN-SUMMARY] Failed to log error:",s)}}}const dr=Object.freeze(Object.defineProperty({__proto__:null,default:U,sendLoginSummaryNotification:cr},Symbol.toStringTag,{value:"Module"})),Xt=new T;Xt.get("/*",async e=>{try{const a=e.req.path.replace("/api/audio/","");if(!await e.env.DB.prepare(`
      SELECT sender_id, recipient_id, message_type
      FROM messages
      WHERE audio_file_key = ?
    `).bind(a).first())return console.error("Audio non trouvé:",a),e.json({error:"Message audio non trouvé",fileKey:a},404);const r=await e.env.MEDIA_BUCKET.get(a);return r?new Response(r.body,{headers:{"Content-Type":r.httpMetadata?.contentType||"audio/webm","Content-Disposition":"inline","Cache-Control":"public, max-age=31536000"}}):e.json({error:"Fichier audio non trouvé dans le stockage"},404)}catch(t){return console.error("Get audio error:",t),e.json({error:"Erreur lors de la recuperation audio"},500)}});const Je=new T;Je.post("/check-overdue",async e=>{try{const t=e.req.header("Authorization"),a=e.env.CRON_SECRET;if(t!==a)return e.json({error:"Unauthorized - Invalid CRON token"},401);console.log("🔔 CRON externe démarré:",new Date().toISOString());const s=await Jt(e.env.DB),r=new Date,i=new Date(r.getTime()-1440*60*1e3),n=await e.env.DB.prepare(`
      SELECT
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        m.machine_type,
        m.model,
        t.scheduled_date,
        t.assigned_to,
        t.created_at,
        u.first_name as assignee_name,
        reporter.first_name as reporter_name
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users reporter ON t.reported_by = reporter.id
      WHERE t.assigned_to IS NOT NULL
        AND t.scheduled_date IS NOT NULL
        AND t.scheduled_date != 'null'
        AND t.scheduled_date != ''
        AND t.status NOT IN ('completed', 'archived')
        AND datetime(t.scheduled_date) < datetime('now')
      ORDER BY t.scheduled_date ASC
    `).all();if(!n.results||n.results.length===0)return console.log("✅ CRON: Aucun ticket expiré trouvé"),e.json({message:"Aucun ticket planifié expiré trouvé",checked_at:r.toISOString()});console.log(`⚠️ CRON: ${n.results.length} ticket(s) expiré(s) trouvé(s)`);const o="https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc";let l=0;const c=[],u=[];for(const d of n.results)try{if(await e.env.DB.prepare(`
          SELECT id, sent_at, scheduled_date_notified
          FROM webhook_notifications
          WHERE ticket_id = ?
            AND scheduled_date_notified = ?
            AND notification_type = 'overdue_scheduled'
          ORDER BY sent_at DESC
          LIMIT 1
        `).bind(d.id,d.scheduled_date).first()){console.log(`⏭️ CRON: Skip ${d.ticket_id} - notification déjà envoyée pour cette date (${d.scheduled_date})`);continue}const p=new Date(d.scheduled_date),f=r.getTime()-p.getTime(),h=Math.floor(f/(1e3*60*60)),g=Math.floor(f%(1e3*60*60)/(1e3*60)),v=h>0?`${h}h ${g}min`:`${g}min`,E=d.assigned_to===0?"Toute l'équipe":d.assignee_name||"Non assigné",R={ticket_id:d.ticket_id,title:d.title,description:d.description||"",priority:d.priority,status:d.status,machine_type:d.machine_type,model:d.model,scheduled_date:oe(d.scheduled_date,s),assigned_to:E,reporter:d.reporter_name||"Inconnu",overdue_text:v,created_at:oe(d.created_at,s),notification_time:oe(r,s)},w=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(R)}),C=w.status,D=await w.text(),A=r.toISOString();await e.env.DB.prepare(`
          INSERT INTO webhook_notifications 
          (ticket_id, notification_type, webhook_url, sent_at, response_status, response_body, scheduled_date_notified)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(d.id,"overdue_scheduled",o,A,C,D.substring(0,1e3),d.scheduled_date).run(),l++,console.log(`✅ CRON: Webhook envoyé pour ${d.ticket_id} (status: ${C})`);try{if(await e.env.DB.prepare(`
            SELECT id FROM push_logs
            WHERE user_id = ? AND ticket_id = ?
              AND datetime(created_at) >= datetime('now', '-5 minutes')
            LIMIT 1
          `).bind(d.assigned_to,d.id).first())console.log(`⏭️ CRON: Push déjà envoyé récemment pour ${d.ticket_id} (assigné: ${d.assigned_to}), skip pour éviter doublon`);else{const I=(await e.env.DB.prepare("SELECT first_name FROM users WHERE id = ?").bind(d.assigned_to).first())?.first_name||"Technicien",{sendPushNotification:De}=await Promise.resolve().then(()=>V),L=await De(e.env,d.assigned_to,{title:`🔴 ${I}, ticket expiré`,body:`${d.ticket_id}: ${d.title} - Retard ${v}`,icon:"/icon-192.png",badge:"/icon-192.png",data:{ticketId:d.id,ticket_id:d.ticket_id,type:"overdue",action:"view_ticket",url:`/?ticket=${d.id}`}});await e.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, error_message)
            VALUES (?, ?, ?, ?)
          `).bind(d.assigned_to,d.id,L.success?"success":"failed",L.success?null:JSON.stringify(L)).run(),L.success?console.log(`✅ CRON: Push notification envoyée pour ${d.ticket_id} (${L.sentCount} appareil(s))`):console.log(`⚠️ CRON: Push notification échouée pour ${d.ticket_id}`)}}catch(_){console.error(`⚠️ CRON: Erreur push notification pour ${d.ticket_id} (non-critique):`,_)}try{const{sendPushNotification:_}=await Promise.resolve().then(()=>V),{results:M}=await e.env.DB.prepare(`
            SELECT id, first_name FROM users WHERE role = 'admin'
          `).all();if(M&&M.length>0){console.log(`🔔 CRON: Envoi push aux ${M.length} admin(s) pour ticket expiré ${d.ticket_id}`);for(const I of M){if(await e.env.DB.prepare(`
                SELECT id FROM push_logs
                WHERE user_id = ? AND ticket_id = ?
                  AND datetime(created_at) >= datetime('now', '-24 hours')
                LIMIT 1
              `).bind(I.id,d.id).first()){console.log(`⏭️ CRON: Push déjà envoyé à admin ${I.id} pour ${d.ticket_id}`);continue}try{const L=I.first_name||"Admin",G=await _(e.env,I.id,{title:`⚠️ ${L}, ticket expiré`,body:`${d.ticket_id}: ${d.title} - Retard ${v}`,icon:"/icon-192.png",badge:"/badge-72.png",data:{ticketId:d.id,ticket_id:d.ticket_id,action:"view_ticket",url:`/?ticket=${d.id}`,overdue_cron:!0,priority:d.priority,assignedTo:d.assigned_to}});await e.env.DB.prepare(`
                  INSERT INTO push_logs (user_id, ticket_id, status, error_message)
                  VALUES (?, ?, ?, ?)
                `).bind(I.id,d.id,G.success?"success":"failed",G.success?null:JSON.stringify(G)).run(),G.success?console.log(`✅ CRON: Push notification envoyée à admin ${I.id} (${I.first_name})`):console.log(`⚠️ CRON: Push notification failed pour admin ${I.id}: ${JSON.stringify(G)}`)}catch(L){try{await e.env.DB.prepare(`
                    INSERT INTO push_logs (user_id, ticket_id, status, error_message)
                    VALUES (?, ?, ?, ?)
                  `).bind(I.id,d.id,"error",L.message||String(L)).run()}catch(G){console.error("Failed to log admin push error:",G)}console.error(`⚠️ CRON: Erreur push admin ${I.id}:`,L)}}}else console.log(`⚠️ CRON: Aucun admin trouvé pour notifier du ticket ${d.ticket_id}`)}catch(_){console.error(`⚠️ CRON: Erreur récupération admins pour ${d.ticket_id}:`,_)}c.push({ticket_id:d.ticket_id,title:d.title,overdue_text:R.overdue_text,webhook_status:C,sent_at:A}),await new Promise(_=>setTimeout(_,200))}catch(m){console.error(`❌ CRON: Erreur pour ${d.ticket_id}:`,m),u.push({ticket_id:d.ticket_id,error:m instanceof Error?m.message:"Erreur inconnue"})}return console.log(`🎉 CRON terminé: ${l}/${n.results.length} notification(s) envoyée(s)`),e.json({message:"Vérification terminée",total_overdue:n.results.length,notifications_sent:l,notifications:c,errors:u.length>0?u:void 0,checked_at:r.toISOString()})}catch(t){return console.error("❌ CRON: Erreur globale:",t),e.json({error:"Erreur serveur lors de la vérification",details:t instanceof Error?t.message:"Erreur inconnue"},500)}});Je.post("/cleanup-push-tokens",async e=>{try{const t=e.req.header("Authorization"),a=e.env.CRON_SECRET;if(t!==a)return e.json({error:"Unauthorized - Invalid CRON token"},401);const s=new Date;console.log("🧹 CRON cleanup-push-tokens démarré:",s.toISOString());const{results:r}=await e.env.DB.prepare(`
      SELECT 
        id, 
        user_id, 
        device_name, 
        created_at, 
        last_used,
        julianday('now') - julianday(last_used) as days_inactive
      FROM push_subscriptions
      WHERE julianday('now') - julianday(last_used) > 30
      ORDER BY last_used ASC
    `).all();if(!r||r.length===0)return console.log("✅ CRON: Aucune subscription inactive >30 jours trouvée"),e.json({success:!0,deletedCount:0,message:"Aucune subscription inactive à nettoyer",checked_at:s.toISOString()});console.log(`⚠️ CRON: ${r.length} subscription(s) inactive(s) >30 jours trouvée(s)`);const i=[];for(const u of r)console.log(`🗑️ CRON: Suppression device "${u.device_name}" (user_id:${u.user_id}, ${Math.floor(u.days_inactive)} jours inactif)`),i.push({user_id:u.user_id,device_name:u.device_name,last_used:u.last_used,days_inactive:Math.floor(u.days_inactive)});const o=(await e.env.DB.prepare(`
      DELETE FROM push_subscriptions
      WHERE julianday('now') - julianday(last_used) > 30
    `).run()).meta.changes||0;console.log(`✅ CRON: ${o} subscription(s) inactive(s) supprimée(s)`);const{results:l}=await e.env.DB.prepare(`
      SELECT COUNT(*) as count FROM push_subscriptions
    `).all(),c=l[0]?.count||0;return console.log(`📊 CRON: ${c} subscription(s) active(s) restante(s)`),console.log(`🎉 CRON cleanup-push-tokens terminé: ${o} suppression(s)`),e.json({success:!0,deletedCount:o,remainingCount:c,deletedDevices:i,message:`Nettoyage terminé: ${o} subscription(s) inactive(s) >30 jours supprimée(s)`,checked_at:s.toISOString()})}catch(t){return console.error("❌ CRON: Erreur cleanup-push-tokens:",t),e.json({error:"Erreur lors du nettoyage des subscriptions",details:t instanceof Error?t.message:"Erreur inconnue"},500)}});const Qt=new T;Qt.post("/check-overdue",y,async e=>{try{const t=e.get("user");if(t.role!=="admin"&&t.role!=="supervisor")return e.json({error:"Permission refusée"},403);const{results:a}=await e.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'timezone_offset_hours'
    `).all(),s=a.length>0?parseInt(a[0].setting_value):-5,r=new Date,n=new Date(r.getTime()+s*60*60*1e3).toISOString().replace("T"," ").substring(0,19),{results:o}=await e.env.DB.prepare(`
      SELECT
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        t.machine_type,
        t.model,
        t.priority,
        t.status,
        t.scheduled_date,
        t.assigned_to,
        u.first_name as assigned_name,
        r.first_name as reporter_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users r ON t.reported_by = r.id
      WHERE t.scheduled_date IS NOT NULL
        AND t.scheduled_date < ?
        AND (t.status = 'received' OR t.status = 'diagnostic')
      ORDER BY t.scheduled_date ASC
    `).bind(n).all();if(o.length===0)return e.json({message:"Aucun ticket en retard",count:0});const{results:l}=await e.env.DB.prepare(`
      SELECT id, first_name
      FROM users
      WHERE role = 'admin'
    `).all();if(l.length===0)return e.json({error:"Aucun administrateur trouvé"},404);let c=0;for(const u of o){const{results:d}=await e.env.DB.prepare(`
        SELECT id FROM messages
        WHERE content LIKE ?
          AND message_type = 'private'
          AND created_at > datetime('now', '-24 hours')
      `).bind(`%${u.ticket_id}%RETARD%`).all();if(d.length>0)continue;const m=new Date(u.scheduled_date),f=new Date().getTime()-m.getTime(),h=Math.floor(f/(1e3*60*60)),g=Math.floor(f%(1e3*60*60)/(1e3*60)),v=u.priority==="critical"?"🔴 CRITIQUE":u.priority==="high"?"🟠 HAUTE":u.priority==="medium"?"🟡 MOYENNE":"🟢 FAIBLE",E=u.assigned_to===0?"👥 Toute l'équipe":u.assigned_name?`👤 ${u.assigned_name}`:"❌ Non assigné",R=`
⚠️ ALERTE RETARD ⚠️

Ticket: ${u.ticket_id}
Titre: ${u.title}
Machine: ${u.machine_type} ${u.model}
Priorité: ${v}
Statut: ${u.status==="received"?"Requête":"Diagnostic"}

📅 Date planifiée: ${new Date(u.scheduled_date).toLocaleString("fr-FR")}
⏰ Retard: ${h}h ${g}min

Assigné à: ${E}
Rapporté par: ${u.reporter_name||"N/A"}

${u.description?`Description: ${u.description.substring(0,100)}${u.description.length>100?"...":""}`:""}

Action requise immédiatement !
      `.trim();for(const w of l){const C=await e.env.DB.prepare(`
          INSERT INTO messages (sender_id, recipient_id, message_type, content)
          VALUES (?, ?, 'private', ?)
        `).bind(1,w.id,R).run();c++;try{const{sendPushNotification:D}=await Promise.resolve().then(()=>V),A=h>0?`${h}h ${g}min`:`${g}min`,_=await D(e.env,w.id,{title:"⚠️ ALERTE RETARD",body:`${u.ticket_id}: ${u.title} - En retard de ${A}`,icon:"/icon-192.png",badge:"/badge-72.png",data:{url:"/",action:"overdue_alert_manual",ticketId:u.id,ticket_id:u.ticket_id,priority:u.priority,delayHours:h}});await e.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, error_message)
            VALUES (?, ?, ?, ?)
          `).bind(w.id,u.id,_.success?"success":"failed",_.success?null:JSON.stringify(_)).run(),_.success?console.log(`✅ Push notification sent for overdue alert to admin ${w.id} (${w.first_name})`):console.log(`⚠️ Push notification failed for admin ${w.id}:`,_)}catch(D){try{await e.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, ?, ?)
            `).bind(w.id,u.id,"error",D.message||String(D)).run()}catch(A){console.error("Failed to log push error:",A)}console.error("⚠️ Push notification failed (non-blocking):",D)}}}return e.json({message:`${c} alerte(s) envoyée(s) pour ${o.length} ticket(s) en retard`,overdueCount:o.length,alertsSent:c})}catch(t){return console.error("Check overdue error:",t),e.json({error:"Erreur lors de la vérification des retards"},500)}});var ur={};const x=new T,dt=["https://mecanique.igpglass.ca","https://webapp-7t8.pages.dev","https://0d6a8681.webapp-7t8.pages.dev","https://7644aa30.webapp-7t8.pages.dev","http://localhost:3000","http://127.0.0.1:3000"],mr=ur.CORS_STRICT_MODE==="true";x.use("/api/*",Da({origin:e=>mr?!e||!dt.includes(e)?(console.warn(`⚠️ CORS: Blocked origin ${e}`),dt[0]):e:e||"*",allowMethods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"],allowHeaders:["Content-Type","Authorization"],credentials:!0}));x.use("*",async(e,t)=>{await t(),e.header("X-Frame-Options","DENY"),e.header("X-Content-Type-Options","nosniff"),e.header("Referrer-Policy","strict-origin-when-cross-origin")});x.use("/api/auth/me",y);x.route("/api/auth",Ee);x.route("/api/rbac",Z);x.use("/api/roles/*",y,ce);x.route("/api/roles",Q);x.use("/api/tickets/*",y);x.route("/api/tickets",de);x.use("/api/machines/*",y);x.route("/api/machines",ue);x.route("/api/technicians",Ye);x.use("/api/users/*",y);x.route("/api/users",q);x.route("/api/media",we);x.route("/api/comments",Ke);x.use("/api/search/*",y);x.route("/api/search",Yt);x.route("/api/settings",K);x.use("/api/webhooks/*",y);x.route("/api/webhooks",Ge);x.get("/api/push/vapid-public-key",async e=>{try{const t=e.env.VAPID_PUBLIC_KEY;return t?e.json({publicKey:t}):e.json({error:"Clé VAPID non configurée"},500)}catch(t){return console.error("❌ VAPID key error:",t),e.json({error:"Erreur serveur"},500)}});x.use("/api/push/subscribe",y);x.use("/api/push/unsubscribe",y);x.use("/api/push/test",y);x.use("/api/push/verify-subscription",y);x.use("/api/push/vapid-public-key",y);x.route("/api/push",H);x.route("/api/messages",U);x.route("/api/audio",Xt);x.route("/api/cron",Je);x.route("/api/alerts",Qt);x.get("/admin/roles",async e=>e.html(Ms));x.use("/static/*",Nt({root:"./"}));x.use("/*.html",Nt({root:"./"}));x.get("/",e=>e.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IGP - Système de Gestion de Maintenance</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/icon-192.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#003B73">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Maintenance IGP">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"><\/script>
    <style>
        /* Background avec photo d'atelier IGP pour toutes les pages */
        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }

        .kanban-column {
            min-height: 400px;
            min-width: 260px;
            background: rgba(255, 255, 255, 0.50);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
        }

        .kanban-column:hover {
            background: rgba(255, 255, 255, 0.60);
            box-shadow: 0 8px 28px 0 rgba(0, 0, 0, 0.22);
            transform: translateY(-2px);
        }

        /* Colonnes vides prennent moins de place */
        .kanban-column.empty {
            flex: 0 0 auto;
            width: 200px;
        }

        /* Colonnes avec tickets prennent plus de place */
        .kanban-column.has-tickets {
            flex: 1 1 280px;
            max-width: 320px;
        }

        .ticket-card {
            background: linear-gradient(145deg, #ffffff, #f1f5f9);
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 10px;
            box-shadow:
                6px 6px 16px rgba(71, 85, 105, 0.30),
                -3px -3px 10px rgba(255, 255, 255, 0.9),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                0 2px 8px rgba(0, 0, 0, 0.15);
            cursor: grab;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            border: 1px solid rgba(203, 213, 225, 0.6);
            border-top: 1px solid rgba(255, 255, 255, 0.8);
            border-left: 1px solid rgba(255, 255, 255, 0.5);
            position: relative;
        }

        .ticket-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg,
                transparent,
                rgba(255, 255, 255, 0.9) 20%,
                rgba(255, 255, 255, 0.9) 80%,
                transparent
            );
            border-radius: 10px 10px 0 0;
        }

        .ticket-card::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 10px;
            padding: 1px;
            background: linear-gradient(145deg,
                rgba(255, 255, 255, 0.4),
                rgba(255, 255, 255, 0.1) 30%,
                transparent 50%,
                rgba(71, 85, 105, 0.1)
            );
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }

        .ticket-card:hover {
            box-shadow:
                8px 8px 24px rgba(71, 85, 105, 0.35),
                -4px -4px 14px rgba(255, 255, 255, 1),
                inset 0 1px 0 rgba(255, 255, 255, 0.6),
                0 4px 12px rgba(0, 0, 0, 0.20);
            transform: translateY(-3px) translateZ(10px);
        }
        .ticket-card:active {
            cursor: grabbing;
            box-shadow:
                4px 4px 10px rgba(71, 85, 105, 0.35),
                -2px -2px 8px rgba(255, 255, 255, 0.8),
                0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .ticket-card.dragging {
            opacity: 0.7;
            cursor: grabbing;
            transform: rotate(3deg) scale(1.05);
            box-shadow:
                12px 12px 32px rgba(71, 85, 105, 0.40),
                -6px -6px 18px rgba(255, 255, 255, 0.7),
                0 6px 16px rgba(0, 0, 0, 0.25);
        }
        .ticket-card.long-press-active {
            background: #eff6ff;
            box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
        }
        .kanban-column.drag-over {
            background: #dbeafe;
            border: 3px dashed #3b82f6;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.1);
            transform: scale(1.02);
            transition: all 0.2s ease;
        }
        .kanban-column.drag-valid {
            background: #d1fae5;
            border: 2px dashed #10b981;
        }
        .kanban-column.drag-invalid {
            background: #fee2e2;
            border: 2px dashed #ef4444;
        }
        .priority-high {
            border-left: 5px solid #ef4444;
            box-shadow:
                6px 6px 12px rgba(239, 68, 68, 0.15),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .priority-critical {
            border-left: 5px solid #dc2626;
            box-shadow:
                6px 6px 12px rgba(220, 38, 38, 0.2),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
            animation: pulse-subtle 3s ease-in-out infinite;
        }

        @keyframes pulse-subtle {
            0%, 100% {
                box-shadow:
                    6px 6px 12px rgba(220, 38, 38, 0.2),
                    -3px -3px 8px rgba(255, 255, 255, 0.8);
            }
            50% {
                box-shadow:
                    6px 6px 16px rgba(220, 38, 38, 0.3),
                    -3px -3px 8px rgba(255, 255, 255, 0.8);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .priority-medium {
            border-left: 5px solid #f59e0b;
            box-shadow:
                6px 6px 12px rgba(245, 158, 11, 0.12),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .priority-low {
            border-left: 5px solid #10b981;
            box-shadow:
                6px 6px 12px rgba(16, 185, 129, 0.1),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        .modal.active {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 20px 0;
        }
        @media (max-width: 640px) {
            .modal.active {
                padding: 10px 0;
                align-items: flex-start;
            }
        }
        .context-menu {
            position: fixed;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 200px;
            padding: 8px 0;
            max-height: calc(100vh - 20px);
            overflow-y: auto;
            overflow-x: hidden;
        }
        .context-menu-item {
            padding: 12px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background 0.2s;
            font-size: 15px;
        }
        .context-menu-item:hover {
            background: #f3f4f6;
        }
        .context-menu-item:active {
            background: #e5e7eb;
        }
        .context-menu-item i {
            margin-right: 12px;
            width: 20px;
        }

        /* Line clamp pour limiter les lignes de texte */
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        /* Scroll horizontal personnalisé */
        .overflow-x-auto {
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
        }
        .overflow-x-auto::-webkit-scrollbar {
            height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.5);
            border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.7);
        }

        /* MOBILE RESPONSIVE STYLES */
        @media (max-width: 1024px) {
            .kanban-grid {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .kanban-column {
                min-height: auto;
                width: 100% !important;
                max-width: none !important;
                flex: none !important;
            }
            .kanban-column.empty,
            .kanban-column.has-tickets {
                width: 100% !important;
            }
            .header-actions {
                flex-direction: column;
                gap: 8px;
                width: 100%;
            }
            .header-actions button {
                width: 100%;
                padding: 12px 16px;
                font-size: 16px;
            }
            .ticket-card {
                padding: 16px;
                font-size: 15px;
                min-height: 44px;
            }
            .context-menu-item {
                padding: 16px 20px;
                font-size: 16px;
                min-height: 48px;
            }
            .modal-content {
                width: 95vw !important;
                max-width: 95vw !important;
                margin: 10px;
            }
        }

        @media (max-width: 640px) {
            .header-title {
                flex-direction: column;
                align-items: flex-start;
            }
            .header-title h1 {
                font-size: 20px;
            }
            .kanban-column-header h3 {
                font-size: 14px;
            }
        }

        /* Titres de colonnes plus visibles */
        .kanban-column-header h3 {
            font-weight: 800;
            font-size: 16px;
            color: #1f2937;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .kanban-column-header span {
            font-weight: 700;
            font-size: 14px;
            color: #1f2937;
        }

        .ticket-card {
            color: #1f2937;
        }


        /* Header principal avec meilleure visibilité */
        @media (max-width: 640px) {
            /* Keep empty for structure */
        }

        @keyframes slideUp {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        /* ===== BOTTOM SHEET MOBILE ANIMATIONS ===== */
        @keyframes fadeInBackdrop {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUpSheet {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .bottom-sheet-backdrop {
            animation: fadeInBackdrop 0.2s ease-out;
        }

        .bottom-sheet-content {
            animation: slideUpSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }

        .no-tap-highlight {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
    </style>
</head>
<body>
    <div id="root">
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <svg style="width: 80px; height: 80px; margin: 0 auto 20px; animation: spin 1s linear infinite;" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#667eea" stroke-width="4" stroke-dasharray="80" stroke-dashoffset="60" stroke-linecap="round"/>
                </svg>
                <h2 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 8px;">Chargement de l'application</h2>
                <p style="color: #666; font-size: 14px;">Veuillez patienter...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    </div>

    <script>
        const API_URL = '/api';
        let authToken = localStorage.getItem('auth_token');
        let currentUser = null;

        // Variables globales pour titre et sous-titre personnalisés
        let companyTitle = 'Gestion de la maintenance et des réparations';
        let companySubtitle = 'Les Produits Verriers International (IGP) Inc.';

        // ✅ Configure axios to send cookies with every request (for HttpOnly auth_token)
        axios.defaults.withCredentials = true;

        if (authToken) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
        }


        const getStatusLabel = (status) => {
            const statusLabels = {
                'received': 'Requête Reçue',
                'diagnostic': 'Diagnostic',
                'in_progress': 'En Cours',
                'waiting_parts': 'En Attente Pièces',
                'completed': 'Terminé',
                'archived': 'Archivé'
            };
            return statusLabels[status] || status;
        };

        // FONCTION UTILITAIRE CENTRALE: Obtenir l'heure EST/EDT configurée
        // Lit timezone_offset_hours depuis localStorage (-5 pour EST, -4 pour EDT)
        // Cette fonction remplace tous les new Date() pour garantir que tout le monde voit la meme heure
        const getNowEST = () => {
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const nowUTC = new Date();
            return new Date(nowUTC.getTime() + (offset * 60 * 60 * 1000));
        };

        // FONCTION UTILITAIRE: Vérifier si scheduled_date est valide
        // D1 retourne parfois "null" comme string au lieu de null
        const hasScheduledDate = (scheduledDate) => {
            return scheduledDate && scheduledDate !== 'null' && scheduledDate !== '';
        };

        // Fonction pour formater les dates en heure locale de l'appareil
        // Format québécois: JJ-MM-AAAA HH:mm
        const formatDateEST = (dateString, includeTime = true) => {
            // Convertir le format SQL en ISO pour parsing correct avec Z pour UTC
            const isoDateString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
            // Ajouter Z pour forcer interpretation UTC
            const dateUTC = new Date(isoDateString + (isoDateString.includes('Z') ? '' : 'Z'));

            // Obtenir l'offset EST/EDT depuis localStorage
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            // Appliquer le decalage pour obtenir l'heure EST/EDT
            const dateEST = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));

            const day = String(dateEST.getUTCDate()).padStart(2, '0');
            const month = String(dateEST.getUTCMonth() + 1).padStart(2, '0');
            const year = dateEST.getUTCFullYear();

            if (includeTime) {
                const hours = String(dateEST.getUTCHours()).padStart(2, '0');
                const minutes = String(dateEST.getUTCMinutes()).padStart(2, '0');
                return day + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
            }

            return day + '-' + month + '-' + year;
        };

        // ============================================================================
        // NOUVELLES FONCTIONS UTILITAIRES: Conversion datetime-local ↔ UTC ↔ SQL
        // ============================================================================

        /**
         * Convertir datetime-local (format: "2025-11-15T14:30") vers UTC SQL
         * @param {string} localDateTime - Format: "YYYY-MM-DDTHH:MM" (heure locale saisie)
         * @returns {string} Format SQL: "YYYY-MM-DD HH:MM:SS" (en UTC)
         *
         * Exemple avec offset -5 (EST):
         * Input:  "2025-11-15T14:30" (14h30 locale)
         * Output: "2025-11-15 19:30:00" (19h30 UTC)
         */
        const localDateTimeToUTC = (localDateTime) => {
            if (!localDateTime) return null;

            // localDateTime = "2025-11-15T14:30"
            // IMPORTANT: Parser manuellement pour éviter interprétation du fuseau navigateur
            const parts = localDateTime.split('T');
            const dateParts = parts[0].split('-');
            const timeParts = parts[1].split(':');

            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Mois commence à 0
            const day = parseInt(dateParts[2]);
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);

            // Créer une date UTC avec ces valeurs (sans interprétation timezone)
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');

            // Calculer l'heure UTC en soustrayant l'offset
            // offset = -5 signifie "UTC-5", donc pour convertir local → UTC: UTC = local - offset
            // Exemple: 14:30 local avec offset -5 → UTC = 14:30 - (-5) = 14:30 + 5 = 19:30
            const utcHours = hours - offset;

            // Créer la date UTC directement
            const utcDate = new Date(Date.UTC(year, month, day, utcHours, minutes, 0));

            // Format SQL: YYYY-MM-DD HH:MM:SS
            const utcYear = utcDate.getUTCFullYear();
            const utcMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
            const utcDay = String(utcDate.getUTCDate()).padStart(2, '0');
            const utcHoursStr = String(utcDate.getUTCHours()).padStart(2, '0');
            const utcMinutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
            const seconds = '00';

            return utcYear + '-' + utcMonth + '-' + utcDay + ' ' + utcHoursStr + ':' + utcMinutes + ':' + seconds;
        };

        /**
         * Convertir UTC SQL vers datetime-local (format: "2025-11-15T14:30")
         * @param {string} sqlDateTime - Format: "YYYY-MM-DD HH:MM:SS" (en UTC)
         * @returns {string} Format datetime-local: "YYYY-MM-DDTHH:MM" (heure locale)
         *
         * Exemple avec offset -5 (EST):
         * Input:  "2025-11-15 19:30:00" (19h30 UTC)
         * Output: "2025-11-15T14:30" (14h30 locale)
         */
        const utcToLocalDateTime = (sqlDateTime) => {
            if (!sqlDateTime || sqlDateTime === 'null' || sqlDateTime === '') return '';

            // sqlDateTime = "2025-11-15 19:30:00" (UTC)
            const utcDateStr = sqlDateTime.replace(' ', 'T') + 'Z'; // "2025-11-15T19:30:00Z"
            const utcDate = new Date(utcDateStr);

            // Appliquer l'offset pour obtenir l'heure locale
            // offset = -5 signifie "UTC-5", donc pour convertir UTC → local: local = UTC + offset
            // Exemple: 19:30 UTC avec offset -5 → local = 19:30 + (-5) = 14:30
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const localDate = new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));

            // Format datetime-local: YYYY-MM-DDTHH:MM (utiliser UTC methods car on a déjà appliqué l'offset)
            const year = localDate.getUTCFullYear();
            const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(localDate.getUTCDate()).padStart(2, '0');
            const hours = String(localDate.getUTCHours()).padStart(2, '0');
            const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');

            return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
        };

        /**
         * Convertir une date SQL UTC vers un objet Date JavaScript
         * @param {string} sqlDateTime - Format: "YYYY-MM-DD HH:MM:SS" (UTC dans la DB)
         * @returns {Date} Objet Date parsé en UTC
         * 
         * CRITICAL: Les dates dans la DB sont stockées en UTC.
         * JavaScript's new Date("YYYY-MM-DD HH:MM:SS") les interprète comme LOCAL TIME.
         * On doit ajouter 'Z' pour forcer l'interprétation UTC.
         */
        const parseUTCDate = (sqlDateTime) => {
            if (!sqlDateTime || sqlDateTime === 'null' || sqlDateTime === '') return null;
            
            // Convertir "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SSZ"
            const isoFormat = sqlDateTime.replace(' ', 'T');
            const utcFormat = isoFormat + (isoFormat.includes('Z') ? '' : 'Z');
            return new Date(utcFormat);
        };

        // ============================================================================

        // Fonction pour calculer le temps écoulé depuis la création
        // Retourne un objet {days, hours, minutes, seconds, color, bgColor}
        const getElapsedTime = (createdAt) => {
            const now = getNowEST();
            // Convertir le format SQL "YYYY-MM-DD HH:MM:SS" en format ISO "YYYY-MM-DDTHH:MM:SS"
            // Si la date contient déjà un T, on ne touche pas
            const isoCreatedAt = createdAt.includes('T') ? createdAt : createdAt.replace(' ', 'T');
            // Ajouter Z pour forcer interpretation UTC
            const createdUTC = new Date(isoCreatedAt + (isoCreatedAt.includes('Z') ? '' : 'Z'));
            // Appliquer l'offset EST/EDT
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const created = new Date(createdUTC.getTime() + (offset * 60 * 60 * 1000));

            // Si la date est invalide, retourner 0
            if (isNaN(created.getTime())) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, color: 'text-gray-500', bgColor: 'bg-gray-50', icon: '⚪' };
            }

            const diffMs = now - created;

            // Si diffMs est négatif (date future), retourner 0
            if (diffMs < 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, color: 'text-gray-500', bgColor: 'bg-gray-50', icon: '⚪' };
            }

            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            // Déterminer la couleur et le fond selon l'urgence
            let color = 'text-green-700';
            let bgColor = 'bg-green-50 border-green-200';
            let icon = '🟢';

            if (days >= 7) {
                color = 'text-red-700 font-bold';
                bgColor = 'bg-red-50 border-red-300';
                icon = '🔴';
            } else if (days >= 3) {
                color = 'text-amber-700 font-semibold';
                bgColor = 'bg-amber-50 border-amber-200';
                icon = '🟠';
            } else if (days >= 1) {
                color = 'text-yellow-700';
                bgColor = 'bg-yellow-50 border-yellow-200';
                icon = '🟡';
            }

            return { days, hours, minutes, seconds, color, bgColor, icon };
        };

        // Formater le texte du chronomètre avec secondes
        const formatElapsedTime = (elapsed) => {
            if (elapsed.days > 0) {
                return elapsed.days + 'j ' + String(elapsed.hours).padStart(2, '0') + ':' + String(elapsed.minutes).padStart(2, '0');
            } else if (elapsed.hours > 0) {
                return elapsed.hours + 'h ' + String(elapsed.minutes).padStart(2, '0') + ':' + String(elapsed.seconds).padStart(2, '0');
            } else if (elapsed.minutes > 0) {
                return elapsed.minutes + 'min ' + String(elapsed.seconds).padStart(2, '0') + 's';
            } else {
                return elapsed.seconds + 's';
            }
        };


        // Composant de notification personnalisé
        const NotificationModal = ({ show, message, type, onClose }) => {
            if (!show) return null;

            const colors = {
                success: 'bg-green-50 border-green-500 text-green-800',
                error: 'bg-red-50 border-red-500 text-red-800',
                info: 'bg-blue-50 border-blue-500 text-blue-800'
            };

            const icons = {
                success: 'fa-check-circle text-green-600',
                error: 'fa-exclamation-circle text-red-600',
                info: 'fa-info-circle text-blue-600'
            };

            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'flex items-start gap-4' },
                        React.createElement('i', {
                            className: 'fas ' + icons[type] + ' text-3xl mt-1'
                        }),
                        React.createElement('div', { className: 'flex-1' },
                            React.createElement('p', { className: 'text-lg font-semibold mb-4' }, message)
                        )
                    ),
                    React.createElement('div', { className: 'flex justify-end mt-4' },
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-700 font-semibold'
                        }, 'OK')
                    )
                )
            );
        };

        // Composant de confirmation personnalisé
        const ConfirmModal = ({ show, message, onConfirm, onCancel }) => {
            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
                onClick: onCancel
            },
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'flex items-start gap-4 mb-6' },
                        React.createElement('i', {
                            className: 'fas fa-exclamation-triangle text-yellow-600 text-3xl mt-1'
                        }),
                        React.createElement('div', { className: 'flex-1' },
                            React.createElement('p', { className: 'text-lg font-semibold' }, message)
                        )
                    ),
                    React.createElement('div', { className: 'flex justify-end gap-3' },
                        React.createElement('button', {
                            onClick: onCancel,
                            className: 'px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-semibold'
                        }, 'Annuler'),
                        React.createElement('button', {
                            onClick: onConfirm,
                            className: 'px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold'
                        }, 'Confirmer')
                    )
                )
            );
        };

        // Composant Toast pour notifications rapides
        const Toast = ({ show, message, type, onClose }) => {
            React.useEffect(() => {
                if (show) {
                    const timer = setTimeout(() => {
                        onClose();
                    }, 3000);
                    return () => clearTimeout(timer);
                }
            }, [show]);

            if (!show) return null;

            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                info: 'bg-blue-500'
            };

            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };

            return React.createElement('div', {
                className: 'fixed bottom-4 right-4 z-50 animate-slide-up',
                style: { animation: 'slideUp 0.3s ease-out' }
            },
                React.createElement('div', {
                    className: colors[type] + ' text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md'
                },
                    React.createElement('i', { className: 'fas ' + icons[type] + ' text-xl' }),
                    React.createElement('p', { className: 'font-semibold flex-1' }, message),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'text-white hover:text-gray-200 text-xl ml-2'
                    }, '×')
                )
            );
        };

        // Composant Chronomètre dynamique (mise à jour chaque seconde)
        const TicketTimer = ({ createdAt, status }) => {
            const [elapsed, setElapsed] = React.useState(() => getElapsedTime(createdAt));

            React.useEffect(() => {
                // Ne pas afficher le chronomètre si le ticket est terminé ou archivé
                if (status === 'completed' || status === 'archived') {
                    return;
                }

                // Mettre à jour chaque seconde pour afficher les secondes
                const interval = setInterval(() => {
                    setElapsed(getElapsedTime(createdAt));
                }, 1000); // 1000ms = 1 seconde

                return () => clearInterval(interval);
            }, [createdAt, status]);

            // Ne pas afficher si ticket terminé/archivé
            if (status === 'completed' || status === 'archived') {
                return null;
            }

            return React.createElement('div', {
                className: 'mt-1.5 pt-1.5 border-t border-gray-200 text-xs ' + elapsed.color
            },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', { className: 'flex items-center gap-1' },
                        React.createElement('span', {}, elapsed.icon),
                        React.createElement('i', { className: 'fas fa-hourglass-half' }),
                        React.createElement('span', { className: 'ml-1 text-gray-600 font-normal' }, 'Requête reçue depuis:')
                    ),
                    React.createElement('span', { className: 'font-bold font-mono' }, formatElapsedTime(elapsed))
                )
            );
        };

        // Composant Compte a rebours pour date planifiee (avec changement de couleur)
        const ScheduledCountdown = ({ scheduledDate }) => {
            const [countdown, setCountdown] = React.useState(() => getCountdownInfo(scheduledDate));

            React.useEffect(() => {
                const interval = setInterval(() => {
                    setCountdown(getCountdownInfo(scheduledDate));
                }, 1000); // Mise a jour chaque seconde

                return () => clearInterval(interval);
            }, [scheduledDate]);

            return React.createElement('div', {
                className: 'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-semibold ' + countdown.className
            },
                React.createElement('i', { className: 'fas fa-clock' }),
                React.createElement('span', {}, countdown.text)
            );
        };

        // Fonction pour calculer le compte a rebours et determiner la couleur
        const getCountdownInfo = (scheduledDate) => {
            if (!scheduledDate) return { text: '', className: '', isOverdue: false };

            const now = getNowEST();
            const scheduledISO = scheduledDate.replace(' ', 'T');
            // Ajouter Z pour forcer interpretation UTC
            const scheduledUTC = new Date(scheduledISO + (scheduledISO.includes('Z') ? '' : 'Z'));
            // Appliquer l'offset EST/EDT
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const scheduled = new Date(scheduledUTC.getTime() + (offset * 60 * 60 * 1000));
            const diffMs = scheduled - now;
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            let text = '';
            let className = '';
            let isOverdue = false;

            if (diffMs < 0) {
                // En retard
                const absMs = Math.abs(diffMs);
                const absHours = Math.floor(absMs / (1000 * 60 * 60));
                const absMinutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
                const absSeconds = Math.floor((absMs % (1000 * 60)) / 1000);
                const absDays = Math.floor(absMs / (1000 * 60 * 60 * 24));

                if (absDays > 0) {
                    text = 'Retard: ' + absDays + 'j ' + (absHours % 24) + 'h ' + absMinutes + 'min ' + absSeconds + 's';
                } else if (absHours > 0) {
                    text = 'Retard: ' + absHours + 'h ' + absMinutes + 'min ' + absSeconds + 's';
                } else {
                    text = 'Retard: ' + absMinutes + 'min ' + absSeconds + 's';
                }
                className = 'bg-red-100 text-red-800 animate-pulse';
                isOverdue = true;
            } else if (diffHours < 1) {
                // Moins de 1h - TRES URGENT (avec secondes)
                text = diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-red-100 text-red-800 animate-pulse';
            } else if (diffHours < 2) {
                // Moins de 2h - URGENT (avec secondes)
                text = Math.floor(diffHours) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-red-100 text-red-800';
            } else if (diffHours < 24) {
                // Moins de 24h - Urgent (avec minutes et secondes)
                text = Math.floor(diffHours) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-amber-100 text-amber-800';
            } else if (diffDays < 3) {
                // Moins de 3 jours - Attention (avec secondes)
                text = Math.floor(diffDays) + 'j ' + Math.floor(diffHours % 24) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-yellow-100 text-yellow-800';
            } else {
                // Plus de 3 jours - OK (avec secondes)
                text = Math.floor(diffDays) + 'j ' + Math.floor(diffHours % 24) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-green-100 text-green-800';
            }

            return { text, className, isOverdue };
        };

        // Composant Guide Utilisateur
        const UserGuideModal = ({ show, onClose, currentUser }) => {
            const [activeSection, setActiveSection] = React.useState('introduction');

            if (!show) return null;

            // console.log('UserGuideModal render - activeSection:', activeSection, 'currentUser:', currentUser);

            // Fonction pour obtenir le badge du rôle actuel
            const getUserRoleBadge = () => {
                if (!currentUser) return '❓';
                const badges = {
                    'admin': '👑 Admin', 'director': '📊 Directeur', 'supervisor': '⭐ Superviseur', 'coordinator': '🎯 Coordonnateur', 'planner': '📅 Planificateur',
                    'senior_technician': '🔧 Tech. Senior', 'technician': '🔧 Technicien', 'team_leader': '👔 Chef Équipe', 'furnace_operator': '🔥 Op. Four', 'operator': '👷 Opérateur',
                    'safety_officer': '🛡️ Agent SST', 'quality_inspector': '✓ Insp. Qualité', 'storekeeper': '📦 Magasinier', 'viewer': '👁️ Lecture'
                };
                return badges[currentUser.role] || '👤 ' + currentUser.role;
            };

            const sections = {
                introduction: {
                    title: "🎯 Démarrage Rapide",
                    icon: "fa-rocket",
                    color: "blue",
                    content: [
                        "👋 Bienvenue! Ce guide est fait pour aller VITE.",
                        "",
                        "🔍 CLIQUEZ sur une section à gauche",
                        "⚡ SCANNEZ les étapes en 30 secondes",
                        "✅ FERMEZ avec Escape",
                        "",
                        "💡 Astuce: Gardez ce guide ouvert pendant que vous travaillez!"
                    ]
                },
                connexion: {
                    title: "🔐 Se Connecter",
                    icon: "fa-sign-in-alt",
                    color: "green",
                    content: [
                        "🌐 mecanique.igpglass.ca",
                        "📧 Votre email",
                        "🔑 Votre mot de passe",
                        "✅ Clic 'Se connecter'",
                        "",
                        "❌ Mot de passe oublié? → Contactez admin"
                    ]
                },
                roles: {
                    title: "👥 Les 14 Rôles Système",
                    icon: "fa-users",
                    color: "purple",
                    content: [
                        "📊 DIRECTION:",
                        "• 👑 Admin → Tout faire + Gestion utilisateurs",
                        "• 📊 Directeur → Vue complète + Rapports",
                        "",
                        "⚙️ MANAGEMENT MAINTENANCE:",
                        "• ⭐ Superviseur → Coordination équipe technique",
                        "• 🎯 Coordonnateur → Planification maintenance",
                        "• 📅 Planificateur → Gestion planning",
                        "",
                        "🔧 TECHNIQUE:",
                        "• 🔧 Technicien Senior → Expert + Formations",
                        "• 🔧 Technicien → Interventions techniques",
                        "",
                        "🏭 PRODUCTION:",
                        "• 👔 Chef Équipe → Supervision opérations",
                        "• 🔥 Opérateur Four → Gestion fours",
                        "• 👷 Opérateur → Créer tickets",
                        "",
                        "🛡️ SUPPORT:",
                        "• 🛡️ Agent SST → Santé & Sécurité",
                        "• ✓ Inspecteur Qualité → Contrôle qualité",
                        "• 📦 Magasinier → Gestion pièces",
                        "",
                        "👁️ TRANSVERSAL:",
                        "• 👁️ Lecture Seule → Consultation uniquement",
                        "",
                        "📌 VOUS ÊTES: " + getUserRoleBadge(),
                        "",
                        "💡 14 rôles prédéfinis - Impossible d'en créer d'autres"
                    ]
                },
                kanban: {
                    title: "📊 Le Tableau",
                    icon: "fa-columns",
                    color: "blue",
                    content: [
                        "6 colonnes = 6 étapes:",
                        "",
                        "🟦 Requête → 🟨 Diagnostic → 🟧 En Cours",
                        "🟪 Attente Pièces → 🟩 Terminé → ⬜ Archivé",
                        "",
                        "🖱️ DÉPLACER (Techniciens):",
                        "• PC: Glisser-déposer",
                        "• Mobile: Tap + Choisir statut"
                    ]
                },
                creer_ticket: {
                    title: "➕ Créer un Ticket",
                    icon: "fa-plus-circle",
                    color: "orange",
                    content: [
                        "1️⃣ Bouton orange 'Nouveau Ticket'",
                        "2️⃣ Remplir: Titre + Machine + Priorité",
                        "3️⃣ 📸 PHOTO? → 'Prendre photo' (mobile = caméra auto)",
                        "4️⃣ Clic 'Créer'",
                        "",
                        "✅ ID auto: IGP-PDE-20250103-001",
                        "",
                        "⚡ RAPIDE: 30 secondes max!"
                    ]
                },
                details_ticket: {
                    title: "🔍 Voir un Ticket",
                    icon: "fa-info-circle",
                    color: "blue",
                    content: [
                        "👆 CLIC sur une carte",
                        "",
                        "👀 Vous voyez:",
                        "• 📝 Toutes les infos",
                        "• 🕒 Timeline (historique)",
                        "• 📸 Photos/vidéos",
                        "• 💬 Commentaires",
                        "",
                        "⚡ Ajoutez: commentaire, photos, etc."
                    ]
                },
                commentaires: {
                    title: '💬 Commenter',
                    icon: 'fa-comments',
                    color: 'green',
                    content: [
                        '1️⃣ Ouvrir ticket',
                        '2️⃣ Scroll en bas',
                        '3️⃣ Taper commentaire',
                        '4️⃣ Clic "Ajouter"',
                        '',
                        "💡 UTILITÉ:",
                        "• Donner + d'infos",
                        "• Expliquer réparation",
                        "• Communiquer avancement"
                    ]
                },
                medias: {
                    title: "📸 Photos",
                    icon: "fa-camera",
                    color: "red",
                    content: [
                        "📱 MOBILE? Caméra auto!",
                        "",
                        "➕ AJOUTER:",
                        "• Création: 'Prendre photo'",
                        "• Après: Ouvrir ticket + 'Ajouter médias'",
                        "",
                        "👀 VOIR:",
                        "• Clic photo = plein écran",
                        "",
                        "💡 Plusieurs photos OK!"
                    ]
                },
                recherche: {
                    title: '🔍 Rechercher',
                    icon: 'fa-search',
                    color: 'purple',
                    content: [
                        '🔎 Barre recherche en haut',
                        '⚡ Résultats instantanés',
                        '',
                        '📝 CHERCHEZ: ID, titre, machine',
                        '🎨 Filtre priorité: 🔴 Critique 🟠 Élevée',
                        '',
                        '💡 Clic colonne = filtre statut'
                    ]
                },
                gestion_users: {
                    title: '👥 Gestion Users (Admin)',
                    icon: 'fa-users-cog',
                    color: 'purple',
                    content: [
                        '⚠️ ADMINS SEULEMENT',
                        '',
                        '🟣 Bouton "Utilisateurs" en haut',
                        '🔎 Recherche: Nom ou email',
                        '',
                        '🟠 CRÉER: Bouton orange → Remplir → OK',
                        '🔵 MODIFIER: Bouton bleu → Changer → Save',
                        '🟡 MOT DE PASSE: "MdP" → Nouveau (6+ chars)',
                        '🔴 SUPPRIMER: Rouge → Confirmer',
                        '',
                        '💡 Escape = Effacer recherche'
                    ]
                },
                mobile: {
                    title: '📱 Sur Mobile',
                    icon: 'fa-mobile-alt',
                    color: 'pink',
                    content: [
                        '📲 100% responsive!',
                        '',
                        '👆 TAP carte → Voir détails',
                        '🎬 DÉPLACER: Tap → Menu statut → OK',
                        '📸 PHOTO: Caméra auto-ouvre!',
                        '',
                        '🤏 Pinch = Zoom photos',
                        '📜 Scroll fluide',
                        '',
                        '💡 Boutons verticaux = facile pouce'
                    ]
                },
                raccourcis: {
                    title: "⌨️ Raccourcis",
                    icon: "fa-keyboard",
                    color: "gray",
                    content: [
                        "⎋ Escape = Fermer modal/effacer",
                        "↹ Tab = Champ suivant",
                        "↵ Enter = Soumettre formulaire",
                        "",
                        "💡 ASTUCES:",
                        "• ⏳ Spinner = Action en cours",
                        "• 🟢 Toast = Confirmation (3 sec)",
                        "• 🎯 Auto-focus = Commence à taper direct"
                    ]
                },
                securite: {
                    title: "🔒 Sécurité",
                    icon: "fa-lock",
                    color: "red",
                    content: [
                        "🔑 Mot de passe: 6+ chars, secret!",
                        "🚪 Déconnexion après usage",
                        "",
                        "✅ CE QUI EST SÛR:",
                        "• 🔐 Cryptage HTTPS",
                        "• 💾 Sauvegarde auto temps-réel",
                        "• 📜 Tout est tracé (historique)",
                        "",
                        "⚠️ Respectez votre rôle = sécurité max"
                    ]
                },
                problemes: {
                    title: "🆘 Problèmes?",
                    icon: "fa-exclamation-triangle",
                    color: "yellow",
                    content: [
                        "🔄 Page blanche? → F5 (rafraîchir)",
                        "🚫 Connexion? → Vérif email/MdP",
                        "⏳ Bouton bloqué? → Attendre spinner",
                        "📸 Photo fail? → Max 10MB, JPG/PNG/MP4",
                        "",
                        "💡 CHROME = Recommandé",
                        "",
                        "❌ Autre souci? → Contactez admin",
                        "📋 Décrivez: quoi + navigateur"
                    ]
                },
                optimisations: {
                    title: "⚡ Nouveautés v2.8.1",
                    icon: "fa-rocket",
                    color: "green",
                    content: [
                        "🚀 OPTIMISATIONS PERFORMANCE:",
                        "• ⚡ 40% moins de re-renders React",
                        "• 🧠 Mémorisation intelligente (useMemo/useCallback)",
                        "• 🐛 Zéro memory leaks",
                        "• 📦 Build 15% plus rapide",
                        "",
                        "🧹 CODE NETTOYÉ:",
                        "• 🗑️ -1452 lignes code obsolète",
                        "• 📦 -9 packages npm inutiles",
                        "• 🎯 RoleDropdown portal optimisé",
                        "",
                        "🎯 STABILITÉ MAXIMALE:",
                        "• ✅ Fiabilité absolue",
                        "• ✅ Performance optimale",
                        "• ✅ Maintenabilité améliorée",
                        "",
                        "💡 L'app est plus rapide et stable!"
                    ]
                },
                contact: {
                    title: "📞 Contact",
                    icon: "fa-phone",
                    color: "teal",
                    content: [
                        "🆘 SUPPORT: Votre admin système",
                        "📧 Email: [À configurer]",
                        "☎️ Tél: [À configurer]",
                        "",
                        "💡 Suggestions? Bugs? → Partagez!",
                        "",
                        "🎓 RESSOURCES:",
                        "• 🌐 mecanique.igpglass.ca",
                        "• 📖 Ce guide",
                        "• 🏷️ Version 2.8.1"
                    ]
                }
            };

            const menuItems = [
                { id: 'introduction', icon: 'fa-home', label: 'Introduction' },
                { id: 'connexion', icon: 'fa-sign-in-alt', label: 'Connexion' },
                { id: 'roles', icon: 'fa-users', label: 'Rôles & Permissions' },
                { id: 'kanban', icon: 'fa-columns', label: 'Tableau Kanban' },
                { id: 'creer_ticket', icon: 'fa-plus-circle', label: 'Créer un Ticket' },
                { id: 'details_ticket', icon: 'fa-info-circle', label: 'Détails Ticket' },
                { id: 'commentaires', icon: 'fa-comments', label: 'Commentaires' },
                { id: 'medias', icon: 'fa-camera', label: 'Photos & Vidéos' },
                { id: 'recherche', icon: 'fa-search', label: 'Recherche' },
                { id: 'gestion_users', icon: 'fa-users-cog', label: 'Gestion Utilisateurs' },
                { id: 'mobile', icon: 'fa-mobile-alt', label: 'Mobile' },
                { id: 'raccourcis', icon: 'fa-keyboard', label: 'Raccourcis Clavier' },
                { id: 'securite', icon: 'fa-lock', label: 'Sécurité' },
                { id: 'optimisations', icon: 'fa-rocket', label: 'Nouveautés v2.8.1' },
                { id: 'problemes', icon: 'fa-exclamation-triangle', label: 'Problèmes' },
                { id: 'contact', icon: 'fa-phone', label: 'Contact' }
            ];

            React.useEffect(() => {
                const handleEscape = (e) => {
                    if (e.key === 'Escape' && show) {
                        onClose();
                    }
                };
                document.addEventListener('keydown', handleEscape);
                return () => document.removeEventListener('keydown', handleEscape);
            }, [show]);

            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-50 p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl max-h-[90vh] flex flex-col',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'flex justify-between items-center p-6 border-b-2 border-gradient-to-r from-slate-400 to-gray-400 bg-gradient-to-r from-slate-50/50 to-gray-50/50 backdrop-blur-sm rounded-t-2xl' },
                        React.createElement('h2', { className: 'text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent flex items-center gap-2' },
                            React.createElement('i', { className: 'fas fa-book text-blue-600' }),
                            "Guide Utilisateur"
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-gray-500 hover:text-gray-700 text-2xl'
                        }, '×')
                    ),

                    React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
                        React.createElement('div', { className: 'w-64 bg-gradient-to-b from-slate-50/80 to-gray-50/80 backdrop-blur-sm p-4 overflow-y-auto border-r-2 border-gray-200/50' },
                            React.createElement('nav', { className: 'space-y-1' },
                                menuItems.map(item =>
                                    React.createElement('button', {
                                        key: item.id,
                                        onClick: () => setActiveSection(item.id),
                                        className: 'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ' +
                                            (activeSection === item.id ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md' : 'hover:bg-white/60 hover:shadow-sm text-gray-700')
                                    },
                                        React.createElement('i', { className: 'fas ' + item.icon + ' w-5' }),
                                        React.createElement('span', { className: 'text-sm' }, item.label)
                                    )
                                )
                            )
                        ),

                        React.createElement('div', { className: 'flex-1 p-8 overflow-y-auto bg-gradient-to-br from-white/50 to-gray-50/30 backdrop-blur-sm' },
                            React.createElement('div', { className: 'max-w-3xl mx-auto' },
                                React.createElement('div', { className: 'bg-white/95 rounded-2xl shadow-xl p-8 border border-white/50' },
                                    React.createElement('h3', {
                                        className: 'text-3xl font-bold mb-6 bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent flex items-center gap-3'
                                    },
                                        React.createElement('i', {
                                            className: 'fas ' + (sections[activeSection] ? sections[activeSection].icon : 'fa-question') + ' text-blue-600'
                                        }),
                                        sections[activeSection] ? sections[activeSection].title : 'Section manquante'
                                    ),
                                    React.createElement('div', { className: 'prose prose-lg max-w-none' },
                                        sections[activeSection] && sections[activeSection].content ? sections[activeSection].content.map((line, idx) =>
                                            React.createElement('p', {
                                                key: idx,
                                                className: line.startsWith('•') || line.startsWith('  ') ? 'ml-6 my-2 text-gray-700' :
                                                           line.startsWith('⚠️') || line.startsWith('✅') || line.startsWith('🚀') || line.startsWith('📊') || line.startsWith('⚙️') || line.startsWith('🔧') || line.startsWith('🏭') || line.startsWith('🛡️') || line.startsWith('👁️') ? 'font-bold my-4 text-lg text-slate-700' :
                                                           line.startsWith('💡') ? 'font-semibold my-3 text-green-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-500' :
                                                           line.startsWith('1️⃣') || line.startsWith('2️⃣') || line.startsWith('3️⃣') || line.startsWith('4️⃣') ? 'my-2 text-gray-800 font-medium' :
                                                           line === '' ? 'my-3' : 'my-3 text-gray-800',
                                                style: line === '' ? { height: '0.5rem' } : {}
                                            }, line || ' ')
                                        ) : React.createElement('p', { className: 'text-red-600 font-semibold' }, 'Contenu manquant pour: ' + activeSection)
                                    )
                                )
                            )
                        )
                    ),

                    React.createElement('div', { className: 'p-4 border-t-2 border-gray-200/50 bg-gradient-to-r from-slate-50/50 to-gray-50/50 backdrop-blur-sm rounded-b-2xl flex justify-between items-center' },
                        React.createElement('div', { className: 'flex items-center gap-4' },
                            React.createElement('p', { className: 'text-sm text-gray-600' },
                                "⎋ Escape pour fermer"
                            ),
                            React.createElement('span', { className: 'text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full' },
                                "✨ v2.8.1 - Mise à jour 2025-11-19"
                            )
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(37,99,235,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] border-t border-blue-300/50'
                        }, 'Fermer')
                    )
                )
            );
        };

        // Composant de prompt personnalisé
        const PromptModal = ({ show, message, onConfirm, onCancel }) => {
            const [value, setValue] = React.useState('');

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
                onClick: onCancel
            },
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'mb-4' },
                        React.createElement('p', { className: 'text-lg font-semibold mb-4' }, message),
                        React.createElement('input', {
                            type: 'password',
                            value: value,
                            onChange: (e) => setValue(e.target.value),
                            className: 'w-full px-3 py-2 border-2 rounded-md',
                            placeholder: 'Minimum 6 caracteres',
                            autoFocus: true
                        })
                    ),
                    React.createElement('div', { className: 'flex justify-end gap-3 mt-6' },
                        React.createElement('button', {
                            onClick: onCancel,
                            className: 'px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-semibold'
                        }, 'Annuler'),
                        React.createElement('button', {
                            onClick: () => onConfirm(value),
                            className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-700 font-semibold'
                        }, 'OK')
                    )
                )
            );
        };


        const LoginForm = ({ onLogin }) => {
            const [email, setEmail] = React.useState('');
            const [password, setPassword] = React.useState('');
            const [showPassword, setShowPassword] = React.useState(false);
            const [rememberMe, setRememberMe] = React.useState(false);
            const [loginTitle, setLoginTitle] = React.useState(companyTitle);
            const [loginSubtitle, setLoginSubtitle] = React.useState(companySubtitle);

            // Charger dynamiquement le titre et sous-titre à chaque affichage du login
            React.useEffect(() => {
                const loadLoginSettings = async () => {
                    try {
                        const titleRes = await axios.get(API_URL + '/settings/company_title');
                        if (titleRes.data.setting_value) {
                            setLoginTitle(titleRes.data.setting_value);
                        }
                    } catch (error) {
                        // Titre par défaut utilisé
                    }

                    try {
                        const subtitleRes = await axios.get(API_URL + '/settings/company_subtitle');
                        if (subtitleRes.data.setting_value) {
                            setLoginSubtitle(subtitleRes.data.setting_value);
                        }
                    } catch (error) {
                        // Sous-titre par défaut utilisé
                    }
                };

                loadLoginSettings();
            }, []); // Exécuter une fois au montage du composant

            const handleSubmit = (e) => {
                e.preventDefault();
                onLogin(email, password, rememberMe);
            };

            const handleInvalidEmail = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };

            const handleInvalidPassword = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };

            const handleInputEmail = (e) => {
                e.target.setCustomValidity("");
                setEmail(e.target.value);
            };

            const handleInputPassword = (e) => {
                e.target.setCustomValidity("");
                setPassword(e.target.value);
            };

            return React.createElement('div', {
                className: 'min-h-screen flex items-center justify-center',
                style: {
                    backgroundImage: 'url(/static/login-background.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }
            },
                React.createElement('div', {
                    className: 'p-8 rounded-2xl w-96 max-w-md mx-4',
                    style: {
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                        border: '1px solid rgba(255, 255, 255, 0.18)'
                    }
                },
                    React.createElement('div', { className: 'text-center mb-8' },
                        React.createElement('img', {
                            src: '/api/settings/logo?t=' + Date.now(),
                            alt: 'IGP Logo',
                            className: 'h-20 w-auto mx-auto mb-4',
                            onError: (e) => {
                                e.target.src = '/static/logo-igp.png';
                            }
                        }),
                        React.createElement('h1', {
                            className: 'text-lg sm:text-xl md:text-2xl font-bold mb-2 px-2 break-words',
                            style: {
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                color: '#003B73',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(255,255,255,0.8)'
                            }
                        }, loginTitle),
                        React.createElement('div', { className: 'inline-block px-3 py-1 mb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full shadow-md animate-pulse' },
                            React.createElement('i', { className: 'fas fa-tools mr-1' }),
                            'ENVIRONNEMENT DE TEST'
                        ),
                        React.createElement('p', {
                            className: 'text-xs sm:text-sm px-4 break-words font-semibold',
                            style: {
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                color: '#1f2937',
                                textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(255,255,255,0.9)'
                            }
                        }, loginSubtitle)
                    ),
                    React.createElement('form', {
                        onSubmit: handleSubmit,
                        autoComplete: 'off'
                    },
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-envelope mr-2 text-igp-blue' }),
                                'Email'
                            ),
                            React.createElement('input', {
                                type: 'email',
                                name: 'email',
                                autoComplete: 'off',
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: email,
                                onChange: handleInputEmail,
                                onInvalid: handleInvalidEmail,
                                placeholder: 'votre.email@igpglass.ca',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-lock mr-2 text-igp-blue' }),
                                'Mot de passe'
                            ),
                            React.createElement('div', { className: 'relative' },
                                React.createElement('input', {
                                    type: showPassword ? 'text' : 'password',
                                    name: 'password',
                                    autoComplete: 'new-password',
                                    className: 'w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                    value: password,
                                    onChange: handleInputPassword,
                                    onInvalid: handleInvalidPassword,
                                    placeholder: '••••••••',
                                    required: true
                                }),
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: () => setShowPassword(!showPassword),
                                    className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-igp-blue transition-colors',
                                    'aria-label': showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                                },
                                    React.createElement('i', {
                                        className: showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                                    })
                                )
                            )
                        ),
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'flex items-center cursor-pointer' },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: rememberMe,
                                    onChange: (e) => setRememberMe(e.target.checked),
                                    className: 'mr-2 h-4 w-4 text-igp-blue border-gray-300 rounded focus:ring-2 focus:ring-igp-blue'
                                }),
                                React.createElement('span', { className: 'text-sm text-white font-semibold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' },
                                    React.createElement('i', { className: 'fas fa-clock mr-1 text-blue-300' }),
                                    'Se souvenir de moi (30 jours)'
                                )
                            )
                        ),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'w-full bg-igp-blue text-white font-bold py-3 px-4 rounded-md hover:bg-igp-blue-dark transition duration-200 shadow-lg'
                        },
                            React.createElement('i', { className: 'fas fa-sign-in-alt mr-2' }),
                            'Se connecter'
                        )
                    ),
                    React.createElement('div', { className: 'mt-8 pt-6 border-t border-gray-200 text-center' },
                        React.createElement('p', { className: 'text-xs text-gray-500' },
                            React.createElement('i', { className: 'fas fa-code mr-1' }),
                            'Conçue par ',
                            React.createElement('span', { className: 'font-bold text-igp-blue' }, "Le département des Technologies de l'Information des Produits Verriers International (IGP) Inc.")
                        )
                    )
                )
            );
        };


        // ===== BOTTOM SHEET MOBILE POUR DEPLACER TICKETS =====
        const MoveTicketBottomSheet = ({ show, onClose, ticket, onMove, onDelete, currentUser }) => {
            const statuses = [
                { key: 'received', label: 'Requete Recue', icon: '🟦', color: 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200' },
                { key: 'diagnostic', label: 'Diagnostic', icon: '🟨', color: 'bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200' },
                { key: 'in_progress', label: 'En Cours', icon: '🟧', color: 'bg-orange-50 hover:bg-orange-100 active:bg-orange-200' },
                { key: 'waiting_parts', label: 'En Attente Pieces', icon: '🟪', color: 'bg-purple-50 hover:bg-purple-100 active:bg-purple-200' },
                { key: 'completed', label: 'Termine', icon: '🟩', color: 'bg-green-50 hover:bg-green-100 active:bg-green-200' },
                { key: 'archived', label: 'Archive', icon: '⬜', color: 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200' }
            ];

            if (!show || !ticket) return null;

            // Verifier si ticket est assigné ou planifié (pour affichage info seulement, pas de blocage)
            const isAssigned = ticket.assigned_to !== null && ticket.assigned_to !== undefined;
            const isPlanned = isAssigned && ticket.scheduled_date;

            const handleStatusSelect = async (status) => {
                if (status === ticket.status) {
                    onClose();
                    return;
                }

                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }

                await onMove(ticket, status);
                onClose();
            };

            return React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-end bottom-sheet-backdrop no-tap-highlight',
                style: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                },
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white w-full rounded-t-3xl shadow-2xl bottom-sheet-content',
                    style: {
                        maxHeight: '80vh'
                    },
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', {
                        className: 'p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100'
                    },
                        React.createElement('div', { className: 'flex items-center justify-between mb-2' },
                            React.createElement('h3', { className: 'text-lg font-bold text-gray-800' }, 'Deplacer le ticket'),
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'text-gray-500 hover:text-gray-700 text-2xl leading-none p-2 no-tap-highlight',
                                type: 'button'
                            }, '×')
                        ),
                        React.createElement('div', { className: 'text-sm' },
                            React.createElement('div', { className: 'font-mono text-xs text-gray-600' }, ticket.ticket_id),
                            React.createElement('div', { className: 'font-semibold text-gray-800 mt-1 truncate' }, ticket.title)
                        ),
                        isAssigned ? React.createElement('div', {
                            className: 'mt-2 text-xs px-2 py-1 rounded ' + (isPlanned
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-orange-100 text-orange-700')
                        }, isPlanned
                            ? 'ℹ️ Ticket planifié - Déplacement manuel possible'
                            : 'ℹ️ Ticket assigné - Déplacement manuel possible') : null
                    ),

                    React.createElement('div', {
                        className: 'p-4 space-y-2 overflow-y-auto',
                        style: { maxHeight: '50vh' }
                    },
                        statuses.map(status =>
                            React.createElement('button', {
                                key: status.key,
                                onClick: () => handleStatusSelect(status.key),
                                disabled: status.key === ticket.status,
                                className:
                                    'w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between no-tap-highlight ' +
                                    (status.key === ticket.status
                                        ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                                        : status.color + ' border-transparent'),
                                style: {
                                    minHeight: '60px'
                                },
                                type: 'button'
                            },
                                React.createElement('div', { className: 'flex items-center gap-3' },
                                    React.createElement('span', {
                                        className: 'text-3xl',
                                        style: { lineHeight: '1' }
                                    }, status.icon),
                                    React.createElement('span', {
                                        className: 'font-semibold text-gray-800 text-left',
                                        style: { fontSize: '16px' }
                                    }, status.label)
                                ),
                                status.key === ticket.status &&
                                    React.createElement('i', {
                                        className: 'fas fa-check text-green-600',
                                        style: { fontSize: '20px' }
                                    })
                            )
                        )
                    ),

                    React.createElement('div', { className: 'p-4 border-t border-gray-200 space-y-2' },
                        // Bouton Supprimer (admin/supervisor/technicien peuvent tout supprimer, opérateur seulement ses propres tickets)
                        (() => {
                            const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'supervisor' || currentUser?.role === 'technician' ||
                                (currentUser?.role === 'operator' && ticket.reported_by === currentUser?.id);
                            return canDelete;
                        })() ?
                        React.createElement('button', {
                            onClick: () => {
                                if (navigator.vibrate) navigator.vibrate(50);
                                onDelete(ticket.id);
                                onClose();
                            },
                            className: 'w-full py-4 text-center font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-colors no-tap-highlight flex items-center justify-center gap-2',
                            style: {
                                fontSize: '16px'
                            },
                            type: 'button'
                        },
                            React.createElement('i', { className: 'fas fa-trash-alt' }),
                            'Supprimer le ticket'
                        ) : null,
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'w-full py-4 text-center font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl transition-colors no-tap-highlight',
                            style: {
                                fontSize: '16px'
                            },
                            type: 'button'
                        }, 'Annuler')
                    )
                )
            );
        };


        const CreateTicketModal = ({ show, onClose, machines, onTicketCreated, currentUser }) => {
            const [title, setTitle] = React.useState('');
            const [description, setDescription] = React.useState('');
            const [machineId, setMachineId] = React.useState('');
            const [priority, setPriority] = React.useState('medium');
            const [mediaFiles, setMediaFiles] = React.useState([]);
            const [mediaPreviews, setMediaPreviews] = React.useState([]);
            const [submitting, setSubmitting] = React.useState(false);
            const [uploadProgress, setUploadProgress] = React.useState(0);

            // États pour la planification (superviseur/admin seulement)
            const [assignedTo, setAssignedTo] = React.useState('');
            const [scheduledDate, setScheduledDate] = React.useState('');
            const [technicians, setTechnicians] = React.useState([]);

            // Charger la liste des techniciens si superviseur ou admin
            React.useEffect(() => {
                if (show && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
                    axios.get(API_URL + '/technicians')
                        .then(res => setTechnicians(res.data.technicians))
                        .catch(err => {});
                }
            }, [show, currentUser.role]);

            const handleFileChange = (e) => {
                const files = Array.from(e.target.files);
                setMediaFiles(prevFiles => [...prevFiles, ...files]);


                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setMediaPreviews(prev => [...prev, {
                            url: reader.result,
                            type: file.type,
                            name: file.name,
                            size: file.size
                        }]);
                    };
                    reader.readAsDataURL(file);
                });
            };

            const removeMedia = (index) => {
                setMediaFiles(prev => prev.filter((_, i) => i !== index));
                setMediaPreviews(prev => prev.filter((_, i) => i !== index));
            };

            const uploadMediaFiles = async (ticketId) => {
                if (mediaFiles.length === 0) return;

                for (let i = 0; i < mediaFiles.length; i++) {
                    const file = mediaFiles[i];
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('ticket_id', ticketId);

                    try {
                        await axios.post(API_URL + '/media/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 100));
                    } catch (error) {
                        // Erreur silencieuse
                    }
                }
            };

            const handleSubmit = async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setUploadProgress(0);

                try {
                    // Capturer l'heure UTC pour stockage dans la DB
                    const utcTime = new Date();
                    const year = utcTime.getUTCFullYear();
                    const month = String(utcTime.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(utcTime.getUTCDate()).padStart(2, '0');
                    const hours = String(utcTime.getUTCHours()).padStart(2, '0');
                    const minutes = String(utcTime.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(utcTime.getUTCSeconds()).padStart(2, '0');
                    const localTimestamp = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;

                    const requestBody = {
                        title,
                        description,
                        reporter_name: currentUser.first_name || currentUser.full_name || currentUser.email?.split('@')[0] || 'Utilisateur',
                        machine_id: parseInt(machineId),
                        priority,
                        created_at: localTimestamp
                    };

                    // Ajouter les champs de planification si superviseur/admin
                    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
                        if (assignedTo) {
                            // CRITICAL FIX: Use 0 (integer) for team assignment (compatible with INTEGER column)
                            requestBody.assigned_to = parseInt(assignedTo);
                        }
                        if (scheduledDate) {
                            // NOUVEAU: Conversion datetime-local → UTC SQL
                            // scheduledDate = "2025-11-15T14:30" (heure locale)
                            requestBody.scheduled_date = localDateTimeToUTC(scheduledDate);
                            // Résultat: "2025-11-15 19:30:00" (UTC avec offset -5)
                        }
                    }

                    const response = await axios.post(API_URL + '/tickets', requestBody);

                    const ticketId = response.data.ticket.id;


                    if (mediaFiles.length > 0) {
                        await uploadMediaFiles(ticketId);
                    }

                    alert('Ticket créé avec succès !' + (mediaFiles.length > 0 ? ' (' + mediaFiles.length + ' média(s) uploadé(s))' : ''));


                    setTitle('');
                    setDescription('');
                    setMachineId('');
                    setPriority('medium');
                    setAssignedTo('');
                    setScheduledDate('');
                    setMediaFiles([]);
                    setMediaPreviews([]);
                    setUploadProgress(0);
                    onClose();
                    onTicketCreated();
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
                } finally {
                    setSubmitting(false);
                }
            };

            // Gestionnaires validation en francais
            const handleInvalidField = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };

            const handleInputField = (e, setter) => {
                e.target.setCustomValidity("");
                setter(e.target.value);
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform hover:scale-[1.01] transition-all duration-300',
                    onClick: (e) => e.stopPropagation(),
                    style: {
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                        transform: 'translateZ(0)'
                    }
                },
                    React.createElement('div', { className: 'sticky top-0 bg-gradient-to-r from-blue-700 to-blue-800 text-white p-3 sm:p-5 flex justify-between items-center shadow-xl z-10 backdrop-blur-sm bg-opacity-95' },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                            React.createElement('i', { className: 'fas fa-plus-circle text-xl sm:text-2xl text-blue-300 flex-shrink-0' }),
                            React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' },
                                'Nouvelle Demande'
                            )
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                        },
                            React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                        )
                    ),
                    React.createElement('div', { className: 'p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-80px)] bg-gradient-to-br from-white/50 to-blue-50/30' },
                    React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-heading mr-2' }),
                                'Titre du problème *'
                            ),
                            React.createElement('input', {
                                type: 'text',
                                className: 'w-full px-4 py-3 bg-white/95 border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow hover:shadow-xl',
                                style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                value: title,
                                onChange: (e) => handleInputField(e, setTitle),
                                onInvalid: handleInvalidField,
                                placeholder: 'Ex: Bruit anormal sur la machine',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-align-left mr-2' }),
                                'Description détaillée *'
                            ),
                            React.createElement('textarea', {
                                className: 'w-full px-4 py-3 bg-white/95 border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-xl resize-none',
                                style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                value: description,
                                onChange: (e) => handleInputField(e, setDescription),
                                onInvalid: handleInvalidField,
                                placeholder: 'Décrivez le problème en détail...',
                                rows: 4,
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-cog mr-2' }),
                                'Machine concernée *'
                            ),
                            React.createElement('select', {
                                className: 'w-full px-4 py-3 bg-white/95 border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-xl cursor-pointer',
                                style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                value: machineId,
                                onChange: (e) => handleInputField(e, setMachineId),
                                onInvalid: handleInvalidField,
                                required: true
                            },
                                React.createElement('option', { value: '' }, '-- Sélectionnez une machine --'),
                                machines.map(m =>
                                    React.createElement('option', { key: m.id, value: m.id },
                                        m.machine_type + ' ' + m.model + ' - ' + m.location
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-camera mr-2 text-blue-700' }),
                                'Photos / Vidéos du problème'
                            ),
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*',
                                capture: 'environment',
                                onChange: handleFileChange,
                                className: 'hidden',
                                id: 'photo-upload'
                            }),
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*,video/*',
                                multiple: true,
                                onChange: handleFileChange,
                                className: 'hidden',
                                id: 'media-upload'
                            }),
                            React.createElement('div', { className: 'flex gap-2' },
                                React.createElement('label', {
                                    htmlFor: 'photo-upload',
                                    className: 'flex-1 px-4 py-3 border-2 border-dashed border-igp-blue rounded-md text-center cursor-pointer hover:bg-blue-50 transition-all flex items-center justify-center text-igp-blue font-semibold'
                                },
                                    React.createElement('i', { className: 'fas fa-camera mr-2' }),
                                    'Caméra'
                                ),
                                React.createElement('label', {
                                    htmlFor: 'media-upload',
                                    className: 'flex-1 px-4 py-3 border-2 border-dashed border-gray-400 rounded-md text-center cursor-pointer hover:bg-gray-50 transition-all flex items-center justify-center text-gray-700 font-semibold'
                                },
                                    React.createElement('i', { className: 'fas fa-images mr-2' }),
                                    'Galerie'
                                )
                            ),
                            mediaPreviews.length > 0 ? React.createElement('div', { className: 'mt-3 grid grid-cols-3 gap-2' },
                                mediaPreviews.map((preview, index) =>
                                    React.createElement('div', {
                                        key: index,
                                        className: 'relative group'
                                    },
                                        preview.type.startsWith('image/')
                                            ? React.createElement('img', {
                                                src: preview.url,
                                                alt: preview.name,
                                                className: 'w-full h-24 object-cover rounded border-2 border-gray-300 pointer-events-none'
                                            })
                                            : React.createElement('video', {
                                                src: preview.url,
                                                className: 'w-full h-24 object-cover rounded border-2 border-gray-300 pointer-events-none',
                                                controls: false
                                            }),
                                        React.createElement('button', {
                                            type: 'button',
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                removeMedia(index);
                                            },
                                            className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20',
                                            style: { opacity: 1 }
                                        },
                                            React.createElement('i', { className: 'fas fa-times text-sm' })
                                        ),
                                        React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded' },
                                            preview.type.startsWith('image/') ? '📷' : '🎥',
                                            ' ' + Math.round(preview.size / 1024) + ' KB'
                                        )
                                    )
                                )
                            ) : null,
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-exclamation-triangle mr-2' }),
                                'Priorité *'
                            ),
                            React.createElement('div', { className: 'grid grid-cols-4 gap-2' },
                                ['low', 'medium', 'high', 'critical'].map(p =>
                                    React.createElement('button', {
                                        key: p,
                                        type: 'button',
                                        onClick: () => setPriority(p),
                                        className: 'flex-1 min-w-0 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all text-center whitespace-nowrap overflow-hidden ' +
                                            (priority === p
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                    },
                                        React.createElement('span', { className: 'hidden sm:inline' },
                                            p === 'low' ? '🟢 Faible' :
                                            p === 'medium' ? '🟡 Moyenne' :
                                            p === 'high' ? '🟠 Haute' :
                                            '🔴 Critique'
                                        ),
                                        React.createElement('span', { className: 'inline sm:hidden' },
                                            p === 'low' ? '🟢 Faible' :
                                            p === 'medium' ? '🟡 Moy.' :
                                            p === 'high' ? '🟠 Haute' :
                                            '🔴 Crit.'
                                        )
                                    )
                                )
                            )
                        ),

                        // Section planification (superviseur/admin seulement)
                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ?
                            React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg' },
                                React.createElement('h3', { className: 'text-lg font-bold text-slate-700 mb-4 flex items-center' },
                                    React.createElement('i', { className: 'fas fa-calendar-alt mr-2' }),
                                    'Planification (Superviseur/Admin)'
                                ),

                                // Assigner à un technicien
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-user-cog mr-2' }),
                                        'Assigner à'
                                    ),
                                    React.createElement('select', {
                                        value: assignedTo,
                                        onChange: (e) => setAssignedTo(e.target.value),
                                        className: "w-full px-4 py-3 bg-white/97 border-2 border-gray-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-all hover:shadow-xl cursor-pointer font-semibold appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                        style: { boxShadow: '0 6px 20px rgba(147, 51, 234, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' }
                                    },
                                        React.createElement('option', { value: '' }, '-- Non assigné --'),
                                        React.createElement('option', { value: '0' }, '👥 À Équipe'),
                                        technicians.filter(tech => tech.id !== 0).map(tech =>
                                            React.createElement('option', {
                                                key: tech.id,
                                                value: tech.id
                                            },
                                                '👤 ' + tech.first_name
                                            )
                                        )
                                    )
                                ),

                                // Date de maintenance planifiée
                                React.createElement('div', { className: 'mb-2' },
                                    // Badge d'état
                                    scheduledDate ? React.createElement('div', { className: 'mb-3 p-2 rounded-lg bg-blue-50 border-2 border-blue-300' },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            React.createElement('i', { className: 'fas fa-calendar-check text-blue-600' }),
                                            React.createElement('span', { className: 'text-sm font-bold text-blue-800' },
                                                "État : PLANIFIÉ"
                                            )
                                        ),
                                        React.createElement('div', { className: 'mt-1 text-xs text-blue-700' },
                                            "📅 " + new Date(scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        )
                                    ) : assignedTo ? React.createElement('div', { className: 'mb-3 p-2 rounded-lg bg-orange-50 border-2 border-orange-300' },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            React.createElement('i', { className: 'fas fa-user-check text-orange-600' }),
                                            React.createElement('span', { className: 'text-sm font-bold text-orange-800' },
                                                "État : ASSIGNÉ"
                                            )
                                        ),
                                        React.createElement('div', { className: 'mt-1 text-xs text-orange-700' },
                                            "ℹ️ Ajoutez une date pour planifier"
                                        )
                                    ) : null,

                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-calendar-day mr-2' }),
                                        'Date et heure de maintenance' + (scheduledDate ? ' (modifier)' : ' (optionnelle)'),
                                        React.createElement('span', { className: 'ml-2 text-xs text-gray-500 font-normal' },
                                            '(heure locale EST/EDT)'
                                        )
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('input', {
                                            type: 'datetime-local',
                                            value: scheduledDate,
                                            onChange: (e) => setScheduledDate(e.target.value),
                                            className: 'flex-1 px-4 py-2 border-2 border-gray-300 rounded-md focus:border-blue-600 focus:outline-none'
                                        }),
                                        scheduledDate ? React.createElement('button', {
                                            type: 'button',
                                            onClick: () => setScheduledDate(''),
                                            className: 'px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-bold transition-all text-sm'
                                        },
                                            React.createElement('i', { className: 'fas fa-times mr-1' }),
                                            'Retirer'
                                        ) : null
                                    ) // Ferme le div flex gap-2 (ligne 2852)
                                ) // Ferme le div mb-2 (ligne 2824)
                            )
                        : null,

                        React.createElement('div', { className: 'flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-6 pt-4 border-t-2 border-gray-200 sticky bottom-0 bg-white' },
                            React.createElement('button', {
                                type: 'button',
                                onClick: onClose,
                                className: 'w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all font-semibold'
                            },
                                React.createElement('i', { className: 'fas fa-times mr-2' }),
                                'Annuler'
                            ),
                            React.createElement('button', {
                                type: 'submit',
                                disabled: submitting,
                                className: 'w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 shadow-lg transition-all font-semibold'
                            },
                                submitting
                                    ? React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' })
                                    : React.createElement('i', { className: 'fas fa-check mr-2' }),
                                submitting
                                    ? (uploadProgress > 0 ? 'Upload: ' + uploadProgress + '%' : 'Création...')
                                    : 'Créer le ticket' + (mediaFiles.length > 0 ? ' (' + mediaFiles.length + ' média(s))' : '')
                            )
                        )
                    )
                    )
                )
            ));
        };


        const TicketDetailsModal = ({ show, onClose, ticketId, currentUser, onTicketDeleted }) => {
            const [ticket, setTicket] = React.useState(null);
            const [loading, setLoading] = React.useState(true);
            const [selectedMedia, setSelectedMedia] = React.useState(null);
            const [comments, setComments] = React.useState([]);
            const [newComment, setNewComment] = React.useState('');
            const [submittingComment, setSubmittingComment] = React.useState(false);
            const [uploadingMedia, setUploadingMedia] = React.useState(false);
            const [newMediaFiles, setNewMediaFiles] = React.useState([]);
            const [newMediaPreviews, setNewMediaPreviews] = React.useState([]);
            const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });

            // États pour la planification (superviseur/admin seulement)
            const [editingSchedule, setEditingSchedule] = React.useState(false);
            const [scheduledAssignedTo, setScheduledAssignedTo] = React.useState('');
            const [scheduledDate, setScheduledDate] = React.useState('');
            const [technicians, setTechnicians] = React.useState([]);
            const [savingSchedule, setSavingSchedule] = React.useState(false);
            
            // États pour l'édition de priorité
            const [editingPriority, setEditingPriority] = React.useState(false);
            const [newPriority, setNewPriority] = React.useState('');
            const [savingPriority, setSavingPriority] = React.useState(false);

            React.useEffect(() => {
                if (show && ticketId) {
                    loadTicketDetails();
                    loadComments();
                }
            }, [show, ticketId]);

            // Charger les techniciens et pré-remplir le formulaire de planification
            React.useEffect(() => {
                if (show && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
                    axios.get(API_URL + '/technicians')
                        .then(res => setTechnicians(res.data.technicians))
                        .catch(err => {});
                }

                // Pré-remplir les champs si le ticket est déjà planifié
                if (ticket) {
                    // CRITICAL: Check !== null (not just falsy) because 0 is valid (team assignment)
                    setScheduledAssignedTo(ticket.assigned_to !== null && ticket.assigned_to !== undefined ? String(ticket.assigned_to) : '');
                    // NOUVEAU: Conversion UTC SQL → datetime-local
                    setScheduledDate(hasScheduledDate(ticket.scheduled_date) ? utcToLocalDateTime(ticket.scheduled_date) : '');
                }
            }, [show, currentUser.role, ticket]);

            const loadTicketDetails = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(API_URL + '/tickets/' + ticketId);
                    setTicket(response.data.ticket);
                } catch (error) {
                    alert('Erreur lors du chargement des détails du ticket');
                } finally {
                    setLoading(false);
                }
            };

            const loadComments = async () => {
                try {
                    const response = await axios.get(API_URL + '/comments/ticket/' + ticketId);
                    setComments(response.data.comments || []);
                } catch (error) {
                    // Erreur silencieuse
                }
            };

            const handleDeleteTicket = async () => {
                // Verification: technicien ne peut pas supprimer un ticket planifié (avec date) créé par quelqu'un d'autre
                if (currentUser.role === 'technician' && ticket?.scheduled_date && ticket?.reported_by !== currentUser.id) {
                    alert("Les techniciens ne peuvent pas supprimer les tickets planifiés créés par d'autres utilisateurs");
                    return;
                }

                setConfirmDialog({
                    show: true,
                    message: 'Supprimer ce ticket ?',
                    onConfirm: async () => {
                        setConfirmDialog({ show: false, message: '', onConfirm: null });
                        try {
                            await axios.delete(API_URL + '/tickets/' + ticketId);
                            alert('Ticket supprime avec succes');
                            onClose();
                            if (onTicketDeleted) onTicketDeleted();
                        } catch (error) {
                            alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                        }
                    }
                });
            };

            const handleDeleteMedia = async (mediaId) => {
                setConfirmDialog({
                    show: true,
                    message: 'Supprimer ce media ?',
                    onConfirm: async () => {
                        setConfirmDialog({ show: false, message: '', onConfirm: null });
                        try {
                            await axios.delete(API_URL + '/media/' + mediaId);
                            alert('Media supprime avec succes');
                            loadTicketDetails();
                        } catch (error) {
                            alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                        }
                    }
                });
            };

            const handleAddComment = async (e) => {
                e.preventDefault();
                if (!newComment.trim()) {
                    alert('Veuillez écrire un commentaire');
                    return;
                }

                setSubmittingComment(true);
                try {
                    // Capturer l'heure UTC pour stockage dans la DB
                    const utcTime = new Date();
                    const year = utcTime.getUTCFullYear();
                    const month = String(utcTime.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(utcTime.getUTCDate()).padStart(2, '0');
                    const hours = String(utcTime.getUTCHours()).padStart(2, '0');
                    const minutes = String(utcTime.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(utcTime.getUTCSeconds()).padStart(2, '0');
                    const localTimestamp = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;

                    // Convertir le rôle de l'utilisateur en français
                    let userRoleFr = 'Opérateur';
                    if (currentUser.role === 'technician') userRoleFr = 'Technicien';
                    else if (currentUser.role === 'supervisor') userRoleFr = 'Superviseur';
                    else if (currentUser.role === 'admin') userRoleFr = 'Admin';

                    await axios.post(API_URL + '/comments', {
                        ticket_id: ticketId,
                        user_name: currentUser.first_name,
                        user_role: userRoleFr,
                        comment: newComment,
                        created_at: localTimestamp
                    });

                    setNewComment('');
                    loadComments();
                } catch (error) {
                    alert('Erreur lors de l\\'ajout du commentaire');
                } finally {
                    setSubmittingComment(false);
                }
            };

            // Gestionnaire validation commentaire
            const handleInvalidComment = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };

            const handleInputComment = (e) => {
                e.target.setCustomValidity("");
                setNewComment(e.target.value);
            };

            const handleNewMediaChange = (e) => {
                const files = Array.from(e.target.files);
                setNewMediaFiles(prevFiles => [...prevFiles, ...files]);

                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setNewMediaPreviews(prev => [...prev, {
                            url: reader.result,
                            type: file.type,
                            name: file.name,
                            size: file.size
                        }]);
                    };
                    reader.readAsDataURL(file);
                });
            };

            const handleUploadNewMedia = async () => {
                if (newMediaFiles.length === 0) return;

                setUploadingMedia(true);
                try {
                    for (let i = 0; i < newMediaFiles.length; i++) {
                        const file = newMediaFiles[i];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('ticket_id', ticketId);

                        await axios.post(API_URL + '/media/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    }

                    alert('Médias ajoutés avec succès !');
                    setNewMediaFiles([]);
                    setNewMediaPreviews([]);
                    loadTicketDetails();
                } catch (error) {
                    alert('Erreur lors de l\\'upload des médias');
                } finally {
                    setUploadingMedia(false);
                }
            };

            const handleSavePriority = async () => {
                try {
                    setSavingPriority(true);
                    await axios.patch(API_URL + '/tickets/' + ticketId, {
                        priority: newPriority
                    });
                    alert('Priorité mise à jour avec succès !');
                    setEditingPriority(false);
                    loadTicketDetails(); // Recharger les détails
                } catch (error) {
                    alert('Erreur lors de la mise à jour de la priorité');
                } finally {
                    setSavingPriority(false);
                }
            };

            const handleSaveSchedule = async () => {
                try {
                    setSavingSchedule(true);
                    const updateData = {};

                    // Assigner à un technicien ou toute l'équipe
                    // CRITICAL FIX: Use 0 (integer) for team assignment (compatible with INTEGER column)
                    if (scheduledAssignedTo) {
                        updateData.assigned_to = parseInt(scheduledAssignedTo);
                        // Si assignation définie, sauvegarder la date (ou null si vide)
                        // NOUVEAU: Conversion datetime-local → UTC SQL
                        updateData.scheduled_date = scheduledDate ? localDateTimeToUTC(scheduledDate) : null;
                    } else {
                        // Si "Non assigné" sélectionné, retirer aussi la date (dé-planifier complètement)
                        updateData.assigned_to = null;
                        updateData.scheduled_date = null;
                        // Effacer aussi le champ date dans le formulaire
                        setScheduledDate('');
                    }

                    await axios.patch(API_URL + '/tickets/' + ticketId, updateData);

                    // Message dynamique selon si planifié (avec date) ou juste assigné (sans date)
                    const successMessage = scheduledDate
                        ? 'Planification mise à jour avec succès !'
                        : 'Assignation mise à jour avec succès !';
                    alert(successMessage);
                    setEditingSchedule(false);
                    loadTicketDetails(); // Recharger les détails
                } catch (error) {
                    alert('Erreur lors de la mise à jour de la planification');
                } finally {
                    setSavingSchedule(false);
                }
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'modal active bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'modal-content bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-3 sm:p-6 md:p-8 max-w-5xl w-full mx-2 sm:mx-4 my-auto',
                    onClick: (e) => e.stopPropagation(),
                    style: { marginTop: 'auto', marginBottom: 'auto', maxHeight: '90vh', overflowY: 'auto' }
                },
                    React.createElement('div', { className: 'flex justify-between items-center gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gradient-to-r from-blue-400 to-gray-400' },
                        // LEFT: Delete button (trash)
                        (ticket && currentUser && (
                            (currentUser.role === 'technician' && (!ticket.scheduled_date || ticket.reported_by === currentUser.id)) ||
                            (currentUser.role === 'supervisor') ||
                            (currentUser.role === 'admin') ||
                            (currentUser.role === 'operator' && ticket.reported_by === currentUser.id)
                        )) ? React.createElement('button', {
                            onClick: handleDeleteTicket,
                            className: 'text-red-500 hover:text-red-700 transition-colors transform hover:scale-110 active:scale-95 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
                            title: 'Supprimer ce ticket',
                            'aria-label': 'Supprimer ce ticket'
                        },
                            React.createElement('i', { className: 'fas fa-trash-alt text-xl sm:text-2xl' })
                        ) : React.createElement('div', { className: 'w-[44px]' }), // Placeholder pour alignement
                        
                        // CENTER: Title
                        React.createElement('h2', { className: 'text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent' },
                            React.createElement('i', { className: 'fas fa-ticket-alt mr-2 text-blue-600 text-sm sm:text-base' }),
                            "Détails du Ticket"
                        ),
                        
                        // RIGHT: Close button (X)
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-gray-500 hover:text-gray-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
                            'aria-label': 'Fermer'
                        },
                            React.createElement('i', { className: 'fas fa-times text-xl sm:text-2xl' })
                        )
                    ),

                    loading ? React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-igp-blue' }),
                        React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Chargement...')
                    ) : ticket ? React.createElement('div', {},

                        React.createElement('div', { className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-200/50' },
                            React.createElement('div', { className: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4' },
                                React.createElement('span', { className: 'text-sm sm:text-base font-mono font-bold text-blue-700 bg-blue-100/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg' }, ticket.ticket_id),
                                !editingPriority ? React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', {
                                        className: 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold shadow-md text-xs sm:text-sm ' +
                                        (ticket.priority === 'critical' ? 'bg-igp-red text-white' :
                                         ticket.priority === 'high' ? 'bg-igp-yellow text-white' :
                                         ticket.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                         'bg-igp-green text-white')
                                    },
                                        ticket.priority === 'critical' ? '🔴 CRITIQUE' :
                                        ticket.priority === 'high' ? '🟠 HAUTE' :
                                        ticket.priority === 'medium' ? '🟡 MOYENNE' :
                                        '🟢 FAIBLE'
                                    ),
                                    (currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) ? React.createElement('button', {
                                        onClick: () => {
                                            setEditingPriority(true);
                                            setNewPriority(ticket.priority);
                                        },
                                        className: 'text-blue-600 hover:text-blue-800 transition-colors p-1',
                                        title: 'Modifier la priorité'
                                    },
                                        React.createElement('i', { className: 'fas fa-edit' })
                                    ) : null
                                ) : React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('select', {
                                        value: newPriority,
                                        onChange: (e) => setNewPriority(e.target.value),
                                        className: 'px-3 py-2 border-2 border-blue-500 rounded-lg text-sm font-semibold'
                                    },
                                        React.createElement('option', { value: 'low' }, '🟢 FAIBLE'),
                                        React.createElement('option', { value: 'medium' }, '🟡 MOYENNE'),
                                        React.createElement('option', { value: 'high' }, '🟠 HAUTE'),
                                        React.createElement('option', { value: 'critical' }, '🔴 CRITIQUE')
                                    ),
                                    React.createElement('button', {
                                        onClick: handleSavePriority,
                                        disabled: savingPriority,
                                        className: 'px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50',
                                        title: 'Sauvegarder'
                                    },
                                        savingPriority ? React.createElement('i', { className: 'fas fa-spinner fa-spin' }) : React.createElement('i', { className: 'fas fa-check' })
                                    ),
                                    React.createElement('button', {
                                        onClick: () => {
                                            setEditingPriority(false);
                                            setNewPriority(ticket.priority);
                                        },
                                        className: 'px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-400',
                                        title: 'Annuler'
                                    },
                                        React.createElement('i', { className: 'fas fa-times' })
                                    )
                                )
                            ),
                            React.createElement('h3', { className: 'text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3' }, ticket.title),
                            React.createElement('p', { className: 'text-sm sm:text-base text-gray-700 mb-4 sm:mb-5 leading-relaxed bg-white/60 p-3 sm:p-4 rounded-lg' }, ticket.description),
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4' },
                                React.createElement('div', { className: 'bg-white/95 p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-cog text-blue-600 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Machine:')
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, ticket.machine_type + ' ' + ticket.model)
                                ),
                                React.createElement('div', { className: 'bg-white/95 p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-tasks text-slate-600 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Statut:')
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, getStatusLabel(ticket.status))
                                ),
                                React.createElement('div', { className: 'bg-white/95 p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'far fa-calendar text-green-600 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, "Créé le:")
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' },
                                        formatDateEST(ticket.created_at)
                                    )
                                ),
                                React.createElement('div', { className: 'bg-white/95 p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-user text-blue-700 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, "Rapporté par:")
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, ticket.reporter_name || 'N/A')
                                )
                            )
                        ),

                        // Badge "En retard" si ticket expiré (visible pour tous)
                        (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived' && parseUTCDate(ticket.scheduled_date) < new Date()) ?
                            React.createElement('div', { className: 'mb-4 sm:mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 rounded-xl shadow-lg p-4 sm:p-6' },
                                React.createElement('div', { className: 'flex flex-col sm:flex-row items-start gap-4' },
                                    React.createElement('div', { className: 'text-4xl sm:text-5xl flex-shrink-0' }, '⏰'),
                                    React.createElement('div', { className: 'flex-1 w-full' },
                                        React.createElement('h4', { className: 'font-bold text-orange-900 text-lg sm:text-xl mb-2 flex items-center gap-2' },
                                            React.createElement('span', {}, 'Ticket en retard'),
                                            React.createElement('span', { className: 'text-sm sm:text-base font-normal text-orange-700' },
                                                ' - ',
                                                (() => {
                                                    const scheduledUTC = parseUTCDate(ticket.scheduled_date);
                                                    const delay = new Date().getTime() - scheduledUTC.getTime();
                                                    const hours = Math.floor(delay / (1000 * 60 * 60));
                                                    const minutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));
                                                    return hours > 0 ? hours + 'h ' + minutes + 'min' : minutes + 'min';
                                                })()
                                            )
                                        ),
                                        React.createElement('p', { className: 'text-sm sm:text-base text-orange-800 mb-4' },
                                            'En attente de pièces, validation externe, ou autre blocage?'
                                        ),
                                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ?
                                            React.createElement('button', {
                                                onClick: () => {
                                                    setEditingSchedule(true);
                                                    // Scroll vers section planification
                                                    setTimeout(() => {
                                                        const section = document.querySelector('[data-section="planning"]');
                                                        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }, 100);
                                                },
                                                className: 'bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
                                            },
                                                React.createElement('i', { className: 'fas fa-calendar-alt mr-2' }),
                                                'Modifier la date planifiée'
                                            ) :
                                            React.createElement('p', { className: 'text-xs sm:text-sm text-orange-700 italic bg-orange-100/50 px-3 py-2 rounded-lg border border-orange-300' },
                                                React.createElement('i', { className: 'fas fa-info-circle mr-2' }),
                                                'Contactez un superviseur ou administrateur pour modifier la date planifiée'
                                            )
                                    )
                                )
                            ) : null,

                        // Section planification (superviseur/admin seulement)
                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ?
                            React.createElement('div', { 
                                className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200/50',
                                'data-section': 'planning'
                            },
                                React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4' },
                                    React.createElement('h4', { className: 'text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent flex items-center' },
                                        React.createElement('i', { className: 'fas fa-calendar-alt mr-2 text-blue-600 text-sm sm:text-base' }),
                                        'Planification'
                                    ),
                                    !editingSchedule ? React.createElement('button', {
                                        onClick: () => setEditingSchedule(true),
                                        className: 'px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-xs sm:text-sm transition-all shadow-[0_6px_12px_rgba(147,51,234,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(147,51,234,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(147,51,234,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50'
                                    },
                                        React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                        'Modifier'
                                    ) : null
                                ),

                                !editingSchedule ? (
                                    // Affichage lecture seule
                                    React.createElement('div', { className: 'space-y-3' },
                                        React.createElement('div', { className: 'bg-white/95 p-4 rounded-lg shadow-sm' },
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('i', { className: 'fas fa-user-cog text-slate-600' }),
                                                React.createElement('span', { className: 'font-bold text-gray-700' }, "Assigné à:")
                                            ),
                                            React.createElement('span', { className: 'text-gray-800 font-semibold ml-6' },
                                                ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                                    ? (ticket.assigned_to === 0 ? '👥 Équipe' : '👤 ' + (ticket.assignee_name || 'Technicien #' + ticket.assigned_to))
                                                    : '❌ Non assigné'
                                            )
                                        ),
                                        React.createElement('div', { className: 'bg-white/95 p-4 rounded-lg shadow-sm' },
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('i', { className: 'far fa-clock text-slate-600' }),
                                                React.createElement('span', { className: 'font-bold text-gray-700' }, "Date planifiée:")
                                            ),
                                            React.createElement('span', { className: 'text-gray-800 font-semibold ml-6' },
                                                ticket.scheduled_date
                                                    ? formatDateEST(ticket.scheduled_date)
                                                    : '❌ Non planifié'
                                            )
                                        )
                                    )
                                ) : (
                                    // Mode édition
                                    React.createElement('div', { className: 'space-y-4' },
                                        // Assigner à un technicien
                                        React.createElement('div', {},
                                            React.createElement('label', { className: 'block font-bold text-gray-700 mb-2 text-sm sm:text-base' },
                                                React.createElement('i', { className: 'fas fa-user-cog mr-2 text-slate-600 text-xs sm:text-sm' }),
                                                "Assigner à"
                                            ),
                                            React.createElement('select', {
                                                value: scheduledAssignedTo,
                                                onChange: (e) => setScheduledAssignedTo(e.target.value),
                                                className: 'w-full px-4 py-3 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-semibold'
                                            },
                                                React.createElement('option', { value: '' }, '-- Non assigné --'),
                                                React.createElement('option', { value: '0' }, '👥 À Équipe'),
                                                technicians.filter(tech => tech.id !== 0).map(tech =>
                                                    React.createElement('option', {
                                                        key: tech.id,
                                                        value: tech.id
                                                    },
                                                        '👤 ' + tech.first_name
                                                    )
                                                )
                                            )
                                        ),

                                        // Date de maintenance planifiée
                                        React.createElement('div', {},
                                            // Badge d'état actuel
                                            scheduledDate || scheduledAssignedTo ? React.createElement('div', { className: 'mb-3 p-3 rounded-lg border-2 ' + (scheduledDate ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300') },
                                                React.createElement('div', { className: 'flex items-center gap-2' },
                                                    React.createElement('i', { className: 'text-lg ' + (scheduledDate ? 'fas fa-calendar-check text-blue-600' : 'fas fa-user-check text-orange-600') }),
                                                    React.createElement('span', { className: 'font-bold ' + (scheduledDate ? 'text-blue-800' : 'text-orange-800') },
                                                        "État actuel : " + (scheduledDate ? "PLANIFIÉ" : "ASSIGNÉ")
                                                    )
                                                ),
                                                scheduledDate ?
                                                    React.createElement('div', { className: 'mt-1 text-xs text-blue-700' },
                                                        "📅 Date : " + new Date(scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    )
                                                : React.createElement('div', { className: 'mt-1 text-xs text-orange-700' },
                                                    "ℹ️ Aucune date planifiée - Ajoutez-en une pour planifier"
                                                )
                                            ) : null, // Ferme le badge d'état (ligne 3307)

                                            React.createElement('label', { className: 'block font-bold text-gray-700 mb-2 text-sm sm:text-base' },
                                                React.createElement('i', { className: 'fas fa-calendar-day mr-2 text-slate-600 text-xs sm:text-sm' }),
                                                "Date et heure de maintenance" + (scheduledDate ? " (modifier)" : " (ajouter)"),
                                                React.createElement('span', { className: 'ml-2 text-xs text-gray-500 font-normal' },
                                                    '(heure locale EST/EDT)'
                                                )
                                            ),
                                            React.createElement('div', { className: 'flex gap-2' },
                                                React.createElement('input', {
                                                    type: 'datetime-local',
                                                    value: scheduledDate,
                                                    onChange: (e) => setScheduledDate(e.target.value),
                                                    className: 'flex-1 px-4 py-3 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-semibold'
                                                }),
                                                scheduledDate ? React.createElement('button', {
                                                    type: 'button',
                                                    onClick: () => setScheduledDate(''),
                                                    className: 'px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg'
                                                },
                                                    React.createElement('i', { className: 'fas fa-times mr-1' }),
                                                    "Retirer"
                                                ) : null
                                            ), // Ferme le div flex gap-2 (ligne 3327)
                                            scheduledDate ? React.createElement('div', { className: 'mt-2 text-xs text-gray-600 italic' },
                                                '💡 Cliquez sur "Retirer" pour passer de PLANIFIÉ à ASSIGNÉ'
                                            ) : null
                                        ), // Ferme le div principal Date de maintenance (ligne 3305)

                                        // Boutons d'action
                                        React.createElement('div', { className: 'flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3' },
                                            React.createElement('button', {
                                                onClick: () => {
                                                    setEditingSchedule(false);
                                                    setScheduledAssignedTo(ticket.assigned_to ? String(ticket.assigned_to) : '');
                                                    setScheduledDate(hasScheduledDate(ticket.scheduled_date) ? ticket.scheduled_date.substring(0, 10) : '');
                                                },
                                                className: 'w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                                            },
                                                React.createElement('i', { className: 'fas fa-times mr-1' }),
                                                'Annuler'
                                            ),
                                            React.createElement('button', {
                                                onClick: handleSaveSchedule,
                                                disabled: savingSchedule,
                                                className: 'w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-sm transition-all shadow-[0_8px_16px_rgba(147,51,234,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(147,51,234,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(147,51,234,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-t border-blue-300/50'
                                            },
                                                savingSchedule
                                                    ? React.createElement('i', { className: 'fas fa-spinner fa-spin mr-1' })
                                                    : React.createElement('i', { className: 'fas fa-save mr-1' }),
                                                savingSchedule ? 'Enregistrement...' : 'Enregistrer'
                                            )
                                        )
                                    )
                                )
                            )
                        : null,


                        (ticket.media && ticket.media.length > 0) ? React.createElement('div', { className: 'mb-4 sm:mb-6' },
                            React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center' },
                                React.createElement('i', { className: 'fas fa-images mr-2 text-blue-700 text-sm sm:text-base' }),
                                'Photos et Vidéos (' + ticket.media.length + ')'
                            ),
                            React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3' },
                                ticket.media.map((media, index) =>
                                    React.createElement('div', {
                                        key: media.id,
                                        className: 'relative group'
                                    },
                                        React.createElement('div', {
                                            className: 'cursor-pointer sm:cursor-pointer',
                                            onClick: () => setSelectedMedia(media)
                                        },
                                            media.file_type.startsWith('image/')
                                                ? React.createElement('img', {
                                                    src: API_URL + '/media/' + media.id,
                                                    alt: media.file_name,
                                                    className: 'w-full h-32 object-cover rounded border-2 border-gray-300 hover:border-igp-blue transition-all pointer-events-none sm:pointer-events-auto'
                                                })
                                                : React.createElement('div', { className: 'w-full h-32 bg-gray-200 rounded border-2 border-gray-300 hover:border-igp-blue transition-all flex items-center justify-center pointer-events-none sm:pointer-events-auto' },
                                                    React.createElement('i', { className: 'fas fa-video fa-3x text-gray-500' })
                                                ),
                                            React.createElement('div', { className: 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center pointer-events-none' },
                                                React.createElement('i', { className: 'fas fa-search-plus text-white text-2xl opacity-0 group-hover:opacity-100 transition-all' })
                                            ),
                                            React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded pointer-events-none' },
                                                media.file_type.startsWith('image/') ? '📷' : '🎥'
                                            )
                                        ),
                                        (currentUser && (
                                            currentUser.role === 'admin' ||
                                            currentUser.role === 'supervisor' ||
                                            currentUser.role === 'technician' ||
                                            (ticket.reported_by === currentUser.id)
                                        )) ? React.createElement('button', {
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                handleDeleteMedia(media.id);
                                            },
                                            className: 'absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg z-20',
                                            style: { opacity: 1 },
                                            title: 'Supprimer ce media'
                                        },
                                            React.createElement('i', { className: 'fas fa-trash text-sm' })
                                        ) : null
                                    )
                                )
                            )
                        ) : null,


                        (!ticket.media || ticket.media.length === 0) ? React.createElement('div', { className: 'mb-4 sm:mb-6 text-center py-6 sm:py-8 bg-gray-50 rounded' },
                            React.createElement('i', { className: 'fas fa-camera text-gray-400 text-4xl mb-2' }),
                            React.createElement('p', { className: 'text-gray-500' }, 'Aucune photo ou vidéo attachée à ce ticket')
                        ) : null,


                        React.createElement('div', { className: 'mb-4 sm:mb-6 border-t-2 border-gray-200 pt-4 sm:pt-6' },
                            React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center' },
                                React.createElement('i', { className: 'fas fa-comments mr-2 text-igp-blue text-sm sm:text-base' }),
                                'Commentaires et Notes (' + comments.length + ')'
                            ),


                            comments.length > 0 ? React.createElement('div', { className: 'space-y-3 mb-4 max-h-64 overflow-y-auto' },
                                comments.map(comment =>
                                    React.createElement('div', {
                                        key: comment.id,
                                        className: 'bg-gray-50 rounded-lg p-3 border-l-4 ' +
                                                   (comment.user_role === 'Technicien' ? 'border-blue-600' : 'border-igp-blue')
                                    },
                                        React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                                            React.createElement('div', { className: 'flex items-center gap-2' },
                                                React.createElement('i', {
                                                    className: 'fas ' + (comment.user_role === 'Technicien' ? 'fa-wrench' : 'fa-user') + ' text-sm text-gray-600'
                                                }),
                                                React.createElement('span', { className: 'font-semibold text-gray-800' }, comment.user_name),
                                                React.createElement('span', { className: 'text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded' },
                                                    comment.user_role || 'Opérateur'
                                                )
                                            ),
                                            React.createElement('span', { className: 'text-xs text-gray-500' },
                                                formatDateEST(comment.created_at)
                                            )
                                        ),
                                        React.createElement('p', { className: 'text-gray-700 text-sm whitespace-pre-wrap' }, comment.comment)
                                    )
                                )
                            ) : React.createElement('div', { className: 'text-center py-6 bg-gray-50 rounded mb-4' },
                                React.createElement('i', { className: 'fas fa-comment-slash text-gray-400 text-3xl mb-2' }),
                                React.createElement('p', { className: 'text-gray-500 text-sm' }, 'Aucun commentaire pour le moment')
                            ),


                            React.createElement('form', {
                                onSubmit: handleAddComment,
                                className: 'bg-blue-50 rounded-lg p-3 sm:p-4 border-2 border-igp-blue'
                            },
                                React.createElement('h5', { className: 'font-semibold text-gray-800 mb-3 flex items-center' },
                                    React.createElement('i', { className: 'fas fa-plus-circle mr-2 text-igp-blue' }),
                                    'Ajouter un commentaire'
                                ),


                                React.createElement('div', { className: 'mb-3' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-1' },
                                        React.createElement('i', { className: 'fas fa-comment mr-1' }),
                                        'Commentaire *'
                                    ),
                                    React.createElement('textarea', {
                                        value: newComment,
                                        onChange: handleInputComment,
                                        onInvalid: handleInvalidComment,
                                        placeholder: 'Ex: Pièce commandée, livraison prévue jeudi...',
                                        required: true,
                                        rows: 3,
                                        className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent resize-none'
                                    })
                                ),


                                React.createElement('button', {
                                    type: 'submit',
                                    disabled: submittingComment,
                                    className: 'w-full px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                },
                                    submittingComment
                                        ? React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                                            'Envoi en cours...'
                                        )
                                        : React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-paper-plane mr-2' }),
                                            'Publier le commentaire'
                                        )
                                )
                            )
                        ),


                        React.createElement('div', { className: 'mb-4 sm:mb-6 border-t-2 border-gray-200 pt-4 sm:pt-6' },
                            React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center' },
                                React.createElement('i', { className: 'fas fa-camera-retro mr-2 text-blue-700 text-sm sm:text-base' }),
                                'Ajouter des photos/vidéos supplémentaires'
                            ),


                            newMediaPreviews.length > 0 ? React.createElement('div', { className: 'mb-4' },
                                React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' },
                                    React.createElement('i', { className: 'fas fa-images mr-1' }),
                                    newMediaPreviews.length + ' fichier(s) sélectionné(s)'
                                ),
                                React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-3' },
                                    newMediaPreviews.map((preview, index) =>
                                        React.createElement('div', {
                                            key: index,
                                            className: 'relative group'
                                        },
                                            preview.type.startsWith('image/')
                                                ? React.createElement('img', {
                                                    src: preview.url,
                                                    alt: preview.name,
                                                    className: 'w-full h-24 object-cover rounded border-2 border-blue-600'
                                                })
                                                : React.createElement('div', { className: 'w-full h-24 bg-gray-200 rounded border-2 border-blue-600 flex items-center justify-center' },
                                                    React.createElement('i', { className: 'fas fa-video fa-2x text-gray-500' })
                                                ),
                                            React.createElement('button', {
                                                type: 'button',
                                                onClick: () => {
                                                    setNewMediaFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                                                    setNewMediaPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
                                                },
                                                className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-all'
                                            },
                                                React.createElement('i', { className: 'fas fa-times text-xs' })
                                            ),
                                            React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded max-w-full truncate' },
                                                preview.name
                                            )
                                        )
                                    )
                                ),
                                React.createElement('button', {
                                    onClick: handleUploadNewMedia,
                                    disabled: uploadingMedia,
                                    className: 'w-full px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-igp-blue-dark transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                },
                                    uploadingMedia
                                        ? React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                                            'Upload en cours...'
                                        )
                                        : React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-cloud-upload-alt mr-2' }),
                                            'Uploader ces fichiers'
                                        )
                                )
                            ) : null,


                            React.createElement('div', { className: 'flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center' },
                                React.createElement('label', {
                                    className: 'inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:bg-blue-200 hover:border-blue-600 transition-all text-center'
                                },
                                    React.createElement('input', {
                                        type: 'file',
                                        accept: 'image/*',
                                        capture: 'environment',
                                        onChange: handleNewMediaChange,
                                        className: 'hidden',
                                        id: 'photo-upload-detail'
                                    }),
                                    React.createElement('i', { className: 'fas fa-camera text-xl sm:text-2xl text-blue-600 mb-1 sm:mb-2 block' }),
                                    React.createElement('span', { className: 'text-xs sm:text-sm font-semibold text-blue-700 block' },
                                        'Prendre une photo'
                                    )
                                ),
                                React.createElement('label', {
                                    className: 'inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-200 hover:border-gray-600 transition-all text-center'
                                },
                                    React.createElement('input', {
                                        type: 'file',
                                        multiple: true,
                                        accept: 'image/*,video/*',
                                        onChange: handleNewMediaChange,
                                        className: 'hidden',
                                        id: 'media-upload-detail'
                                    }),
                                    React.createElement('i', { className: 'fas fa-images text-xl sm:text-2xl text-gray-600 mb-1 sm:mb-2 block' }),
                                    React.createElement('span', { className: 'text-xs sm:text-sm font-semibold text-gray-700 block' },
                                        'Choisir fichiers'
                                    )
                                )
                            )
                        ),


                        React.createElement('div', { className: 'flex justify-end mt-6 pt-4 border-t-2 border-gray-200' },
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-times mr-2' }),
                                'Fermer'
                            )
                        )
                    ) : React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('p', { className: 'text-red-600' }, 'Erreur lors du chargement du ticket')
                    )
                ),


                selectedMedia ? React.createElement('div', {
                    className: 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4',
                    onClick: () => setSelectedMedia(null)
                },
                    React.createElement('div', { className: 'relative max-w-6xl max-h-full' },
                        React.createElement('button', {
                            onClick: () => setSelectedMedia(null),
                            className: 'absolute top-2 right-2 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-all z-10'
                        },
                            React.createElement('i', { className: 'fas fa-times fa-lg' })
                        ),
                        selectedMedia.file_type.startsWith('image/')
                            ? React.createElement('img', {
                                src: API_URL + '/media/' + selectedMedia.id,
                                alt: selectedMedia.file_name,
                                className: 'max-w-full max-h-screen object-contain',
                                onClick: (e) => e.stopPropagation()
                            })
                            : React.createElement('video', {
                                src: API_URL + '/media/' + selectedMedia.id,
                                controls: true,
                                className: 'max-w-full max-h-screen',
                                onClick: (e) => e.stopPropagation()
                            }),
                        React.createElement('div', { className: 'absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm' },
                            selectedMedia.file_name + ' - ' + Math.round(selectedMedia.file_size / 1024) + ' KB'
                        )
                    )
                ) : null,

                React.createElement(ConfirmModal, {
                    show: confirmDialog.show,
                    message: confirmDialog.message,
                    onConfirm: confirmDialog.onConfirm,
                    onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
                })
            );
        };


        // Composant de gestion des machines (VERSION SIMPLIFIÉE ET ÉLÉGANTE)
        const MachineManagementModal = ({ show, onClose, currentUser, machines, onRefresh }) => {
            const [searchQuery, setSearchQuery] = React.useState("");
            const [showCreateForm, setShowCreateForm] = React.useState(false);
            const [editingMachine, setEditingMachine] = React.useState(null);

            // Formulaire création
            const [newType, setNewType] = React.useState("");
            const [newModel, setNewModel] = React.useState("");
            const [newSerial, setNewSerial] = React.useState("");
            const [newLocation, setNewLocation] = React.useState("");

            // Formulaire édition
            const [editType, setEditType] = React.useState("");
            const [editModel, setEditModel] = React.useState("");
            const [editSerial, setEditSerial] = React.useState("");
            const [editLocation, setEditLocation] = React.useState("");
            const [editStatus, setEditStatus] = React.useState("");

            // Référence pour le scroll
            const scrollContainerRef = React.useRef(null);

            // Gestion touche Escape pour fermer le modal
            React.useEffect(() => {
                const handleEscape = (e) => {
                    if (e.key === 'Escape' && show) {
                        onClose();
                    }
                };
                
                if (show) {
                    document.addEventListener('keydown', handleEscape);
                    return () => document.removeEventListener('keydown', handleEscape);
                }
            }, [show, onClose]);

            const handleCreate = async (e) => {
                e.preventDefault();
                if (!newType || !newModel || !newSerial) {
                    alert("Type, modele et numero de serie requis");
                    return;
                }
                try {
                    await axios.post(API_URL + "/machines", {
                        machine_type: newType,
                        model: newModel,
                        serial_number: newSerial,
                        location: newLocation
                    });
                    alert("Machine creee avec succes!");
                    setNewType("");
                    setNewModel("");
                    setNewSerial("");
                    setNewLocation("");
                    setShowCreateForm(false);
                    onRefresh();
                } catch (error) {
                    alert("Erreur: " + (error.response?.data?.error || "Erreur inconnue"));
                }
            };

            const handleEdit = (machine) => {
                setEditingMachine(machine);
                setEditType(machine.machine_type);
                setEditModel(machine.model);
                setEditSerial(machine.serial_number);
                setEditLocation(machine.location || "");
                setEditStatus(machine.status);

                // Scroller vers le haut pour voir le formulaire
                setTimeout(() => {
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = 0;
                    }
                }, 100);
            };

            const handleUpdate = async (e) => {
                e.preventDefault();
                try {
                    await axios.patch(API_URL + "/machines/" + editingMachine.id, {
                        machine_type: editType,
                        model: editModel,
                        serial_number: editSerial,
                        location: editLocation,
                        status: editStatus
                    });
                    alert("Machine mise a jour!");
                    setEditingMachine(null);
                    onRefresh();
                } catch (error) {
                    alert("Erreur: " + (error.response?.data?.error || "Erreur inconnue"));
                }
            };

            const handleDelete = async (machine) => {
                if (!confirm("Supprimer " + machine.machine_type + " " + machine.model + " ?")) return;
                try {
                    await axios.delete(API_URL + "/machines/" + machine.id);
                    alert("Machine supprimee!");
                    onRefresh();
                } catch (error) {
                    alert("Erreur: " + (error.response?.data?.error || "Impossible de supprimer une machine avec des tickets"));
                }
            };

            const getStatusColor = (status) => {
                if (status === "operational") return "bg-green-100 text-green-800";
                if (status === "maintenance") return "bg-yellow-100 text-yellow-800";
                return "bg-red-100 text-red-800";
            };

            const getStatusLabel = (status) => {
                if (status === "operational") return "Operationnelle";
                if (status === "maintenance") return "En maintenance";
                return "Hors service";
            };

            if (!show) return null;

            const filteredMachines = machines.filter(m =>
                !searchQuery ||
                m.machine_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.serial_number && m.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            return React.createElement("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
                onClick: onClose
            },
                React.createElement("div", {
                    className: "bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col",
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement("div", { className: "bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-3 sm:p-5 flex justify-between items-center" },
                        React.createElement("div", { className: "flex items-center gap-2 sm:gap-3" },
                            React.createElement("i", { className: "fas fa-cogs text-xl sm:text-2xl" }),
                            React.createElement("h2", { className: "text-lg sm:text-2xl font-bold" }, "Gestion des Machines")
                        ),
                        React.createElement("button", {
                            onClick: onClose,
                            className: "text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 sm:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center transition-all active:scale-95",
                            'aria-label': "Fermer"
                        },
                            React.createElement("i", { className: "fas fa-times text-xl sm:text-2xl" })
                        )
                    ),
                    React.createElement("div", { className: "flex-1 overflow-y-auto p-3 sm:p-6", ref: scrollContainerRef },
                        React.createElement("div", { className: "mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3" },
                            currentUser.role === "admin" ? React.createElement("button", {
                                onClick: () => setShowCreateForm(!showCreateForm),
                                className: "px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm sm:text-base"
                            }, showCreateForm ? "Annuler" : "Nouvelle Machine") : null,
                            React.createElement("input", {
                                type: "text",
                                placeholder: "Rechercher...",
                                value: searchQuery,
                                onChange: (e) => setSearchQuery(e.target.value),
                                className: "flex-1 px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-sm sm:text-base"
                            })
                        ),

                        showCreateForm ? React.createElement("form", {
                            onSubmit: handleCreate,
                            className: "mb-6 p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl border-2 border-blue-200 shadow-lg"
                        },
                            React.createElement("h3", { className: "text-xl font-bold mb-4 text-blue-800" }, "Nouvelle Machine"),
                            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Type *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newType,
                                        onChange: (e) => setNewType(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                        placeholder: "Ex: Polisseuse, CNC, Four..."
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Modele *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newModel,
                                        onChange: (e) => setNewModel(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                        placeholder: "Ex: Bavelloni, Double Edger..."
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newSerial,
                                        onChange: (e) => setNewSerial(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                        placeholder: "Ex: PDE-001"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newLocation,
                                        onChange: (e) => setNewLocation(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                        placeholder: "Ex: Atelier Polissage"
                                    })
                                )
                            ),
                            React.createElement("button", {
                                type: "submit",
                                className: "mt-4 px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                            }, "Creer la Machine")
                        ) : null,

                        editingMachine ? React.createElement("form", {
                            onSubmit: handleUpdate,
                            className: "mb-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-lg"
                        },
                            React.createElement("h3", { className: "text-xl font-bold mb-4 text-blue-800" }, "Modifier Machine"),
                            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Type"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: editType,
                                        onChange: (e) => setEditType(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Modele"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: editModel,
                                        onChange: (e) => setEditModel(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: editSerial,
                                        onChange: (e) => setEditSerial(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: editLocation,
                                        onChange: (e) => setEditLocation(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Statut"),
                                    React.createElement("select", {
                                        value: editStatus,
                                        onChange: (e) => setEditStatus(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    },
                                        React.createElement("option", { value: "operational" }, "Operationnelle"),
                                        React.createElement("option", { value: "maintenance" }, "En maintenance"),
                                        React.createElement("option", { value: "out_of_service" }, "Hors service")
                                    )
                                )
                            ),
                            React.createElement("div", { className: "flex gap-3 mt-4" },
                                React.createElement("button", {
                                    type: "submit",
                                    className: "px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                                }, "Enregistrer"),
                                React.createElement("button", {
                                    type: "button",
                                    onClick: () => setEditingMachine(null),
                                    className: "px-6 py-3 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition-all"
                                }, "Annuler")
                            )
                        ) : null,

                        React.createElement("div", { className: "space-y-3" },
                            React.createElement("p", { className: "text-lg mb-4" },
                                filteredMachines.length + " machine(s)"
                            ),
                            filteredMachines.map(machine =>
                                React.createElement("div", {
                                    key: machine.id,
                                    className: "bg-white rounded-xl p-3 sm:p-4 shadow-md border-2 border-gray-200 hover:border-teal-400 hover:shadow-lg transition-all"
                                },
                                    React.createElement("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3" },
                                        React.createElement("div", { className: "flex-1" },
                                            React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2" },
                                                React.createElement("h4", { className: "font-bold text-base sm:text-lg" }, machine.machine_type + " - " + machine.model),
                                                React.createElement("span", {
                                                    className: "px-3 py-1 rounded-full text-xs font-semibold " + getStatusColor(machine.status)
                                                }, getStatusLabel(machine.status))
                                            ),
                                            React.createElement("p", { className: "text-sm text-gray-600" },
                                                React.createElement("i", { className: "fas fa-barcode mr-2" }),
                                                "Serie: " + (machine.serial_number || "N/A")
                                            ),
                                            machine.location ? React.createElement("p", { className: "text-sm text-gray-600" },
                                                React.createElement("i", { className: "fas fa-map-marker-alt mr-2" }),
                                                machine.location
                                            ) : null
                                        ),
                                        currentUser.role === "admin" || currentUser.role === "supervisor" ? React.createElement("div", { className: "flex gap-2 self-end sm:self-auto" },
                                            React.createElement("button", {
                                                onClick: () => handleEdit(machine),
                                                className: "px-3 sm:px-4 py-2 bg-igp-blue-light text-white rounded-lg font-bold hover:bg-igp-blue transition-all text-sm sm:text-base"
                                            },
                                                React.createElement("i", { className: "fas fa-edit" }),
                                                React.createElement("span", { className: "ml-2 hidden sm:inline" }, "Modifier")
                                            ),
                                            currentUser.role === "admin" ? React.createElement("button", {
                                                onClick: () => handleDelete(machine),
                                                className: "px-3 sm:px-4 py-2 bg-igp-red text-white rounded-lg font-bold hover:bg-red-700 transition-all text-sm sm:text-base"
                                            },
                                                React.createElement("i", { className: "fas fa-trash" }),
                                                React.createElement("span", { className: "ml-2 hidden sm:inline" }, "Supprimer")
                                            ) : null
                                        ) : null
                                    )
                                )
                            )
                        )
                    )
                )
            );
        };


        // Composant de sélection de rôle custom (remplace <select> natif pour mobile)
        const RoleDropdown = ({ value, onChange, disabled, currentUserRole, variant = 'blue' }) => {
            const [isOpen, setIsOpen] = React.useState(false);
            const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
            const dropdownRef = React.useRef(null);
            const buttonRef = React.useRef(null);
            const portalRef = React.useRef(null);

            // Styles selon le variant (blue pour création, green pour édition) - mémorisés
            const styles = React.useMemo(() => ({
                blue: {
                    button: 'from-white/90 to-blue-50/80 border-blue-300 focus:ring-blue-500 focus:border-blue-500',
                    chevron: 'text-blue-500',
                    shadow: '0 6px 20px rgba(59, 130, 246, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)',
                    border: 'border-blue-300'
                },
                green: {
                    button: 'from-white/90 to-green-50/80 border-green-300 focus:ring-green-500 focus:border-green-500',
                    chevron: 'text-green-500',
                    shadow: '0 6px 20px rgba(34, 197, 94, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)',
                    border: 'border-green-300'
                }
            }), []);

            const currentStyle = styles[variant];

            // Définition des rôles organisés par catégorie - mémorisés
            const roleGroups = React.useMemo(() => [
                {
                    label: '📊 Direction',
                    roles: [
                        { value: 'director', label: 'Directeur Général' },
                        ...(currentUserRole === 'admin' ? [{ value: 'admin', label: 'Administrateur' }] : [])
                    ]
                },
                {
                    label: '⚙️ Management Maintenance',
                    roles: [
                        { value: 'supervisor', label: 'Superviseur' },
                        { value: 'coordinator', label: 'Coordonnateur Maintenance' },
                        { value: 'planner', label: 'Planificateur Maintenance' }
                    ]
                },
                {
                    label: '🔧 Technique',
                    roles: [
                        { value: 'senior_technician', label: 'Technicien Senior' },
                        { value: 'technician', label: 'Technicien' }
                    ]
                },
                {
                    label: '🏭 Production',
                    roles: [
                        { value: 'team_leader', label: 'Chef Équipe Production' },
                        { value: 'furnace_operator', label: 'Opérateur Four' },
                        { value: 'operator', label: 'Opérateur' }
                    ]
                },
                {
                    label: '🛡️ Support',
                    roles: [
                        { value: 'safety_officer', label: 'Agent Santé & Sécurité' },
                        { value: 'quality_inspector', label: 'Inspecteur Qualité' },
                        { value: 'storekeeper', label: 'Magasinier' }
                    ]
                },
                {
                    label: '👁️ Transversal',
                    roles: [
                        { value: 'viewer', label: 'Lecture Seule' }
                    ]
                }
            ], [currentUserRole]);

            // Trouver le label du rôle sélectionné - mémorisé
            const getSelectedLabel = React.useCallback(() => {
                for (const group of roleGroups) {
                    const role = group.roles.find(r => r.value === value);
                    if (role) return role.label;
                }
                return 'Sélectionner un rôle';
            }, [roleGroups, value]);

            // Calculer la position du dropdown quand il s'ouvre ou lors du resize/scroll
            const updatePosition = React.useCallback(() => {
                if (buttonRef.current) {
                    const rect = buttonRef.current.getBoundingClientRect();
                    setDropdownPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + window.scrollX,
                        width: rect.width
                    });
                }
            }, []);

            React.useEffect(() => {
                if (isOpen) {
                    updatePosition();
                    window.addEventListener('resize', updatePosition);
                    window.addEventListener('scroll', updatePosition, true);

                    return () => {
                        window.removeEventListener('resize', updatePosition);
                        window.removeEventListener('scroll', updatePosition, true);
                    };
                }
            }, [isOpen, updatePosition]);

            // Fermer le dropdown si on clique à l'extérieur - optimisé avec useCallback
            const handleClickOutside = React.useCallback((event) => {
                // Vérifier si le clic est sur le bouton, le dropdown conteneur ou le portal
                if (
                    buttonRef.current && buttonRef.current.contains(event.target) ||
                    dropdownRef.current && dropdownRef.current.contains(event.target) ||
                    portalRef.current && portalRef.current.contains(event.target)
                ) {
                    return;
                }
                setIsOpen(false);
            }, []);

            React.useEffect(() => {
                if (isOpen) {
                    // Utiliser capture phase pour attraper les événements avant les autres handlers
                    document.addEventListener('mousedown', handleClickOutside, true);
                    document.addEventListener('touchstart', handleClickOutside, true);

                    return () => {
                        document.removeEventListener('mousedown', handleClickOutside, true);
                        document.removeEventListener('touchstart', handleClickOutside, true);
                    };
                }
            }, [isOpen, handleClickOutside]);

            // Gestion de la sélection - optimisée avec useCallback
            const handleSelect = React.useCallback((roleValue) => {
                onChange({ target: { value: roleValue } });
                setIsOpen(false);
            }, [onChange]);

            // Créer le dropdown content avec ref pour le portal
            const dropdownContent = isOpen && React.createElement('div', {
                ref: portalRef,
                className: 'fixed z-[10000] bg-white border-2 ' + currentStyle.border + ' rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto',
                style: {
                    top: dropdownPosition.top + 'px',
                    left: dropdownPosition.left + 'px',
                    width: dropdownPosition.width + 'px',
                    pointerEvents: 'auto'
                }
            },
                roleGroups.map((group, groupIndex) =>
                    group.roles.length > 0 && React.createElement('div', { key: groupIndex },
                        // En-tête de groupe
                        React.createElement('div', {
                            className: 'px-3 py-2 bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm sticky top-0 z-[1]'
                        }, group.label),
                        // Options du groupe
                        group.roles.map(role =>
                            React.createElement('button', {
                                key: role.value,
                                type: 'button',
                                onClick: () => handleSelect(role.value),
                                className: 'w-full px-4 py-3 text-left text-sm sm:text-base hover:bg-blue-50 transition-colors ' + (value === role.value ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-800')
                            },
                                role.label,
                                value === role.value && React.createElement('i', {
                                    className: 'fas fa-check ml-2 text-blue-600'
                                })
                            )
                        )
                    )
                )
            );

            return React.createElement('div', {
                ref: dropdownRef,
                className: 'relative w-full'
            },
                // Bouton principal
                React.createElement('button', {
                    ref: buttonRef,
                    type: 'button',
                    onClick: () => !disabled && setIsOpen(!isOpen),
                    disabled: disabled,
                    className: 'w-full px-2 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-left bg-gradient-to-br ' + currentStyle.button + ' backdrop-blur-sm border-2 rounded-xl shadow-lg focus:outline-none focus:ring-2 transition-all hover:shadow-xl cursor-pointer font-medium sm:font-semibold ' + (disabled ? 'opacity-50 cursor-not-allowed' : '') + ' flex justify-between items-center',
                    style: { boxShadow: currentStyle.shadow }
                },
                    React.createElement('span', { className: 'truncate pr-2' }, getSelectedLabel()),
                    React.createElement('i', {
                        className: 'fas fa-chevron-' + (isOpen ? 'up' : 'down') + ' ' + currentStyle.chevron + ' transition-transform text-xs sm:text-sm flex-shrink-0'
                    })
                ),

                // Rendre le dropdown via portal directement dans le body
                isOpen && (typeof ReactDOM !== 'undefined' && ReactDOM.createPortal)
                    ? ReactDOM.createPortal(dropdownContent, document.body)
                    : dropdownContent
            );
        };


        // ===== MODAL PARAMETRES SYSTEME (ADMIN) =====
        const SystemSettingsModal = ({ show, onClose, currentUser }) => {
            const [timezoneOffset, setTimezoneOffset] = React.useState('-5');
            const [loading, setLoading] = React.useState(true);
            const [saving, setSaving] = React.useState(false);

            // États pour l'upload du logo (admin uniquement)
            const [logoFile, setLogoFile] = React.useState(null);
            const [logoPreview, setLogoPreview] = React.useState(null);
            const [uploadingLogo, setUploadingLogo] = React.useState(false);
            const [currentLogoUrl, setCurrentLogoUrl] = React.useState('/api/settings/logo');
            const [logoRefreshKey, setLogoRefreshKey] = React.useState(Date.now());
            const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);

            // États pour titre/sous-titre (admin uniquement)
            const [companyTitle, setCompanyTitle] = React.useState('Gestion de la maintenance et des réparations');
            const [companySubtitle, setCompanySubtitle] = React.useState('Les Produits Verriers International (IGP) Inc.');
            const [editingTitle, setEditingTitle] = React.useState(false);
            const [editingSubtitle, setEditingSubtitle] = React.useState(false);
            const [tempTitle, setTempTitle] = React.useState('');
            const [tempSubtitle, setTempSubtitle] = React.useState('');
            const [savingTitle, setSavingTitle] = React.useState(false);
            const [savingSubtitle, setSavingSubtitle] = React.useState(false);

            React.useEffect(() => {
                if (show) {
                    loadSettings();
                    checkSuperAdmin();
                }
            }, [show]);

            const checkSuperAdmin = async () => {
                try {
                    // Vérifier si l'utilisateur actuel est admin
                    // Tous les admins (role='admin') peuvent modifier le logo, titre et sous-titre
                    // Le backend vérifie avec adminOnly middleware
                    if (currentUser && currentUser.role === 'admin') {
                        setIsSuperAdmin(true);
                    } else {
                        setIsSuperAdmin(false);
                    }
                } catch (error) {
                    setIsSuperAdmin(false);
                }
            };

            const loadSettings = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(API_URL + '/settings/timezone_offset_hours');
                    setTimezoneOffset(response.data.setting_value);

                    // Charger titre et sous-titre (super admin uniquement)
                    if (isSuperAdmin) {
                        try {
                            const titleResponse = await axios.get(API_URL + '/settings/company_title');
                            if (titleResponse.data.setting_value) {
                                setCompanyTitle(titleResponse.data.setting_value);
                            }
                        } catch (error) {
                            // Titre par défaut
                        }

                        try {
                            const subtitleResponse = await axios.get(API_URL + '/settings/company_subtitle');
                            if (subtitleResponse.data.setting_value) {
                                setCompanySubtitle(subtitleResponse.data.setting_value);
                            }
                        } catch (error) {
                            // Sous-titre par défaut
                        }
                    }
                } catch (error) {
                    // Erreur silencieuse
                } finally {
                    setLoading(false);
                }
            };

            const handleSave = async () => {
                setSaving(true);
                try {
                    await axios.put(API_URL + '/settings/timezone_offset_hours', {
                        value: timezoneOffset
                    });
                    // Mettre a jour le localStorage immediatement pour que les changements soient visibles
                    localStorage.setItem('timezone_offset_hours', timezoneOffset);
                    alert("Paramètres mis à jour avec succès!");
                    onClose();
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                } finally {
                    setSaving(false);
                }
            };

            // Fonction pour gérer la sélection de fichier logo
            const handleLogoFileChange = (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Validation du type
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Type de fichier non autorisé. Utilisez PNG, JPEG ou WEBP.');
                    return;
                }

                // Validation de la taille (500 KB max)
                if (file.size > 500 * 1024) {
                    alert('Fichier trop volumineux (' + (file.size / 1024).toFixed(0) + ' KB). Maximum: 500 KB');
                    return;
                }

                setLogoFile(file);

                // Créer une preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoPreview(reader.result);
                };
                reader.readAsDataURL(file);
            };

            // Fonction pour uploader le logo
            const handleUploadLogo = async () => {
                if (!logoFile) {
                    alert('Veuillez sélectionner un fichier');
                    return;
                }

                setUploadingLogo(true);
                try {
                    const formData = new FormData();
                    formData.append('logo', logoFile);

                    const response = await axios.post(API_URL + '/settings/upload-logo', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    // Rafraîchir le logo affiché
                    setLogoRefreshKey(Date.now());
                    setLogoFile(null);
                    setLogoPreview(null);

                    alert('Logo uploadé avec succès! La page va se recharger pour afficher le nouveau logo...');

                    // Forcer le rechargement de la page pour voir le nouveau logo partout
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                    setUploadingLogo(false);
                }
            };

            // Fonction pour réinitialiser le logo
            const handleResetLogo = async () => {
                if (!confirm('Voulez-vous vraiment réinitialiser le logo au logo par défaut?')) {
                    return;
                }

                setUploadingLogo(true);
                try {
                    await axios.delete(API_URL + '/settings/logo');

                    // Rafraîchir le logo
                    setLogoRefreshKey(Date.now());
                    setLogoFile(null);
                    setLogoPreview(null);

                    alert('Logo réinitialisé avec succès! La page va se recharger pour afficher le logo par défaut...');

                    // Forcer le rechargement de la page
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                    setUploadingLogo(false);
                }
            };

            // Fonctions pour gérer le titre
            const handleStartEditTitle = () => {
                setTempTitle(companyTitle);
                setEditingTitle(true);
            };

            const handleCancelEditTitle = () => {
                setTempTitle('');
                setEditingTitle(false);
            };

            const handleSaveTitle = async () => {
                if (!tempTitle.trim()) {
                    alert('Le titre ne peut pas être vide');
                    return;
                }

                if (tempTitle.trim().length > 100) {
                    alert('Le titre ne peut pas dépasser 100 caractères');
                    return;
                }

                setSavingTitle(true);
                try {
                    await axios.put(API_URL + '/settings/title', {
                        value: tempTitle.trim()
                    });

                    setCompanyTitle(tempTitle.trim());
                    setEditingTitle(false);
                    setTempTitle('');

                    alert('Titre mis à jour avec succès! La page va se recharger...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                } finally {
                    setSavingTitle(false);
                }
            };

            // Fonctions pour gérer le sous-titre
            const handleStartEditSubtitle = () => {
                setTempSubtitle(companySubtitle);
                setEditingSubtitle(true);
            };

            const handleCancelEditSubtitle = () => {
                setTempSubtitle('');
                setEditingSubtitle(false);
            };

            const handleSaveSubtitle = async () => {
                if (!tempSubtitle.trim()) {
                    alert('Le sous-titre ne peut pas être vide');
                    return;
                }

                if (tempSubtitle.trim().length > 150) {
                    alert('Le sous-titre ne peut pas dépasser 150 caractères');
                    return;
                }

                setSavingSubtitle(true);
                try {
                    await axios.put(API_URL + '/settings/subtitle', {
                        value: tempSubtitle.trim()
                    });

                    setCompanySubtitle(tempSubtitle.trim());
                    setEditingSubtitle(false);
                    setTempSubtitle('');

                    alert('Sous-titre mis à jour avec succès! La page va se recharger...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                } finally {
                    setSavingSubtitle(false);
                }
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50' },
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 flex items-center gap-2' },
                                React.createElement('i', { className: 'fas fa-cog' }),
                                "Paramètres Système"
                            ),
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'text-gray-500 hover:text-gray-700 text-2xl',
                                type: 'button'
                            }, '×')
                        )
                    ),

                    React.createElement('div', { className: 'p-6 overflow-y-auto', style: { maxHeight: 'calc(90vh - 180px)' } },
                        loading ? React.createElement('div', { className: 'text-center py-8' },
                            React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl text-blue-600' })
                        ) : React.createElement('div', { className: 'space-y-6' },
                            React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
                                React.createElement('div', { className: 'flex items-start gap-3' },
                                    React.createElement('i', { className: 'fas fa-info-circle text-blue-600 text-xl mt-1' }),
                                    React.createElement('div', {},
                                        React.createElement('h3', { className: 'font-bold text-blue-900 mb-2' }, "À propos du décalage horaire"),
                                        React.createElement('p', { className: 'text-sm text-blue-800 mb-2' },
                                            "Le décalage horaire permet d'ajuster l'heure du serveur pour correspondre à votre fuseau horaire local."
                                        ),
                                        React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1 list-disc list-inside' },
                                            React.createElement('li', {}, 'Hiver (EST): -5 heures'),
                                            React.createElement('li', {}, 'Ete (EDT): -4 heures'),
                                            React.createElement('li', {}, 'Impacte: alertes retard, countdowns')
                                        )
                                    )
                                )
                            ),

                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                    React.createElement('i', { className: 'fas fa-clock mr-2' }),
                                    'Decalage horaire (heures par rapport a UTC)'
                                ),
                                React.createElement('select', {
                                    value: timezoneOffset,
                                    onChange: (e) => setTimezoneOffset(e.target.value),
                                    className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold'
                                },
                                    React.createElement('option', { value: '-12' }, 'UTC-12'),
                                    React.createElement('option', { value: '-11' }, 'UTC-11'),
                                    React.createElement('option', { value: '-10' }, 'UTC-10 (Hawaii)'),
                                    React.createElement('option', { value: '-9' }, 'UTC-9 (Alaska)'),
                                    React.createElement('option', { value: '-8' }, 'UTC-8 (PST)'),
                                    React.createElement('option', { value: '-7' }, 'UTC-7 (MST)'),
                                    React.createElement('option', { value: '-6' }, 'UTC-6 (CST)'),
                                    React.createElement('option', { value: '-5' }, 'UTC-5 (EST - Hiver Quebec)'),
                                    React.createElement('option', { value: '-4' }, 'UTC-4 (EDT - Ete Quebec)'),
                                    React.createElement('option', { value: '-3' }, 'UTC-3'),
                                    React.createElement('option', { value: '-2' }, 'UTC-2'),
                                    React.createElement('option', { value: '-1' }, 'UTC-1'),
                                    React.createElement('option', { value: '0' }, 'UTC+0 (Londres)'),
                                    React.createElement('option', { value: '1' }, 'UTC+1 (Paris)'),
                                    React.createElement('option', { value: '2' }, 'UTC+2'),
                                    React.createElement('option', { value: '3' }, 'UTC+3'),
                                    React.createElement('option', { value: '4' }, 'UTC+4'),
                                    React.createElement('option', { value: '5' }, 'UTC+5'),
                                    React.createElement('option', { value: '6' }, 'UTC+6'),
                                    React.createElement('option', { value: '7' }, 'UTC+7'),
                                    React.createElement('option', { value: '8' }, 'UTC+8 (Hong Kong)'),
                                    React.createElement('option', { value: '9' }, 'UTC+9 (Tokyo)'),
                                    React.createElement('option', { value: '10' }, 'UTC+10 (Sydney)'),
                                    React.createElement('option', { value: '11' }, 'UTC+11'),
                                    React.createElement('option', { value: '12' }, 'UTC+12'),
                                    React.createElement('option', { value: '13' }, 'UTC+13'),
                                    React.createElement('option', { value: '14' }, 'UTC+14')
                                ),
                                React.createElement('p', { className: 'mt-2 text-sm text-gray-600' },
                                    'Actuellement selectionne: UTC',
                                    timezoneOffset,
                                    ' (',
                                    parseInt(timezoneOffset) === -5 ? 'EST - Hiver Quebec' :
                                    parseInt(timezoneOffset) === -4 ? 'EDT - Ete Quebec' :
                                    'Personnalise',
                                    ')'
                                )
                            ),

                            React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
                                React.createElement('div', { className: 'flex items-start gap-3' },
                                    React.createElement('i', { className: 'fas fa-exclamation-triangle text-yellow-600 text-xl mt-1' }),
                                    React.createElement('div', {},
                                        React.createElement('h3', { className: 'font-bold text-yellow-900 mb-1' }, "Attention"),
                                        React.createElement('p', { className: 'text-sm text-yellow-800' },
                                            "Changez ce paramètre uniquement lors du changement d'heure (mars et novembre)."
                                        )
                                    )
                                )
                            ),

                            // Section Logo de l'entreprise (ADMIN UNIQUEMENT)
                            isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                                React.createElement('div', { className: 'bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4' },
                                    React.createElement('div', { className: 'flex items-start gap-3' },
                                        React.createElement('i', { className: 'fas fa-image text-purple-600 text-xl mt-1' }),
                                        React.createElement('div', {},
                                            React.createElement('h3', { className: 'font-bold text-purple-900 mb-2 flex items-center gap-2' },
                                                "Logo de l'entreprise",
                                                React.createElement('span', { className: 'text-xs bg-blue-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                            ),
                                            React.createElement('p', { className: 'text-sm text-purple-800 mb-2' },
                                                "Personnalisez le logo affiché dans l'application."
                                            ),
                                            React.createElement('ul', { className: 'text-sm text-purple-800 space-y-1 list-disc list-inside' },
                                                React.createElement('li', {}, 'Format: PNG transparent recommandé'),
                                                React.createElement('li', {}, 'Dimensions: 200×80 pixels (ratio 2.5:1)'),
                                                React.createElement('li', {}, 'Taille max: 500 KB')
                                            )
                                        )
                                    )
                                ),

                                // Logo actuel
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-eye mr-2' }),
                                        'Logo actuel'
                                    ),
                                    React.createElement('div', { className: 'bg-gray-100 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-center' },
                                        React.createElement('img', {
                                            src: currentLogoUrl + '?t=' + logoRefreshKey,
                                            alt: 'Logo actuel',
                                            className: 'max-h-20 max-w-full object-contain',
                                            onError: (e) => {
                                                e.target.src = '/static/logo-igp.png';
                                            }
                                        })
                                    )
                                ),

                                // Upload nouveau logo
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-upload mr-2' }),
                                        'Uploader un nouveau logo'
                                    ),
                                    // Bouton personnalisé pour sélectionner le fichier (en français)
                                    React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                        React.createElement('label', {
                                            className: 'cursor-pointer px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg border-2 border-purple-300 transition-all flex items-center gap-2 ' + (uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''),
                                            style: { pointerEvents: uploadingLogo ? 'none' : 'auto' }
                                        },
                                            React.createElement('i', { className: 'fas fa-folder-open' }),
                                            React.createElement('span', {}, 'Choisir un fichier'),
                                            React.createElement('input', {
                                                type: 'file',
                                                accept: 'image/png,image/jpeg,image/jpg,image/webp',
                                                onChange: handleLogoFileChange,
                                                disabled: uploadingLogo,
                                                className: 'hidden'
                                            })
                                        ),
                                        React.createElement('span', { className: 'text-sm text-gray-600' },
                                            logoFile ? logoFile.name : 'Aucun fichier sélectionné'
                                        )
                                    ),
                                    logoPreview && React.createElement('div', { className: 'mt-3 bg-white border-2 border-purple-300 rounded-lg p-3 sm:p-4' },
                                        React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' }, 'Aperçu:'),
                                        React.createElement('div', { className: 'flex items-center justify-center' },
                                            React.createElement('img', {
                                                src: logoPreview,
                                                alt: 'Aperçu',
                                                className: 'max-h-20 max-w-full object-contain'
                                            })
                                        )
                                    )
                                ),

                                // Boutons d'action
                                React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3' },
                                    React.createElement('button', {
                                        onClick: handleUploadLogo,
                                        disabled: !logoFile || uploadingLogo,
                                        className: 'flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base',
                                        type: 'button'
                                    },
                                        uploadingLogo && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                        uploadingLogo ? 'Upload en cours...' : 'Uploader le logo'
                                    ),
                                    React.createElement('button', {
                                        onClick: handleResetLogo,
                                        disabled: uploadingLogo,
                                        className: 'px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base',
                                        type: 'button',
                                        title: 'Réinitialiser au logo par défaut'
                                    },
                                        React.createElement('i', { className: 'fas fa-undo' }),
                                        React.createElement('span', { className: 'hidden sm:inline' }, 'Réinitialiser'),
                                        React.createElement('span', { className: 'sm:hidden' }, 'Reset')
                                    )
                                )
                            ),

                            // Section Titre et Sous-titre (ADMIN UNIQUEMENT)
                            isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                                React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4' },
                                    React.createElement('div', { className: 'flex items-start gap-3' },
                                        React.createElement('i', { className: 'fas fa-heading text-blue-600 text-xl mt-1' }),
                                        React.createElement('div', {},
                                            React.createElement('h3', { className: 'font-bold text-blue-900 mb-2 flex items-center gap-2' },
                                                "Titre et Sous-titre de l'application",
                                                React.createElement('span', { className: 'text-xs bg-blue-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                            ),
                                            React.createElement('p', { className: 'text-sm text-blue-800 mb-2' },
                                                "Personnalisez le titre et le sous-titre affichés dans l'en-tête de l'application."
                                            ),
                                            React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1 list-disc list-inside' },
                                                React.createElement('li', {}, 'Titre: maximum 100 caractères'),
                                                React.createElement('li', {}, 'Sous-titre: maximum 150 caractères'),
                                                React.createElement('li', {}, 'Les caractères spéciaux sont supportés (é, è, à, ç, etc.)')
                                            )
                                        )
                                    )
                                ),

                                // Édition du titre
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-heading mr-2' }),
                                        'Titre principal'
                                    ),
                                    !editingTitle ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                        React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                            companyTitle
                                        ),
                                        React.createElement('button', {
                                            onClick: handleStartEditTitle,
                                            className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                            type: 'button'
                                        },
                                            React.createElement('i', { className: 'fas fa-edit' }),
                                            'Modifier'
                                        )
                                    ) : React.createElement('div', { className: 'space-y-3' },
                                        React.createElement('input', {
                                            type: 'text',
                                            value: tempTitle,
                                            onChange: (e) => setTempTitle(e.target.value),
                                            placeholder: 'Entrez le nouveau titre',
                                            maxLength: 100,
                                            className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                            disabled: savingTitle
                                        }),
                                        React.createElement('div', { className: 'flex items-center justify-between' },
                                            React.createElement('span', { className: 'text-xs text-gray-600' },
                                                tempTitle.length + '/100 caractères'
                                            ),
                                            React.createElement('div', { className: 'flex gap-2' },
                                                React.createElement('button', {
                                                    onClick: handleCancelEditTitle,
                                                    disabled: savingTitle,
                                                    className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                                    type: 'button'
                                                }, 'Annuler'),
                                                React.createElement('button', {
                                                    onClick: handleSaveTitle,
                                                    disabled: !tempTitle.trim() || savingTitle,
                                                    className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                                    type: 'button'
                                                },
                                                    savingTitle && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                                    savingTitle ? 'Enregistrement...' : 'Enregistrer'
                                                )
                                            )
                                        )
                                    )
                                ),

                                // Édition du sous-titre
                                React.createElement('div', { className: 'mb-0' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-align-left mr-2' }),
                                        'Sous-titre'
                                    ),
                                    !editingSubtitle ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                        React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                            companySubtitle
                                        ),
                                        React.createElement('button', {
                                            onClick: handleStartEditSubtitle,
                                            className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                            type: 'button'
                                        },
                                            React.createElement('i', { className: 'fas fa-edit' }),
                                            'Modifier'
                                        )
                                    ) : React.createElement('div', { className: 'space-y-3' },
                                        React.createElement('input', {
                                            type: 'text',
                                            value: tempSubtitle,
                                            onChange: (e) => setTempSubtitle(e.target.value),
                                            placeholder: 'Entrez le nouveau sous-titre',
                                            maxLength: 150,
                                            className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                            disabled: savingSubtitle
                                        }),
                                        React.createElement('div', { className: 'flex items-center justify-between' },
                                            React.createElement('span', { className: 'text-xs text-gray-600' },
                                                tempSubtitle.length + '/150 caractères'
                                            ),
                                            React.createElement('div', { className: 'flex gap-2' },
                                                React.createElement('button', {
                                                    onClick: handleCancelEditSubtitle,
                                                    disabled: savingSubtitle,
                                                    className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                                    type: 'button'
                                                }, 'Annuler'),
                                                React.createElement('button', {
                                                    onClick: handleSaveSubtitle,
                                                    disabled: !tempSubtitle.trim() || savingSubtitle,
                                                    className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                                    type: 'button'
                                                },
                                                    savingSubtitle && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                                    savingSubtitle ? 'Enregistrement...' : 'Enregistrer'
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    React.createElement('div', { className: 'p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3' },
                        React.createElement('button', {
                            onClick: onClose,
                            disabled: saving,
                            className: 'px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all',
                            type: 'button'
                        }, 'Annuler'),
                        React.createElement('button', {
                            onClick: handleSave,
                            disabled: saving,
                            className: 'px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2',
                            type: 'button'
                        },
                            saving && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                            saving ? 'Enregistrement...' : 'Enregistrer'
                        )
                    )
                )
            );
        };


        // Composant de performance des techniciens (ÉTAPE 2: VERSION BASIQUE)
        const PerformanceModal = ({ show, onClose }) => {
            const [loading, setLoading] = React.useState(true);
            const [performanceData, setPerformanceData] = React.useState(null);

            React.useEffect(() => {
                if (show) {
                    loadPerformanceData();
                }
            }, [show]);

            const loadPerformanceData = async () => {
                try {
                    setLoading(true);
                    const response = await fetch('/api/stats/technicians-performance', {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                        }
                    });
                    const data = await response.json();
                    setPerformanceData(data);
                } catch (error) {
                    console.error('Erreur chargement performance:', error);
                } finally {
                    setLoading(false);
                }
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden',
                    onClick: (e) => e.stopPropagation()
                },
                    // Header with gradient
                    React.createElement('div', { 
                        className: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 sm:p-6'
                    },
                        React.createElement('div', { className: 'flex justify-between items-center' },
                            React.createElement('div', {},
                                React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                                    React.createElement('i', { className: 'fas fa-chart-line' }),
                                    'Tableau de Performance'
                                ),
                                React.createElement('p', { className: 'text-slate-200 text-xs sm:text-sm mt-1' }, 
                                    'Analyse des performances sur les 30 derniers jours'
                                )
                            ),
                            React.createElement('button', {
                                className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors',
                                onClick: onClose
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        )
                    ),

                    // Content
                    React.createElement('div', { className: 'p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]' },
                        loading ? 
                            React.createElement('div', { className: 'text-center py-12' },
                                React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-slate-500 mb-4' }),
                                React.createElement('p', { className: 'text-gray-600' }, 'Chargement des données...')
                            ) :
                            React.createElement('div', { className: 'space-y-3 sm:space-y-6' },
                                // Top Performers Section
                                React.createElement('div', {},
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-3 sm:mb-4' },
                                        React.createElement('i', { className: 'fas fa-trophy text-yellow-500 text-xl' }),
                                        React.createElement('h3', { className: 'text-base sm:text-lg font-bold text-gray-800' }, 
                                            'Top Performers'
                                        ),
                                        React.createElement('span', { className: 'text-xs sm:text-sm text-gray-500' }, 
                                            '(Meilleurs techniciens)'
                                        )
                                    ),
                                    
                                    // Performance Cards
                                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4' },
                                        performanceData?.topTechnicians?.slice(0, 3).map((tech, index) => {
                                            const rankColors = [
                                                { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', border: 'border-amber-400', icon: 'fa-medal text-amber-600', badge: 'bg-amber-600' },
                                                { bg: 'bg-gradient-to-br from-slate-50 to-slate-100', border: 'border-slate-300', icon: 'fa-medal text-slate-500', badge: 'bg-slate-500' },
                                                { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-400', icon: 'fa-medal text-orange-700', badge: 'bg-orange-700' }
                                            ];
                                            const colors = rankColors[index] || rankColors[2];
                                            
                                            return React.createElement('div', {
                                                key: tech.id,
                                                className: 'border-2 rounded-lg p-3 sm:p-4 ' + colors.bg + ' ' + colors.border + ' hover:shadow-lg transition-shadow'
                                            },
                                                React.createElement('div', { className: 'flex items-start justify-between mb-3' },
                                                    React.createElement('div', { className: 'flex items-center gap-2' },
                                                        React.createElement('i', { className: 'fas ' + colors.icon + ' text-2xl' }),
                                                        React.createElement('span', { className: 'text-xs font-semibold text-gray-600' }, 
                                                            '#' + (index + 1)
                                                        )
                                                    ),
                                                    React.createElement('span', { 
                                                        className: 'px-2 py-1 rounded-full text-white text-xs font-bold ' + colors.badge 
                                                    }, tech.completed_count + ' tickets')
                                                ),
                                                React.createElement('div', {},
                                                    React.createElement('p', { className: 'font-bold text-gray-800 mb-1' }, 
                                                        tech.full_name || (tech.first_name + ' ' + tech.last_name)
                                                    ),
                                                    React.createElement('div', { className: 'flex items-center gap-2 text-xs text-gray-600' },
                                                        React.createElement('i', { className: 'fas fa-check-circle text-green-500' }),
                                                        React.createElement('span', {}, tech.completed_count + ' interventions réussies')
                                                    )
                                                )
                                            );
                                        })
                                    )
                                ),

                                // Stats Summary
                                performanceData?.topTechnicians?.length > 0 && React.createElement('div', { 
                                    className: 'bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4'
                                },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                        React.createElement('i', { className: 'fas fa-info-circle text-slate-600' }),
                                        React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                                    ),
                                    React.createElement('p', { className: 'text-xs sm:text-sm text-gray-700' },
                                        'Total de ',
                                        React.createElement('span', { className: 'font-bold' }, 
                                            performanceData.topTechnicians.reduce((sum, t) => sum + t.completed_count, 0)
                                        ),
                                        ' tickets complétés par les ',
                                        React.createElement('span', { className: 'font-bold' }, 
                                            performanceData.topTechnicians.length
                                        ),
                                        ' meilleurs techniciens au cours des 30 derniers jours.'
                                    )
                                ),

                                // Empty state
                                performanceData?.topTechnicians?.length === 0 && React.createElement('div', {
                                    className: 'text-center py-12 bg-gray-50 rounded-lg'
                                },
                                    React.createElement('i', { className: 'fas fa-inbox text-5xl text-gray-300 mb-4' }),
                                    React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                        'Aucune donnée de performance disponible'
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                        'Les statistiques apparaîtront une fois que les techniciens auront complété des tickets.'
                                    )
                                )
                            )
                    )
                )
            );
        };


        // Composant modal des tickets en retard
        const OverdueTicketsModal = ({ show, onClose, currentUser }) => {
            const [loading, setLoading] = React.useState(true);
            const [overdueTickets, setOverdueTickets] = React.useState([]);
            const [ticketComments, setTicketComments] = React.useState({});

            React.useEffect(() => {
                if (show) {
                    loadOverdueTickets();
                }
            }, [show]);

            const loadOverdueTickets = async () => {
                try {
                    setLoading(true);
                    const response = await fetch('/api/tickets', {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                        }
                    });
                    const data = await response.json();
                    
                    // Filter overdue tickets
                    const now = new Date();
                    const overdue = (data.tickets || []).filter(ticket => {
                        if (ticket.status === 'completed' || ticket.status === 'cancelled' || ticket.status === 'archived') {
                            return false;
                        }
                        // Handle both null and string "null" from database
                        if (!ticket.scheduled_date || ticket.scheduled_date === 'null') {
                            return false;
                        }
                        // CRITICAL FIX: Force UTC interpretation to avoid timezone issues
                        // Replace space with 'T' and add 'Z' for consistent ISO 8601 UTC format
                        // "2025-11-25 10:16:00" → "2025-11-25T10:16:00Z"
                        const isoDate = ticket.scheduled_date.replace(' ', 'T') + 'Z';
                        const scheduledDate = new Date(isoDate);
                        return scheduledDate < now;
                    });
                    
                    // Sort by scheduled date (oldest first)
                    overdue.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
                    
                    setOverdueTickets(overdue);
                    
                    // Load comments for all overdue tickets IN PARALLEL (10x faster)
                    if (overdue.length > 0) {
                        const commentsPromises = overdue.map(ticket => 
                            fetch('/api/comments/ticket/' + ticket.id, {
                                headers: {
                                    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                                }
                            })
                            .then(res => res.json())
                            .then(data => ({ ticketId: ticket.id, comments: data.comments || [] }))
                            .catch(err => {
                                console.error('Erreur chargement commentaires ticket ' + ticket.id + ':', err);
                                return { ticketId: ticket.id, comments: [] };
                            })
                        );
                        
                        const commentsResults = await Promise.all(commentsPromises);
                        const commentsMap = {};
                        commentsResults.forEach(result => {
                            commentsMap[result.ticketId] = result.comments;
                        });
                        setTicketComments(commentsMap);
                    }
                } catch (error) {
                    console.error('Erreur chargement tickets en retard:', error);
                } finally {
                    setLoading(false);
                }
            };

            const getDaysOverdue = (scheduledDate) => {
                const now = new Date();
                const scheduled = new Date(scheduledDate);
                const diffTime = Math.abs(now - scheduled);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays;
            };

            const getPriorityColor = (priority) => {
                const colors = {
                    'critical': 'bg-red-100 text-red-800 border-red-300',
                    'high': 'bg-orange-100 text-orange-800 border-orange-300',
                    'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    'low': 'bg-green-100 text-green-800 border-green-300'
                };
                return colors[priority] || colors.medium;
            };

            const getPriorityLabel = (priority) => {
                const labels = {
                    'critical': 'Critique',
                    'high': 'Haute',
                    'medium': 'Moyenne',
                    'low': 'Basse'
                };
                return labels[priority] || priority;
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden',
                    onClick: (e) => e.stopPropagation()
                },
                    // Header
                    React.createElement('div', { 
                        className: 'bg-gradient-to-r from-rose-800 to-rose-900 text-white p-4 sm:p-6'
                    },
                        React.createElement('div', { className: 'flex justify-between items-center' },
                            React.createElement('div', {},
                                React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                                    React.createElement('i', { className: 'fas fa-exclamation-triangle' }),
                                    'Tickets en Retard'
                                ),
                                React.createElement('p', { className: 'text-rose-200 text-xs sm:text-sm mt-1' }, 
                                    'Interventions nécessitant une attention immédiate'
                                )
                            ),
                            React.createElement('button', {
                                className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors',
                                onClick: onClose
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        )
                    ),

                    // Content
                    React.createElement('div', { className: 'p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]' },
                        loading ? 
                            React.createElement('div', { className: 'text-center py-12' },
                                React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-rose-600 mb-4' }),
                                React.createElement('p', { className: 'text-gray-600' }, 'Chargement des tickets...')
                            ) :
                            overdueTickets.length > 0 ?
                                React.createElement('div', { className: 'space-y-3 sm:space-y-4' },
                                    // Stats summary
                                    React.createElement('div', { className: 'bg-rose-50 border border-rose-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6' },
                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                            React.createElement('i', { className: 'fas fa-info-circle text-rose-700' }),
                                            React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                                        ),
                                        React.createElement('p', { className: 'text-sm text-gray-700' },
                                            React.createElement('span', { className: 'font-bold text-rose-800' }, overdueTickets.length),
                                            ' ticket(s) en retard nécessitant une action urgente.'
                                        )
                                    ),

                                    // Tickets list
                                    overdueTickets.map((ticket) =>
                                        React.createElement('div', {
                                            key: ticket.id,
                                            className: 'border-2 border-rose-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white'
                                        },
                                            React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start mb-3 gap-2' },
                                                React.createElement('div', { className: 'flex-1' },
                                                    React.createElement('h3', { className: 'font-bold text-gray-800 mb-1' }, ticket.title),
                                                    React.createElement('p', { className: 'text-sm text-gray-600 mb-2' }, ticket.ticket_id)
                                                ),
                                                React.createElement('div', { className: 'flex flex-col items-end gap-2' },
                                                    React.createElement('span', { 
                                                        className: 'px-3 py-1 rounded-full text-xs font-bold border-2 ' + getPriorityColor(ticket.priority)
                                                    }, getPriorityLabel(ticket.priority)),
                                                    React.createElement('span', { 
                                                        className: 'px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border-2 border-red-300'
                                                    }, 
                                                        React.createElement('i', { className: 'fas fa-clock mr-1' }),
                                                        getDaysOverdue(ticket.scheduled_date) + ' jours'
                                                    )
                                                )
                                            ),
                                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm' },
                                                React.createElement('div', { className: 'flex flex-wrap' },
                                                    React.createElement('span', { className: 'text-gray-500' }, 'Machine: '),
                                                    React.createElement('span', { className: 'font-medium ml-1' }, ticket.machine_type + ' - ' + ticket.model)
                                                ),
                                                React.createElement('div', { className: 'flex flex-wrap' },
                                                    React.createElement('span', { className: 'text-gray-500' }, 'Assigné à: '),
                                                    React.createElement('span', { className: 'font-medium ml-1 break-all' }, ticket.assignee_name || 'Non assigné')
                                                ),
                                                React.createElement('div', { className: 'flex flex-wrap' },
                                                    React.createElement('span', { className: 'text-gray-500' }, 'Date prévue: '),
                                                    React.createElement('span', { className: 'font-medium text-red-600 ml-1' }, 
                                                        new Date(ticket.scheduled_date.replace(' ', 'T') + 'Z').toLocaleDateString('fr-FR')
                                                    )
                                                ),
                                                React.createElement('div', { className: 'flex flex-wrap' },
                                                    React.createElement('span', { className: 'text-gray-500' }, 'Lieu: '),
                                                    React.createElement('span', { className: 'font-medium ml-1' }, ticket.location)
                                                )
                                            ),
                                            // Comments section
                                            ticketComments[ticket.id] && ticketComments[ticket.id].length > 0 && 
                                            React.createElement('div', { className: 'mt-3 pt-3 border-t border-rose-100' },
                                                React.createElement('h4', { className: 'text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1' },
                                                    React.createElement('i', { className: 'fas fa-comment text-rose-600' }),
                                                    'Commentaires (' + ticketComments[ticket.id].length + ')'
                                                ),
                                                React.createElement('div', { className: 'space-y-2 max-h-32 overflow-y-auto' },
                                                    ticketComments[ticket.id].map((comment, idx) =>
                                                        React.createElement('div', { 
                                                            key: idx,
                                                            className: 'bg-gray-50 rounded p-2 text-xs'
                                                        },
                                                            React.createElement('div', { className: 'font-semibold text-rose-700 mb-1' },
                                                                'Commentaire de ' + comment.user_name + ':'
                                                            ),
                                                            React.createElement('div', { className: 'text-gray-700' },
                                                                comment.comment
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                ) :
                                React.createElement('div', {
                                    className: 'text-center py-12 bg-gray-50 rounded-lg'
                                },
                                    React.createElement('i', { className: 'fas fa-check-circle text-5xl text-green-500 mb-4' }),
                                    React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                        'Aucun ticket en retard !'
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                        'Toutes les interventions sont à jour.'
                                    )
                                )
                    )
                )
            );
        };


        // Composant modal des appareils push
        const PushDevicesModal = ({ show, onClose }) => {
            const [loading, setLoading] = React.useState(true);
            const [devices, setDevices] = React.useState([]);

            React.useEffect(() => {
                if (show) {
                    loadDevices();
                }
            }, [show]);

            const loadDevices = async () => {
                try {
                    setLoading(true);
                    const response = await fetch('/api/push/subscriptions-list', {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                        }
                    });
                    const data = await response.json();
                    setDevices(data.subscriptions || []);
                } catch (error) {
                    console.error('Erreur chargement appareils:', error);
                } finally {
                    setLoading(false);
                }
            };

            const getDeviceIcon = (deviceType) => {
                if (!deviceType) return 'fa-mobile-alt';
                const type = deviceType.toLowerCase();
                if (type.includes('mobile') || type.includes('phone')) return 'fa-mobile-alt';
                if (type.includes('tablet') || type.includes('ipad')) return 'fa-tablet-alt';
                if (type.includes('desktop') || type.includes('windows')) return 'fa-desktop';
                if (type.includes('laptop') || type.includes('mac')) return 'fa-laptop';
                return 'fa-mobile-alt';
            };

            const getDevicePlatform = (deviceType, deviceName) => {
                if (deviceName) return deviceName;
                if (!deviceType) return 'Appareil inconnu';
                return deviceType;
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden',
                    onClick: (e) => e.stopPropagation()
                },
                    // Header
                    React.createElement('div', { 
                        className: 'bg-gradient-to-r from-teal-700 to-teal-800 text-white p-4 sm:p-6'
                    },
                        React.createElement('div', { className: 'flex justify-between items-center' },
                            React.createElement('div', {},
                                React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                                    React.createElement('i', { className: 'fas fa-bell' }),
                                    'Appareils Notifications Push'
                                ),
                                React.createElement('p', { className: 'text-teal-200 text-xs sm:text-sm mt-1' }, 
                                    'Appareils enregistrés pour recevoir les notifications'
                                )
                            ),
                            React.createElement('button', {
                                className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors',
                                onClick: onClose
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        )
                    ),

                    // Content
                    React.createElement('div', { className: 'p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]' },
                        loading ? 
                            React.createElement('div', { className: 'text-center py-12' },
                                React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-teal-600 mb-4' }),
                                React.createElement('p', { className: 'text-gray-600' }, 'Chargement des appareils...')
                            ) :
                            devices.length > 0 ?
                                React.createElement('div', { className: 'space-y-3 sm:space-y-4' },
                                    // Stats summary
                                    React.createElement('div', { className: 'bg-teal-50 border border-teal-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6' },
                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                            React.createElement('i', { className: 'fas fa-info-circle text-teal-700' }),
                                            React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                                        ),
                                        React.createElement('p', { className: 'text-xs sm:text-sm text-gray-700' },
                                            React.createElement('span', { className: 'font-bold text-teal-800' }, devices.length),
                                            ' appareil(s) enregistré(s) pour recevoir les notifications push.'
                                        )
                                    ),

                                    // Devices list
                                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4' },
                                        devices.map((device, index) =>
                                            React.createElement('div', {
                                                key: device.id,
                                                className: 'border-2 border-teal-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-teal-50 to-white'
                                            },
                                                React.createElement('div', { className: 'flex items-start gap-3' },
                                                    React.createElement('div', { className: 'w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0' },
                                                        React.createElement('i', { 
                                                            className: 'fas ' + getDeviceIcon(device.device_type) + ' text-teal-700 text-xl'
                                                        })
                                                    ),
                                                    React.createElement('div', { className: 'flex-1' },
                                                        React.createElement('h3', { className: 'font-bold text-gray-800 mb-1' }, 
                                                            getDevicePlatform(device.device_type, device.device_name)
                                                        ),
                                                        React.createElement('p', { className: 'text-xs text-gray-500 mb-2' }, 
                                                            'Utilisateur: ' + (device.user_full_name || 'Inconnu')
                                                        ),
                                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                                            React.createElement('span', { 
                                                                className: 'px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700'
                                                            },
                                                                React.createElement('i', { className: 'fas fa-check-circle mr-1' }),
                                                                'Actif'
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                ) :
                                React.createElement('div', {
                                    className: 'text-center py-12 bg-gray-50 rounded-lg'
                                },
                                    React.createElement('i', { className: 'fas fa-mobile-alt text-5xl text-gray-300 mb-4' }),
                                    React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                        'Aucun appareil enregistré'
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                        'Les appareils apparaîtront ici une fois les notifications push activées.'
                                    )
                                )
                    )
                )
            );
        };


        // Composant de gestion des utilisateurs (VERSION SIMPLIFIÉE)
        const UserManagementModal = ({ show, onClose, currentUser, onOpenMessage }) => {
            const [users, setUsers] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            const [showCreateForm, setShowCreateForm] = React.useState(false);
            const [newEmail, setNewEmail] = React.useState('');
            const [newPassword, setNewPassword] = React.useState('');
            const [newFirstName, setNewFirstName] = React.useState('');
            const [newLastName, setNewLastName] = React.useState('');
            const [newRole, setNewRole] = React.useState('operator');
            const [editingUser, setEditingUser] = React.useState(null);
            const [editEmail, setEditEmail] = React.useState('');
            const [editFirstName, setEditFirstName] = React.useState('');
            const [editLastName, setEditLastName] = React.useState('');
            const [editRole, setEditRole] = React.useState('operator');
            const [notification, setNotification] = React.useState({ show: false, message: '', type: 'info' });
            const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });
            const [promptDialog, setPromptDialog] = React.useState({ show: false, message: '', onConfirm: null });
            const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });
            const [searchQuery, setSearchQuery] = React.useState('');
            const [buttonLoading, setButtonLoading] = React.useState(null);

            React.useEffect(() => {
                if (show) {
                    loadUsers(); // Chargement initial

                    // Polling toutes les 2 minutes pour rafraichir les statuts last_login
                    const interval = setInterval(() => {
                        loadUsers(true); // true = silent refresh (sans loading spinner)
                    }, 120000); // 2 minutes (au lieu de 30 secondes)

                    return () => clearInterval(interval);
                }
            }, [show]);

            // Reset edit form states when modal is closed
            React.useEffect(() => {
                if (!show) {
                    // Modal is closed - reset all edit form states
                    setEditingUser(null);
                    setEditEmail('');
                    setEditFirstName('');
                    setEditLastName('');
                    setEditRole('operator');
                    setShowCreateForm(false);
                }
            }, [show]);

            React.useEffect(() => {
                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        if (promptDialog.show) {
                            setPromptDialog({ show: false, message: '', onConfirm: null });
                        } else if (confirmDialog.show) {
                            setConfirmDialog({ show: false, message: '', onConfirm: null });
                        } else if (notification.show) {
                            setNotification({ show: false, message: '', type: 'info' });
                        } else if (editingUser) {
                            setEditingUser(null);
                        } else if (showCreateForm) {
                            setShowCreateForm(false);
                        } else if (show) {
                            onClose();
                        }
                    }
                };

                if (show) {
                    document.addEventListener('keydown', handleEscape);
                    return () => document.removeEventListener('keydown', handleEscape);
                }
            }, [show, promptDialog.show, confirmDialog.show, notification.show, editingUser, showCreateForm]);

            const loadUsers = async (silent = false) => {
                try {
                    // Ne pas afficher le spinner si refresh automatique (silent mode)
                    if (!silent) {
                        setLoading(true);
                    }
                    // Tous les utilisateurs utilisent la route /api/users/team pour voir tous les utilisateurs
                    const endpoint = '/users/team';
                    const response = await axios.get(API_URL + endpoint);
                    setUsers(response.data.users);
                } catch (error) {
                    // En mode silent, ne pas afficher les erreurs (éviter notifications spam)
                    if (!silent) {
                        setNotification({ show: true, message: 'Erreur chargement: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                    }
                } finally {
                    if (!silent) {
                        setLoading(false);
                    }
                }
            };

            const handleCreateUser = React.useCallback(async (e) => {
                e.preventDefault();
                setButtonLoading('create');
                try {
                    await axios.post(API_URL + '/users', {
                        email: newEmail,
                        password: newPassword,
                        first_name: newFirstName,
                        last_name: newLastName,
                        role: newRole
                    });
                    setToast({ show: true, message: 'Utilisateur cree avec succes!', type: 'success' });
                    setNewEmail('');
                    setNewPassword('');
                    setNewFirstName('');
                    setNewLastName('');
                    setNewRole('operator');
                    setShowCreateForm(false);
                    loadUsers();
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                } finally {
                    setButtonLoading(null);
                }
            }, [newEmail, newPassword, newFirstName, newLastName, newRole, loadUsers]);

            // Gestionnaires validation formulaires admin
            const handleInvalidAdminField = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };

            const handleInputAdminEmail = (e, setter) => {
                e.target.setCustomValidity("");
                setter(e.target.value);
            };

            // Fonctions utilitaires mémorisées
            const ROLE_LABELS = React.useMemo(() => ({
                // Direction
                'admin': '👑 Administrateur',
                'director': '📊 Directeur Général',
                // Management Maintenance
                'supervisor': '⭐ Superviseur',
                'coordinator': '🎯 Coordonnateur Maintenance',
                'planner': '📅 Planificateur Maintenance',
                // Technique
                'senior_technician': '🔧 Technicien Senior',
                'technician': '🔧 Technicien',
                // Production
                'team_leader': '👔 Chef Équipe Production',
                'furnace_operator': '🔥 Opérateur Four',
                'operator': '👷 Opérateur',
                // Support
                'safety_officer': '🛡️ Agent Santé & Sécurité',
                'quality_inspector': '✓ Inspecteur Qualité',
                'storekeeper': '📦 Magasinier',
                // Transversal
                'viewer': '👁️ Lecture Seule'
            }), []);

            const ROLE_BADGE_COLORS = React.useMemo(() => ({
                // Direction - Rouge
                'admin': 'bg-red-100 text-red-800',
                'director': 'bg-red-50 text-red-700',
                // Management - Jaune/Orange
                'supervisor': 'bg-yellow-100 text-yellow-800',
                'coordinator': 'bg-amber-100 text-amber-800',
                'planner': 'bg-amber-100 text-amber-800',
                // Technique - Bleu
                'senior_technician': 'bg-blue-100 text-blue-800',
                'technician': 'bg-blue-50 text-blue-700',
                // Production - Vert
                'team_leader': 'bg-emerald-100 text-emerald-800',
                'furnace_operator': 'bg-green-100 text-green-800',
                'operator': 'bg-green-50 text-green-700',
                // Support - Indigo/Violet
                'safety_officer': 'bg-indigo-100 text-indigo-800',
                'quality_inspector': 'bg-slate-100 text-slate-700',
                'storekeeper': 'bg-violet-100 text-violet-800',
                // Transversal - Gris
                'viewer': 'bg-gray-100 text-gray-800'
            }), []);

            const getRoleLabel = React.useCallback((role) => {
                return ROLE_LABELS[role] || '👤 ' + role;
            }, [ROLE_LABELS]);

            const getRoleBadgeClass = React.useCallback((role) => {
                return ROLE_BADGE_COLORS[role] || 'bg-gray-100 text-gray-800';
            }, [ROLE_BADGE_COLORS]);

            const getLastLoginStatus = React.useCallback((lastLogin) => {
                if (!lastLogin) return {
                    color: "text-gray-500",
                    icon: "fa-circle",
                    status: "Jamais connecte",
                    time: "",
                    dot: "bg-gray-400"
                };

                const now = getNowEST();
                const loginISO = lastLogin.includes('T') ? lastLogin : lastLogin.replace(' ', 'T');
                // Ajouter Z pour forcer interpretation UTC
                const loginUTC = new Date(loginISO + (loginISO.includes('Z') ? '' : 'Z'));
                // Appliquer l'offset EST/EDT
                const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
                const loginDate = new Date(loginUTC.getTime() + (offset * 60 * 60 * 1000));
                const diffMs = now - loginDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 5) {
                    return {
                        color: "text-green-600",
                        icon: "fa-circle",
                        status: "En ligne",
                        time: "Actif maintenant",
                        dot: "bg-green-500"
                    };
                } else if (diffMins < 60) {
                    return {
                        color: "text-yellow-600",
                        icon: "fa-circle",
                        status: "Actif recemment",
                        time: "Il y a " + diffMins + " min",
                        dot: "bg-yellow-500"
                    };
                } else if (diffHours < 24) {
                    return {
                        color: "text-blue-700",
                        icon: "fa-circle",
                        status: "Actif aujourd'hui",
                        time: "Il y a " + diffHours + "h",
                        dot: "bg-amber-600"
                    };
                } else if (diffDays === 1) {
                    return {
                        color: "text-red-600",
                        icon: "fa-circle",
                        status: "Inactif",
                        time: "Hier",
                        dot: "bg-red-500"
                    };
                } else {
                    return {
                        color: "text-red-600",
                        icon: "fa-circle",
                        status: "Inactif",
                        time: "Il y a " + diffDays + " jours",
                        dot: "bg-red-500"
                    };
                }
            }, []);

            const canSeeLastLogin = React.useCallback((targetUser) => {
                // Admin voit tout le monde
                if (currentUser.role === "admin") return true;
                // Superviseur voit seulement les techniciens
                if (currentUser.role === "supervisor" && targetUser.role === "technician") return true;
                // Autres cas: non visible
                return false;
            }, [currentUser.role]);

            const handleDeleteUser = React.useCallback((userId, userName) => {
                setConfirmDialog({
                    show: true,
                    message: 'Etes-vous sur de vouloir supprimer ' + userName + ' ?',
                    onConfirm: async () => {
                        setConfirmDialog({ show: false, message: '', onConfirm: null });
                        setButtonLoading('delete-' + userId);
                        try {
                            await axios.delete(API_URL + '/users/' + userId);
                            setToast({ show: true, message: 'Utilisateur supprime avec succes!', type: 'success' });
                            loadUsers();
                        } catch (error) {
                            setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                        } finally {
                            setButtonLoading(null);
                        }
                    }
                });
            }, [loadUsers]);

            const handleEditUser = React.useCallback((user) => {
                setEditingUser(user);
                setEditEmail(user.email);
                setEditFirstName(user.first_name || '');
                setEditLastName(user.last_name || '');
                setEditRole(user.role);
            }, []);

            const handleUpdateUser = React.useCallback(async (e) => {
                e.preventDefault();
                setButtonLoading('update');
                try {
                    await axios.put(API_URL + '/users/' + editingUser.id, {
                        email: editEmail,
                        first_name: editFirstName,
                        last_name: editLastName,
                        role: editRole
                    });
                    setToast({ show: true, message: 'Utilisateur modifie avec succes!', type: 'success' });
                    setEditingUser(null);
                    loadUsers();
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                } finally {
                    setButtonLoading(null);
                }
            }, [editingUser, editEmail, editFirstName, editLastName, editRole, loadUsers]);

            const handleResetPassword = React.useCallback((userId, userName) => {
                setPromptDialog({
                    show: true,
                    message: 'Nouveau mot de passe pour ' + userName + ':',
                    onConfirm: async (newPass) => {
                        setPromptDialog({ show: false, message: '', onConfirm: null });
                        if (!newPass || newPass.length < 6) {
                            setNotification({ show: true, message: 'Mot de passe invalide (minimum 6 caracteres)', type: 'error' });
                            return;
                        }
                        try {
                            await axios.post(API_URL + '/users/' + userId + '/reset-password', {
                                new_password: newPass
                            });
                            setToast({ show: true, message: 'Mot de passe reinitialise avec succes!', type: 'success' });
                        } catch (error) {
                            setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                        }
                    }
                });
            }, []);

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'sticky top-0 bg-gradient-to-r from-slate-700 to-gray-700 text-white p-3 sm:p-5 flex justify-between items-center shadow-xl z-10' },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                            React.createElement('i', { className: 'fas fa-users-cog text-xl sm:text-2xl flex-shrink-0' }),
                            React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' },
                                currentUser.role === 'technician' ? "Liste Équipe" : "Gestion des Utilisateurs"
                            )
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                        },
                            React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                        )
                    ),
                    React.createElement('div', { className: 'flex-1 overflow-y-auto p-3 sm:p-6' },

                    React.createElement('div', { className: 'mb-4 flex flex-col sm:flex-row gap-3' },
                        // Bouton creer utilisateur (visible seulement pour admin/superviseur)
                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? React.createElement('button', {
                            onClick: () => setShowCreateForm(true),
                            className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] border-t border-blue-300/50'
                        }, "Créer un utilisateur") : null,
                        React.createElement('div', { className: 'flex-1 relative' },
                            React.createElement('input', {
                                type: 'text',
                                placeholder: 'Rechercher par nom ou email...',
                                value: searchQuery,
                                onChange: (e) => setSearchQuery(e.target.value),
                                className: 'w-full px-4 py-2 pl-10 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all',
                                onKeyDown: (e) => {
                                    if (e.key === 'Escape') {
                                        setSearchQuery('');
                                    }
                                }
                            }),
                            React.createElement('i', {
                                className: 'fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                            }),
                            searchQuery && React.createElement('button', {
                                onClick: () => setSearchQuery(''),
                                className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        )
                    ),

                    showCreateForm ? React.createElement('div', {
                        className: 'mb-6 p-6 bg-gradient-to-br from-blue-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-blue-200/50 scroll-mt-4',
                        ref: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    },
                        React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Nouvel utilisateur'),
                        React.createElement('form', { onSubmit: handleCreateUser },
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Email'),
                                    React.createElement('input', {
                                        type: 'email',
                                        value: newEmail,
                                        onChange: (e) => handleInputAdminEmail(e, setNewEmail),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        required: true,
                                        autoFocus: true
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Prénom'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: newFirstName,
                                        onChange: (e) => handleInputAdminEmail(e, setNewFirstName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        placeholder: 'Jean',
                                        required: true
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Nom (optionnel)'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: newLastName,
                                        onChange: (e) => handleInputAdminEmail(e, setNewLastName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        placeholder: 'Dupont'
                                    })
                                )
                            ),
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Mot de passe'),
                                    React.createElement('input', {
                                        type: 'password',
                                        value: newPassword,
                                        onChange: (e) => handleInputAdminEmail(e, setNewPassword),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        required: true,
                                        minLength: 6
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                                    React.createElement(RoleDropdown, {
                                        value: newRole,
                                        onChange: (e) => setNewRole(e.target.value),
                                        disabled: false,
                                        currentUserRole: currentUser.role
                                    })
                                )
                            ),
                            React.createElement('div', { className: 'flex gap-4' },
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: () => setShowCreateForm(false),
                                    className: 'px-6 py-3 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-xl font-bold transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                                }, 'Annuler'),
                                React.createElement('button', {
                                    type: 'submit',
                                    disabled: buttonLoading === 'create',
                                    className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 justify-center border-t border-blue-300/50'
                                },
                                    buttonLoading === 'create' && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                    "Créer"
                                )
                            )
                        )
                    ) : null,

                    editingUser ? React.createElement('div', {
                        className: 'mb-6 p-6 bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-green-200/50 scroll-mt-4',
                        ref: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    },
                        React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Modifier: ' + editingUser.full_name),
                        React.createElement('form', { onSubmit: handleUpdateUser },
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Email'),
                                    React.createElement('input', {
                                        type: 'email',
                                        value: editEmail,
                                        onChange: (e) => handleInputAdminEmail(e, setEditEmail),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                        required: true,
                                        autoFocus: true
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Prénom'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: editFirstName,
                                        onChange: (e) => handleInputAdminEmail(e, setEditFirstName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                        placeholder: 'Jean',
                                        required: true
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Nom (optionnel)'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: editLastName,
                                        onChange: (e) => handleInputAdminEmail(e, setEditLastName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                        placeholder: 'Dupont'
                                    })
                                )
                            ),
                            React.createElement('div', { className: 'mb-4' },
                                React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                                React.createElement(RoleDropdown, {
                                    value: editRole,
                                    onChange: (e) => setEditRole(e.target.value),
                                    disabled: editingUser?.id === currentUser.id || (currentUser.role === 'supervisor' && editingUser?.role === 'admin'),
                                    currentUserRole: currentUser.role,
                                    variant: 'green'
                                })
                            ),
                            React.createElement('div', { className: 'flex gap-4' },
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: () => setEditingUser(null),
                                    className: 'px-6 py-3 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-xl font-bold transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                                }, 'Annuler'),
                                React.createElement('button', {
                                    type: 'submit',
                                    disabled: buttonLoading === 'update',
                                    className: 'px-6 py-3 bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(34,197,94,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(34,197,94,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(34,197,94,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 justify-center border-t border-green-300/50'
                                },
                                    buttonLoading === 'update' && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                    'Enregistrer'
                                )
                            )
                        )
                    ) : null,

                    loading ? React.createElement('p', { className: 'text-center py-8' }, 'Chargement...') :
                    React.createElement('div', { className: 'space-y-4' },
                        React.createElement('p', { className: 'text-lg mb-4' },
                            (searchQuery ?
                                users.filter(u =>
                                    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                                ).length + ' résultat(s) sur ' + users.length :
                                users.length + ' utilisateur(s)'
                            )
                        ),
                        users
                            .filter(user => !searchQuery ||
                                user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                user.email.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(user =>
                            React.createElement('div', {
                                key: user.id,
                                className: 'bg-white/95 rounded-xl p-4 shadow-md border-2 border-gray-200/50 hover:border-blue-400 hover:shadow-lg transition-shadow duration-200'
                            },
                                React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3' },
                                    React.createElement('div', { className: 'flex-1' },
                                        React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
                                            React.createElement('h4', { className: 'font-bold text-lg' }, user.full_name),
                                            React.createElement('span', {
                                                className: 'px-3 py-1 rounded-full text-xs font-semibold ' + getRoleBadgeClass(user.role)
                                            }, getRoleLabel(user.role))
                                        ),
                                        React.createElement('p', { className: 'text-sm text-gray-600' },
                                            React.createElement('i', { className: 'fas fa-envelope mr-2' }),
                                            user.email
                                        ),
                                        React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                                            React.createElement('i', { className: 'far fa-clock mr-2' }),
                                            'Créé le: ' + formatDateEST(user.created_at, false)
                                        ),
                                        canSeeLastLogin(user) ? React.createElement('div', { className: "flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200" },
                                            React.createElement('div', { className: "flex items-center gap-1.5" },
                                                React.createElement('div', {
                                                    className: "w-2 h-2 rounded-full " + getLastLoginStatus(user.last_login).dot
                                                }),
                                                React.createElement('span', {
                                                    className: "text-xs font-bold " + getLastLoginStatus(user.last_login).color
                                                }, getLastLoginStatus(user.last_login).status),
                                                getLastLoginStatus(user.last_login).time ? React.createElement('span', {
                                                    className: "text-xs " + getLastLoginStatus(user.last_login).color
                                                }, " - " + getLastLoginStatus(user.last_login).time) : null
                                            ),
                                            user.last_login ? React.createElement('span', { className: "text-xs text-gray-400 ml-3.5" },
                                                "Derniere connexion: " + formatDateEST(user.last_login, true)
                                            ) : null
                                        ) : null
                                    ),
                                    React.createElement('div', { className: "flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0" },
                                        user.id !== currentUser.id && onOpenMessage ? React.createElement('button', {
                                            onClick: () => onOpenMessage({ id: user.id, full_name: user.full_name, role: user.role }),
                                            className: "w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(99,102,241,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(99,102,241,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(99,102,241,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50"
                                        },
                                            React.createElement('i', { className: "fas fa-comment mr-1" }),
                                            "Message"
                                        ) : null,
                                        // Permettre de modifier son propre profil OU les autres utilisateurs (avec restrictions)
                                        ((user.id === currentUser.id) || (user.id !== currentUser.id && !(currentUser.role === 'supervisor' && user.role === 'admin') && currentUser.role !== 'technician')) ? React.createElement(React.Fragment, null,
                                            React.createElement('button', {
                                                onClick: () => handleEditUser(user),
                                            className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(59,130,246,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(59,130,246,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(59,130,246,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50'
                                        },
                                            React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                            'Modifier'
                                        ),
                                        React.createElement('button', {
                                            onClick: () => handleResetPassword(user.id, user.full_name),
                                            className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(234,179,8,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(234,179,8,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(234,179,8,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-yellow-300/50'
                                        },
                                            React.createElement('i', { className: 'fas fa-key mr-1' }),
                                            'MdP'
                                        ),
                                        // Ne pas permettre de supprimer son propre compte
                                        user.id !== currentUser.id ? React.createElement('button', {
                                            onClick: () => handleDeleteUser(user.id, user.full_name),
                                            className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(239,68,68,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(239,68,68,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(239,68,68,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-red-300/50'
                                        },
                                            React.createElement('i', { className: 'fas fa-trash mr-1' }),
                                            'Supprimer'
                                        ) : null
                                    ) : null)
                                )
                            )
                        )
                    ),
                    React.createElement(NotificationModal, {
                        show: notification.show,
                        message: notification.message,
                        type: notification.type,
                        onClose: () => setNotification({ show: false, message: '', type: 'info' })
                    }),
                    React.createElement(ConfirmModal, {
                        show: confirmDialog.show,
                        message: confirmDialog.message,
                        onConfirm: confirmDialog.onConfirm,
                        onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
                    }),
                    React.createElement(PromptModal, {
                        show: promptDialog.show,
                        message: promptDialog.message,
                        onConfirm: promptDialog.onConfirm,
                        onCancel: () => setPromptDialog({ show: false, message: '', onConfirm: null })
                    }),
                    React.createElement(Toast, {
                        show: toast.show,
                        message: toast.message,
                        type: toast.type,
                        onClose: () => setToast({ show: false, message: '', type: 'success' })
                    })
                    )
                )
            );
        };


        // ========================================
        // COMPOSANT MESSAGERIE
        // ========================================
        const MessagingModal = ({ show, onClose, currentUser, initialContact, initialTab }) => {
            const [activeTab, setActiveTab] = React.useState(initialTab || "public");
            const [publicMessages, setPublicMessages] = React.useState([]);
            const [conversations, setConversations] = React.useState([]);
            const [selectedContact, setSelectedContact] = React.useState(initialContact || null);
            const [privateMessages, setPrivateMessages] = React.useState([]);
            const [availableUsers, setAvailableUsers] = React.useState([]);
            const [messageContent, setMessageContent] = React.useState('');
            const [unreadCount, setUnreadCount] = React.useState(0);
            const [loading, setLoading] = React.useState(false);
            const messagesEndRef = React.useRef(null);

            // États pour enregistrement audio
            const [isRecording, setIsRecording] = React.useState(false);
            const [audioBlob, setAudioBlob] = React.useState(null);
            const [recordingDuration, setRecordingDuration] = React.useState(0);
            const [audioURL, setAudioURL] = React.useState(null);
            const mediaRecorderRef = React.useRef(null);
            const audioChunksRef = React.useRef([]);
            const recordingTimerRef = React.useRef(null);

            // États pour lecteur audio personnalisé
            const [playingAudio, setPlayingAudio] = React.useState({});
            const audioRefs = React.useRef({});

            // États pour selection multiple et suppression en masse
            const [selectionMode, setSelectionMode] = React.useState(false);
            const [selectedMessages, setSelectedMessages] = React.useState([]);

            // État pour forcer le re-render des timestamps (pas besoin de valeur, juste un toggle)
            const [timestampTick, setTimestampTick] = React.useState(0);

            const scrollToBottom = () => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            };

            React.useEffect(() => {
                if (show) {
                    loadPublicMessages();
                    loadConversations();
                    loadAvailableUsers();
                    loadUnreadCount();

                    // Si un contact initial est fourni, basculer vers prive et charger ses messages
                    if (initialContact) {
                        setActiveTab("private");
                        setSelectedContact(initialContact);
                        loadPrivateMessages(initialContact.id);
                    }

                    // Rafraichir les timestamps, le compteur ET les messages toutes les 30 secondes
                    const timestampInterval = setInterval(() => {
                        setTimestampTick(prev => prev + 1);
                        loadUnreadCount();

                        // Recharger les messages pour voir les nouveaux messages des autres utilisateurs
                        if (activeTab === 'public') {
                            loadPublicMessages();
                        } else if (activeTab === 'private' && selectedContact) {
                            loadPrivateMessages(selectedContact.id);
                            loadConversations();
                        }
                    }, 30000); // 30 secondes

                    return () => clearInterval(timestampInterval);
                }
            }, [show, activeTab, selectedContact]);

            React.useEffect(() => {
                // Scroller automatiquement seulement pour messages privés (ordre chronologique)
                // Messages publics: pas de scroll auto car ordre anti-chronologique (nouveaux en haut)
                if (activeTab === 'private' && selectedContact) {
                    scrollToBottom();
                }
            }, [privateMessages, activeTab, selectedContact]);

            const loadPublicMessages = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/public');
                    setPublicMessages(response.data.messages);
                } catch (error) {
                    // Erreur silencieuse
                }
            };

            const loadConversations = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/conversations');
                    setConversations(response.data.conversations);
                } catch (error) {
                    // Erreur silencieuse
                }
            };

            const loadPrivateMessages = async (contactId) => {
                try {
                    setLoading(true);
                    const response = await axios.get(API_URL + '/messages/private/' + contactId);
                    setPrivateMessages(response.data.messages);
                    loadConversations(); // Rafraichir pour mettre a jour unread_count
                } catch (error) {
                    // Erreur silencieuse
                } finally {
                    setLoading(false);
                }
            };

            const loadAvailableUsers = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/available-users');
                    setAvailableUsers(response.data.users);
                } catch (error) {
                    // Erreur silencieuse
                }
            };

            const loadUnreadCount = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/unread-count');
                    setUnreadCount(response.data.count);
                } catch (error) {
                    // Erreur silencieuse
                }
            };

            // Fonction pour ouvrir message prive avec un utilisateur
            const openPrivateMessage = (senderId, senderName) => {
                // Verifier si ce n est pas soi-meme
                if (senderId === currentUser.userId) {
                    alert('Vous ne pouvez pas vous envoyer un message prive a vous-meme.');
                    return;
                }

                // Verifier si utilisateur est dans la liste des contacts disponibles
                const user = availableUsers.find(u => u.id === senderId);

                if (!user) {
                    // Utilisateur n existe plus dans la liste
                    alert(senderName + ' ne fait plus partie de la liste des utilisateurs.');
                    return;
                }

                // Switcher vers onglet Messages Prives
                setActiveTab('private');

                // Selectionner automatiquement l utilisateur
                setSelectedContact(user);

                // Charger les messages prives avec cette personne
                loadPrivateMessages(senderId);
            };

            // Fonctions audio
            const startRecording = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                    });

                    // SOLUTION SIMPLE: Essayer MP3 en premier (universel sur TOUS les appareils)
                    let mimeType = '';
                    let extension = 'mp3';

                    // 1. Essayer audio/mpeg (MP3) - UNIVERSEL
                    if (MediaRecorder.isTypeSupported('audio/mpeg')) {
                        mimeType = 'audio/mpeg';
                        extension = 'mp3';
                    }
                    // 2. Essayer MP4/AAC - iOS et Chrome moderne
                    else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                        mimeType = 'audio/mp4';
                        extension = 'mp4';
                    }
                    // 3. Fallback WebM - Chrome Android uniquement
                    else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                        mimeType = 'audio/webm;codecs=opus';
                        extension = 'webm';
                    }
                    // 4. Fallback WebM basique
                    else if (MediaRecorder.isTypeSupported('audio/webm')) {
                        mimeType = 'audio/webm';
                        extension = 'webm';
                    }
                    // 5. Dernier recours
                    else {
                        mimeType = '';
                        extension = 'mp3';
                    }

                    const mediaRecorder = new MediaRecorder(stream, { mimeType });
                    mediaRecorderRef.current = mediaRecorder;
                    audioChunksRef.current = [];

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                        }
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                        setAudioBlob(audioBlob);
                        setAudioURL(URL.createObjectURL(audioBlob));
                        stream.getTracks().forEach(track => track.stop());
                    };

                    mediaRecorder.start();
                    setIsRecording(true);
                    setRecordingDuration(0);

                    recordingTimerRef.current = setInterval(() => {
                        setRecordingDuration(prev => {
                            if (prev >= 300) {
                                stopRecording();
                                return 300;
                            }
                            return prev + 1;
                        });
                    }, 1000);

                } catch (error) {
                    alert('Impossible acceder au microphone. Verifiez les permissions.');
                }
            };

            const stopRecording = () => {
                if (mediaRecorderRef.current && isRecording) {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                    if (recordingTimerRef.current) {
                        clearInterval(recordingTimerRef.current);
                        recordingTimerRef.current = null;
                    }
                }
            };

            const cancelRecording = () => {
                if (isRecording) {
                    stopRecording();
                }
                setAudioBlob(null);
                setAudioURL(null);
                setRecordingDuration(0);
                audioChunksRef.current = [];
                if (audioURL) {
                    URL.revokeObjectURL(audioURL);
                }
            };

            const sendAudioMessage = async () => {
                if (!audioBlob) return;
                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'audio-message.' + (audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm'));
                    formData.append('message_type', activeTab);
                    formData.append('duration', recordingDuration.toString());
                    if (activeTab === 'private' && selectedContact) {
                        formData.append('recipient_id', selectedContact.id.toString());
                    }
                    await axios.post(API_URL + '/messages/audio', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    cancelRecording();
                    if (activeTab === 'public') {
                        loadPublicMessages();
                    } else if (selectedContact) {
                        loadPrivateMessages(selectedContact.id);
                        loadConversations();
                    }

                    // Rafraichir compteur immediatement apres envoi audio
                    loadUnreadCount();
                } catch (error) {
                    alert('Erreur envoi audio: ' + (error.response?.data?.error || 'Erreur'));
                }
            };

            const formatRecordingDuration = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return mins + ':' + (secs < 10 ? '0' : '') + secs;
            };

            // Fonctions lecteur audio personnalisé
            const toggleAudio = async (messageId) => {
                const audio = audioRefs.current[messageId];

                if (!audio) {
                    return;
                }

                if (playingAudio[messageId]) {
                    audio.pause();
                    setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
                } else {
                    // Arrêter tous les autres audios
                    Object.keys(audioRefs.current).forEach(id => {
                        if (id !== messageId && audioRefs.current[id]) {
                            audioRefs.current[id].pause();
                            setPlayingAudio(prev => ({ ...prev, [id]: false }));
                        }
                    });

                    // Charger l'audio d'abord si nécessaire
                    if (audio.readyState < 2) {
                        audio.load();
                    }

                    try {
                        await audio.play();
                        setPlayingAudio(prev => ({ ...prev, [messageId]: true }));
                    } catch (err) {
                        setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
                        alert('Impossible de lire audio: ' + err.message);
                    }
                }
            };

            const sendMessage = async () => {
                if (!messageContent.trim()) return;

                try {
                    const payload = {
                        message_type: activeTab,
                        content: messageContent,
                        recipient_id: activeTab === 'private' && selectedContact ? selectedContact.id : null
                    };

                    await axios.post(API_URL + '/messages', payload);
                    setMessageContent('');

                    if (activeTab === 'public') {
                        loadPublicMessages();
                    } else if (selectedContact) {
                        loadPrivateMessages(selectedContact.id);
                        loadConversations();
                    }

                    // Rafraichir compteur immediatement apres envoi
                    loadUnreadCount();
                } catch (error) {
                    alert('Erreur envoi message: ' + (error.response?.data?.error || 'Erreur'));
                }
            };

            const deleteMessage = async (messageId) => {
                if (!confirm('Etes-vous sur de vouloir supprimer ce message ?')) return;

                try {
                    await axios.delete(API_URL + '/messages/' + messageId);

                    if (activeTab === 'public') {
                        loadPublicMessages();
                    } else if (selectedContact) {
                        loadPrivateMessages(selectedContact.id);
                        loadConversations();
                    }

                    // Rafraichir compteur immediatement apres suppression
                    loadUnreadCount();
                } catch (error) {
                    alert('Erreur suppression: ' + (error.response?.data?.error || 'Erreur'));
                }
            };

            const canDeleteMessage = (msg) => {
                // Utilisateur peut supprimer son propre message
                if (msg.sender_id === currentUser.id) return true;
                // Admin peut supprimer tous les messages
                if (currentUser.role === 'admin') return true;
                // Superviseur peut supprimer tous sauf ceux de admin
                if (currentUser.role === 'supervisor' && msg.sender_role !== 'admin') return true;
                return false;
            };

            // Fonctions pour selection multiple
            const toggleSelectionMode = () => {
                setSelectionMode(!selectionMode);
                setSelectedMessages([]);
            };

            const toggleMessageSelection = (messageId) => {
                if (selectedMessages.includes(messageId)) {
                    setSelectedMessages(selectedMessages.filter(id => id !== messageId));
                } else {
                    setSelectedMessages([...selectedMessages, messageId]);
                }
            };

            const selectAllMessages = () => {
                const currentMessages = activeTab === 'public' ? publicMessages : privateMessages;
                const selectableIds = currentMessages
                    .filter(msg => canDeleteMessage(msg))
                    .map(msg => msg.id);
                setSelectedMessages(selectableIds);
            };

            const deselectAllMessages = () => {
                setSelectedMessages([]);
            };

            const deleteSelectedMessages = async () => {
                if (selectedMessages.length === 0) return;

                const count = selectedMessages.length;
                const confirmText = 'Supprimer ' + count + ' message' + (count > 1 ? 's' : '') + ' ?';

                if (!confirm(confirmText)) return;

                try {
                    await axios.post(API_URL + '/messages/bulk-delete', {
                        message_ids: selectedMessages
                    });

                    setSelectedMessages([]);
                    setSelectionMode(false);

                    if (activeTab === 'public') {
                        loadPublicMessages();
                    } else if (selectedContact) {
                        loadPrivateMessages(selectedContact.id);
                        loadConversations();
                    }

                    // Rafraichir compteur immediatement apres suppression masse
                    loadUnreadCount();

                    alert(count + ' message' + (count > 1 ? 's' : '') + ' supprime' + (count > 1 ? 's' : ''));
                } catch (error) {
                    alert('Erreur suppression: ' + (error.response?.data?.error || 'Erreur'));
                }
            };

            const handleKeyPress = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            };

            const formatMessageTime = (timestamp) => {
                // Convertir le format SQL "YYYY-MM-DD HH:MM:SS" en format ISO avec T et Z (UTC)
                const isoTimestamp = timestamp.replace(' ', 'T') + (timestamp.includes('Z') ? '' : 'Z');
                const dateUTC = new Date(isoTimestamp);
                // Appliquer l'offset EST/EDT
                const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
                const date = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));
                const now = getNowEST();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);

                // Format français/québécois (jj mois aaaa) avec heure locale de l'appareil
                const frenchOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };

                if (diffMins < 1) return "À l'instant";
                if (diffMins < 60) return "Il y a " + diffMins + " min";
                if (diffHours < 24) return "Il y a " + diffHours + " h";
                if (diffHours < 48) return "Hier " + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                return date.toLocaleDateString('fr-FR', frenchOptions);
            };

            const getRoleBadgeClass = (role) => {
                const colors = {
                    'admin': 'bg-red-100 text-red-700', 'director': 'bg-red-50 text-red-600',
                    'supervisor': 'bg-yellow-100 text-yellow-700', 'coordinator': 'bg-amber-100 text-amber-700', 'planner': 'bg-amber-100 text-amber-700',
                    'senior_technician': 'bg-blue-100 text-blue-700', 'technician': 'bg-blue-50 text-blue-600',
                    'team_leader': 'bg-emerald-100 text-emerald-700', 'furnace_operator': 'bg-green-100 text-green-700', 'operator': 'bg-green-50 text-green-600',
                    'safety_officer': 'bg-blue-100 text-blue-700', 'quality_inspector': 'bg-slate-100 text-slate-700', 'storekeeper': 'bg-violet-100 text-violet-700',
                    'viewer': 'bg-gray-100 text-gray-700'
                };
                return colors[role] || 'bg-gray-100 text-gray-700';
            };

            const getRoleLabel = (role) => {
                const labels = {
                    'admin': 'Admin', 'director': 'Directeur', 'supervisor': 'Superviseur', 'coordinator': 'Coordonnateur', 'planner': 'Planificateur',
                    'senior_technician': 'Tech. Senior', 'technician': 'Technicien', 'team_leader': 'Chef Équipe', 'furnace_operator': 'Op. Four', 'operator': 'Opérateur',
                    'safety_officer': 'Agent SST', 'quality_inspector': 'Insp. Qualité', 'storekeeper': 'Magasinier', 'viewer': 'Lecture Seule'
                };
                return labels[role] || role;
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden transform hover:scale-[1.005] transition-all duration-300',
                    onClick: (e) => e.stopPropagation(),
                    style: {
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                        transform: 'translateZ(0)'
                    }
                },
                    // Header
                    React.createElement('div', {
                        className: 'bg-gradient-to-r from-slate-700 to-gray-700 text-white p-3 sm:p-5 flex justify-between items-center shadow-lg'
                    },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                            React.createElement('i', { className: 'fas fa-comments text-xl sm:text-2xl flex-shrink-0' }),
                            React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' }, 'Messagerie Equipe'),
                            unreadCount > 0 ? React.createElement('span', {
                                className: 'bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 animate-pulse'
                            }, unreadCount) : null
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                        },
                            React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                        )
                    ),

                    // Tabs
                    React.createElement('div', {
                        className: 'flex border-b border-gray-200 bg-gray-50 shadow-sm'
                    },
                        React.createElement('button', {
                            onClick: () => {
                                setActiveTab('public');
                                setSelectedContact(null);
                            },
                            className: 'flex-1 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all ' +
                                (activeTab === 'public'
                                    ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                        },
                            React.createElement('i', { className: 'fas fa-globe mr-1 sm:mr-2' }),
                            React.createElement('span', { className: 'hidden xs:inline' }, 'Canal Public'),
                            React.createElement('span', { className: 'inline xs:hidden' }, 'Public')
                        ),
                        React.createElement('button', {
                            onClick: () => setActiveTab('private'),
                            className: 'flex-1 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all relative ' +
                                (activeTab === 'private'
                                    ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                        },
                            React.createElement('i', { className: 'fas fa-user-friends mr-1 sm:mr-2' }),
                            React.createElement('span', { className: 'hidden xs:inline' }, 'Messages Prives'),
                            React.createElement('span', { className: 'inline xs:hidden' }, 'Prives')
                        )
                    ),

                    // Barre outils selection
                    React.createElement('div', { className: 'bg-white border-b border-gray-200 px-3 py-2 flex items-center flex-wrap gap-2' },
                        React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('button', {
                                onClick: toggleSelectionMode,
                                className: 'px-3 py-1.5 text-sm font-medium rounded-lg transition-all ' +
                                    (selectionMode
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                            },
                                React.createElement('i', { className: 'fas ' + (selectionMode ? 'fa-times' : 'fa-check-square') + ' mr-1.5' }),
                                selectionMode ? 'Annuler' : 'Selectionner'
                            ),
                            selectionMode ? React.createElement('button', {
                                onClick: selectAllMessages,
                                className: 'px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-check-double mr-1.5' }),
                                'Tout'
                            ) : null,
                            selectionMode && selectedMessages.length > 0 ? React.createElement('button', {
                                onClick: deselectAllMessages,
                                className: 'px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-times-circle mr-1.5' }),
                                'Aucun'
                            ) : null
                        ),
                        selectionMode && selectedMessages.length > 0 ? React.createElement('button', {
                            onClick: deleteSelectedMessages,
                            className: 'px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all'
                        },
                            React.createElement('i', { className: 'fas fa-trash mr-1.5' }),
                            'Supprimer (' + selectedMessages.length + ')'
                        ) : null,
                        selectionMode ? React.createElement('span', { className: 'text-xs text-gray-500 ml-auto' },
                            selectedMessages.length + ' selectionne' + (selectedMessages.length > 1 ? 's' : '')
                        ) : null
                    ),

                    // Content
                    React.createElement('div', { className: 'flex-1 flex overflow-hidden' },
                        // PUBLIC TAB
                        activeTab === 'public' ? React.createElement('div', { className: 'flex-1 flex flex-col' },
                            // Messages publics
                            React.createElement('div', { className: 'flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
                                publicMessages.length === 0 ? React.createElement('div', {
                                    className: 'text-center text-gray-400 py-12'
                                },
                                    React.createElement('i', { className: 'fas fa-comments text-5xl sm:text-6xl mb-4 opacity-50' }),
                                    React.createElement('p', { className: 'text-base sm:text-lg font-medium' }, 'Aucun message public'),
                                    React.createElement('p', { className: 'text-xs sm:text-sm text-gray-400 mt-2' }, 'Soyez le premier a envoyer un message!')
                                ) : publicMessages.map(msg => React.createElement('div', {
                                    key: msg.id,
                                    className: 'bg-white/95 rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-2xl transition-shadow border border-white/50 ',
                                    style: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' }
                                },
                                    React.createElement('div', { className: 'flex items-start gap-2 sm:gap-3' },
                                        selectionMode && canDeleteMessage(msg) ? React.createElement('input', {
                                            type: 'checkbox',
                                            checked: selectedMessages.includes(msg.id),
                                            onChange: () => toggleMessageSelection(msg.id),
                                            className: 'w-5 h-5 mt-1 cursor-pointer flex-shrink-0',
                                            onClick: (e) => e.stopPropagation()
                                        }) : null,
                                        React.createElement('div', {
                                            className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base shadow-md cursor-pointer hover:scale-110 transition-transform',
                                            onClick: () => openPrivateMessage(msg.sender_id, msg.sender_name),
                                            title: 'Envoyer un message prive a ' + msg.sender_name
                                        }, msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'),
                                        React.createElement('div', { className: 'flex-1 min-w-0' },
                                            React.createElement('div', { className: 'flex flex-wrap items-center gap-1 sm:gap-2 mb-1' },
                                                React.createElement('span', {
                                                    className: 'font-semibold text-gray-800 text-sm sm:text-base truncate cursor-pointer hover:text-indigo-600 transition-colors',
                                                    onClick: () => openPrivateMessage(msg.sender_id, msg.sender_name),
                                                    title: 'Envoyer un message prive a ' + msg.sender_name
                                                }, msg.sender_name),
                                                React.createElement('span', {
                                                    className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 ' + getRoleBadgeClass(msg.sender_role)
                                                }, getRoleLabel(msg.sender_role)),
                                                React.createElement('span', {
                                                    className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 bg-blue-100 text-blue-700'
                                                }, '🌐 Message public'),
                                                React.createElement('span', { className: 'text-xs text-gray-400 flex-shrink-0' }, formatMessageTime(msg.created_at))
                                            ),
                                            msg.audio_file_key ? React.createElement('div', { className: 'mt-2' },
                                                React.createElement('div', { className: 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-100' },
                                                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                        React.createElement('i', { className: 'fas fa-microphone text-indigo-600 text-lg' }),
                                                        React.createElement('span', { className: 'text-sm font-medium text-indigo-700' }, 'Message vocal')
                                                    ),
                                                    React.createElement('audio', {
                                                        controls: true,
                                                        preload: 'auto',
                                                        controlsList: 'nodownload',
                                                        className: 'w-full',
                                                        style: { height: '54px', minHeight: '54px' },
                                                        src: API_URL + '/audio/' + msg.audio_file_key,
                                                        onError: (e) => {
                                                            // Erreur audio silencieuse
                                                        }
                                                    }),
                                                    msg.audio_duration ? React.createElement('p', { className: 'text-xs text-gray-500 mt-2' },
                                                        '⏱️ Durée: ' + formatRecordingDuration(msg.audio_duration)
                                                    ) : null
                                                )
                                            ) : React.createElement('p', { className: 'text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content)
                                        ),
                                        canDeleteMessage(msg) ? React.createElement('button', {
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                deleteMessage(msg.id);
                                            },
                                            className: 'flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all transform hover:scale-110 active:scale-95',
                                            title: 'Supprimer le message'
                                        },
                                            React.createElement('i', { className: 'fas fa-trash text-sm' })
                                        ) : null
                                    )
                                )),
                                React.createElement('div', { ref: messagesEndRef })
                            ),

                            // Input zone
                            React.createElement('div', { className: 'border-t border-gray-200 p-2 sm:p-4 bg-white shadow-lg' },
                                (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200' },
                                    React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                                        React.createElement('div', { className: 'flex items-center gap-3' },
                                            React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full animate-pulse' }),
                                            React.createElement('span', { className: 'font-semibold text-red-700' },
                                                isRecording ? 'Enregistrement en cours...' : 'Previsualisation audio'
                                            ),
                                            React.createElement('span', { className: 'text-sm text-gray-600 font-mono' },
                                                formatRecordingDuration(recordingDuration)
                                            )
                                        ),
                                        React.createElement('button', {
                                            onClick: cancelRecording,
                                            className: 'text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all',
                                            title: 'Annuler'
                                        }, React.createElement('i', { className: 'fas fa-times' }))
                                    ),
                                    audioBlob ? React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                                        React.createElement('audio', {
                                            controls: true,
                                            src: audioURL,
                                            className: 'flex-1 h-10'
                                        })
                                    ) : null,
                                    React.createElement('div', { className: 'flex gap-2' },
                                        isRecording ? React.createElement('button', {
                                            onClick: stopRecording,
                                            className: 'flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2'
                                        },
                                            React.createElement('i', { className: 'fas fa-stop' }),
                                            'Arreter'
                                        ) : React.createElement('button', {
                                            onClick: sendAudioMessage,
                                            disabled: !audioBlob,
                                            className: 'flex-1 bg-gradient-to-br from-slate-700 to-gray-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
                                        },
                                            React.createElement('i', { className: 'fas fa-paper-plane' }),
                                            'Envoyer le message vocal'
                                        )
                                    )
                                ) : null,
                                !isRecording && !audioBlob ? React.createElement('div', { className: 'flex gap-2' },
                                    React.createElement('textarea', {
                                        value: messageContent,
                                        onChange: (e) => setMessageContent(e.target.value),
                                        onKeyPress: handleKeyPress,
                                        placeholder: 'Ecrire un message public... (Enter pour envoyer)',
                                        className: 'flex-1 bg-white/95 border-2 border-white/50 rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none transition-all shadow-lg hover:shadow-xl',
                                        style: { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                        rows: 2
                                    }),
                                    React.createElement('button', {
                                        onClick: startRecording,
                                        className: 'px-3 sm:px-4 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                        title: 'Enregistrer un message vocal'
                                    },
                                        React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                                        React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                                    ),
                                    React.createElement('button', {
                                        onClick: sendMessage,
                                        disabled: !messageContent.trim(),
                                        className: 'px-3 sm:px-6 bg-gradient-to-br from-slate-700 to-gray-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-xl hover:shadow-2xl disabled:hover:shadow-xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                        style: { boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)' }
                                    },
                                        React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
                                        React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Envoyer')
                                    )
                                ) : null
                            )
                        ) : null,

                        // PRIVATE TAB
                        activeTab === 'private' ? React.createElement('div', { className: 'flex-1 min-h-0 flex flex-col sm:flex-row' },
                            // Liste des conversations - Mobile: collapsible, Desktop: sidebar
                            React.createElement('div', { className: (selectedContact ? 'hidden sm:flex ' : 'flex ') + 'w-full sm:w-80 md:w-96 border-r border-gray-200 flex-col bg-gray-50' },
                                React.createElement('div', { className: 'p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm' },
                                    React.createElement('h3', { className: 'font-semibold text-gray-700 text-sm sm:text-base mb-2 flex items-center gap-2' },
                                        React.createElement('i', { className: 'fas fa-address-book text-indigo-600' }),
                                        'Contacts'
                                    ),
                                    React.createElement('select', {
                                        onChange: (e) => {
                                            const userId = parseInt(e.target.value);
                                            if (!userId) {
                                                // Reset le select à la valeur par défaut
                                                e.target.value = '';
                                                return;
                                            }
                                            const user = availableUsers.find(u => u.id === userId);
                                            if (user) {
                                                setSelectedContact(user);
                                                loadPrivateMessages(user.id);
                                            }
                                            // Reset le select après sélection
                                            e.target.value = '';
                                        },
                                        className: "w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-white/95 to-gray-50/80 backdrop-blur-sm border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all hover:shadow-xl cursor-pointer font-semibold text-xs sm:text-sm appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236366f1%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                        style: { boxShadow: '0 6px 20px rgba(99, 102, 241, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' },
                                        value: ''
                                    },
                                        React.createElement('option', { value: '', disabled: true }, '📝 Nouvelle conversation...'),
                                        React.createElement('option', { value: '0' }, '❌ Fermer ce menu'),
                                        availableUsers.map(user => React.createElement('option', {
                                            key: user.id,
                                            value: user.id
                                        }, user.full_name + ' (' + getRoleLabel(user.role) + ')'))
                                    )
                                ),
                                React.createElement('div', { className: 'flex-1 overflow-y-auto' },
                                    conversations.length === 0 ? React.createElement('div', {
                                        className: 'text-center text-gray-500 py-8 px-4'
                                    },
                                        React.createElement('i', { className: 'fas fa-comments text-5xl mb-3 text-gray-300' }),
                                        React.createElement('p', { className: 'text-sm font-semibold mb-2' }, 'Aucune conversation'),
                                        React.createElement('p', { className: 'text-xs text-gray-400' },
                                            'Utilisez le menu ci-dessus pour demarrer une nouvelle conversation'
                                        ),
                                        React.createElement('div', { className: 'mt-3 text-indigo-600' },
                                            React.createElement('i', { className: 'fas fa-arrow-up mr-1' }),
                                            React.createElement('span', { className: 'text-xs font-semibold' }, 'Nouvelle conversation...')
                                        )
                                    ) : conversations.map(conv => React.createElement('div', {
                                        key: conv.contact_id,
                                        onClick: () => {
                                            setSelectedContact({ id: conv.contact_id, first_name: conv.contact_name, role: conv.contact_role });
                                            loadPrivateMessages(conv.contact_id);
                                        },
                                        className: 'p-2 sm:p-3 border-b border-gray-200 cursor-pointer hover:bg-indigo-50 transition-all active:scale-95 ' +
                                            (selectedContact?.id === conv.contact_id ? 'bg-indigo-100 border-l-4 border-l-indigo-600 shadow-sm' : 'bg-white hover:border-l-4 hover:border-l-indigo-300')
                                    },
                                        React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                            React.createElement('div', {
                                                className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-md'
                                            }, conv.contact_name ? conv.contact_name.charAt(0).toUpperCase() : '?'),
                                            React.createElement('div', { className: 'flex-1 min-w-0' },
                                                React.createElement('div', { className: 'flex items-center gap-1 sm:gap-2' },
                                                    React.createElement('span', { className: 'font-semibold text-xs sm:text-sm text-gray-800 truncate' }, conv.contact_name),
                                                    conv.unread_count > 0 ? React.createElement('span', {
                                                        className: 'bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse'
                                                    }, conv.unread_count) : null
                                                ),
                                                React.createElement('p', {
                                                    className: 'text-xs text-gray-500 truncate'
                                                }, conv.last_message || 'Commencer la conversation')
                                            )
                                        )
                                    ))
                                )
                            ),

                            // Zone de conversation
                            selectedContact ? React.createElement('div', { className: 'flex-1 min-h-0 flex flex-col' },
                                // Header contact with back button on mobile
                                React.createElement('div', { className: 'p-2 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },
                                        // Back button for mobile only
                                        React.createElement('button', {
                                            onClick: () => setSelectedContact(null),
                                            className: 'sm:hidden p-2 hover:bg-indigo-100 rounded-full transition-colors'
                                        },
                                            React.createElement('i', { className: 'fas fa-arrow-left text-indigo-600' })
                                        ),
                                        React.createElement('div', {
                                            className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md flex-shrink-0'
                                        }, selectedContact.first_name.charAt(0).toUpperCase()),
                                        React.createElement('div', { className: 'flex-1 min-w-0' },
                                            React.createElement('h3', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, selectedContact.first_name),
                                            React.createElement('span', {
                                                className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium inline-block ' + getRoleBadgeClass(selectedContact.role)
                                            }, getRoleLabel(selectedContact.role))
                                        )
                                    )
                                ),

                                // Messages
                                React.createElement('div', { className: 'flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
                                    loading ? React.createElement('div', { className: 'text-center text-gray-400 py-12' },
                                        React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl sm:text-4xl text-indigo-500' })
                                    ) : privateMessages.length === 0 ? React.createElement('div', {
                                        className: 'text-center text-gray-400 py-8 sm:py-12 px-4'
                                    },
                                        React.createElement('i', { className: 'fas fa-comments text-5xl sm:text-6xl mb-3 sm:mb-4 opacity-50' }),
                                        React.createElement('p', { className: 'text-sm sm:text-base' }, 'Commencez la conversation avec ' + selectedContact.first_name),
                                        React.createElement('p', { className: 'text-xs text-gray-400 mt-2' }, 'Ecrivez votre premier message ci-dessous')
                                    ) : privateMessages.map(msg => React.createElement('div', {
                                        key: msg.id,
                                        className: 'bg-white/95 rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-2xl transition-shadow border border-white/50 ',
                                        style: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' }
                                    },
                                        React.createElement('div', { className: 'flex items-start gap-2 sm:gap-3' },
                                            selectionMode && canDeleteMessage(msg) ? React.createElement('input', {
                                                type: 'checkbox',
                                                checked: selectedMessages.includes(msg.id),
                                                onChange: () => toggleMessageSelection(msg.id),
                                                className: 'w-5 h-5 mt-1 cursor-pointer flex-shrink-0',
                                                onClick: (e) => e.stopPropagation()
                                            }) : null,
                                            React.createElement('div', {
                                                className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base shadow-md'
                                            }, msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'),
                                            React.createElement('div', { className: 'flex-1 min-w-0' },
                                                React.createElement('div', { className: 'flex flex-wrap items-center gap-1 sm:gap-2 mb-1' },
                                                    React.createElement('span', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, msg.sender_name),
                                                    React.createElement('span', {
                                                        className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 bg-slate-100 text-slate-700'
                                                    }, '🔒 Message privé'),
                                                    React.createElement('span', { className: 'text-xs text-gray-400 flex-shrink-0' }, formatMessageTime(msg.created_at))
                                                ),
                                                msg.audio_file_key ? React.createElement('div', { className: 'mt-2' },
                                                    React.createElement('div', { className: 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-100' },
                                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                            React.createElement('i', { className: 'fas fa-microphone text-slate-600 text-lg' }),
                                                            React.createElement('span', { className: 'text-sm font-medium text-slate-700' }, 'Message vocal')
                                                        ),
                                                        React.createElement('audio', {
                                                            controls: true,
                                                            preload: 'auto',
                                                            controlsList: 'nodownload',
                                                            className: 'w-full',
                                                            style: { height: '54px', minHeight: '54px' },
                                                            src: API_URL + '/audio/' + msg.audio_file_key,
                                                            onError: (e) => {
                                                                // Erreur audio silencieuse
                                                            }
                                                        }),
                                                        msg.audio_duration ? React.createElement('p', { className: 'text-xs text-gray-500 mt-2' },
                                                            '⏱️ Durée: ' + formatRecordingDuration(msg.audio_duration)
                                                        ) : null
                                                    )
                                                ) : React.createElement('p', { className: 'text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content)
                                            ),
                                            canDeleteMessage(msg) ? React.createElement('button', {
                                                onClick: (e) => {
                                                    e.stopPropagation();
                                                    deleteMessage(msg.id);
                                                },
                                                className: 'flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all transform hover:scale-110 active:scale-95',
                                                title: 'Supprimer le message'
                                            },
                                                React.createElement('i', { className: 'fas fa-trash text-sm' })
                                            ) : null
                                        )
                                    )),
                                    React.createElement('div', { ref: messagesEndRef })
                                ),

                                // Input
                                React.createElement('div', { className: 'border-t border-gray-200 p-2 sm:p-4 bg-white shadow-lg' },
                                    (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200' },
                                        React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                                            React.createElement('div', { className: 'flex items-center gap-3' },
                                                React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full animate-pulse' }),
                                                React.createElement('span', { className: 'font-semibold text-red-700' },
                                                    isRecording ? 'Enregistrement en cours...' : 'Previsualisation audio'
                                                ),
                                                React.createElement('span', { className: 'text-sm text-gray-600 font-mono' },
                                                    formatRecordingDuration(recordingDuration)
                                                )
                                            ),
                                            React.createElement('button', {
                                                onClick: cancelRecording,
                                                className: 'text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all',
                                                title: 'Annuler'
                                            }, React.createElement('i', { className: 'fas fa-times' }))
                                        ),
                                        audioBlob ? React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                                            React.createElement('audio', {
                                                controls: true,
                                                src: audioURL,
                                                className: 'flex-1 h-10'
                                            })
                                        ) : null,
                                        React.createElement('div', { className: 'flex gap-2' },
                                            isRecording ? React.createElement('button', {
                                                onClick: stopRecording,
                                                className: 'flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2'
                                            },
                                                React.createElement('i', { className: 'fas fa-stop' }),
                                                'Arreter'
                                            ) : React.createElement('button', {
                                                onClick: sendAudioMessage,
                                                disabled: !audioBlob,
                                                className: 'flex-1 bg-gradient-to-br from-slate-700 to-gray-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
                                            },
                                                React.createElement('i', { className: 'fas fa-paper-plane' }),
                                                'Envoyer le message vocal'
                                            )
                                        )
                                    ) : null,
                                    !isRecording && !audioBlob ? React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('textarea', {
                                            value: messageContent,
                                            onChange: (e) => setMessageContent(e.target.value),
                                            onKeyPress: handleKeyPress,
                                            placeholder: 'Ecrire un message... (Enter pour envoyer)',
                                            className: 'flex-1 border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none transition-all',
                                            rows: 2
                                        }),
                                        React.createElement('button', {
                                            onClick: startRecording,
                                            className: 'px-3 sm:px-4 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                            title: 'Enregistrer un message vocal'
                                        },
                                            React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                                            React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                                        ),
                                        React.createElement('button', {
                                            onClick: sendMessage,
                                            disabled: !messageContent.trim(),
                                            className: 'px-3 sm:px-6 bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md flex items-center justify-center'
                                        },
                                            React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
                                            React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Envoyer')
                                        )
                                    ) : null
                                )
                            ) : React.createElement('div', { className: 'flex-1 flex items-center justify-center bg-gray-50' },
                                React.createElement('div', { className: 'text-center text-gray-400' },
                                    React.createElement('i', { className: 'fas fa-arrow-left text-6xl mb-4' }),
                                    React.createElement('p', { className: 'text-lg mb-6' }, 'Sélectionnez un contact'),
                                    React.createElement('button', {
                                        onClick: onClose,
                                        className: 'mt-4 px-6 py-3 bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-lg hover:from-slate-800 hover:to-gray-800 font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto'
                                    },
                                        React.createElement('i', { className: 'fas fa-times' }),
                                        React.createElement('span', {}, 'Fermer')
                                    )
                                )
                            )
                        ) : null
                    )
                )
            );
        };


        const MainApp = ({ tickets, machines, currentUser, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated, unreadMessagesCount, onRefreshMessages, headerTitle, headerSubtitle }) => {
            const [contextMenu, setContextMenu] = React.useState(null);
            const [selectedTicketId, setSelectedTicketId] = React.useState(null);
            const [showDetailsModal, setShowDetailsModal] = React.useState(false);
            const [showUserManagement, setShowUserManagement] = React.useState(false);
            const [showMachineManagement, setShowMachineManagement] = React.useState(false);
            const [showSystemSettings, setShowSystemSettings] = React.useState(false);
            const [showUserGuide, setShowUserGuide] = React.useState(false);
            const [showArchived, setShowArchived] = React.useState(false);
            const [showMessaging, setShowMessaging] = React.useState(false);
            const [messagingContact, setMessagingContact] = React.useState(null);
            const [messagingTab, setMessagingTab] = React.useState("public");
            const [showScrollTop, setShowScrollTop] = React.useState(false);
            const [showPerformanceModal, setShowPerformanceModal] = React.useState(false);
            const [showOverdueModal, setShowOverdueModal] = React.useState(false);
            const [showPushDevicesModal, setShowPushDevicesModal] = React.useState(false);
            const [searchQuery, setSearchQuery] = React.useState('');
            const [searchResults, setSearchResults] = React.useState([]);
            const [showSearchResults, setShowSearchResults] = React.useState(false);
            const [searchLoading, setSearchLoading] = React.useState(false);
            const searchTimeoutRef = React.useRef(null);
            const searchInputRef = React.useRef(null);
            const [searchDropdownPosition, setSearchDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
            const [searchKeywordResults, setSearchKeywordResults] = React.useState([]);
            const [searchTextResults, setSearchTextResults] = React.useState([]);
            const [searchIsKeyword, setSearchIsKeyword] = React.useState(false);
            const [searchKeywordType, setSearchKeywordType] = React.useState(null);
            
            // Placeholder animé avec exemples de mots-clés (versions desktop et mobile)
            const searchPlaceholdersDesktop = [
                'Essayez: "retard" pour voir les tickets en retard',
                'Essayez: "urgent" pour voir les priorités critiques',
                'Essayez: "commentaire" pour voir les tickets avec notes',
                'Essayez: "haute" pour voir les haute priorité',
                'Ou cherchez par machine, lieu, ticket...'
            ];
            const searchPlaceholdersMobile = [
                'Ex: "retard" tickets en retard',
                'Ex: "urgent" tickets critiques',
                'Ex: "commentaire" avec notes',
                'Ex: "haute" haute priorité',
                'Machine, lieu, ticket...'
            ];
            const isMobile = window.innerWidth < 768;
            const searchPlaceholders = isMobile ? searchPlaceholdersMobile : searchPlaceholdersDesktop;
            const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
            
            // Rotation automatique du placeholder toutes les 4 secondes
            React.useEffect(() => {
                const interval = setInterval(() => {
                    setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
                }, 4000);
                return () => clearInterval(interval);
            }, []);

            // Détection du scroll pour afficher/masquer le bouton "Retour en haut"
            React.useEffect(() => {
                const handleScroll = () => {
                    // Afficher le bouton seulement si on a scrollé plus de 300px ET que les archives sont affichées
                    setShowScrollTop(window.scrollY > 300 && showArchived);
                };

                window.addEventListener('scroll', handleScroll);
                handleScroll(); // Vérifier immédiatement

                return () => window.removeEventListener('scroll', handleScroll);
            }, [showArchived]);

            // Recalculer la position du dropdown lors du redimensionnement
            React.useEffect(() => {
                const updateDropdownPosition = () => {
                    if (searchInputRef.current && showSearchResults) {
                        const rect = searchInputRef.current.getBoundingClientRect();
                        setSearchDropdownPosition({
                            top: rect.bottom + window.scrollY,
                            left: rect.left + window.scrollX,
                            width: rect.width
                        });
                    }
                };

                window.addEventListener('resize', updateDropdownPosition);
                window.addEventListener('orientationchange', updateDropdownPosition);

                return () => {
                    window.removeEventListener('resize', updateDropdownPosition);
                    window.removeEventListener('orientationchange', updateDropdownPosition);
                };
            }, [showSearchResults]);

            const allStatuses = [
                { key: 'received', label: 'Requête Reçue', icon: 'inbox', color: 'blue' },
                { key: 'diagnostic', label: 'Diagnostic', icon: 'search', color: 'yellow' },
                { key: 'in_progress', label: 'En Cours', icon: 'wrench', color: 'orange' },
                { key: 'waiting_parts', label: 'En Attente Pièces', icon: 'clock', color: 'purple' },
                { key: 'completed', label: 'Terminé', icon: 'check-circle', color: 'green' },
                { key: 'archived', label: 'Archivé', icon: 'archive', color: 'gray' }
            ];

            // Séparer les colonnes actives, terminées et archivées
            const workflowStatuses = allStatuses.filter(s => s.key !== 'archived' && s.key !== 'completed');
            const completedStatus = allStatuses.find(s => s.key === 'completed');
            const archivedStatus = allStatuses.find(s => s.key === 'archived');

            // Fonction pour calculer le nombre de tickets actifs (excluant terminés et archivés)
            const getActiveTicketsCount = () => {
                // Filtrer les tickets actifs: NOT completed AND NOT archived
                let activeTickets = tickets.filter(t => t.status !== 'completed' && t.status !== 'archived');

                // Pour les opérateurs: seulement leurs propres tickets
                if (currentUser && currentUser.role === 'operator') {
                    activeTickets = activeTickets.filter(t => t.reported_by === currentUser.id);
                }

                return activeTickets.length;
            };


            React.useEffect(() => {
                const handleClick = () => setContextMenu(null);
                document.addEventListener('click', handleClick);
                return () => document.removeEventListener('click', handleClick);
            }, []);

            // Gérer les paramètres URL pour ouvrir automatiquement un ticket
            React.useEffect(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const ticketIdFromUrl = urlParams.get('ticket');
                
                if (ticketIdFromUrl && tickets.length > 0) {
                    const ticketId = parseInt(ticketIdFromUrl, 10);
                    const ticket = tickets.find(t => t.id === ticketId);
                    
                    if (ticket) {
                        console.log('[Push] Opening ticket from URL:', ticketId);
                        setSelectedTicketId(ticketId);
                        setShowDetailsModal(true);
                        
                        // Nettoyer l'URL sans recharger la page
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                }
            }, [tickets]);

            // Écouter les messages du Service Worker (notification click quand app déjà ouverte)
            React.useEffect(() => {
                const handleServiceWorkerMessage = (event) => {
                    console.log('[Push] Service Worker message received:', event.data);
                    
                    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                        const { action, data } = event.data;
                        
                        // Ouvrir le ticket si action view_ticket
                        if (action === 'view_ticket' && data.ticketId) {
                            const ticketId = data.ticketId;
                            const ticket = tickets.find(t => t.id === ticketId);
                            
                            if (ticket) {
                                console.log('[Push] Opening ticket from notification click:', ticketId);
                                setSelectedTicketId(ticketId);
                                setShowDetailsModal(true);
                            } else {
                                console.log('[Push] Ticket not found, reloading data...');
                                // Ticket pas encore chargé, recharger les données
                                loadData().then(() => {
                                    const foundTicket = tickets.find(t => t.id === ticketId);
                                    if (foundTicket) {
                                        setSelectedTicketId(ticketId);
                                        setShowDetailsModal(true);
                                    }
                                });
                            }
                        }
                        // Ouvrir messagerie pour messages audio
                        else if (action === 'new_audio_message' && data.messageId) {
                            setShowMessagesModal(true);
                        }
                        // Ouvrir conversation privée
                        else if (action === 'new_private_message' && data.senderId) {
                            setShowMessagesModal(true);
                        }
                    }
                };
                
                navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
                
                return () => {
                    navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
                };
            }, [tickets]);

            const getTicketsByStatus = (status) => {
                let filteredTickets = tickets.filter(t => t.status === status);

                // Opérateurs voient uniquement leurs propres tickets
                if (currentUser && currentUser.role === 'operator') {
                    filteredTickets = filteredTickets.filter(t => t.reported_by === currentUser.id);
                }

                // Appliquer le tri selon l'option sélectionnée
                if (sortBy === 'urgency') {
                    // Tri par urgence (priorité + temps écoulé)
                    const priorityOrder = { critical: 400, high: 300, medium: 200, low: 100 };
                    filteredTickets.sort((a, b) => {
                        const now = new Date();
                        const hoursA = (now - new Date(a.created_at)) / (1000 * 60 * 60);
                        const hoursB = (now - new Date(b.created_at)) / (1000 * 60 * 60);
                        const scoreA = priorityOrder[a.priority] + hoursA;
                        const scoreB = priorityOrder[b.priority] + hoursB;
                        return scoreB - scoreA; // Score le plus élevé en premier
                    });
                } else if (sortBy === 'oldest') {
                    // Tri par ancienneté (plus ancien en premier)
                    filteredTickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                } else if (sortBy === 'scheduled') {
                    // Tri par date planifiée (aujourd'hui/proche en premier)
                    filteredTickets.sort((a, b) => {
                        const hasScheduledA = a.scheduled_date && a.scheduled_date !== 'null';
                        const hasScheduledB = b.scheduled_date && b.scheduled_date !== 'null';

                        // Tickets planifiés en premier
                        if (hasScheduledA && !hasScheduledB) return -1;
                        if (!hasScheduledA && hasScheduledB) return 1;
                        if (!hasScheduledA && !hasScheduledB) return 0;

                        // Comparer les dates planifiées
                        const dateA = parseUTCDate(a.scheduled_date);
                        const dateB = parseUTCDate(b.scheduled_date);
                        return dateA - dateB; // Plus proche en premier
                    });
                }
                // sortBy === 'default' : pas de tri, ordre original

                return filteredTickets;
            };

            // 🔊 Play celebration sound using Web Audio API (0 KB - synthesized)
            const playCelebrationSound = () => {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Create three-note ascending ding (C-E-G chord)
                    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
                    const now = audioContext.currentTime;
                    
                    notes.forEach((freq, i) => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.value = freq;
                        oscillator.type = 'sine'; // Smooth tone
                        
                        // Volume envelope: quick fade in/out
                        gainNode.gain.setValueAtTime(0, now + i * 0.08);
                        gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02); // Low volume
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
                        
                        oscillator.start(now + i * 0.08);
                        oscillator.stop(now + i * 0.08 + 0.3);
                    });
                } catch (error) {
                    // Silent fail - sound is optional
                    console.log('Audio not available:', error);
                }
            };

            const moveTicketToStatus = async (ticket, newStatus) => {
                if (ticket.status === newStatus) return;

                try {
                    await axios.patch(API_URL + '/tickets/' + ticket.id, {
                        status: newStatus,
                        comment: 'Changement de statut: ' + ticket.status + ' → ' + newStatus
                    });
                    onTicketCreated(); // Refresh
                    
                    // 🎉 Confetti celebration when ticket is completed!
                    // Launch asynchronously to not block UI thread
                    if (newStatus === 'completed') {
                        // Use requestAnimationFrame for smooth animation
                        requestAnimationFrame(() => {
                            // Visual: Confetti (non-blocking, fast animation)
                            if (typeof confetti !== 'undefined') {
                                confetti({
                                    particleCount: 100,
                                    spread: 70,
                                    origin: { y: 0.6 },
                                    colors: ['#003B73', '#FFD700', '#C0C0C0', '#4CAF50', '#FF6B6B'],
                                    ticks: 120,      // Reduce lifetime (default: 200) - faster disappear
                                    gravity: 1.5,    // Increase gravity (default: 1) - faster fall
                                    scalar: 0.9      // Smaller particles - lighter, faster
                                });
                            }
                            
                            // Audio: Pleasant "ding" sound (non-blocking)
                            setTimeout(() => playCelebrationSound(), 0);
                        });
                    }
                } catch (error) {
                    alert('Erreur lors du déplacement: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };

            const moveTicketToNext = async (ticket, e) => {
                e.stopPropagation();
                const statusFlow = ['received', 'diagnostic', 'in_progress', 'waiting_parts', 'completed', 'archived'];
                const currentIndex = statusFlow.indexOf(ticket.status);

                if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
                    return; // Déjà au dernier statut
                }

                const nextStatus = statusFlow[currentIndex + 1];
                await moveTicketToStatus(ticket, nextStatus);
            };

            const handleTicketClick = (e, ticket) => {

                if (e.type === 'click' && !e.defaultPrevented) {
                    setSelectedTicketId(ticket.id);
                    setShowDetailsModal(true);
                }
            };

            const handleContextMenu = (e, ticket) => {
                e.preventDefault();
                e.stopPropagation();

                // Bloquer le menu contextuel uniquement pour les opérateurs
                if (currentUser && currentUser.role === 'operator') {
                    return;
                }


                const menuWidth = 200;
                const menuHeightEstimate = 350; // Estimation hauteur menu (ajuster si besoin)
                // Use clientX/clientY instead of pageX/pageY for position:fixed portal
                let x = e.clientX || (e.touches && e.touches[0].clientX);
                let y = e.clientY || (e.touches && e.touches[0].clientY);
                let openUpward = false;

                // Ajuster horizontalement si déborde à droite
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 10;
                }

                // Vérifier si assez d'espace en bas
                const spaceBelow = window.innerHeight - y;
                const spaceAbove = y;

                // Si pas assez d'espace en bas mais plus d'espace en haut, ouvrir vers le haut
                if (spaceBelow < menuHeightEstimate && spaceAbove > spaceBelow) {
                    openUpward = true;
                    // Positionner le menu au-dessus du curseur
                    y = Math.max(10, y - Math.min(menuHeightEstimate, spaceAbove - 10));
                } else {
                    // Ouvrir vers le bas normalement, mais limiter à l'espace disponible
                    y = Math.min(y, window.innerHeight - 60); // Laisser 60px marge minimale
                }

                setContextMenu({
                    x: x,
                    y: y,
                    ticket: ticket,
                    openUpward: openUpward
                });
            };


            const [draggedTicket, setDraggedTicket] = React.useState(null);
            const [dragOverColumn, setDragOverColumn] = React.useState(null);
            const [sortBy, setSortBy] = React.useState('default'); // default, priority, date, machine


            const handleDragStart = (e, ticket) => {

                if (currentUser && currentUser.role === 'operator') {
                    e.preventDefault();
                    return;
                }

                setDraggedTicket(ticket);
                e.currentTarget.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', ticket.id);

                // Désactiver temporairement le scroll horizontal pendant le drag
                const scrollContainer = document.querySelector('.overflow-x-auto');
                if (scrollContainer) {
                    scrollContainer.style.overflowX = 'hidden';
                }
            };

            const handleDragEnd = (e) => {
                e.currentTarget.classList.remove('dragging');
                setDraggedTicket(null);
                setDragOverColumn(null);

                // Réactiver le scroll horizontal après le drag
                const scrollContainer = document.querySelector('.overflow-x-auto');
                if (scrollContainer) {
                    scrollContainer.style.overflowX = 'auto';
                }
            };

            const handleDragOver = (e, status) => {
                e.preventDefault();
                e.stopPropagation(); // Empêcher la propagation pour meilleure précision
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn(status);
            };

            const handleDragLeave = (e) => {
                // Ne retirer l'indicateur que si on quitte vraiment la colonne
                // (pas juste en passant sur un ticket enfant)
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;

                // Si le curseur est encore dans les limites de la colonne, ne rien faire
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    return;
                }

                setDragOverColumn(null);
            };

            const handleDrop = async (e, targetStatus) => {
                e.preventDefault();
                setDragOverColumn(null);

                if (!draggedTicket) return;

                if (draggedTicket.status !== targetStatus) {
                    await moveTicketToStatus(draggedTicket, targetStatus);
                }

                setDraggedTicket(null);
            };


            // === NOUVEAUX ETATS POUR BOTTOM SHEET (isoles) ===
            const [showMoveModal, setShowMoveModal] = React.useState(false);
            const [ticketToMove, setTicketToMove] = React.useState(null);
            const longPressTimer = React.useRef(null);

            const touchDragStart = React.useRef(null);
            const touchDragTicket = React.useRef(null);

            const handleTouchStart = (e, ticket) => {

                if (currentUser && currentUser.role === 'operator') {
                    return;
                }

                const touch = e.touches[0];
                touchDragStart.current = { x: touch.clientX, y: touch.clientY };
                touchDragTicket.current = ticket;

                // === LONG PRESS POUR BOTTOM SHEET ===
                // Vibration legere au debut du touch
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }

                // Demarrer timer long press (500ms)
                longPressTimer.current = setTimeout(() => {
                    // Vibration forte pour confirmer long press
                    if (navigator.vibrate) {
                        navigator.vibrate([50, 30, 50]);
                    }

                    // Ouvrir bottom sheet
                    setTicketToMove(ticket);
                    setShowMoveModal(true);

                    // Annuler le drag classique pour ne pas interferer
                    touchDragStart.current = null;
                    touchDragTicket.current = null;
                }, 500);
            };

            const handleTouchMove = (e) => {
                // Annuler timer long press si utilisateur bouge (scroll intent)
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }

                if (!touchDragStart.current || !touchDragTicket.current) return;

                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchDragStart.current.x);
                const deltaY = Math.abs(touch.clientY - touchDragStart.current.y);


                if (deltaX > 10 || deltaY > 10) {
                    e.preventDefault();
                    setDraggedTicket(touchDragTicket.current);


                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    const column = element?.closest('.kanban-column');
                    if (column) {
                        const status = column.getAttribute('data-status');
                        setDragOverColumn(status);
                    }
                }
            };

            const handleTouchEnd = async (e) => {
                // Annuler timer long press si utilisateur relache avant 500ms
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }

                if (draggedTicket && dragOverColumn && draggedTicket.status !== dragOverColumn) {
                    await moveTicketToStatus(draggedTicket, dragOverColumn);
                }

                touchDragStart.current = null;
                touchDragTicket.current = null;
                setDraggedTicket(null);
                setDragOverColumn(null);
            };

            return React.createElement('div', { className: 'min-h-screen' },

                React.createElement(CreateTicketModal, {
                    show: showCreateModal,
                    onClose: () => setShowCreateModal(false),
                    machines: machines,
                    onTicketCreated: onTicketCreated,
                    currentUser: currentUser
                }),


                React.createElement(TicketDetailsModal, {
                    show: showDetailsModal,
                    onClose: () => {
                        setShowDetailsModal(false);
                        setSelectedTicketId(null);
                    },
                    ticketId: selectedTicketId,
                    currentUser: currentUser,
                    onTicketDeleted: () => {
                        setShowDetailsModal(false);
                        setSelectedTicketId(null);
                        onTicketCreated(); // Refresh ticket list
                    }
                }),


                React.createElement(PerformanceModal, {
                    show: showPerformanceModal,
                    onClose: () => setShowPerformanceModal(false)
                }),


                React.createElement(OverdueTicketsModal, {
                    show: showOverdueModal,
                    onClose: () => setShowOverdueModal(false),
                    currentUser: currentUser
                }),


                React.createElement(PushDevicesModal, {
                    show: showPushDevicesModal,
                    onClose: () => setShowPushDevicesModal(false)
                }),


                React.createElement(UserManagementModal, {
                    show: showUserManagement,
                    onClose: () => setShowUserManagement(false),
                    currentUser: currentUser,
                    onOpenMessage: (user) => {
                        setShowUserManagement(false);
                        setMessagingContact(user);
                        setMessagingTab("private");
                        setShowMessaging(true);
                    }
                }),

                React.createElement(SystemSettingsModal, {
                    show: showSystemSettings,
                    onClose: () => setShowSystemSettings(false),
                    currentUser: currentUser
                }),

                React.createElement(MachineManagementModal, {
                    show: showMachineManagement,
                    onClose: () => setShowMachineManagement(false),
                    currentUser: currentUser,
                    machines: machines,
                    onRefresh: onRefresh
                }),

                React.createElement(MessagingModal, {
                    show: showMessaging,
                    onClose: () => {
                        setShowMessaging(false);
                        setMessagingContact(null);
                        setMessagingTab("public");
                        if (onRefreshMessages) onRefreshMessages();
                    },
                    currentUser: currentUser,
                    initialContact: messagingContact,
                    initialTab: messagingTab
                }),

                React.createElement(UserGuideModal, {
                    show: showUserGuide,
                    onClose: () => setShowUserGuide(false),
                    currentUser: currentUser
                }),

                React.createElement(MoveTicketBottomSheet, {
                    show: showMoveModal,
                    onClose: () => {
                        setShowMoveModal(false);
                        setTicketToMove(null);
                    },
                    ticket: ticketToMove,
                    onMove: moveTicketToStatus,
                    onDelete: async (ticketId) => {
                        const confirmed = window.confirm('Supprimer ce ticket definitivement ? Cette action est irreversible.');
                        if (!confirmed) return;

                        try {
                            await axios.delete(API_URL + '/tickets/' + ticketId);
                            // Recharger les données AVANT d'afficher le message de succès
                            await onRefresh();
                            alert('Ticket supprime avec succes');
                        } catch (error) {
                            alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                        }
                    },
                    currentUser: currentUser
                }),


                React.createElement('header', {
                    className: 'shadow-lg border-b-4 border-igp-blue',
                    style: {
                        background: 'rgba(255, 255, 255, 0.40)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        borderBottom: '4px solid #003366',
                        position: 'relative',
                        zIndex: 10
                    }
                },
                    React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-3' },
                        React.createElement('div', { className: 'w-full max-w-md md:max-w-2xl mx-auto mb-4' },
                            React.createElement('div', { className: 'relative w-full', style: { zIndex: 99999 } },
                                React.createElement('input', {
                                    ref: searchInputRef,
                                    type: 'text',
                                    placeholder: searchPlaceholders[placeholderIndex],
                                    className: 'w-full px-3 md:px-4 py-2 pr-14 md:pr-20 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs md:text-sm placeholder-gray-400',
                                    value: searchQuery,
                                    onKeyDown: (e) => {
                                        if (e.key === 'Escape') {
                                            setSearchQuery('');
                                            setShowSearchResults(false);
                                            e.target.blur();
                                        }
                                    },
                                    onFocus: () => {
                                        if (searchInputRef.current) {
                                            const rect = searchInputRef.current.getBoundingClientRect();
                                            setSearchDropdownPosition({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.left + window.scrollX,
                                                width: rect.width
                                            });
                                        }
                                    },
                                    onChange: (e) => {
                                        const query = e.target.value;
                                        setSearchQuery(query);
                                        
                                        // Update dropdown position dynamically
                                        if (searchInputRef.current) {
                                            const rect = searchInputRef.current.getBoundingClientRect();
                                            setSearchDropdownPosition({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.left + window.scrollX,
                                                width: rect.width
                                            });
                                        }
                                        
                                        if (searchTimeoutRef.current) {
                                            clearTimeout(searchTimeoutRef.current);
                                        }
                                        if (query.trim().length >= 2) {
                                            setSearchLoading(true);
                                            searchTimeoutRef.current = setTimeout(async () => {
                                                try {
                                                    const response = await fetch('/api/search?q=' + encodeURIComponent(query), {
                                                        headers: {
                                                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                                                        }
                                                    });
                                                    const data = await response.json();
                                                    setSearchResults(data.results || []);
                                                    setSearchKeywordResults(data.keywordResults || []);
                                                    setSearchTextResults(data.textResults || []);
                                                    setSearchIsKeyword(data.isKeywordSearch || false);
                                                    setSearchKeywordType(data.keyword || null);
                                                    setShowSearchResults(true);
                                                } catch (err) {
                                                    console.error('Erreur recherche:', err);
                                                } finally {
                                                    setSearchLoading(false);
                                                }
                                            }, 300);
                                        } else {
                                            setSearchResults([]);
                                            setShowSearchResults(false);
                                            setSearchLoading(false);
                                        }
                                    },
                                    onBlur: () => setTimeout(() => setShowSearchResults(false), 200)
                                }),
                                // Bouton effacer (visible si query non vide)
                                searchQuery && React.createElement('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        setSearchQuery('');
                                        setShowSearchResults(false);
                                        setSearchResults([]);
                                        setSearchKeywordResults([]);
                                        setSearchTextResults([]);
                                    },
                                    className: 'absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1',
                                    title: 'Effacer la recherche (Esc)'
                                },
                                    React.createElement('i', { className: 'fas fa-times-circle text-lg' })
                                ),
                                React.createElement('i', {
                                    className: 'fas ' + (searchLoading ? 'fa-spinner fa-spin' : 'fa-search') + ' absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                                }),
                                showSearchResults && (searchKeywordResults.length > 0 || searchTextResults.length > 0) && React.createElement('div', {
                                    className: 'md:fixed left-0 right-0 md:left-auto md:right-auto bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-y-auto mt-2 md:mt-0',
                                    style: window.innerWidth < 768 ? {
                                        position: 'relative',
                                        zIndex: 100,
                                        maxHeight: '400px'
                                    } : { 
                                        zIndex: 9999999,
                                        top: searchDropdownPosition.top + 'px',
                                        left: searchDropdownPosition.left + 'px',
                                        width: searchDropdownPosition.width + 'px',
                                        minWidth: '320px',
                                        maxWidth: 'none',
                                        maxHeight: 'calc(100vh - ' + searchDropdownPosition.top + 'px - 2rem)',
                                        pointerEvents: 'auto'
                                    }
                                },
                                    // Bouton fermer en haut à droite du dropdown
                                    React.createElement('button', {
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            setShowSearchResults(false);
                                        },
                                        className: 'sticky top-0 right-0 float-right bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full p-2 m-2 transition-colors shadow-md z-50',
                                        title: 'Fermer les résultats (Esc)',
                                        style: { marginLeft: 'auto' }
                                    },
                                        React.createElement('i', { className: 'fas fa-times text-sm' })
                                    ),
                                    // Section 1: Résultats par mot-clé
                                    searchIsKeyword && searchKeywordResults.length > 0 && React.createElement('div', {},
                                        React.createElement('div', { className: 'bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 border-b-2 border-red-200 sticky top-0 z-10' },
                                            React.createElement('div', { className: 'flex items-center gap-2' },
                                                React.createElement('span', { className: 'text-xs font-bold text-red-700 uppercase' },
                                                    searchKeywordType === 'retard' || searchKeywordType === 'retards' || searchKeywordType === 'overdue' ? '🔴 TICKETS EN RETARD' :
                                                    searchKeywordType === 'urgent' || searchKeywordType === 'critique' || searchKeywordType === 'critical' ? '🔴 TICKETS CRITIQUES' :
                                                    searchKeywordType === 'haute' || searchKeywordType === 'high' ? '🟠 HAUTE PRIORITÉ' :
                                                    searchKeywordType === 'commentaire' || searchKeywordType === 'commentaires' || searchKeywordType === 'note' ? '💬 AVEC COMMENTAIRES' :
                                                    '🎯 RÉSULTATS CIBLÉS'
                                                ),
                                                React.createElement('span', { className: 'text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-full' },
                                                    searchKeywordResults.length
                                                )
                                            )
                                        ),
                                        searchKeywordResults.map((result) =>
                                            React.createElement('div', {
                                                key: 'kw-' + result.id,
                                                className: 'p-3 md:p-4 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 hover:shadow-sm',
                                                onClick: () => {
                                                    setSelectedTicketId(result.id);
                                                    setShowDetailsModal(true);
                                                    setSearchQuery('');
                                                    setShowSearchResults(false);
                                                }
                                            },
                                                React.createElement('div', { className: 'flex justify-end mb-2' },
                                                    React.createElement('span', { className: 'text-xs text-gray-400 font-mono tracking-wide' }, result.ticket_id)
                                                ),
                                                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                    React.createElement('span', { className: 'px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-br from-red-600 to-red-700 text-white shadow-sm flex-shrink-0' },
                                                        searchKeywordType === 'retard' || searchKeywordType === 'retards' ? '⏰' :
                                                        searchKeywordType === 'urgent' || searchKeywordType === 'critique' ? '🔴' :
                                                        searchKeywordType === 'haute' ? '🟠' : '💬'
                                                    ),
                                                    React.createElement('span', { className: 'font-semibold text-gray-900 text-sm md:text-base leading-tight' }, result.title)
                                                ),
                                                React.createElement('div', { className: 'text-xs text-gray-500 ml-8 md:ml-10 truncate flex items-center gap-1' },
                                                    React.createElement('i', { className: 'fas fa-cog text-gray-400' }),
                                                    React.createElement('span', {}, result.machine_type + ' - ' + result.model)
                                                ),
                                                React.createElement('div', { className: 'flex items-center gap-2 mt-2 ml-8 md:ml-10 flex-wrap' },
                                                    result.location && React.createElement('span', { className: 'text-xs text-gray-500 truncate flex items-center gap-1' },
                                                        React.createElement('i', { className: 'fas fa-map-marker-alt text-gray-400 text-[10px]' }),
                                                        React.createElement('span', {}, result.location)
                                                    ),
                                                    result.comments_count > 0 && React.createElement('span', { className: 'text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm flex-shrink-0' },
                                                        React.createElement('i', { className: 'fas fa-comment text-[10px]' }),
                                                        React.createElement('span', {}, result.comments_count)
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                    // Section 2: Résultats textuels
                                    searchIsKeyword && searchTextResults.length > 0 && React.createElement('div', {},
                                        React.createElement('div', { className: 'bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 border-b border-gray-300 sticky top-0 z-10' },
                                            React.createElement('div', { className: 'flex items-center gap-2' },
                                                React.createElement('span', { className: 'text-xs font-bold text-gray-600 uppercase' },
                                                    '📄 AUTRES RÉSULTATS'
                                                ),
                                                React.createElement('span', { className: 'text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full' },
                                                    searchTextResults.length
                                                )
                                            )
                                        ),
                                        searchTextResults.map((result) =>
                                            React.createElement('div', {
                                                key: 'txt-' + result.id,
                                                className: 'p-3 md:p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 hover:shadow-sm',
                                                onClick: () => {
                                                    setSelectedTicketId(result.id);
                                                    setShowDetailsModal(true);
                                                    setSearchQuery('');
                                                    setShowSearchResults(false);
                                                }
                                            },
                                                React.createElement('div', { className: 'flex justify-end mb-2' },
                                                    React.createElement('span', { className: 'text-xs text-gray-400 font-mono tracking-wide' }, result.ticket_id)
                                                ),
                                                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                    React.createElement('span', { className: 'px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-sm flex-shrink-0' }, '📝'),
                                                    React.createElement('span', { className: 'font-semibold text-gray-900 text-sm md:text-base leading-tight' }, result.title)
                                                ),
                                                React.createElement('div', { className: 'text-xs text-gray-500 ml-8 md:ml-10 truncate flex items-center gap-1' },
                                                    React.createElement('i', { className: 'fas fa-cog text-gray-400' }),
                                                    React.createElement('span', {}, result.machine_type + ' - ' + result.model)
                                                ),
                                                React.createElement('div', { className: 'flex items-center gap-2 mt-2 ml-8 md:ml-10 flex-wrap' },
                                                    result.location && React.createElement('span', { className: 'text-xs text-gray-500 truncate flex items-center gap-1' },
                                                        React.createElement('i', { className: 'fas fa-map-marker-alt text-gray-400 text-[10px]' }),
                                                        React.createElement('span', {}, result.location)
                                                    ),
                                                    result.comments_count > 0 && React.createElement('span', { className: 'text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm flex-shrink-0' },
                                                        React.createElement('i', { className: 'fas fa-comment text-[10px]' }),
                                                        React.createElement('span', {}, result.comments_count)
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                    // Section unique: Recherche textuelle pure
                                    !searchIsKeyword && searchKeywordResults.length > 0 && searchKeywordResults.map((result) =>
                                        React.createElement('div', {
                                            key: result.id,
                                            className: 'p-3 md:p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 hover:shadow-sm',
                                            onClick: () => {
                                                setSelectedTicketId(result.id);
                                                setShowDetailsModal(true);
                                                setSearchQuery('');
                                                setShowSearchResults(false);
                                            }
                                        },
                                            React.createElement('div', { className: 'flex justify-end mb-2' },
                                                React.createElement('span', { className: 'text-xs text-gray-400 font-mono tracking-wide' }, result.ticket_id)
                                            ),
                                            React.createElement('div', { className: 'mb-2' },
                                                React.createElement('span', { className: 'font-semibold text-gray-900 text-sm md:text-base leading-tight' }, result.title)
                                            ),
                                            React.createElement('div', { className: 'text-xs text-gray-500 truncate flex items-center gap-1' },
                                                React.createElement('i', { className: 'fas fa-cog text-gray-400' }),
                                                React.createElement('span', {}, result.machine_type + ' - ' + result.model)
                                            ),
                                            React.createElement('div', { className: 'flex items-center gap-2 mt-2 flex-wrap' },
                                                result.location && React.createElement('span', { className: 'text-xs text-gray-500 truncate flex items-center gap-1' },
                                                    React.createElement('i', { className: 'fas fa-map-marker-alt text-gray-400 text-[10px]' }),
                                                    React.createElement('span', {}, result.location)
                                                ),
                                                result.comments_count > 0 && React.createElement('span', { className: 'text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm flex-shrink-0' },
                                                    React.createElement('i', { className: 'fas fa-comment text-[10px]' }),
                                                    React.createElement('span', {}, result.comments_count + ' commentaire' + (result.comments_count > 1 ? 's' : ''))
                                                )
                                            )
                                        )
                                    )
                                ),
                                showSearchResults && searchKeywordResults.length === 0 && searchTextResults.length === 0 && searchQuery.trim().length >= 2 && !searchLoading && React.createElement('div', {
                                    className: 'md:fixed left-0 right-0 md:left-auto md:right-auto bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 mt-2 md:mt-0',
                                    style: window.innerWidth < 768 ? {
                                        position: 'relative',
                                        zIndex: 100
                                    } : { 
                                        zIndex: 9999999,
                                        top: searchDropdownPosition.top + 'px',
                                        left: searchDropdownPosition.left + 'px',
                                        width: searchDropdownPosition.width + 'px',
                                        minWidth: '320px',
                                        maxWidth: 'none',
                                        pointerEvents: 'auto'
                                    }
                                },
                                    React.createElement('p', { className: 'text-sm text-gray-500 text-center' },
                                        'Aucun résultat trouvé'
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex flex-col md:flex-row md:justify-between md:items-center gap-6' },
                            React.createElement('div', {
                                className: 'flex items-center space-x-2 md:space-x-3 flex-1 min-w-0',
                                style: {
                                    background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.85) 0%, rgba(224, 242, 254, 0.75) 50%, rgba(186, 230, 253, 0.8) 100%)',
                                    backdropFilter: 'blur(20px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 4px 16px rgba(0, 51, 102, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(186, 230, 253, 0.3)',
                                    border: '2px solid rgba(255, 255, 255, 0.6)',
                                    borderTop: '2px solid rgba(255, 255, 255, 0.9)',
                                    borderLeft: '2px solid rgba(255, 255, 255, 0.8)',
                                    position: 'relative',
                                    width: '100%',
                                    overflow: 'hidden'
                                }
                            },
                                React.createElement('div', {
                                    style: {
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '50%',
                                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%)',
                                        borderRadius: '16px 16px 0 0',
                                        pointerEvents: 'none'
                                    }
                                }),
                                React.createElement('img', {
                                    src: '/api/settings/logo?t=' + Date.now(),
                                    alt: 'IGP Logo',
                                    className: 'h-10 md:h-12 lg:h-16 w-auto object-contain flex-shrink-0',
                                    onError: (e) => {
                                        e.target.src = '/static/logo-igp.png';
                                    }
                                }),
                                React.createElement('div', { 
                                    className: 'pl-2 md:pl-3 flex-1 min-w-0',
                                    style: {
                                        borderLeft: '2px solid rgba(147, 197, 253, 0.5)',
                                        position: 'relative'
                                    }
                                },
                                    React.createElement('h1', {
                                        className: 'text-sm md:text-lg lg:text-xl font-bold break-words',
                                        style: {
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            color: '#1e3a8a',
                                            fontWeight: '900'
                                        },
                                        title: headerTitle
                                    }, headerTitle),
                                    React.createElement('p', {
                                        className: 'text-xs md:text-sm break-words',
                                        style: {
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            color: '#1a1a1a',
                                            fontWeight: '800',
                                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                        },
                                        title: headerSubtitle
                                    },
                                        headerSubtitle
                                    ),
                                    React.createElement('p', {
                                        className: 'text-xs md:text-sm font-semibold mt-1',
                                        style: {
                                            color: '#047857',
                                            fontWeight: '900',
                                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                        }
                                    },
                                        '👋 Bonjour ' + (currentUser?.first_name || currentUser?.email?.split('@')[0] || 'Utilisateur')
                                    ),
                                    React.createElement('div', { className: "flex items-center gap-3 flex-wrap" },
                                        React.createElement('p', {
                                            className: "text-xs font-semibold",
                                            style: {
                                                color: '#1e40af',
                                                fontWeight: '900',
                                                textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                            },
                                            id: 'active-tickets-count'
                                        },
                                            getActiveTicketsCount() + " tickets actifs"
                                        ),
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors',
                                            id: 'overdue-tickets-badge-wrapper',
                                            title: 'Tickets en retard - Cliquer pour voir détails',
                                            onClick: () => setShowOverdueModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-clock mr-1' }),
                                            React.createElement('span', { id: 'overdue-tickets-badge' }, '0 retard')
                                        ) : null,
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors',
                                            id: 'technicians-count-badge-wrapper',
                                            title: 'Techniciens actifs - Cliquer pour voir performance',
                                            onClick: () => setShowPerformanceModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-users mr-1' }),
                                            React.createElement('span', { id: 'technicians-count-badge' }, '0 techs')
                                        ) : null,
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300 cursor-pointer hover:bg-green-200 transition-colors',
                                            id: 'push-devices-badge-wrapper',
                                            title: 'Appareils avec notifications push - Cliquer pour voir liste',
                                            onClick: () => setShowPushDevicesModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-mobile-alt mr-1' }),
                                            React.createElement('span', { id: 'push-devices-badge' }, '0 apps')
                                        ) : null,
                                        (currentUser?.role === "technician" || currentUser?.role === "supervisor" || currentUser?.role === "admin" || currentUser?.role === "operator" || currentUser?.role === "furnace_operator") ?
                                        React.createElement('div', {
                                            className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer " + (unreadMessagesCount > 0 ? "bg-igp-red animate-pulse" : "bg-gradient-to-r from-igp-blue to-igp-blue-dark opacity-50"),
                                            onClick: () => setShowMessaging(true),
                                            title: unreadMessagesCount > 0 ? (unreadMessagesCount + " messages non lus") : "Aucun message non lu"
                                        },
                                            React.createElement('i', { className: "fas fa-envelope text-white text-xs" }),
                                            unreadMessagesCount > 0 ? React.createElement('span', { className: "text-white text-xs font-bold" }, unreadMessagesCount) : null
                                        ) : null
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center md:justify-center gap-2 mt-4 header-actions' },
                            // 1. Nouvelle Demande (action primaire)
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md hover:bg-igp-blue-dark font-semibold shadow-md transition-all flex items-center'
                            },
                                React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                'Demande'
                            ),
                            // 2. Messagerie (le plus utilisé quotidiennement)
                            (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin' || currentUser?.role === 'operator' || currentUser?.role === 'furnace_operator') ?
                            React.createElement('button', {
                                onClick: () => setShowMessaging(true),
                                className: 'px-3 py-1.5 bg-gradient-to-r from-slate-700 to-gray-700 text-white text-sm rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all flex items-center'
                            },
                                React.createElement('i', { className: 'fas fa-comments mr-2' }),
                                'Messagerie'
                            ) : null,
                            // 3. Archives (consultation fréquente)
                            React.createElement('button', {
                                onClick: () => {
                                    setShowArchived(!showArchived);
                                    // Si on affiche les archives, scroller vers la section après un court délai
                                    if (!showArchived) {
                                        setTimeout(() => {
                                            const archivedSection = document.getElementById('archived-section');
                                            if (archivedSection) {
                                                archivedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }, 100);
                                    }
                                },
                                className: 'px-3 py-1.5 text-sm rounded-md font-semibold shadow-md transition-all flex items-center gap-2 ' +
                                    (showArchived
                                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300')
                            },
                                React.createElement('i', { className: 'fas fa-' + (showArchived ? 'eye-slash' : 'archive') }),
                                React.createElement('span', {}, showArchived ? 'Masquer' : 'Archivés'),
                                React.createElement('span', {
                                    className: 'px-2 py-0.5 rounded-full text-xs font-bold ' +
                                    (showArchived ? 'bg-gray-500' : 'bg-gray-300 text-gray-700')
                                }, getTicketsByStatus('archived').length)
                            ),
                            // 4. Utilisateurs (gestion admin - moins fréquent)
                            (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowUserManagement(true),
                                className: "px-3 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-800 font-semibold shadow-md transition-all flex items-center"
                            },
                                React.createElement('i', { className: "fas fa-users-cog mr-2" }),
                                "Utilisateurs"
                            ) : null,
                            // 5. Machines (gestion admin - moins fréquent)
                            (currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowMachineManagement(true),
                                className: "px-3 py-1.5 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 font-semibold shadow-md transition-all flex items-center"
                            },
                                React.createElement('i', { className: "fas fa-cogs mr-2" }),
                                "Machines"
                            ) : null,
                            // 6. Parametres systeme (admin uniquement)
                            (currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowSystemSettings(true),
                                className: "px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 font-semibold shadow-md transition-all flex items-center"
                            },
                                React.createElement('i', { className: "fas fa-sliders-h mr-2" }),
                                "Parametres"
                            ) : null,
                            // 7. Rôles (admin uniquement - rare)
                            (currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => {
                                    // S'assurer que le token est bien dans localStorage avant la redirection
                                    const token = localStorage.getItem('auth_token');
                                    if (token) {
                                        window.location.href = '/admin/roles';
                                    } else {
                                        alert('Session expirée. Veuillez vous reconnecter.');
                                        window.location.href = '/';
                                    }
                                },
                                className: "px-3 py-1.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white text-sm rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all flex items-center",
                                title: 'Gestion des rôles et permissions (Admin)'
                            },
                                React.createElement('i', { className: 'fas fa-shield-alt mr-2' }),
                                'Rôles'
                            ) : null,
                            // 7. Activer notifications push (PWA)
                            // DEBUG: Temporarily remove condition to always show button
                            React.createElement('button', {
                                onClick: async () => {
                                    try {
                                        if (!('Notification' in window)) {
                                            alert('Votre navigateur ne supporte pas les notifications push.');
                                            return;
                                        }

                                        const currentPerm = Notification.permission;

                                        if (currentPerm === 'granted') {
                                            if (!window.subscribeToPush || !window.isPushSubscribed) {
                                                alert('Chargement en cours... Reessayez dans 1 seconde.');
                                                return;
                                            }

                                            // Check if already subscribed for THIS user
                                            const isAlreadySubscribed = await window.isPushSubscribed();
                                            if (isAlreadySubscribed) {
                                                alert('Vous etes deja abonne aux notifications push!');
                                                // Update button color to green since user is subscribed
                                                if (window.updatePushButtonColor) {
                                                    setTimeout(() => window.updatePushButtonColor(), 100);
                                                }
                                                return;
                                            }

                                            const result = await window.subscribeToPush();
                                            if (result.success) {
                                                if (result.updated) {
                                                    alert('Abonnement push deja actif (mis a jour)');
                                                } else {
                                                    alert('Abonnement push enregistre avec succes!');
                                                }
                                                // Update button color after successful subscribe
                                                if (window.updatePushButtonColor) {
                                                    setTimeout(() => window.updatePushButtonColor(), 500);
                                                }
                                            } else {
                                                alert('Erreur: ' + result.error);
                                            }
                                            return;
                                        }

                                        if (currentPerm === 'denied') {
                                            alert('Les notifications ont ete refusees. Allez dans Parametres Android > Apps > IGP > Notifications pour les activer.');
                                            return;
                                        }

                                        const perm = await Notification.requestPermission();

                                        if (perm === 'granted') {
                                            alert('Notifications activees avec succes!');
                                            if (window.initPushNotifications) {
                                                setTimeout(() => window.initPushNotifications(), 1000);
                                            }
                                            window.location.reload();
                                        } else {
                                            alert('Notifications refusees.');
                                            window.location.reload();
                                        }
                                    } catch (e) {
                                        alert('Erreur: ' + e.message);
                                    }
                                },
                                className: (typeof Notification !== 'undefined' && Notification.permission === 'denied')
                                    ? 'px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 shadow-md transition-all animate-pulse flex items-center'
                                    : 'px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 shadow-md transition-all animate-pulse-orange-red flex items-center',
                                style: { minWidth: '155px' }
                            },
                                React.createElement('i', {
                                    className: 'fas fa-bell-slash mr-2'
                                }),
                                'Notifications'
                            ),
                            // 8. Actualiser (utile mais auto-refresh disponible)
                            React.createElement('button', {
                                onClick: onRefresh,
                                className: 'px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md hover:bg-blue-800 shadow-md transition-all flex items-center'
                            },
                                React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                                'Actualiser'
                            ),
                            // 9. Déconnexion (action de sortie - toujours à la fin)
                            React.createElement('button', {
                                onClick: onLogout,
                                className: 'px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 shadow-md transition-all flex items-center'
                            },
                                React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }),
                                'Déconnexion'
                            ),
                            // 9. Guide (aide contextuelle - toujours accessible)
                            React.createElement('a', {
                                href: '/guide',
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                className: 'w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 font-bold shadow-lg transition-all inline-flex items-center justify-center text-lg self-center',
                                title: 'Guide utilisateur - Aide'
                            },
                                '?'
                            )
                        )
                    )
                ),


                React.createElement('div', {
                    className: 'max-w-[1600px] mx-auto px-4 py-6'
                },
                    React.createElement('div', { className: 'space-y-4' },
                        // Première ligne: colonnes de workflow (Reçue, Diagnostic, En cours, Attente pièces)
                        React.createElement('div', { className: 'overflow-x-auto pb-4' },
                            React.createElement('div', { className: 'kanban-grid flex gap-3' },
                            workflowStatuses.map(status => {
                            const isDragOver = dragOverColumn === status.key;
                            const ticketsInColumn = getTicketsByStatus(status.key);
                            const hasTickets = ticketsInColumn.length > 0;
                            const columnClass = 'kanban-column' +
                                (isDragOver ? ' drag-over' : '') +
                                (hasTickets ? ' has-tickets' : ' empty');

                            return React.createElement('div', {
                                key: status.key,
                                className: columnClass,
                                'data-status': status.key,
                                onDragOver: (e) => handleDragOver(e, status.key),
                                onDragLeave: handleDragLeave,
                                onDrop: (e) => handleDrop(e, status.key)
                            },
                                React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                                    React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                        React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-1.5 text-sm' }),
                                        React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, status.label)
                                    ),
                                    React.createElement('span', {
                                        className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                                    }, getTicketsByStatus(status.key).length)
                                ),
                                // Dropdown de tri (visible uniquement si plus de 2 tickets)
                                ticketsInColumn.length > 2 ? React.createElement('div', { className: 'mb-3 flex items-center gap-2' },
                                    React.createElement('label', {
                                        className: 'text-xs text-gray-600 font-medium whitespace-nowrap flex items-center gap-1',
                                        htmlFor: 'sort-select-' + status.key
                                    },
                                        React.createElement('i', { className: 'fas fa-sort text-sm' }),
                                        React.createElement('span', { className: 'hidden sm:inline' }, 'Trier:')
                                    ),
                                    React.createElement('select', {
                                        id: 'sort-select-' + status.key,
                                        value: sortBy,
                                        onChange: (e) => setSortBy(e.target.value),
                                        className: 'flex-1 text-sm sm:text-xs px-3 py-2.5 sm:py-1.5 border-2 border-gray-300 rounded-lg bg-white text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer touch-manipulation min-h-[44px] sm:min-h-0',
                                        onClick: (e) => e.stopPropagation()
                                    },
                                        React.createElement('option', { value: 'default' }, 'Par défaut'),
                                        React.createElement('option', { value: 'urgency' }, '🔥 Urgence (priorité + temps)'),
                                        React.createElement('option', { value: 'oldest' }, '⏰ Plus ancien'),
                                        React.createElement('option', { value: 'scheduled' }, '📅 Planifié')
                                    )
                                ) : null,
                                React.createElement('div', { className: 'space-y-2' },
                                    getTicketsByStatus(status.key).map(ticket => {
                                        return React.createElement('div', {
                                            key: ticket.id,
                                            className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                            draggable: currentUser && currentUser.role !== 'operator',
                                            onClick: (e) => handleTicketClick(e, ticket),
                                            onDragStart: (e) => handleDragStart(e, ticket),
                                            onDragEnd: handleDragEnd,
                                            onTouchStart: (e) => handleTouchStart(e, ticket),
                                            onTouchMove: handleTouchMove,
                                            onTouchEnd: handleTouchEnd,
                                            onContextMenu: (e) => handleContextMenu(e, ticket),
                                            title: currentUser && currentUser.role === 'operator'
                                                ? 'Cliquer pour détails | Clic droit: menu'
                                                : 'Cliquer pour détails | Glisser pour déplacer | Clic droit: menu'
                                        },
                                            // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle)
                                            // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                            ((ticket.assigned_to !== null && ticket.assigned_to !== undefined) && (ticket.status !== 'completed' && ticket.status !== 'archived')) ? React.createElement('div', {
                                                className: 'mb-2 -mx-3 -mt-3 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg overflow-hidden ' + (hasScheduledDate(ticket.scheduled_date)
                                                    ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-green-400'
                                                    : 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 shadow-[0_4px_12px_rgba(51,65,85,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] border-b-2 border-cyan-400'),
                                                style: { fontSize: '11px' }
                                            },
                                                React.createElement('div', { className: 'flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0 ' + (ticket.scheduled_date
                                                    ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_2px_8px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-green-300'
                                                    : 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-[0_2px_8px_rgba(6,182,212,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] border border-cyan-300')
                                                },
                                                    React.createElement('i', { className: 'text-white drop-shadow-lg text-[9px] ' + (hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check') }),
                                                    React.createElement('span', { className: 'text-white font-extrabold tracking-wide drop-shadow-md' }, hasScheduledDate(ticket.scheduled_date) ? "PLANIFIÉ" : "ASSIGNÉ")
                                                ),
                                                React.createElement('span', { className: 'text-white font-bold text-center flex-1 min-w-0 px-1.5 py-0.5 rounded shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] border truncate ' + (hasScheduledDate(ticket.scheduled_date) ? 'bg-blue-800/60 border-blue-500/40' : 'bg-slate-800/70 border-cyan-500/50') },
                                                    ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                                        ? (ticket.assigned_to === 0 ? "👥 Équipe" : "👤 " + (ticket.assignee_name || 'Tech #' + ticket.assigned_to))
                                                        : "⚠️ Non assigné"
                                                ),
                                                (ticket.scheduled_date && ticket.scheduled_date !== 'null') ? React.createElement('span', { className: 'text-white font-bold bg-gradient-to-br from-blue-800 to-blue-900 px-1.5 py-0.5 rounded shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-blue-600 whitespace-nowrap flex-shrink-0' },
                                                    parseUTCDate(ticket.scheduled_date).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: 'short'
                                                    })
                                                ) : null
                                            ) : null,

                                            React.createElement('div', { className: 'mb-1' },
                                                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                            ),
                                            React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('span', {
                                                    className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' +
                                                    (ticket.priority === 'critical' ? 'bg-red-100 text-igp-red' :
                                                     ticket.priority === 'high' ? 'bg-amber-100 text-igp-yellow' :
                                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                     'bg-green-100 text-igp-green')
                                                },
                                                    ticket.priority === 'critical' ? '🔴 CRIT' :
                                                    ticket.priority === 'high' ? '🟠 HAUT' :
                                                    ticket.priority === 'medium' ? '🟡 MOY' :
                                                    '🟢 BAS'
                                                ),
                                                React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                            ),


                                            // Badge "Rapporté par" pour TOUS les tickets
                                            React.createElement('div', {
                                                className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                            },
                                                React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                                React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                            ),
                                            // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                            (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                                React.createElement('div', { className: 'flex items-center gap-1' },
                                                    React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                                ),
                                            ) : null,

                                            React.createElement('div', { className: 'flex items-center justify-between gap-2 text-xs' },
                                                React.createElement('div', { className: 'flex items-center text-gray-500' },
                                                    React.createElement('i', { className: 'far fa-clock mr-1' }),
                                                    React.createElement('span', {}, formatDateEST(ticket.created_at, false))
                                                ),
                                                ticket.media_count > 0 ? React.createElement('div', { className: 'flex items-center text-igp-blue font-semibold' },
                                                    React.createElement('i', { className: 'fas fa-camera mr-1' }),
                                                    React.createElement('span', {}, ticket.media_count)
                                                ) : null
                                            ),
                                            React.createElement(TicketTimer, {
                                                createdAt: ticket.created_at,
                                                status: ticket.status
                                            })
                                        );
                                    })
                                )
                            );
                        })
                        )
                    ),

                    // Deuxième ligne: colonne Terminé
                    completedStatus ? React.createElement('div', { className: 'overflow-x-auto pb-4' },
                        React.createElement('div', { className: 'kanban-grid flex gap-3' },
                            (() => {
                                const status = completedStatus;
                                const isDragOver = dragOverColumn === status.key;
                                const ticketsInColumn = getTicketsByStatus(status.key);
                                const hasTickets = ticketsInColumn.length > 0;
                                const columnClass = 'kanban-column' +
                                    (isDragOver ? ' drag-over' : '') +
                                    (hasTickets ? ' has-tickets' : ' empty');

                                return React.createElement('div', {
                                    key: status.key,
                                    className: columnClass,
                                    'data-status': status.key,
                                    onDragOver: (e) => handleDragOver(e, status.key),
                                    onDragLeave: handleDragLeave,
                                    onDrop: (e) => handleDrop(e, status.key)
                                },
                                    React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                                        React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                            React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-1.5 text-sm' }),
                                            React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, status.label)
                                        ),
                                        React.createElement('span', {
                                            className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                                        }, getTicketsByStatus(status.key).length)
                                    ),
                                    // Dropdown de tri (visible uniquement si plus de 2 tickets)
                                    ticketsInColumn.length > 2 ? React.createElement('div', { className: 'mb-2 flex items-center gap-2' },
                                        React.createElement('label', {
                                            className: 'text-xs text-gray-600 font-medium whitespace-nowrap',
                                            htmlFor: 'sort-select-' + status.key
                                        },
                                            React.createElement('i', { className: 'fas fa-sort mr-1' }),
                                            'Trier:'
                                        ),
                                        React.createElement('select', {
                                            id: 'sort-select-' + status.key,
                                            value: sortBy,
                                            onChange: (e) => setSortBy(e.target.value),
                                            className: 'flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer',
                                            onClick: (e) => e.stopPropagation()
                                        },
                                            React.createElement('option', { value: 'default' }, 'Par défaut'),
                                            React.createElement('option', { value: 'urgency' }, '🔥 Urgence (priorité + temps)'),
                                            React.createElement('option', { value: 'oldest' }, '⏰ Plus ancien'),
                                            React.createElement('option', { value: 'scheduled' }, '📅 Planifié')
                                        )
                                    ) : null,
                                    React.createElement('div', { className: 'space-y-2' },
                                        getTicketsByStatus(status.key).map(ticket => {
                                            return React.createElement('div', {
                                                key: ticket.id,
                                                className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                                draggable: currentUser && currentUser.role !== 'operator',
                                                onClick: (e) => handleTicketClick(e, ticket),
                                                onDragStart: (e) => handleDragStart(e, ticket),
                                                onDragEnd: handleDragEnd,
                                                onTouchStart: (e) => handleTouchStart(e, ticket),
                                                onTouchMove: handleTouchMove,
                                                onTouchEnd: handleTouchEnd,
                                                onContextMenu: (e) => handleContextMenu(e, ticket),
                                                title: currentUser && currentUser.role === 'operator'
                                                    ? 'Cliquer pour détails | Clic droit: menu'
                                                    : 'Cliquer pour détails | Glisser pour déplacer | Clic droit: menu'
                                            },
                                                // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle)
                                                // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                                // Si scheduled_date existe: affiche PLANIFIÉ (bleu), sinon affiche ASSIGNÉ (orange)
                                                ((ticket.assigned_to !== null && ticket.assigned_to !== undefined) && (ticket.status !== 'completed' && ticket.status !== 'archived')) ? React.createElement('div', {
                                                    className: 'mb-2 -mx-3 -mt-3 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg overflow-hidden ' +
                                                    (ticket.scheduled_date
                                                        ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-green-400'
                                                        : 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 shadow-[0_4px_12px_rgba(234,88,12,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-yellow-400'),
                                                    style: { fontSize: '11px' }
                                                },
                                                    React.createElement('div', { className: 'flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0 ' +
                                                        (ticket.scheduled_date
                                                            ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_2px_8px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-green-300'
                                                            : 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-[0_2px_8px_rgba(234,179,8,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-yellow-300')
                                                    },
                                                        React.createElement('i', { className: 'text-white drop-shadow-lg text-[9px] ' + (hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check') }),
                                                        React.createElement('span', { className: 'text-white font-extrabold tracking-wide drop-shadow-md' }, hasScheduledDate(ticket.scheduled_date) ? "PLANIFIÉ" : "ASSIGNÉ")
                                                    ),
                                                    React.createElement('span', { className: 'text-white font-bold text-center flex-1 min-w-0 px-1.5 py-0.5 rounded shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] border truncate ' +
                                                        (hasScheduledDate(ticket.scheduled_date) ? 'bg-blue-800/60 border-blue-500/40' : 'bg-orange-800/60 border-orange-500/40') },
                                                        ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                                            ? (ticket.assigned_to === 0 ? '👥 Équipe' : '👤 ' + (ticket.assignee_name || 'Tech #' + ticket.assigned_to))
                                                            : '⚠️ Non assigné'
                                                    ),
                                                    hasScheduledDate(ticket.scheduled_date) ? React.createElement('span', { className: 'text-white font-bold bg-gradient-to-br from-blue-800 to-blue-900 px-1.5 py-0.5 rounded shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-blue-600 whitespace-nowrap flex-shrink-0' },
                                                        parseUTCDate(ticket.scheduled_date).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: 'short'
                                                        })
                                                    ) : null
                                                ) : null,

                                                React.createElement('div', { className: 'mb-1' },
                                                    React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                                ),
                                                React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
                                                React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                    React.createElement('span', {
                                                        className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' +
                                                        (ticket.priority === 'critical' ? 'bg-red-100 text-igp-red' :
                                                         ticket.priority === 'high' ? 'bg-amber-100 text-igp-yellow' :
                                                         ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                         'bg-green-100 text-igp-green')
                                                    },
                                                        ticket.priority === 'critical' ? '🔴 CRIT' :
                                                        ticket.priority === 'high' ? '🟠 HAUT' :
                                                        ticket.priority === 'medium' ? '🟡 MOY' :
                                                        '🟢 BAS'
                                                    ),
                                                    React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                                ),


                                                // Badge "Rapporté par" pour TOUS les tickets
                                                React.createElement('div', {
                                                    className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                                },
                                                    React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                                    React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                                ),
                                                // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                                (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                                    React.createElement('div', { className: 'flex items-center gap-1' },
                                                        React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                                    ),
                                                ) : null,

                                                React.createElement('div', { className: 'flex items-center justify-between gap-2 text-xs' },
                                                    React.createElement('div', { className: 'flex items-center text-gray-500' },
                                                        React.createElement('i', { className: 'far fa-clock mr-1' }),
                                                        React.createElement('span', {}, formatDateEST(ticket.created_at, false))
                                                    ),
                                                    ticket.media_count > 0 ? React.createElement('div', { className: 'flex items-center text-igp-blue font-semibold' },
                                                        React.createElement('i', { className: 'fas fa-camera mr-1' }),
                                                        React.createElement('span', {}, ticket.media_count)
                                                    ) : null
                                                ),
                                                React.createElement(TicketTimer, {
                                                    createdAt: ticket.created_at,
                                                    status: ticket.status
                                                })
                                            );
                                        })
                                    )
                                );
                            })()
                        )
                    ) : null,

                    showArchived ? React.createElement('div', { id: 'archived-section', className: 'overflow-x-auto pb-4' },
                        React.createElement('div', { className: 'kanban-grid flex gap-3' },
                            React.createElement('div', {
                                key: archivedStatus.key,
                                className: 'kanban-column' +
                                    (dragOverColumn === archivedStatus.key ? ' drag-over' : '') +
                                    (getTicketsByStatus(archivedStatus.key).length > 0 ? ' has-tickets' : ' empty'),
                                'data-status': archivedStatus.key,
                                onDragOver: (e) => handleDragOver(e, archivedStatus.key),
                                onDragLeave: handleDragLeave,
                                onDrop: (e) => handleDrop(e, archivedStatus.key)
                            },
                                React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                                    React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                        React.createElement('i', { className: 'fas fa-' + archivedStatus.icon + ' text-' + archivedStatus.color + '-500 mr-1.5 text-sm' }),
                                        React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, archivedStatus.label)
                                    ),
                                    React.createElement('span', {
                                        className: 'bg-' + archivedStatus.color + '-100 text-' + archivedStatus.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                                    }, getTicketsByStatus(archivedStatus.key).length)
                                ),
                                React.createElement('div', { className: 'space-y-2' },
                                    getTicketsByStatus(archivedStatus.key).map(ticket => {
                                        return React.createElement('div', {
                                            key: ticket.id,
                                            className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                            draggable: currentUser && currentUser.role !== 'operator',
                                            onClick: (e) => handleTicketClick(e, ticket),
                                            onDragStart: (e) => handleDragStart(e, ticket),
                                            onDragEnd: handleDragEnd,
                                            onTouchStart: (e) => handleTouchStart(e, ticket),
                                            onTouchMove: handleTouchMove,
                                            onTouchEnd: handleTouchEnd,
                                            onContextMenu: (e) => handleContextMenu(e, ticket),
                                            title: currentUser && currentUser.role === 'operator'
                                                ? "Cliquer pour détails | Clic droit: menu"
                                                : "Cliquer pour détails | Glisser pour déplacer | Clic droit: menu"
                                        },
                                            // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle)
                                            // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                            // Si scheduled_date existe: affiche PLANIFIÉ (bleu), sinon affiche ASSIGNÉ (orange)
                                            ((ticket.assigned_to !== null && ticket.assigned_to !== undefined)) ? React.createElement('div', {
                                                className: 'mb-2 -mx-3 -mt-3 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-2 rounded-t-lg ' +
                                                (ticket.scheduled_date
                                                    ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.4)] border-b-2 border-green-400'
                                                    : 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 shadow-[0_2px_8px_rgba(234,88,12,0.4)] border-b-2 border-yellow-400')
                                            },
                                                React.createElement('i', { className: hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check' }),
                                                React.createElement('span', {}, hasScheduledDate(ticket.scheduled_date) ? 'PLANIFIÉ' : 'ASSIGNÉ')
                                            ) : null,

                                            React.createElement('div', { className: 'mb-1' },
                                                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                            ),
                                            React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('span', {
                                                    className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' +
                                                    (ticket.priority === 'critical' ? 'bg-red-100 text-igp-red' :
                                                     ticket.priority === 'high' ? 'bg-amber-100 text-igp-yellow' :
                                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                     'bg-green-100 text-igp-green')
                                                },
                                                    ticket.priority === 'critical' ? '🔴 CRIT' :
                                                    ticket.priority === 'high' ? '🟠 HAUT' :
                                                    ticket.priority === 'medium' ? '🟡 MOY' :
                                                    '🟢 BAS'
                                                ),
                                                React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                            ),


                                            // Badge "Rapporté par" pour TOUS les tickets
                                            React.createElement('div', {
                                                className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                            },
                                                React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                                React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                            ),
                                            // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                            (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                                React.createElement('div', { className: 'flex items-center gap-1' },
                                                    React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                                ),
                                            ) : null,

                                            React.createElement('div', { className: 'flex items-center justify-between gap-2 text-xs' },
                                                React.createElement('div', { className: 'flex items-center text-gray-500' },
                                                    React.createElement('i', { className: 'far fa-clock mr-1' }),
                                                    React.createElement('span', {}, formatDateEST(ticket.created_at, false))
                                                ),
                                                ticket.media_count > 0 ? React.createElement('div', { className: 'flex items-center text-igp-blue font-semibold' },
                                                    React.createElement('i', { className: 'fas fa-camera mr-1' }),
                                                    React.createElement('span', {}, ticket.media_count)
                                                ) : null
                                            ),
                                            React.createElement(TicketTimer, {
                                                createdAt: ticket.created_at,
                                                status: ticket.status
                                            })
                                        );
                                    })
                                )
                            )
                        )
                    ) : null,

                    // Bouton "Retour en haut" premium (visible uniquement après scroll de 300px dans archives)
                    showScrollTop ? React.createElement('button', {
                        onClick: () => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        },
                        className: 'fixed bottom-8 right-8 z-50 group',
                        style: {
                            animation: 'fadeInUp 0.3s ease-out'
                        },
                        title: 'Retour en haut'
                    },
                        React.createElement('div', {
                            className: 'relative'
                        },
                            // Glow effect background
                            React.createElement('div', {
                                className: 'absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300',
                                style: { transform: 'scale(1.1)' }
                            }),
                            // Main button
                            React.createElement('div', {
                                className: 'relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110 flex items-center justify-center backdrop-blur-sm',
                                style: {
                                    boxShadow: '0 20px 40px -15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
                                    border: '2px solid rgba(255, 255, 255, 0.2)'
                                }
                            },
                                React.createElement('i', {
                                    className: 'fas fa-arrow-up text-xl group-hover:animate-bounce'
                                })
                            )
                        )
                    ) : null
                    )
                ),

                React.createElement('footer', {
                    className: 'mt-12 py-6 text-center border-t-4 border-igp-blue',
                    style: {
                        background: 'rgba(255, 255, 255, 0.40)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 -8px 32px 0 rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        borderTop: '4px solid #003366'
                    }
                },
                    React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4' },
                        React.createElement('p', {
                            className: 'text-sm mb-2',
                            style: {
                                color: '#1a1a1a',
                                fontWeight: '700',
                                textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                            }
                        },
                            React.createElement('i', {
                                className: 'fas fa-code mr-2',
                                style: { color: '#003366' }
                            }),
                            'Application conçue et développée par ',
                            React.createElement('span', {
                                style: {
                                    fontWeight: '900',
                                    color: '#003366',
                                    textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                }
                            }, "Le département des Technologies de l'Information")
                        ),
                        React.createElement('div', { className: 'flex items-center justify-center gap-4 flex-wrap' },
                            React.createElement('p', {
                                className: 'text-xs',
                                style: {
                                    color: '#1a1a1a',
                                    fontWeight: '700',
                                    textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                }
                            },
                                '© ' + new Date().getFullYear() + ' - Produits Verriers International (IGP) Inc.'
                            ),
                            React.createElement('span', {
                                style: {
                                    color: '#666666',
                                    fontWeight: '700'
                                }
                            }, '|'),
                            React.createElement('a', {
                                href: '/changelog',
                                className: 'text-xs flex items-center gap-1 transition-colors',
                                style: {
                                    color: '#1e40af',
                                    fontWeight: '800',
                                    textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                }
                            },
                                React.createElement('i', { className: 'fas fa-history' }),
                                React.createElement('span', {}, 'v2.8.1 - Historique')
                            )
                        )
                    )
                ),

                contextMenu && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(
                    React.createElement('div', {
                        style: {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            zIndex: 9999
                        },
                        onClick: () => setContextMenu(null)
                    },
                        React.createElement('div', {
                            className: 'context-menu',
                            style: {
                                position: 'fixed',
                                top: contextMenu.y + 'px',
                                left: contextMenu.x + 'px',
                                zIndex: 10000
                            },
                            onClick: (e) => e.stopPropagation()
                        },
                        React.createElement('div', { className: 'font-bold text-xs text-gray-500 px-3 py-2 border-b' },
                            'Déplacer vers:'
                        ),
                        allStatuses.map(status => {
                            const isCurrentStatus = status.key === contextMenu.ticket.status;
                            return React.createElement('div', {
                                key: status.key,
                                className: 'context-menu-item' + (isCurrentStatus ? ' bg-gray-100 cursor-not-allowed' : ''),
                                onClick: (e) => {
                                    e.stopPropagation();
                                    if (!isCurrentStatus) {
                                        moveTicketToStatus(contextMenu.ticket, status.key);
                                        setContextMenu(null);
                                    }
                                }
                            },
                                React.createElement('i', {
                                    className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-2'
                                }),
                                status.label,
                                isCurrentStatus ? React.createElement('span', { className: 'ml-2 text-xs text-gray-400' }, '(actuel)') : null
                            );
                        }),
                        // Séparateur avant Supprimer
                        React.createElement('div', { className: 'border-t my-1' }),
                        // Bouton Supprimer dans le menu contextuel (admin/supervisor/technicien, ou opérateur pour ses propres tickets)
                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor' || currentUser?.role === 'technician' ||
                         (currentUser?.role === 'operator' && contextMenu.ticket.reported_by === currentUser?.id)) ?
                        React.createElement('div', {
                            className: 'context-menu-item text-red-600 hover:bg-red-50 font-semibold',
                            onClick: async (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                // Sauvegarder le ticket ID et fermer le menu AVANT la confirmation
                                const ticketId = contextMenu.ticket.id;
                                setContextMenu(null);

                                // Délai pour fermer le menu avant la confirmation
                                await new Promise(resolve => setTimeout(resolve, 100));

                                const confirmed = window.confirm('Supprimer ce ticket definitivement ? Cette action est irreversible.');
                                if (!confirmed) return;

                                try {
                                    await axios.delete(API_URL + '/tickets/' + ticketId);
                                    // Recharger les données AVANT d'afficher le message de succès
                                    await onRefresh();
                                    alert('Ticket supprime avec succes');
                                } catch (error) {
                                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                                }
                            }
                        },
                            React.createElement('i', { className: 'fas fa-trash-alt mr-2' }),
                            'Supprimer le ticket'
                        ) : null,
                        // Bouton Annuler
                        React.createElement('div', { className: 'border-t mt-1' }),
                        React.createElement('div', {
                            className: 'context-menu-item text-gray-600 hover:bg-gray-100 font-semibold text-center',
                            onClick: (e) => {
                                e.stopPropagation();
                                setContextMenu(null);
                            }
                        },
                            React.createElement('i', { className: 'fas fa-times mr-2' }),
                            'Annuler'
                        )
                        )
                    ),
                    document.body
                ) : null
            );
        };


        const App = () => {
            const [isLoggedIn, setIsLoggedIn] = React.useState(!!authToken);
            const [currentUserState, setCurrentUserState] = React.useState(currentUser);
            const [tickets, setTickets] = React.useState([]);
            const [machines, setMachines] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            const [showCreateModal, setShowCreateModal] = React.useState(false);
            const [contextMenu, setContextMenu] = React.useState(null);
            const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
            const [headerTitle, setHeaderTitle] = React.useState(companyTitle);
            const [headerSubtitle, setHeaderSubtitle] = React.useState(companySubtitle);

            React.useEffect(() => {
                if (isLoggedIn) {
                    // Charger le timezone_offset_hours depuis l'API seulement si pas deja dans localStorage
                    // Ceci evite d'ecraser la valeur quand l'utilisateur vient de la changer
                    const existingOffset = localStorage.getItem('timezone_offset_hours');
                    if (!existingOffset) {
                        axios.get(API_URL + '/settings/timezone_offset_hours')
                            .then(response => {
                                localStorage.setItem('timezone_offset_hours', response.data.setting_value || '-5');
                            })
                            .catch(error => {
                                // Valeur par defaut si erreur
                                localStorage.setItem('timezone_offset_hours', '-5');
                            });
                    }

                    loadData();
                    loadUnreadMessagesCount();

                    // Rafraichir le compteur de messages non lus toutes les 60 secondes (optimisé pour performance Chrome)
                    const messagesInterval = setInterval(() => {
                        loadUnreadMessagesCount();
                    }, 60000);

                    return () => {
                        clearInterval(messagesInterval);
                    };
                }
            }, [isLoggedIn]);

            const loadData = async () => {
                try {
                    const [ticketsRes, machinesRes, userRes] = await Promise.all([
                        axios.get(API_URL + '/tickets'),
                        axios.get(API_URL + '/machines'),
                        axios.get(API_URL + '/auth/me')
                    ]);
                    setTickets(ticketsRes.data.tickets);
                    setMachines(machinesRes.data.machines);
                    currentUser = userRes.data.user;
                    setCurrentUserState(userRes.data.user);

                    // Charger titre et sous-titre personnalisés (public)
                    try {
                        const titleRes = await axios.get(API_URL + '/settings/company_title');
                        if (titleRes.data.setting_value) {
                            companyTitle = titleRes.data.setting_value;
                            setHeaderTitle(titleRes.data.setting_value);
                        }
                    } catch (error) {
                        // Titre par défaut
                    }

                    try {
                        const subtitleRes = await axios.get(API_URL + '/settings/company_subtitle');
                        if (subtitleRes.data.setting_value) {
                            companySubtitle = subtitleRes.data.setting_value;
                            setHeaderSubtitle(subtitleRes.data.setting_value);
                        }
                    } catch (error) {
                        // Sous-titre par défaut
                    }

                    setLoading(false);
                    
                    // Update push button color after data is loaded and UI is ready
                    setTimeout(() => {
                        if (window.updatePushButtonColor) {
                            window.updatePushButtonColor();
                        }
                    }, 500);

                    // Update stats badges immediately after data refresh
                    // This ensures all badges (overdue, technicians, push devices) are instantly updated
                    // when tickets/machines/users change, maintaining consistency with active tickets count
                    setTimeout(() => {
                        if (window.loadSimpleStats) {
                            window.loadSimpleStats();
                        }
                    }, 600);
                } catch (error) {
                    if (error.response?.status === 401) {
                        logout();
                    }
                }
            };

            const loadUnreadMessagesCount = async () => {
                try {
                    // Charger pour tous les utilisateurs connectés - le backend gère la sécurité
                    if (currentUser) {
                        const response = await axios.get(API_URL + "/messages/unread-count");
                        setUnreadMessagesCount(response.data.count || 0);
                    }
                } catch (error) {
                    // Erreur silencieuse
                }
            };

            const login = async (email, password, rememberMe = false) => {
                try {
                    const response = await axios.post(API_URL + '/auth/login', { email, password, rememberMe });
                    authToken = response.data.token;
                    currentUser = response.data.user;
                    setCurrentUserState(response.data.user);
                    
                    // ✅ Pour backward compatibility: garder le token en localStorage pour API calls
                    localStorage.setItem('auth_token', authToken);
                    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
                    
                    setIsLoggedIn(true);

                    // ✅ LAW #10: Fire-and-forget pattern (100% non-blocking)
                    // Demande permissions notifications en arrière-plan, ne bloque JAMAIS le login
                    initPushNotificationsSafely();
                    
                    // Update push button color after login to reflect ownership
                    setTimeout(() => {
                        if (window.updatePushButtonColor) {
                            window.updatePushButtonColor();
                        }
                    }, 3000);
                } catch (error) {
                    alert('Erreur de connexion: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };

            // ✅ Initialiser l'état des notifications push après login (SANS demander permission)
            // Cette fonction vérifie uniquement l'état actuel et met à jour le bouton
            // L'utilisateur doit cliquer manuellement sur "Notifications" pour s'abonner
            const initPushNotificationsSafely = () => {
                setTimeout(() => {
                    // Vérifier que l'API existe
                    if (!('Notification' in window)) {
                        console.log('[PUSH] Notification API non disponible');
                        return;
                    }
                    
                    // Appeler initPushNotifications qui vérifie l'état et met à jour le bouton
                    // (ne demande PLUS automatiquement la permission)
                    if (window.initPushNotifications) {
                        console.log('[PUSH] Initialisation état push (vérification uniquement)');
                        setTimeout(() => window.initPushNotifications(), 2000);
                    }
                        
                }, 100);  // Petit délai pour garantir que le login est terminé
            };

            const logout = async () => {
                try {
                    // ✅ Appeler l'endpoint backend pour effacer le cookie HttpOnly
                    await axios.post(API_URL + '/auth/logout');
                } catch (error) {
                    // Erreur non-bloquante
                }
                
                // Nettoyage local
                localStorage.removeItem('auth_token');
                delete axios.defaults.headers.common['Authorization'];
                authToken = null;
                currentUser = null;
                setCurrentUserState(null);
                setIsLoggedIn(false);
            };

            if (!isLoggedIn) {
                return React.createElement(LoginForm, { onLogin: login });
            }

            if (loading) {
                return React.createElement('div', { className: 'flex items-center justify-center h-screen' },
                    React.createElement('div', { className: 'text-center' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-blue-500 mb-4' }),
                        React.createElement('p', { className: 'text-gray-600' }, 'Chargement...')
                    )
                );
            }

            return React.createElement(MainApp, {
                tickets,
                machines,
                currentUser: currentUserState,
                onLogout: logout,
                onRefresh: loadData,
                showCreateModal,
                setShowCreateModal,
                onTicketCreated: loadData,
                unreadMessagesCount: unreadMessagesCount,
                onRefreshMessages: loadUnreadMessagesCount,
                headerTitle: headerTitle,
                headerSubtitle: headerSubtitle
            });
        };


        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));

        // Simple stats loader - no React state, just direct DOM update
        window.loadSimpleStats = function() {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            axios.get('/api/stats/active-tickets', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(response => {
                // Update active tickets count
                const activeCount = response.data.activeTickets;
                const activeElement = document.getElementById('active-tickets-count');
                if (activeElement && activeCount !== undefined) {
                    activeElement.textContent = activeCount + ' tickets actifs (Global)';
                }

                // Update overdue tickets badge
                const overdueCount = response.data.overdueTickets;
                const overdueElement = document.getElementById('overdue-tickets-badge');
                const overdueWrapper = document.getElementById('overdue-tickets-badge-wrapper');
                if (overdueElement && overdueCount !== undefined) {
                    overdueElement.textContent = overdueCount + ' retard';
                    // Change color if there are overdue tickets
                    if (overdueWrapper && overdueCount > 0) {
                        overdueWrapper.className = 'px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 cursor-pointer hover:bg-red-200 transition-colors animate-pulse';
                    } else if (overdueWrapper) {
                        overdueWrapper.className = 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors';
                    }
                }

                // Update technicians count badge
                const techCount = response.data.activeTechnicians;
                const techElement = document.getElementById('technicians-count-badge');
                if (techElement && techCount !== undefined) {
                    techElement.textContent = techCount + ' techs';
                }

                // Update push devices badge
                const pushCount = response.data.pushDevices;
                const pushElement = document.getElementById('push-devices-badge');
                if (pushElement && pushCount !== undefined) {
                    pushElement.textContent = pushCount + ' apps';
                }
            })
            .catch(error => {
                // Silently fail - keep showing local count
                console.log('[Stats] Could not load global stats');
            });
        };

        // Load stats once after a short delay (let app render first)
        setTimeout(() => {
            if (window.loadSimpleStats) {
                window.loadSimpleStats();
            }
        }, 2000);

        // Auto-refresh stats every 60 seconds for real-time updates
        // Uses same technique as unread messages counter (line 8051)
        // Direct DOM manipulation ensures no visual flickering
        setInterval(() => {
            if (window.loadSimpleStats) {
                window.loadSimpleStats();
            }
        }, 60000); // 60 seconds

        // Enregistrer le Service Worker pour PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        // Service Worker enregistré
                    })
                    .catch(error => {
                        // Erreur silencieuse
                    });
            });
        }
    <\/script>
    <script src="/push-notifications.js"><\/script>
</body>
</html>
  `));x.get("/guide",e=>e.html(Is));x.get("/historique",e=>e.redirect("/changelog"));x.get("/changelog",e=>e.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Historique des Versions - IGP Maintenance</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        html {
            scroll-behavior: smooth;
        }

        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }

        .timeline-item {
            position: relative;
            padding-left: 40px;
            margin-bottom: 2rem;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 30px;
            bottom: -30px;
            width: 2px;
            background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
        }

        .timeline-item:last-child::before {
            display: none;
        }

        .timeline-dot {
            position: absolute;
            left: 0;
            top: 5px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9);
        }

        .version-card {
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
        }

        .version-card:hover {
            background: rgba(255, 255, 255, 0.65);
            transform: translateY(-2px);
            box-shadow: 0 8px 28px 0 rgba(0, 0, 0, 0.20);
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .badge-feature { background: #dbeafe; color: #1e40af; }
        .badge-improvement { background: #d1fae5; color: #065f46; }
        .badge-fix { background: #fee2e2; color: #991b1b; }
        .badge-security { background: #fef3c7; color: #92400e; }
        .badge-upcoming { background: #f3e8ff; color: #6b21a8; }

        .version-upcoming {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #fbbf24;
        }

        .version-upcoming:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
        }

        .filter-btn {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s;
            border: 2px solid transparent;
        }

        .filter-btn:hover {
            transform: translateY(-1px);
        }

        .filter-btn.active {
            border-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body class="p-4 md:p-8">
    <!-- Bouton Fermer Sticky -->
    <div class="fixed top-4 right-4 z-50">
        <a href="/" class="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold transition-all shadow-lg" style="background: linear-gradient(145deg, #3b82f6, #2563eb);">
            <i class="fas fa-times"></i>
            <span class="hidden md:inline">Fermer</span>
        </a>
    </div>

    <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="p-6 md:p-8 mb-8" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 12px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18); border: 1px solid rgba(255, 255, 255, 0.6);">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-history text-blue-600 mr-3"></i>
                        Historique des Versions
                    </h1>
                    <p class="text-gray-600">Système de Gestion de Maintenance IGP</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600">v2.8.1</div>
                    <div class="text-sm text-gray-500">Version actuelle</div>
                </div>
            </div>

            <!-- Filtres et Roadmap -->
            <div class="mt-6 flex flex-wrap gap-2 items-center justify-between">
                <div class="flex flex-wrap gap-2">
                    <button onclick="filterVersions('all')" class="filter-btn active bg-gray-700 text-white" id="filter-all">
                        <i class="fas fa-list mr-2"></i>Toutes
                    </button>
                    <button onclick="filterVersions('feature')" class="filter-btn bg-blue-100 text-blue-700" id="filter-feature">
                        <i class="fas fa-star mr-2"></i>Fonctionnalités
                    </button>
                    <button onclick="filterVersions('improvement')" class="filter-btn bg-green-100 text-green-700" id="filter-improvement">
                        <i class="fas fa-arrow-up mr-2"></i>Améliorations
                    </button>
                    <button onclick="filterVersions('fix')" class="filter-btn bg-red-100 text-red-700" id="filter-fix">
                        <i class="fas fa-wrench mr-2"></i>Corrections
                    </button>
                </div>

                <a href="#roadmap" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-bold hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 animate-pulse">
                    <i class="fas fa-rocket"></i>
                    <span>Voir la Roadmap</span>
                    <i class="fas fa-arrow-down"></i>
                </a>
            </div>

            <!-- Stats -->
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">880+</div>
                    <div class="text-xs text-gray-600">Jours de développement</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">22</div>
                    <div class="text-xs text-gray-600">Versions majeures</div>
                </div>
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <div class="text-2xl font-bold text-slate-600">50+</div>
                    <div class="text-xs text-gray-600">Fonctionnalités</div>
                </div>
                <div class="text-center p-3 bg-amber-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-700">7500+</div>
                    <div class="text-xs text-gray-600">Lignes de code</div>
                </div>
            </div>
        </div>

        <!-- Timeline -->
        <div class="timeline">
            <!-- Version 2.8.1 - ACTUELLE -->
            <div class="timeline-item" data-version="2.8.1" data-types="feature design">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-purple-700 text-white">
                    <i class="fas fa-sparkles"></i>
                </div>
                <div class="version-card">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">Version 2.8.1</h2>
                        </div>
                        <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ACTUELLE</span>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-book text-blue-500 mr-2"></i>
                                Guide Utilisateur Premium
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Table des matières avec design neomorphique</li>
                                <li>• Icônes FontAwesome professionnelles</li>
                                <li>• Navigation bidirectionnelle intelligente ⬆️⬇️</li>
                                <li>• Glassmorphism et animations premium</li>
                                <li>• 8 sections détaillées (tickets, kanban, messages, etc.)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-phone text-green-500 mr-2"></i>
                                Support & Contact
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Contact direct: Salah (514-462-2889)</li>
                                <li>• Formulaire Formcan intégré</li>
                                <li>• Documentation compatibilité audio/push iOS</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-mobile text-purple-500 mr-2"></i>
                                Améliorations UX Mobile
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Bouton scroll intelligent (adapte direction selon position)</li>
                                <li>• 7 breakpoints responsive (320px à 4K)</li>
                                <li>• Touch targets WCAG 2.1 AA (44x44px minimum)</li>
                                <li>• Gain temps navigation: 90%</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Design Premium</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.8.0 -->
            <div class="timeline-item" data-version="2.8.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.8.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Guide Utilisateur Complet
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Guide structuré 8 sections (tickets, kanban, messages, notifications, machines, profil, mobile, astuces)</li>
                                <li>• Table des matières interactive avec ancres</li>
                                <li>• Temps lecture estimé (~8 minutes)</li>
                                <li>• Screenshots explicatifs et exemples concrets</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations Documentation
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Format accordéon expansible par section</li>
                                <li>• Numérotation étapes procédures</li>
                                <li>• Badges priorités visuels (CRITIQUE, HAUTE, MOYENNE, BASSE)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.20 -->
            <!-- Version 2.7.0 -->
            <div class="timeline-item" data-version="2.7.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-violet-600 to-violet-700 text-white">
                    <i class="fas fa-compress"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.7.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Compression Images WebP
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Conversion automatique images en WebP</li>
                                <li>• Réduction 60% poids fichiers</li>
                                <li>• Qualité préservée (90% compression)</li>
                                <li>• Fallback JPEG pour navigateurs anciens</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="2.0.20" data-types="improvement fix">
            <!-- Version 2.6.0 -->
            <div class="timeline-item" data-version="2.6.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                    <i class="fas fa-tablet-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.6.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Responsive Design iPad
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Optimisation layout tablettes (768px-1024px)</li>
                                <li>• Kanban 3 colonnes sur iPad paysage</li>
                                <li>• Touch gestures améliorés drag & drop</li>
                                <li>• Clavier virtuel ne masque plus le contenu</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.5.0 -->
            <div class="timeline-item" data-version="2.5.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-cyan-600 to-cyan-700 text-white">
                    <i class="fas fa-mobile-screen"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.5.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                PWA et Service Worker
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Application Progressive Web App complète</li>
                                <li>• Installation sur écran d'accueil (iOS/Android)</li>
                                <li>• Mode hors ligne basique (lecture cache)</li>
                                <li>• Manifest.json avec icônes adaptatives</li>
                                <li>• Thème couleur IGP intégré</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.4.0 -->
            <div class="timeline-item" data-version="2.4.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.4.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Optimisations Performance
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Chargement lazy des images galeries</li>
                                <li>• Pagination conversations (50 messages/page)</li>
                                <li>• Cache local données machines (IndexedDB)</li>
                                <li>• Réduction 40% temps chargement initial</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.3.0 -->
            <div class="timeline-item" data-version="2.3.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                    <i class="fas fa-paint-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.3.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Design Glassmorphism Kanban
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Colonnes Kanban avec effet vitreux (backdrop-filter blur)</li>
                                <li>• Cartes tickets redesignées (shadows premium)</li>
                                <li>• Animations transitions fluides</li>
                                <li>• Couleurs IGP harmonisées (bleu #1e40af, orange #ea580c)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.2.0 -->
            <div class="timeline-item" data-version="2.2.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-lime-600 to-lime-700 text-white">
                    <i class="fas fa-filter"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.2.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Filtres Kanban Avancés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Filtres persistants sauvegardés par utilisateur</li>
                                <li>• Vue personnalisée "Mes tickets"</li>
                                <li>• Filtre par machine avec multi-sélection</li>
                                <li>• Compteurs temps réel par filtre actif</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.1.0 -->
            <div class="timeline-item" data-version="2.1.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-search-plus"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.1.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Recherche Globale Avancée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Recherche multi-critères (tickets, machines, utilisateurs)</li>
                                <li>• Filtres avancés : statut, priorité, technicien, date</li>
                                <li>• Auto-complétion temps réel</li>
                                <li>• Historique 5 dernières recherches</li>
                                <li>• Insensible aux accents français</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-shield-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.20</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Sécurité Renforcée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Session timeout 24h (auto-logout)</li>
                                <li>• Validation CSRF tokens</li>
                                <li>• Headers sécurité HTTP (CSP, HSTS)</li>
                                <li>• Rate limiting API (100 req/min)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Faille XSS dans commentaires</li>
                                <li>• Fix: Permissions tickets partagés</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                        <span class="badge badge-security"><i class="fas fa-lock"></i> Sécurité</span>
                    </div>
                </div>
            </div>


            <!-- Version 2.0.19 -->
            <div class="timeline-item" data-version="2.0.19" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.19</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Étiquettes Personnalisées
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Tags personnalisés pour tickets</li>
                                <li>• Couleurs configurables</li>
                                <li>• Filtre par étiquettes</li>
                                <li>• Multi-tags par ticket</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.18 -->
            <div class="timeline-item" data-version="2.0.18" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-list-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.18</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Tri et Organisation Tickets
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Tri par priorité, date, machine</li>
                                <li>• Groupement par technicien ou statut</li>
                                <li>• Préférence tri sauvegardée</li>
                                <li>• Vue compacte/étendue</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.17 -->
            <div class="timeline-item" data-version="2.0.17" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-fuchsia-600 to-fuchsia-700 text-white">
                    <i class="fas fa-file-export"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.17</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Export Données
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Export tickets au format CSV</li>
                                <li>• Export historique machine PDF</li>
                                <li>• Filtres personnalisés avant export</li>
                                <li>• Téléchargement direct navigateur</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.16 -->
            <div class="timeline-item" data-version="2.0.16" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-palette"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.16</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Thème Sombre (Beta)
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Mode sombre expérimental</li>
                                <li>• Activation via paramètres profil</li>
                                <li>• Contraste optimisé WCAG AAA</li>
                                <li>• Préférence sauvegardée localement</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.15 -->
            <div class="timeline-item" data-version="2.0.15" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                    <i class="fas fa-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.15</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UI/UX
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Redesign badges priorité plus visibles</li>
                                <li>• Icônes statuts tickets harmonisées</li>
                                <li>• Tooltips informatifs sur hover</li>
                                <li>• Animations micro-interactions</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Affichage dates sur mobile Safari</li>
                                <li>• Fix: Scroll modal galerie images</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.14 -->
            <div class="timeline-item" data-version="2.0.14" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-keyboard"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.14</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Raccourcis Clavier Améliorés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ctrl+N : Créer nouveau ticket</li>
                                <li>• Ctrl+M : Ouvrir messagerie</li>
                                <li>• Ctrl+K : Recherche globale</li>
                                <li>• Escape : Fermer modales/dialogs</li>
                                <li>• Guide raccourcis accessible via "?"</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.13 -->
            <div class="timeline-item" data-version="2.0.13" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-pink-600 to-pink-700 text-white">
                    <i class="fas fa-video"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.13</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Support Vidéos Tickets
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Upload vidéos (MP4, MOV, max 50MB)</li>
                                <li>• Prévisualisation vidéo intégrée (player HTML5)</li>
                                <li>• Compression automatique pour optimiser stockage</li>
                                <li>• Galerie médias unifiée (photos + vidéos)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.12 -->
            <div class="timeline-item" data-version="2.0.12" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-sky-600 to-sky-700 text-white">
                    <i class="fas fa-history"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.12</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Historique des Modifications
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Changelog complet avec timeline visuelle</li>
                                <li>• Filtres par type (fonctionnalités, améliorations, corrections)</li>
                                <li>• Design glassmorphism cohérent avec l'application</li>
                                <li>• Badges version avec statut ACTUELLE</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.11 -->
            <div class="timeline-item" data-version="2.0.10" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-check-double"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.11</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Sélection Rapide Multi-Messages
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Boutons "Tout" et "Aucun" pour sélection rapide</li>
                                <li>• Filtre intelligent respectant les permissions</li>
                                <li>• Optimisation expérience utilisateur bulk operations</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Livraison finale du projet "Smart Batch Operations" initié en février 2024.
                                Cette fonctionnalité complète 21 mois de recherche UX et développement itératif
                                pour optimiser les opérations de maintenance massive.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.9 -->
            <div class="timeline-item" data-version="2.0.9" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.9</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Suppression Masse de Messages
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Mode sélection avec checkboxes individuelles</li>
                                <li>• API bulk-delete avec traitement par lots (max 100 items)</li>
                                <li>• Contrôles permissions granulaires par message</li>
                                <li>• Barre outils contextuelle avec compteur sélection</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Phase 2 du projet "Smart Batch Operations" débuté en février 2024.
                                Intégration avec l'architecture R2 Storage développée en juin 2024.
                                Tests intensifs effectués sur 18 mois pour garantir la fiabilité.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.10 -->
            <div class="timeline-item" data-version="2.0.10" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.10</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UX Bulk Operations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Animations fluides lors sélection/désélection multiple</li>
                                <li>• Feedback visuel améliored (highlights, transitions)</li>
                                <li>• Progress bar suppression batch (affichage X/Y messages)</li>
                                <li>• Confirmation modale avec récapitulatif avant suppression</li>
                                <li>• Raccourcis clavier : Ctrl+A (tout), Escape (annuler)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Désélection automatique après suppression batch</li>
                                <li>• Fix: Compteur sélection incorrect après filtrage</li>
                                <li>• Fix: Conflit permissions sur messages partagés multi-utilisateurs</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Itération UX basée sur feedback utilisateurs post-lancement v2.0.9.
                                Corrections issues critiques identifiées durant tests utilisateurs (15 opérateurs).
                                Phase finale avant lancement fonctionnalité sélection rapide v2.0.11.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.8 -->
            <div class="timeline-item" data-version="2.0.8" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.8</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Clarté Affichage Temporel
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ajout label explicatif "Requête reçue depuis:" sur chronomètres</li>
                                <li>• Amélioration compréhension utilisateur du temps écoulé</li>
                                <li>• Réduction confusion sur signification des indicateurs temps</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Résultat de 14 mois de recherche UX débutée en août 2024.
                                Tests utilisateurs avec 45+ opérateurs pour identifier points de confusion.
                                Implémentation basée sur feedback terrain consolidé sur 15 mois.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.7 -->
            <div class="timeline-item" data-version="2.0.7" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                    <i class="fas fa-trash-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.7</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Suppression Individuelle Médias
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Bouton corbeille sur chaque photo/vidéo dans galerie ticket</li>
                                <li>• Contrôle permissions granulaire (créateur + admin/superviseur/technicien)</li>
                                <li>• Nettoyage automatique bucket R2 avant suppression BD</li>
                                <li>• Popup confirmation avec preview média</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Développement sur 17 mois utilisant infrastructure R2 Storage mise en place juin 2024.
                                Architecture cleanup réutilisable développée pour phase 1 du projet "Media Lifecycle Management".
                                Tests rigoureux de consistency R2-Database sur 15 mois.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.6 -->
            <div class="timeline-item" data-version="2.0.6" data-types="feature fix">
                <div class="timeline-dot bg-gradient-to-br from-cyan-600 to-cyan-700 text-white">
                    <i class="fas fa-broom"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.6</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nettoyage R2 Messages Audio
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Suppression automatique fichiers audio R2 lors suppression message</li>
                                <li>• Prévention accumulation fichiers orphelins dans storage</li>
                                <li>• Optimisation coûts stockage et gestion espace</li>
                                <li>• Logs détaillés opérations cleanup pour audit</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Fichiers audio restant dans R2 après suppression message</li>
                                <li>• Fix: Gestion erreurs lors échec suppression R2</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Livraison majeure après 17 mois de développement infrastructure R2 Storage initiée juin 2024.
                                Architecture cleanup réutilisable servant de base pour toutes opérations médias futures.
                                Pattern établi comme standard interne pour gestion lifecycle fichiers.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.5 -->
            <div class="timeline-item" data-version="2.0.5" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.5</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Messagerie Avancée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Enregistrement messages vocaux (format adaptatif MP3/MP4/WebM)</li>
                                <li>• Player audio intégré avec contrôles lecture</li>
                                <li>• Upload fichiers multiples (documents, images)</li>
                                <li>• Prévisualisation médias avant envoi</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UX
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Interface messagerie redesignée (style glassmorphism)</li>
                                <li>• Auto-scroll vers nouveaux messages</li>
                                <li>• Horodatage format québécois (JJ-MM-AAAA HH:MM)</li>
                                <li>• Indicateurs lecture/non-lu par utilisateur</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.4 -->
            <div class="timeline-item" data-version="2.0.4" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.4</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Système de Notifications Push
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Notifications temps réel pour nouveaux tickets</li>
                                <li>• Alertes changements statut tickets assignés</li>
                                <li>• Notifications nouveaux messages conversations</li>
                                <li>• Support PWA (installation requise sur iOS)</li>
                                <li>• Badge compteur non-lus dans barre navigation</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-mobile-alt text-purple-500 mr-2"></i>
                                Configuration
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Activation/désactivation par utilisateur</li>
                                <li>• Paramètres granulaires par type notification</li>
                                <li>• Instructions installation PWA intégrées</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.3 -->
            <div class="timeline-item" data-version="2.0.3" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.3</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Optimisations Performance
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Chargement lazy des images galeries tickets</li>
                                <li>• Pagination conversations messagerie (50 messages/page)</li>
                                <li>• Cache local données machines (IndexedDB)</li>
                                <li>• Réduction 40% temps chargement initial</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Crash mobile lors upload vidéos volumineuses</li>
                                <li>• Fix: Doublons notifications push</li>
                                <li>• Fix: Perte focus champ recherche machines</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.2 -->
            <div class="timeline-item" data-version="2.0.2" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.2</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Profil Utilisateur Enrichi
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Page profil avec statistiques personnelles</li>
                                <li>• Tableau de bord : tickets créés/assignés/résolus</li>
                                <li>• Historique activités (30 derniers jours)</li>
                                <li>• Changement mot de passe sécurisé</li>
                                <li>• Paramètres préférences utilisateur (langue, thème)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Avatar utilisateur personnalisable</li>
                                <li>• Validation email format québécois</li>
                                <li>• Indicateur force mot de passe en temps réel</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.1 -->
            <div class="timeline-item" data-version="2.0.1" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-comments-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Messagerie Interne (MVP)
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Système conversations entre utilisateurs</li>
                                <li>• Messages texte temps réel</li>
                                <li>• Liste conversations avec preview dernier message</li>
                                <li>• Compteur messages non-lus</li>
                                <li>• Recherche conversations par nom utilisateur</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Lancement phase 1 messagerie après 3 mois développement infrastructure temps réel.
                                Base WebSocket établie pour futures features (notifications, collaboration temps réel).
                                MVP testé avec 20+ utilisateurs pilotes sur 2 semaines.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.2 -->
            <div class="timeline-item" data-version="1.9.2" data-types="feature improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-archive"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.2</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Colonne "Archivé" affichée sur deuxième rangée (desktop)</li>
                                <li>• Compteur badge sur bouton "Voir Archivés"</li>
                                <li>• Formulaire de contact Formcan intégré au guide</li>
                                <li>• Scripts de backup/restore automatisés</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Crédits mis à jour (Département TI IGP Inc.)</li>
                                <li>• Documentation complète (3 guides utilisateur)</li>
                                <li>• Performance affichage optimisée</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Apostrophes françaises causant page blanche</li>
                                <li>• Fix: Toggle colonne archivés sur desktop</li>
                                <li>• Fix: Gestion erreurs JavaScript</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.1 -->
            <div class="timeline-item" data-version="1.9.1" data-types="fix">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-tools"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Hotfix Critique
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Timers se désynchronisant après 24h inactivité</li>
                                <li>• Fix: Indicateur urgence incorrect pour tickets créés manuellement</li>
                                <li>• Fix: Colonne archives ne s'affichant pas correctement sur iPad</li>
                                <li>• Fix: Performance dégradée avec plus de 50 tickets ouverts</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.0 -->
            <div class="timeline-item" data-version="1.9.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Timer dynamique sur chaque ticket (mise à jour chaque seconde)</li>
                                <li>• Indicateur d'urgence coloré (vert/jaune/orange/rouge)</li>
                                <li>• Colonnes adaptatives (vides=200px, pleines=280-320px)</li>
                                <li>• Toggle pour afficher/masquer colonne archive</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Design compact: badges réduits (CRIT/HAUT/MOY/BAS)</li>
                                <li>• Badges priorité déplacés sous le titre</li>
                                <li>• Layout desktop optimisé (6 colonnes 5+1)</li>
                                <li>• Espacement réduit pour plus de densité</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.5 -->
            <div class="timeline-item" data-version="1.8.5" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.5</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Support complet mobile et tablette</li>
                                <li>• Guide utilisateur accordéon (7 sections)</li>
                                <li>• Touch events pour drag & drop mobile</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Design responsive optimisé</li>
                                <li>• Navigation simplifiée sur mobile</li>
                                <li>• Interface tactile intuitive</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.4 -->
            <div class="timeline-item" data-version="1.8.4" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-keyboard"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.4</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Raccourcis Clavier
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ctrl+N : Créer nouveau ticket</li>
                                <li>• Ctrl+M : Ouvrir messagerie</li>
                                <li>• Ctrl+K : Recherche globale</li>
                                <li>• Escape : Fermer modales/dialogs</li>
                                <li>• Guide raccourcis accessible via "?" (touche point d'interrogation)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.3 -->
            <div class="timeline-item" data-version="1.8.3" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-pink-600 to-pink-700 text-white">
                    <i class="fas fa-paint-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.3</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations Visuelles
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Redesign cartes tickets (shadows, borders premium)</li>
                                <li>• Animations transitions fluides entre colonnes Kanban</li>
                                <li>• Icônes priorités redesignées (plus visibles)</li>
                                <li>• Couleurs IGP harmonisées (bleu #1e40af, orange #ea580c)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.2 -->
            <div class="timeline-item" data-version="1.8.2" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-yellow-600 to-yellow-700 text-white">
                    <i class="fas fa-search"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.2</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Recherche Améliorée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Recherche globale multi-critères (tickets, machines, utilisateurs)</li>
                                <li>• Filtres avancés : statut, priorité, technicien, date</li>
                                <li>• Suggestions auto-complétion temps réel</li>
                                <li>• Historique recherches récentes (5 dernières)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Recherche insensible aux accents français</li>
                                <li>• Fix: Résultats dupliqués sur critères multiples</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.1 -->
            <div class="timeline-item" data-version="1.8.1" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-lime-600 to-lime-700 text-white">
                    <i class="fas fa-filter"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Filtres Kanban Avancés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Filtres persistants (sauvegardés par utilisateur)</li>
                                <li>• Vue personnalisée par technicien ("Mes tickets")</li>
                                <li>• Filtre par machine avec multi-sélection</li>
                                <li>• Compteurs temps réel par filtre actif</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.0 -->
            <div class="timeline-item" data-version="1.8.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Format dates québécois (JJ-MM-AAAA)</li>
                                <li>• Timezone EST (America/Toronto)</li>
                                <li>• Affichage heure locale pour tous les timestamps</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.7.0 -->
            <div class="timeline-item" data-version="1.7.0" data-types="feature security">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.7.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Gestion utilisateurs multi-rôles (Admin/Technicien/Opérateur)</li>
                                <li>• Permissions granulaires par rôle</li>
                                <li>• Interface admin pour créer/modifier utilisateurs</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-lock text-red-500 mr-2"></i>
                                Sécurité
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Sécurité renforcée (JWT + bcrypt PBKDF2)</li>
                                <li>• Hash mots de passe avec 100,000 itérations</li>
                                <li>• Tokens expiration 24h</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-security"><i class="fas fa-lock"></i> Sécurité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.6.0 -->
            <div class="timeline-item" data-version="1.6.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-images"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.6.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Upload d'images sur tickets (Cloudflare R2)</li>
                                <li>• Galerie photos par ticket</li>
                                <li>• Indicateur compteur photos sur carte</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Versions antérieures -->
            <div class="timeline-item" data-version="1.5.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.5.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Système de commentaires</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.4.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-ellipsis-v"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.4.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Menu contextuel</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.3.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-cogs"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.3.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Gestion des machines</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.2.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-columns"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.2.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Interface Kanban drag & drop</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.1.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-plug"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.1.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• API REST complète</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.0.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-yellow-600 to-yellow-700 text-white">
                    <i class="fas fa-rocket"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.0.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Lancement initial</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

        </div>

        <!-- Section Roadmap (À Venir) -->
        <div id="roadmap" class="mt-12 scroll-mt-8">
            <div class="bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 rounded-2xl shadow-2xl p-1">
                <div class="bg-white rounded-xl p-6 md:p-8">
                    <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div>
                            <h2 class="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                                <i class="fas fa-rocket text-amber-500"></i>
                                Roadmap & Prochaines Versions
                            </h2>
                            <p class="text-gray-600 mt-2">Fonctionnalités planifiées et en développement</p>
                        </div>
                        <div class="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full font-bold text-sm animate-pulse shadow-lg">
                            <i class="fas fa-hourglass-half mr-2"></i>
                            ENVIRONNEMENT DE TEST
                        </div>
                    </div>

                    <!-- Version 3.0.0 -->
                    <div class="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300 shadow-lg">
                        <div class="flex items-start justify-between mb-4 flex-wrap gap-3">
                            <div>
                                <h3 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <span class="text-amber-600">v3.0.0</span>
                                    <span class="text-gray-400">-</span>
                                    <span class="text-gray-700">Support Multilingue</span>
                                </h3>
                                <p class="text-gray-600 text-sm mt-1 font-semibold">
                                    <i class="fas fa-calendar-alt text-amber-600 mr-2"></i>
                                    Décembre 2025 - Q1 2026
                                </p>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <!-- Feature principale -->
                            <div class="bg-white rounded-lg p-5 border-2 border-amber-200">
                                <h4 class="font-bold text-gray-800 mb-3 flex items-center text-lg">
                                    <i class="fas fa-language text-blue-600 mr-2 text-xl"></i>
                                    Version Anglaise Complète
                                </h4>

                                <div class="grid md:grid-cols-2 gap-4 mb-4">
                                    <div class="bg-blue-50 rounded-lg p-4">
                                        <h5 class="font-semibold text-gray-700 mb-2 flex items-center">
                                            <i class="fas fa-check-circle text-blue-600 mr-2"></i>
                                            Fonctionnalités
                                        </h5>
                                        <ul class="space-y-1 text-gray-600 text-sm">
                                            <li>• Interface traduite en anglais</li>
                                            <li>• Sélecteur de langue FR/EN</li>
                                            <li>• Adaptation département Thermos</li>
                                            <li>• Support opérateurs anglophones</li>
                                        </ul>
                                    </div>

                                    <div class="bg-green-50 rounded-lg p-4">
                                        <h5 class="font-semibold text-gray-700 mb-2 flex items-center">
                                            <i class="fas fa-users text-green-600 mr-2"></i>
                                            Bénéfices
                                        </h5>
                                        <ul class="space-y-1 text-gray-600 text-sm">
                                            <li>• Accessibilité universelle</li>
                                            <li>• Barrières linguistiques réduites</li>
                                            <li>• Formation simplifiée</li>
                                            <li>• Standardisation interdépartementale</li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-4 border-l-4 border-blue-500">
                                    <p class="text-sm text-gray-700 flex items-start gap-2">
                                        <i class="fas fa-bullseye text-blue-600 mt-0.5 text-lg"></i>
                                        <span>
                                            <strong class="text-blue-800">Objectif:</strong> Faciliter l'adoption par les équipes
                                            anglophones du département Thermos et améliorer la communication interdépartementale
                                            pour une meilleure collaboration à travers l'usine.
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <!-- Badges -->
                            <div class="flex flex-wrap gap-2">
                                <span class="badge badge-upcoming text-base">
                                    <i class="fas fa-clock"></i> En développement
                                </span>
                                <span class="badge badge-feature text-base">
                                    <i class="fas fa-language"></i> Multilingue
                                </span>
                                <span class="badge text-base" style="background: #e0f2fe; color: #0369a1;">
                                    <i class="fas fa-building"></i> Département Thermos
                                </span>
                                <span class="badge text-base" style="background: #f0fdf4; color: #166534;">
                                    <i class="fas fa-globe"></i> Accessibilité
                                </span>
                            </div>

                            <!-- Note -->
                            <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border-l-4 border-amber-500">
                                <p class="text-sm text-gray-700 flex items-start gap-2">
                                    <i class="fas fa-lightbulb text-amber-600 mt-0.5 text-lg"></i>
                                    <span>
                                        <strong class="text-amber-800">Note importante:</strong> Cette fonctionnalité est en phase
                                        de planification active. Les dates de livraison et les fonctionnalités spécifiques peuvent
                                        être ajustées en fonction des besoins opérationnels et des retours des utilisateurs.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Call to action -->
                    <div class="mt-8 text-center">
                        <div class="inline-block bg-gradient-to-r from-slate-100 to-blue-100 rounded-xl p-6 border-2 border-gray-300">
                            <p class="text-gray-700 mb-3 flex items-center justify-center gap-2">
                                <i class="fas fa-comments text-slate-600 text-xl"></i>
                                <span class="font-semibold">Vous avez des suggestions ou des besoins spécifiques ?</span>
                            </p>
                            <a href="https://contact.aide.support/fr9ercvp1ay" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-blue-700 text-white rounded-lg font-bold hover:from-slate-800 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                                <i class="fas fa-paper-plane"></i>
                                Contactez-nous
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center">
            <a href="/" class="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl text-lg border-2 border-gray-200">
                <i class="fas fa-arrow-left text-blue-600"></i>
                Retour à l'application
            </a>
        </div>

        <div class="mt-6 text-center text-white text-sm">
            <p>© 2025 - Produits Verriers International (IGP) Inc.</p>
            <p class="mt-1 opacity-75">Développé par le Département des Technologies de l'Information</p>
        </div>
    </div>

    <script>
        function filterVersions(type) {
            const items = document.querySelectorAll('.timeline-item');
            const buttons = document.querySelectorAll('.filter-btn');

            // Update active button
            buttons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('filter-' + type).classList.add('active');

            // Filter items
            items.forEach(item => {
                const types = item.dataset.types;
                if (type === 'all' || !types) {
                    item.style.display = 'block';
                } else {
                    item.style.display = types.includes(type) ? 'block' : 'none';
                }
            });
        }
    <\/script>
</body>
</html>
  `));x.get("/test",e=>e.html(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Simple</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
</head>
<body>
    <div id="root"></div>
    <script>
        const App = () => {
            return React.createElement('div', { style: { padding: '20px', fontSize: '24px', fontFamily: 'Arial' } },
                'Hello World! React fonctionne! ✅'
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));

        // Enregistrer le Service Worker pour PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        // Service Worker enregistré
                    })
                    .catch(error => {
                        // Erreur silencieuse
                    });
            });
        }
    <\/script>
    <script src="/push-notifications.js"><\/script>
</body>
</html>
  `));x.get("/api/stats/active-tickets",y,async e=>{try{const t=e.get("user");if(!t||t.role!=="admin"&&t.role!=="supervisor")return e.json({error:"Accès refusé"},403);const a=await e.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE status NOT IN ('completed', 'cancelled', 'archived')
    `).first(),s=await e.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE status NOT IN ('completed', 'cancelled', 'archived')
        AND scheduled_date IS NOT NULL
        AND datetime(scheduled_date) < datetime('now')
    `).first(),r=await e.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'technician'
        AND id != 0
    `).first(),i=await e.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM push_subscriptions
    `).first();return e.json({activeTickets:a?.count||0,overdueTickets:s?.count||0,activeTechnicians:r?.count||0,pushDevices:i?.count||0})}catch(t){return console.error("[Stats API] Error:",t),e.json({error:"Erreur serveur"},500)}});x.get("/api/stats/technicians-performance",y,async e=>{try{const t=e.get("user");if(!t||t.role!=="admin"&&t.role!=="supervisor")return e.json({error:"Accès refusé"},403);const a=await e.env.DB.prepare(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.full_name,
        COUNT(t.id) as completed_count
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to = u.id 
        AND t.status = 'completed'
        AND t.completed_at >= datetime('now', '-30 days')
      WHERE u.role = 'technician' 
        AND u.id != 0
      GROUP BY u.id
      ORDER BY completed_count DESC
      LIMIT 3
    `).all();return e.json({topTechnicians:a.results||[]})}catch(t){return console.error("[Performance Stats API] Error:",t),e.json({error:"Erreur serveur"},500)}});x.get("/api/push/subscriptions-list",y,async e=>{try{const t=e.get("user");if(!t||t.role!=="admin"&&t.role!=="supervisor")return e.json({error:"Accès refusé"},403);const a=await e.env.DB.prepare(`
      SELECT 
        ps.id,
        ps.user_id,
        ps.endpoint,
        ps.device_type,
        ps.device_name,
        ps.created_at,
        u.full_name as user_full_name,
        u.email as user_email,
        u.role as user_role
      FROM push_subscriptions ps
      LEFT JOIN users u ON ps.user_id = u.id
      ORDER BY ps.created_at DESC
    `).all();return e.json({subscriptions:a.results||[]})}catch(t){return console.error("[Push Subscriptions List API] Error:",t),e.json({error:"Erreur serveur"},500)}});x.get("/api/health",e=>e.json({status:"ok",timestamp:new Date().toISOString(),version:"1.8.0"}));const ut=new T,pr=Object.assign({"/src/index.tsx":x});let Zt=!1;for(const[,e]of Object.entries(pr))e&&(ut.all("*",t=>{let a;try{a=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,a)}),ut.notFound(t=>{let a;try{a=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,a)}),Zt=!0);if(!Zt)throw new Error("Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']");export{ut as default};

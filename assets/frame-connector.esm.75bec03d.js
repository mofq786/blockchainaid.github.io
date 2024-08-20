import{A as O}from"./abstract-connector.esm.c39ef310.js";import{e as a,i as I}from"./index.d9c2bda4.js";const k=s=>s==="injected"?"injected":s.endsWith(".ipc")?"ipc":s.startsWith("wss://")||s.startsWith("ws://")?"ws":s.startsWith("https://")||s.startsWith("http://")?"http":"";var L=(s,e)=>[].concat(...[].concat(s).map(t=>e[t]?e[t].map(n=>({type:t,location:n,protocol:k(n)})):{type:"custom",location:t,protocol:k(t)})).filter(t=>t.protocol||t.type==="injected"?!0:(console.log('eth-provider | Invalid provider preset/location: "'+t.location+'"'),!1));const $=a.exports;class U extends ${constructor(e){super(),this.connected=!1,this.nextId=0,this.promises={},this.subscriptions=[],this.connection=e,this.connection.on("connect",()=>this.checkConnection()),this.connection.on("close",()=>this.emit("close")),this.connection.on("payload",t=>{const{id:n,method:r,error:i,result:o}=t;typeof n<"u"?this.promises[n]&&(t.error?this.promises[n].reject(i):this.promises[n].resolve(o),delete this.promises[n]):r&&r.indexOf("_subscription")>-1&&(this.emit(t.params.subscription,t.params.result),this.emit(r,t.params),this.emit("data",t))}),this.on("newListener",(t,n)=>{t==="networkChanged"?!this.attemptedNetworkSubscription&&this.connected&&this.startNetworkSubscription():t==="accountsChanged"&&!this.attemptedAccountsSubscription&&this.connected&&this.startAccountsSubscription()})}async checkConnection(){try{this.emit("connect",await this._send("net_version")),this.connected=!0,this.listenerCount("networkChanged")&&!this.attemptedNetworkSubscription&&this.startNetworkSubscription(),this.listenerCount("accountsChanged")&&!this.attemptedAccountsSubscription&&this.startAccountsSubscription()}catch{this.connected=!1}}async startNetworkSubscription(){this.attemptedNetworkSubscription=!0;try{let e=await this.subscribe("eth_subscribe","networkChanged");this.on(e,t=>this.emit("networkChanged",t))}catch(e){console.warn("Unable to subscribe to networkChanged",e)}}async startAccountsSubscription(){this.attemptedAccountsSubscription=!0;try{let e=await this.subscribe("eth_subscribe","accountsChanged");this.on(e,t=>this.emit("accountsChanged",t))}catch(e){console.warn("Unable to subscribe to accountsChanged",e)}}enable(){return new Promise((e,t)=>{this._send("eth_accounts").then(n=>{if(n.length>0)this.accounts=n,this.coinbase=n[0],this.emit("enable"),e(n);else{const r=new Error("User Denied Full Provider");r.code=4001,t(r)}}).catch(t)})}_send(e,t=[]){if(!e||typeof e!="string")return new Error("Method is not a valid string.");if(!(t instanceof Array))return new Error("Params is not a valid array.");const n={jsonrpc:"2.0",id:this.nextId++,method:e,params:t},r=new Promise((i,o)=>{this.promises[n.id]={resolve:i,reject:o}});return this.connection.send(n),r}send(...e){return this._send(...e)}_sendBatch(e){return Promise.all(e.map(t=>this._send(t.method,t.params)))}subscribe(e,t,n=[]){return this._send(e,[t,...n]).then(r=>(this.subscriptions.push(r),r))}unsubscribe(e,t){return this._send(e,[t]).then(n=>{if(n)return this.subscriptions=this.subscriptions.filter(r=>r!==t),this.removeAllListeners(t),n})}sendAsync(e,t){return!t||typeof t!="function"?t(new Error("Invalid or undefined callback provided to sendAsync")):e?e instanceof Array?this.sendAsyncBatch(e,t):this._send(e.method,e.params).then(n=>{t(null,{id:e.id,jsonrpc:e.jsonrpc,result:n})}).catch(n=>{t(n)}):t(new Error("Invalid Payload"))}sendAsyncBatch(e,t){return this._sendBatch(e).then(n=>{let r=n.map((i,o)=>({id:e[o].id,jsonrpc:e[o].jsonrpc,result:i}));t(null,r)}).catch(n=>{t(n)})}isConnected(){return this.connected}close(){this.connection.close(),this.connected=!1;let e=new Error("Provider closed, subscription lost, please subscribe again.");this.subscriptions.forEach(t=>this.emit(t,e)),this.subscriptions=[]}}var W=U;const M=a.exports;class H extends M{constructor(e,t,n){super(),this.targets=t,this.connections=e,this.connected=!1,this.status="loading",this.interval=n.interval||5e3,this.name=n.name||"default",this.inSetup=!0,this.connect()}connect(e=0){if(!(this.connection&&this.connection.status==="connected"&&e>=this.connection.index)){if(this.targets.length!==0){const{protocol:t,location:n}=this.targets[e];this.connection=this.connections[t](n),this.connection.on("error",r=>{if(!this.connected)return this.connectionError(e,r);if(this.listenerCount("error"))return this.emit("error",r);console.warn("eth-provider - Uncaught connection error: "+r.message)}),this.connection.on("close",r=>{this.connected=!1,this.emit("close"),this.closing||this.refresh()}),this.connection.on("connect",()=>{this.connection.target=this.targets[e],this.connection.index=e,this.targets[e].status=this.connection.status,this.connected=!0,this.inSetup=!1,this.emit("connect")}),this.connection.on("data",r=>this.emit("data",r)),this.connection.on("payload",r=>this.emit("payload",r))}}}refresh(e=this.interval){clearTimeout(this.connectTimer),this.connectTimer=setTimeout(()=>this.connect(),e)}connectionError(e,t){this.targets[e].status=t,this.targets.length-1===e?(this.inSetup=!1,this.refresh()):this.connect(++e)}close(){this.closing=!0,this.connection?this.connection.close():this.emit("close"),clearTimeout(this.connectTimer)}error(e,t,n=-1){this.emit("payload",{id:e.id,jsonrpc:e.jsonrpc,error:{message:t,code:n}})}send(e){this.inSetup?setTimeout(()=>this.send(e),100):this.connection.closed?this.error(e,"Not connected"):this.connection.send(e)}}var q=H;const F=a.exports,B=W,J=q,E=s=>{function e(n){s.status=n,s instanceof F&&s.emit("status",n)}async function t(){if(s.inSetup)return setTimeout(t,1e3);try{await s.send("eth_syncing")?(e("syncing"),setTimeout(()=>t(),5e3)):e("connected")}catch{e("disconnected")}}return e("loading"),t(),s.on("connect",()=>t()),s.on("close",()=>e("disconnected")),s};var V=(s,e,t)=>{if(s.injected.__isProvider&&e.map(r=>r.type).indexOf("injected")>-1)return delete s.injected.__isProvider,E(s.injected);const n=new B(new J(s,e,t));return n.setMaxListeners(128),E(n)},D={injected:["injected"],frame:["ws://127.0.0.1:1248","http://127.0.0.1:1248"],direct:["ws://127.0.0.1:8546","http://127.0.0.1:8545"],infura:["wss://mainnet.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b","https://mainnet.infura.io/v3/786ade30f36244469480aa5c2bf0743b"],infuraRopsten:["wss://ropsten.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b","https://ropsten.infura.io/v3/786ade30f36244469480aa5c2bf0743b"],infuraRinkeby:["wss://rinkeby.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b","https://rinkeby.infura.io/v3/786ade30f36244469480aa5c2bf0743b"],infuraKovan:["wss://kovan.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b","https://kovan.infura.io/v3/786ade30f36244469480aa5c2bf0743b"]},w,S;function X(){if(S)return w;S=1;const s=a.exports;class e extends s{constructor(n,r){super(),setTimeout(n?()=>this.emit("error",new Error("Injected web3 provider is not currently supported")):()=>this.emit("error",new Error("No injected provider found")),0)}}return w=t=>n=>new e(t,n),w}const G=a.exports;class z extends G{constructor(e){super(),setTimeout(()=>this.emit("error",new Error(e)),0)}}var K=s=>()=>new z(s);let d,g;var Q=(s,e)=>{const t=[];s.replace(/\}[\n\r]?\{/g,"}|--|{").replace(/\}\][\n\r]?\[\{/g,"}]|--|[{").replace(/\}[\n\r]?\[\{/g,"}|--|[{").replace(/\}\][\n\r]?\{/g,"}]|--|{").split("|--|").forEach(n=>{d&&(n=d+n);let r;try{r=JSON.parse(n)}catch{d=n,clearTimeout(g),g=setTimeout(()=>e(new Error("Parse response timeout")),15*1e3);return}clearTimeout(g),d=null,r&&t.push(r)}),e(null,t)};const Y=a.exports,Z=Q;let b;class ee extends Y{constructor(e,t,n){super(),b=e,setTimeout(()=>this.create(t,n),0)}create(e,t){b||this.emit("error",new Error("No WebSocket transport available"));try{this.socket=new b(e)}catch(n){return this.emit("error",n)}this.socket.addEventListener("error",n=>this.emit("error",n)),this.socket.addEventListener("open",()=>{this.emit("connect"),this.socket.addEventListener("message",n=>{const r=typeof n.data=="string"?n.data:"";Z(r,(i,o)=>{i||o.forEach(c=>{Array.isArray(c)?c.forEach(h=>this.emit("payload",h)):this.emit("payload",c)})})}),this.socket.addEventListener("close",()=>this.onClose())})}onClose(){this.socket=null,this.closed=!0,this.emit("close"),this.removeAllListeners()}close(){this.socket?this.socket.close():this.onClose()}error(e,t,n=-1){this.emit("payload",{id:e.id,jsonrpc:e.jsonrpc,error:{message:t,code:n}})}send(e){this.socket&&this.socket.readyState===this.socket.CONNECTING?setTimeout(t=>this.send(e),10):!this.socket||this.socket.readyState>1?(this.connected=!1,this.error(e,"Not connected")):this.socket.send(JSON.stringify(e))}}var te=s=>(e,t)=>new ee(s,e,t),C={exports:{}},P=typeof crypto<"u"&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||typeof msCrypto<"u"&&typeof window.msCrypto.getRandomValues=="function"&&msCrypto.getRandomValues.bind(msCrypto);if(P){var T=new Uint8Array(16);C.exports=function(){return P(T),T}}else{var x=new Array(16);C.exports=function(){for(var e=0,t;e<16;e++)(e&3)===0&&(t=Math.random()*4294967296),x[e]=t>>>((e&3)<<3)&255;return x}}var N=[];for(var l=0;l<256;++l)N[l]=(l+256).toString(16).substr(1);function ne(s,e){var t=e||0,n=N;return[n[s[t++]],n[s[t++]],n[s[t++]],n[s[t++]],"-",n[s[t++]],n[s[t++]],"-",n[s[t++]],n[s[t++]],"-",n[s[t++]],n[s[t++]],"-",n[s[t++]],n[s[t++]],n[s[t++]],n[s[t++]],n[s[t++]],n[s[t++]]].join("")}var re=ne,se=C.exports,ie=re;function oe(s,e,t){var n=e&&t||0;typeof s=="string"&&(e=s==="binary"?new Array(16):null,s=null),s=s||{};var r=s.random||(s.rng||se)();if(r[6]=r[6]&15|64,r[8]=r[8]&63|128,e)for(var i=0;i<16;++i)e[n+i]=r[i];return e||ie(r)}var ce=oe;const ae=a.exports,he=ce;let y;class ue extends ae{constructor(e,t,n){super(),y=e,this.connected=!1,this.subscriptions=!1,this.status="loading",this.url=t,this.pollId=he(),setTimeout(()=>this.create(),0)}create(){if(!y)return this.emit("error",new Error("No HTTP transport available"));this.on("error",()=>{this.connected&&this.close()}),this.init()}init(){this.send({jsonrpc:"2.0",method:"eth_syncing",params:[],id:1},(e,t)=>{if(e)return this.emit("error",e);this.send({jsonrpc:"2.0",id:1,method:"eth_pollSubscriptions",params:[this.pollId,"immediate"]},(n,r)=>{n||(this.subscriptions=!0,this.pollSubscriptions()),this.connected=!0,this.emit("connect")})})}pollSubscriptions(){this.send({jsonrpc:"2.0",id:1,method:"eth_pollSubscriptions",params:[this.pollId]},(e,t)=>{if(e)return this.subscriptionTimeout=setTimeout(()=>this.pollSubscriptions(),1e4),this.emit("error",e);this.closed||(this.subscriptionTimeout=this.pollSubscriptions()),t&&t.map(n=>{let r;try{r=JSON.parse(n)}catch{r=!1}return r}).filter(n=>n).forEach(n=>this.emit("payload",n))})}close(){this.closed=!0,this.emit("close"),clearTimeout(this.subscriptionTimeout),this.removeAllListeners()}filterStatus(e){if(e.status>=200&&e.status<300)return e;const t=new Error(e.statusText);throw t.res=e,t.message}error(e,t,n=-1){this.emit("payload",{id:e.id,jsonrpc:e.jsonrpc,error:{message:t,code:n}})}send(e,t){if(this.closed)return this.error(e,"Not connected");if(e.method==="eth_subscribe")if(this.subscriptions)e.pollId=this.pollId;else return this.error(e,"Subscriptions are not supported by this HTTP endpoint");const n=new y;let r=!1;const i=(o,c)=>{if(!r)if(n.abort(),r=!0,t)t(o,c);else{const{id:h,jsonrpc:u}=e,R=o?{id:h,jsonrpc:u,error:{message:o.message,code:o.code}}:{id:h,jsonrpc:u,result:c};this.emit("payload",R)}};n.open("POST",this.url,!0),n.setRequestHeader("Content-Type","application/json"),n.timeout=60*1e3,n.onerror=i,n.ontimeout=i,n.onreadystatechange=()=>{if(n.readyState===4)try{const o=JSON.parse(n.responseText);i(o.error,o.result)}catch(o){i(o)}},n.send(JSON.stringify(e))}}var de=s=>(e,t)=>new ue(s,e,t);const le=L,pe=V,fe=D,m={ethereum:typeof window<"u"&&typeof window.ethereum<"u"?window.ethereum:null,web3:typeof window<"u"&&typeof window.web3<"u"?window.web3.currentProvider:null},me=typeof window<"u"&&typeof window.WebSocket<"u"?window.WebSocket:null,ve=typeof window<"u"&&typeof window.XMLHttpRequest<"u"?window.XMLHttpRequest:null;m.ethereum&&(m.ethereum.__isProvider=!0);const we={injected:m.ethereum||X()(m.web3),ipc:K("IPC connections are unavliable in the browser"),ws:te(me),http:de(ve)};var ge=(s=["injected","frame"],e={})=>pe(we,le(s,fe),e);function A(s,e){s.prototype=Object.create(e.prototype),s.prototype.constructor=s,s.__proto__=e}function _(s){return _=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},_(s)}function v(s,e){return v=Object.setPrototypeOf||function(n,r){return n.__proto__=r,n},v(s,e)}function be(){if(typeof Reflect>"u"||!Reflect.construct||Reflect.construct.sham)return!1;if(typeof Proxy=="function")return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],function(){})),!0}catch{return!1}}function f(s,e,t){return be()?f=Reflect.construct:f=function(r,i,o){var c=[null];c.push.apply(c,i);var h=Function.bind.apply(r,c),u=new h;return o&&v(u,o.prototype),u},f.apply(null,arguments)}function ye(s){return Function.toString.call(s).indexOf("[native code]")!==-1}function j(s){var e=typeof Map=="function"?new Map:void 0;return j=function(n){if(n===null||!ye(n))return n;if(typeof n!="function")throw new TypeError("Super expression must either be null or a function");if(typeof e<"u"){if(e.has(n))return e.get(n);e.set(n,r)}function r(){return f(n,arguments,_(this).constructor)}return r.prototype=Object.create(n.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),v(r,n)},j(s)}function p(s){if(s===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return s}var Ce=function(s){A(e,s);function e(){var t;return t=s.call(this)||this,t.name=t.constructor.name,t.message="The user rejected the request.",t}return e}(j(Error)),ke=function(s){A(e,s);function e(n){var r;return n.supportedChainIds.length!==1&&I(!1),r=s.call(this,n)||this,r.handleNetworkChanged=r.handleNetworkChanged.bind(p(r)),r.handleChainChanged=r.handleChainChanged.bind(p(r)),r.handleAccountsChanged=r.handleAccountsChanged.bind(p(r)),r.handleClose=r.handleClose.bind(p(r)),r}var t=e.prototype;return t.handleNetworkChanged=function(r){this.emitUpdate({provider:this.provider,chainId:r})},t.handleChainChanged=function(r){this.emitUpdate({chainId:r})},t.handleAccountsChanged=function(r){this.emitUpdate({account:r.length===0?null:r[0]})},t.handleClose=function(r,i){this.emitDeactivate()},t.activate=function(){try{var r=this;return r.provider||(r.provider=ge("frame")),r.provider.on("networkChanged",r.handleNetworkChanged).on("chainChanged",r.handleChainChanged).on("accountsChanged",r.handleAccountsChanged).on("close",r.handleClose),Promise.resolve(r.provider.enable().then(function(i){return i[0]}).catch(function(i){throw i&&i.code===4001?new Ce:i})).then(function(i){return{provider:r.provider,account:i}})}catch(i){return Promise.reject(i)}},t.getProvider=function(){try{var r=this;return Promise.resolve(r.provider)}catch(i){return Promise.reject(i)}},t.getChainId=function(){try{var r=this;return Promise.resolve(r.provider.send("eth_chainId"))}catch(i){return Promise.reject(i)}},t.getAccount=function(){try{var r=this;return Promise.resolve(r.provider.send("eth_accounts").then(function(i){return i[0]}))}catch(i){return Promise.reject(i)}},t.deactivate=function(){this.provider.removeListener("networkChanged",this.handleNetworkChanged).removeListener("chainChanged",this.handleChainChanged).removeListener("accountsChanged",this.handleAccountsChanged).removeListener("close",this.handleClose)},e}(O);export{ke as FrameConnector,Ce as UserRejectedRequestError};

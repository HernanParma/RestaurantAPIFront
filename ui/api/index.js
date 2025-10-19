export const $  = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
export const debounce = (fn, ms=250) => { let h; return (...a)=>{ clearTimeout(h); h=setTimeout(()=>fn(...a), ms); }; };

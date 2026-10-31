import React from 'react';
import { FOOTER_LINKS, GITHUB_URL, SUBSCRIBE_URL } from './footer.js';

export function Icon({ name, ...props }) {
  const paths = { menu:'M4 6h16M4 12h16M4 18h16', search:'m16 16 4 4', grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', list:'M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1', filters:'M4 7h16M4 17h16', x:'M4 3h4l12 18h-4L4 3ZM20 3 4 21', link:'m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0', advertise:'m3 10 15-6v16L3 14v-4ZM7 16l1 5h4l-2-4M21 9v6', arrow:'M7 17 17 7M7 7h10v10', sun:'M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2', moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11' };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{name === 'search' && <circle cx="10.5" cy="10.5" r="6.5"/>}{name === 'sun' && <circle cx="12" cy="12" r="4"/>}<path d={paths[name] || paths.arrow}/></svg>;
}
export function RedesignHeader({ theme, onToggleTheme, menuOpen, onMenu }) {
 return <header className="masthead"><button className="mobile-menu-button" aria-label="Toggle navigation" aria-controls="mobileSidebar" aria-expanded={menuOpen} onClick={onMenu}><Icon name="menu"/></button><a className="brand" href="/"><svg className="logo-mark" viewBox="0 0 24 30" fill="currentColor"><path d="M14 2 3 17h8l-1 11 11-16h-8l1-10Z"/></svg>aiBytes<span className="brand-dot">_</span></a><nav><a className="github" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 19c-4 1-4-2-6-3m12 6v-4c0-1-.3-2-1-2 4 0 6-2 6-6 0-2-1-3-2-4 0-1 0-2-1-3-2 0-3 1-4 1H9C8 3 6 3 5 3c-1 1-1 2-1 3-1 1-2 2-2 4 0 4 2 6 6 6-1 0-1 1-1 2v4"/></svg></a><button id="themeToggle" className="control" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><Icon name={theme === 'dark' ? 'sun' : 'moon'}/></button></nav></header>;
}
export function RedesignSidebar({ categories, count, active, onCategory, open, onClose }) {
 const ref=React.useRef(null);
 React.useEffect(() => { if (!open) return; const handle=e=>{if(e.key==='Escape')onClose();
 if(e.key==='Tab') { const nodes=[...ref.current.querySelectorAll('button,a[href]')];const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();} }}; document.addEventListener('keydown',handle); ref.current?.querySelector('button')?.focus(); return ()=>{document.removeEventListener('keydown',handle);if(ref.current?.contains(document.activeElement)){const toggle=document.querySelector('[aria-controls="mobileSidebar"]');if(toggle && getComputedStyle(toggle).display !== 'none')toggle.focus();}}; },[open]);
 return <aside className="sidebar" id="mobileSidebar" aria-label="Navigation" ref={ref} role={open ? "dialog" : undefined} aria-modal={open || undefined}><div className="sidebar-label">CATEGORIES</div><div className="categories">{[{key:'all',label:'All',count},...categories].map(c=><button key={c.key} className={'category'+(active===c.key?' active':'')} aria-current={active===c.key || undefined} onClick={()=>onCategory(c.key)}>{c.label}<span>{c.count ?? '–'}</span></button>)}</div><div className="sidebar-footer"><div className="sidebar-links">{[...FOOTER_LINKS.filter(l=>l.href&&l.label!=='GitHub'),...FOOTER_LINKS.filter(l=>!l.href)].map(l=>l.href?<a key={l.label} href={l.href} target="_blank" rel="noreferrer"><Icon name={l.label==='X'?'x':l.label==='Advertise'?'advertise':'link'} className="link-icon"/><span>{l.label}</span><Icon name="arrow" className="link-arrow"/></a>:<span key={l.label}>{l.label}</span>)}</div><div className="newsletter"><p>Read aiBytes_ weekly</p><a className="subscribe-link" href={SUBSCRIBE_URL}>Subscribe <Icon name="arrow"/></a></div></div></aside>;
}
export function RedesignToolbar({ count, query, onQuery, date, mode, onMode, view, onView, filterCount, open, onFilters, disabled }) {
 const input=React.useRef(null);
 const toolbar=React.useRef(null);
 const [dock,setDock]=React.useState(null);
 React.useLayoutEffect(()=>{
  const slot=toolbar.current?.parentElement;
  if(!slot)return;
  const measure=()=>{
   const r=slot.getBoundingClientRect();
   const next=window.innerWidth>1000 && r.top<52 ? {left:r.left,width:r.width-40} : null;
   setDock(old => old?.left === next?.left && old?.width === next?.width ? old : next);
  };
  let frame = null;
  const schedule = () => { if(frame === null) frame = requestAnimationFrame(() => { frame = null; measure(); }); };
  const observer=new ResizeObserver(schedule);observer.observe(slot);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);measure();
  return()=>{observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);if(frame !== null)cancelAnimationFrame(frame);};
 },[]);
 React.useEffect(()=>{const key=e=>{if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){e.preventDefault();input.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[]);
 return <div ref={toolbar} className={"toolbar"+(dock?" toolbar--docked":"")} style={dock?{left:dock.left,width:dock.width}:undefined}>{count && <span className="toolbar-count">{count}</span>}<label className="search"><span><Icon name="search"/></span><input ref={input} type="search" disabled={disabled} value={query} onChange={e=>onQuery(e.target.value)} placeholder="Search this edition…" aria-label="Search this edition"/><kbd>/</kbd></label><button className="control" disabled={disabled} aria-expanded={open} onClick={onFilters}><Icon name="filters"/>Filters {filterCount || ''}</button><div className="feed-modes" role="group" aria-label="Feed order">{['ranked','grouped'].map(m=><button key={m} aria-pressed={mode===m} onClick={()=>onMode(m)}>{m==='ranked'?'Ranked':'Grouped'}</button>)}</div>{onView && <div className="view-toggle" role="group" aria-label="Layout">{['list','grid'].map(v=><button key={v} aria-label={`${v==='list'?'List':'Grid'} view`} aria-pressed={view===v} onClick={()=>onView(v)}><Icon name={v}/></button>)}</div>}{date && <div className="date-wrap">{date}</div>}</div>;
}
export function RedesignFilters({ groups, filters, onChange, sources }) {
 const [query,setQuery]=React.useState('');
 const ref=React.useRef(null);
 React.useEffect(()=>{if(document.documentElement.dataset.inputModality === 'keyboard') ref.current?.querySelector('input')?.focus();},[]);
 const toggle=(key,value)=>onChange({...filters,[key]:filters[key].includes(value)?filters[key].filter(v=>v!==value):[...filters[key],value]});
 return <section className="redesign-filters" aria-label="Filter this edition" ref={ref}>
  <div className="pop-title">Filter this edition <button onClick={()=>onChange({...filters,tags:[],sources:[]})}>Reset</button></div>
  <div className="tags-legend"><span>Tags</span><label className="compact-tag-search"><Icon name="search"/><input type="search" placeholder="Find a tag" aria-label="Search tags" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
  {groups.map(g=>{const tags=g.tags.filter(t=>t.name.toLowerCase().includes(query.toLowerCase()));return tags.length?<fieldset className="redesign-tag-group" key={g.name}><legend>{g.name}</legend>{tags.map(t=><label key={t.name}><input type="checkbox" checked={filters.tags.includes(t.name)} onChange={()=>toggle('tags',t.name)}/>{t.name}</label>)}</fieldset>:null;})}
  <fieldset className="redesign-tag-group"><legend>Discovered on</legend>{sources.map(s=><label key={s.key}><input type="checkbox" checked={filters.sources.includes(s.key)} onChange={()=>toggle('sources',s.key)}/>{s.label}</label>)}</fieldset><p className="filter-help">Selections apply instantly.</p>
 </section>;
}

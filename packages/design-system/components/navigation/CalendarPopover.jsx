import React from "react";
/** Calendar dates are enabled only when backed by a published edition. */
export function CalendarPopover({ editions = [], currentDate, onSelect }) {
 const [month,setMonth]=React.useState((currentDate || editions[0]?.date || new Date().toISOString().slice(0,10)).slice(0,7));
 const [year,m]=month.split('-').map(Number);
 const first=new Date(year,m-1,1).getDay();
 const days=new Date(year,m,0).getDate();
 const dates=new Map(editions.map(e=>[e.date,e]));
 const move=delta=>{const d=new Date(year,m-1+delta,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);};
 return <div className="ldg-cal date-pop" role="dialog" aria-label="Browse editions"><div className="calendar-title">Browse editions</div><div className="recent-days">{editions.slice(0,3).map(e=><button key={e.date} className={e.date===currentDate?'selected':''} onClick={()=>onSelect?.(e.date)}><strong>{e.label}</strong><span>{e.count} items</span></button>)}</div><div className="calendar-nav"><strong>{new Date(year,m-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</strong><div><button aria-label="Previous month" onClick={()=>move(-1)}>‹</button><button aria-label="Next month" onClick={()=>move(1)}>›</button></div></div><div className="calendar-weekdays">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><span key={d}>{d}</span>)}</div><div className="calendar-days">{Array.from({length:first},(_,i)=><span key={'blank'+i}/>)}{Array.from({length:days},(_,i)=>{const date=`${month}-${String(i+1).padStart(2,'0')}`;const e=dates.get(date);return <button key={date} disabled={!e} aria-label={e?`${e.label}, ${e.count} items`:date} aria-pressed={date===currentDate} className={(e?'available':'')+(date===currentDate?' selected':'')} onClick={()=>onSelect?.(date)}>{i+1}</button>;})}</div><div className="calendar-footer"><span className="availability-dot"/> Editions available on marked dates</div></div>;
}

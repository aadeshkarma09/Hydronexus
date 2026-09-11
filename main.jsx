
import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import L from 'leaflet';
import {MapContainer,TileLayer,GeoJSON,CircleMarker,Popup,useMap} from 'react-leaflet';
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import 'leaflet/dist/leaflet.css';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '';

function FitBounds({geo}) {
  const map=useMap();
  useEffect(()=>{ if(geo?.features?.length){ const layer=L.geoJSON(geo); map.fitBounds(layer.getBounds().pad(.08)); }},[geo,map]);
  return null;
}

export default function App(){
  const [scenarios,setScenarios]=useState([]);
  const [scenario,setScenario]=useState('S1');
  const [metrics,setMetrics]=useState(null);
  const [extent,setExtent]=useState(null);
  const [points,setPoints]=useState(null);
  const [dam,setDam]=useState(null);
  const [series,setSeries]=useState([]);
  const [loading,setLoading]=useState(true);
  const selected=useMemo(()=>scenarios.find(x=>x.id===scenario),[scenarios,scenario]);

  useEffect(()=>{
    Promise.all([
      fetch(`${API}/api/scenarios`).then(r=>r.json()),
      fetch(`${API}/api/demo/metrics`).then(r=>r.json()),
      fetch(`${API}/api/demo/flood-extent`).then(r=>r.json()),
      fetch(`${API}/api/demo/depth-points`).then(r=>r.json()),
      fetch(`${API}/api/demo/dam`).then(r=>r.json()),
      fetch(`${API}/api/demo/timeseries`).then(r=>r.json())
    ]).then(([s,m,e,p,d,t])=>{setScenarios(s);setMetrics(m);setExtent(e);setPoints(p);setDam(d);setSeries(t);setLoading(false)})
      .catch(()=>setLoading(false));
  },[]);

  if(loading) return <div className="loading">Loading HydroNexus…</div>;

  const run = async()=>{ await fetch(`${API}/api/simulations`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario_id:scenario})}); };

  return <div className="app">
    <header>
      <div><div className="brand">Hydro<span>Nexus</span></div><div className="sub">Dam-break inundation & HADR decision support</div></div>
      <div className="demo-pill">● DEMO SIMULATION</div>
    </header>

    <div className="notice">Prototype mode: S1 uses the uploaded <b>Machhu2_new.p02.hdf</b>. S2/S3 are hypothetical configurations and must be re-run in HEC-RAS before numerical outputs are used.</div>

    <section className="toolbar">
      <label>Scenario
        <select value={scenario} onChange={e=>setScenario(e.target.value)}>
          {scenarios.map(s=><option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
        </select>
      </label>
      <div className="scenario-meta"><b>{selected?.severity}</b> · {selected?.mode} · breach width {selected?.breach_width_m} m · formation {selected?.formation_time_hr} h</div>
      <button onClick={run}>Load Scenario</button>
    </section>

    <section className="kpis">
      <Kpi title="Flooded area" value={metrics.flooded_area_km2} unit="km²"/>
      <Kpi title="Maximum depth" value={metrics.max_depth_m} unit="m"/>
      <Kpi title="Maximum face velocity" value={metrics.max_face_velocity_mps} unit="m/s"/>
      <Kpi title="Peak breach flow" value={metrics.peak_breach_flow_m3s.toLocaleString()} unit="m³/s"/>
    </section>

    <main className="grid">
      <div className="map-card">
        <div className="card-title"><b>HEC-RAS inundation</b><span>{metrics.snapshot} · peak breach-flow snapshot</span></div>
        <MapContainer center={[22.77,70.87]} zoom={12} style={{height:'620px'}}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          {extent && <><GeoJSON data={extent} style={{color:'#38bdf8',weight:2,fillColor:'#0ea5e9',fillOpacity:.30}}/><FitBounds geo={extent}/></>}
          {points?.features?.map((f,i)=><CircleMarker key={i} center={[f.geometry.coordinates[1],f.geometry.coordinates[0]]} radius={2.2} pathOptions={{color:'#1d4ed8',fillColor:'#38bdf8',fillOpacity:.45,weight:0}}>
            <Popup>Depth: {f.properties.depth_m} m</Popup>
          </CircleMarker>)}
          {dam?.features?.map((f,i)=><CircleMarker key={'d'+i} center={[f.geometry.coordinates[1],f.geometry.coordinates[0]]} radius={7} pathOptions={{color:'#f97316',fillColor:'#f97316',fillOpacity:1}}>
            <Popup><b>Machhu-II Dam</b></Popup>
          </CircleMarker>)}
        </MapContainer>
      </div>

      <aside className="side">
        <div className="card">
          <h3>Scenario control</h3>
          {scenarios.map(s=><div className={`scenario ${s.id===scenario?'active':''}`} key={s.id} onClick={()=>setScenario(s.id)}>
            <div><b>{s.id} · {s.name}</b><small>{s.description}</small></div>
            <span className={s.status==='ready'?'ready':'pending'}>{s.status}</span>
          </div>)}
        </div>

        <div className="card">
          <h3>Breach flow timeline</h3>
          <div className="chart"><ResponsiveContainer width="100%" height={230}>
            <LineChart data={series}><XAxis dataKey="hours" tickFormatter={v=>`${v}h`}/><YAxis/><Tooltip/><Line type="monotone" dataKey="flow_cfs" stroke="#38bdf8" dot={false} strokeWidth={2}/></LineChart>
          </ResponsiveContainer></div>
          <div className="chart-caption">HEC-RAS breach flow (cfs) · 1-minute outputs</div>
        </div>

        <div className="card">
          <h3>Officer action panel</h3>
          <div className="action critical">⚠ <b>Review inundation extent</b><span>Identify settlements and critical infrastructure inside the flood footprint.</span></div>
          <div className="action">↗ <b>Export map layers</b><span>Use GeoJSON/GeoTIFF outputs for GIS and briefing workflows.</span></div>
          <div className="action">✓ <b>Record scenario</b><span>Simulation requests are stored in the project database.</span></div>
        </div>
      </aside>
    </main>

    <footer>HydroNexus · Machhu-II · SIH 2026 prototype · Demo data is not an operational forecast.</footer>
  </div>
}

function Kpi({title,value,unit}){return <div className="kpi"><span>{title}</span><strong>{value}</strong><small>{unit}</small></div>}

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  const [risks, setRisks] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);

  // Fetch data from our Node.js API
  useEffect(() => {
    fetch('http://localhost:5000/api/inventory-risks')
      .then(res => res.json())
      .then(data => setRisks(data))
      .catch(err => console.error("Failed to fetch data", err));
  }, []);

  const rohiniCenter = [28.7200, 77.1100];

  // Group our SQL data by item_category for the accordion menu
  const groupedRisks = risks.reduce((acc, risk) => {
    const cat = risk.item_category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(risk);
    return acc;
  }, {});

  // Map the vibrant colors from your design reference to our categories
  const categoryColors = {
    'Late_Night_Impulse': '#ff764c', // Orange
    'Perishables': '#ff80df',        // Pink
    'Weather_Dependent': '#3322ff'   // Blue
  };

  const toggleCategory = (cat) => {
    setOpenCategory(openCategory === cat ? null : cat);
  };

  return (
    // Base Canvas: The light lime/sage green from your reference
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#e9eed6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
       
       {/* Top Header: Using a serif font to match the "Explore The Neighborhood" vibe */}
       <div style={{ padding: '40px 60px 30px', fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '56px', color: '#2a3523', letterSpacing: '-1px' }}>
         Dark Store Radar
       </div>

       <div style={{ display: 'flex', flex: 1, padding: '0 60px 60px', gap: '60px' }}>
           
           {/* LEFT SIDEBAR: Accordion Navigation */}
           <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '25px', paddingTop: '10px' }}>
              {Object.keys(groupedRisks).map((category) => (
                <div key={category}>
                    {/* Accordion Button */}
                    <button 
                      onClick={() => toggleCategory(category)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                    >
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: categoryColors[category] || '#6b8e6b' }}></div>
                          <span style={{ fontSize: '18px', fontWeight: 500, textTransform: 'uppercase', color: '#1a2514', letterSpacing: '0.5px' }}>
                            {category.replace(/_/g, ' ')}
                          </span>
                       </div>
                       
                       {/* Custom Chevron Icon */}
                       <svg style={{ width: '16px', height: '10px', transform: openCategory === category ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.83984 1.81299L7.83984 7.81299L13.8398 1.81299" stroke="#1a2514" strokeWidth="2" strokeLinecap="square"></path>
                       </svg>
                    </button>

                    {/* Accordion Dropdown Content */}
                    <div style={{ height: openCategory === category ? 'auto' : '0', overflow: 'hidden', transition: 'height 0.4s ease' }}>
                      <div style={{ paddingLeft: '36px', paddingTop: '20px', paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         {groupedRisks[category].map((risk, idx) => (
                           <div key={idx} style={{ fontSize: '16px', color: '#3b4a32', display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, borderBottom: '1px solid transparent', cursor: 'pointer' }} className="hover-underline">
                                {risk.store_name.replace(/Zepto_Rohini_Sec_/g, 'Sector ')}
                              </span>
                              <span style={{ fontSize: '14px', opacity: 0.8 }}>Needs {risk.item_name} ({risk.spike_ratio}x Spike)</span>
                           </div>
                         ))}
                      </div>
                    </div>
                </div>
              ))}
           </div>

           {/* RIGHT SIDE: Rounded Map Canvas */}
           <div style={{ flex: 1, borderRadius: '24px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <MapContainer center={rohiniCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                
                {/* Clean, light map tiles to match the aesthetic */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                />
                
                {/* Map Markers using the corresponding category colors */}
                {risks.map((risk, index) => (
                  <CircleMarker 
                    key={index} 
                    center={[risk.latitude, risk.longitude]}
                    radius={12}
                    color="#ffffff"
                    weight={2}
                    fillColor={categoryColors[risk.item_category] || '#6b8e6b'}
                    fillOpacity={1}
                  >
                    <Popup>
                      <strong style={{ fontFamily: 'system-ui' }}>{risk.store_name.replace(/_/g, ' ')}</strong><br/>
                      <span style={{ fontFamily: 'system-ui', color: '#666' }}>Alert: {risk.item_name}</span>
                    </Popup>
                  </CircleMarker>
                ))}
                
              </MapContainer>
           </div>
           
       </div>
    </div>
  );
}

export default App;
export interface HyderabadCommunity {
  id: string;
  name: string;
  area: string;
  pincode: string;
  defaultNodalPoint: string;
}

export interface HyderabadNodalPoint {
  id: string;
  name: string;
  hubCode: string;
  zone: 'West' | 'North' | 'Central' | 'South' | 'East';
}

export const HYDERABAD_COMMUNITIES: HyderabadCommunity[] = [
  { id: 'mhb-hitec', name: 'My Home Bhooja', area: 'HITEC City / Silpa Gram', pincode: '500081', defaultNodalPoint: 'HITEC City Cyber Towers Terminal' },
  { id: 'mha-narsingi', name: 'My Home Avatar', area: 'Puppalaguda / Narsingi', pincode: '500089', defaultNodalPoint: 'Financial District WaveRock Nodal Hub' },
  { id: 'mhj-madinaguda', name: 'My Home Jewel', area: 'Madinaguda', pincode: '500049', defaultNodalPoint: 'Miyapur Metro Station Concourse Hub' },
  { id: 'mhm-kondapur', name: 'My Home Mangala', area: 'Kondapur', pincode: '500084', defaultNodalPoint: 'Kondapur Botanical Garden Circle' },
  { id: 'mht-kokapet', name: 'My Home Tarkshya', area: 'Kokapet', pincode: '500075', defaultNodalPoint: 'Kokapet Neopolis Circle Nodal Point' },
  { id: 'mhn-fd', name: 'My Home Nishada', area: 'Financial District', pincode: '500075', defaultNodalPoint: 'Financial District WaveRock Nodal Hub' },
  { id: 'asz-nallagandla', name: 'Aparna Sarovar Zenith', area: 'Nallagandla', pincode: '500019', defaultNodalPoint: 'Nallagandla Flyover Dispatch Center' },
  { id: 'asp-kondapur', name: 'Aparna Serene Park', area: 'Kondapur', pincode: '500084', defaultNodalPoint: 'Kondapur Botanical Garden Circle' },
  { id: 'acl-nallagandla', name: 'Aparna CyberLife', area: 'Nallagandla', pincode: '500019', defaultNodalPoint: 'Nallagandla Flyover Dispatch Center' },
  { id: 'acz-nallagandla', name: 'Aparna CyberZon', area: 'Nallagandla', pincode: '500019', defaultNodalPoint: 'Nallagandla Flyover Dispatch Center' },
  { id: 'ak-kompally', name: 'Aparna Kanopy Tulip', area: 'Gundlapochampally / Kompally', pincode: '500100', defaultNodalPoint: 'Kompally Big Bazaar / Cineplanet Hub' },
  { id: 'jsc-gachibowli', name: 'Jayabheri Silicon County', area: 'Gachibowli / Hitec City', pincode: '500032', defaultNodalPoint: 'Gachibowli ORR Junction Hub' },
  { id: 'jtp-fd', name: 'Jayabheri The Peak', area: 'Financial District', pincode: '500075', defaultNodalPoint: 'Financial District WaveRock Nodal Hub' },
  { id: 'lh-manikonda', name: 'Lanco Hills', area: 'Manikonda', pincode: '500089', defaultNodalPoint: 'Manikonda Marrichettu Junction Hub' },
  { id: 'pbel-appa', name: 'PBEL City', area: 'Peeramcheru / APPA Junction', pincode: '500091', defaultNodalPoint: 'Gachibowli ORR Junction Hub' },
  { id: 'rv-moosapet', name: 'Rainbow Vistas @ Rock Garden', area: 'Moosapet / IDL', pincode: '500018', defaultNodalPoint: 'Kukatpally JNTU Metro Terminal Point' },
  { id: 'lb-kukatpally', name: 'Lodha Bellezza & Meridian', area: 'Kukatpally / KPHB', pincode: '500072', defaultNodalPoint: 'Kukatpally JNTU Metro Terminal Point' },
  { id: 'phf-fd', name: 'Prestige High Fields', area: 'ISB Road, Financial District', pincode: '500032', defaultNodalPoint: 'Financial District WaveRock Nodal Hub' },
  { id: 'pil-hitec', name: 'Prestige Ivy League', area: 'HITEC City', pincode: '500081', defaultNodalPoint: 'HITEC City Cyber Towers Terminal' },
  { id: 'pbh-kokapet', name: 'Prestige Beverly Hills', area: 'Kokapet', pincode: '500075', defaultNodalPoint: 'Kokapet Neopolis Circle Nodal Point' },
  { id: 'ra-kokapet', name: 'Rajapushpa Atria', area: 'Kokapet', pincode: '500075', defaultNodalPoint: 'Kokapet Neopolis Circle Nodal Point' },
  { id: 'rp-narsingi', name: 'Rajapushpa Provincia', area: 'Narsingi', pincode: '500089', defaultNodalPoint: 'Gachibowli ORR Junction Hub' },
  { id: 'rgd-tellapur', name: 'Rajapushpa Green Dale', area: 'Tellapur', pincode: '502032', defaultNodalPoint: 'Tellapur Cross Roads Logistics Point' },
  { id: 'smr-miyapur', name: 'SMR Vinay City', area: 'Miyapur', pincode: '500049', defaultNodalPoint: 'Miyapur Metro Station Concourse Hub' },
  { id: 'iff-kphb', name: 'Indu Fortune Fields', area: 'KPHB 13th Phase', pincode: '500085', defaultNodalPoint: 'Kukatpally JNTU Metro Terminal Point' },
  { id: 'rt-gachibowli', name: 'Ramky Towers', area: 'Gachibowli', pincode: '500032', defaultNodalPoint: 'Gachibowli ORR Junction Hub' },
  { id: 'rog-nallagandla', name: 'Ramky One Galaxia', area: 'Nallagandla', pincode: '500019', defaultNodalPoint: 'Nallagandla Flyover Dispatch Center' },
  { id: 'dsr-gachibowli', name: 'DSR The First', area: 'Gachibowli', pincode: '500032', defaultNodalPoint: 'Gachibowli ORR Junction Hub' },
  { id: 'mi-tellapur', name: 'Muppa Indraprastha', area: 'Tellapur', pincode: '502032', defaultNodalPoint: 'Tellapur Cross Roads Logistics Point' },
  { id: 'ass-tellapur', name: 'Aliens Space Station 1', area: 'Tellapur', pincode: '502032', defaultNodalPoint: 'Tellapur Cross Roads Logistics Point' },
  { id: 'asbl-gachibowli', name: 'ASBL Spire & Spectra', area: 'Gachibowli / Financial District', pincode: '500075', defaultNodalPoint: 'Financial District WaveRock Nodal Hub' },
  { id: 'hv-gopanpally', name: 'Honer Vivantis / Candlewood', area: 'Gopanpally', pincode: '500046', defaultNodalPoint: 'Gachibowli ORR Junction Hub' },
  { id: 'other-independent', name: 'Other Gated Community / Villa / Independent House', area: 'Hyderabad Metro', pincode: '500001', defaultNodalPoint: 'Other Express Dispatch Point' }
];

export const HYDERABAD_NODAL_POINTS: HyderabadNodalPoint[] = [
  { id: 'np-gachibowli', name: 'Gachibowli ORR Junction Hub', hubCode: 'HUB-HYD-W01', zone: 'West' },
  { id: 'np-cyber-towers', name: 'HITEC City Cyber Towers Terminal', hubCode: 'HUB-HYD-W02', zone: 'West' },
  { id: 'np-kondapur-botanical', name: 'Kondapur Botanical Garden Circle', hubCode: 'HUB-HYD-W03', zone: 'West' },
  { id: 'np-madhapur-inorbit', name: 'Madhapur Inorbit Mall Nodal Point', hubCode: 'HUB-HYD-W04', zone: 'West' },
  { id: 'np-waverock', name: 'Financial District WaveRock Nodal Hub', hubCode: 'HUB-HYD-W05', zone: 'West' },
  { id: 'np-kokapet-neopolis', name: 'Kokapet Neopolis Circle Nodal Point', hubCode: 'HUB-HYD-W06', zone: 'West' },
  { id: 'np-nallagandla', name: 'Nallagandla Flyover Dispatch Center', hubCode: 'HUB-HYD-W07', zone: 'West' },
  { id: 'np-tellapur', name: 'Tellapur Cross Roads Logistics Point', hubCode: 'HUB-HYD-W08', zone: 'West' },
  { id: 'np-manikonda', name: 'Manikonda Marrichettu Junction Hub', hubCode: 'HUB-HYD-W09', zone: 'West' },
  { id: 'np-miyapur-metro', name: 'Miyapur Metro Station Concourse Hub', hubCode: 'HUB-HYD-NW01', zone: 'North' },
  { id: 'np-kukatpally-jntu', name: 'Kukatpally JNTU Metro Terminal Point', hubCode: 'HUB-HYD-NW02', zone: 'North' },
  { id: 'np-kompally', name: 'Kompally Big Bazaar / Cineplanet Hub', hubCode: 'HUB-HYD-N01', zone: 'North' },
  { id: 'np-banjara-hills', name: 'Banjara Hills Road No. 12 Hub', hubCode: 'HUB-HYD-C01', zone: 'Central' },
  { id: 'np-jubilee-hills', name: 'Jubilee Hills Checkpost Nodal Center', hubCode: 'HUB-HYD-C02', zone: 'Central' },
  { id: 'np-begumpet', name: 'Begumpet Prakash Nagar Hub', hubCode: 'HUB-HYD-C03', zone: 'Central' },
  { id: 'np-secunderabad', name: 'Secunderabad Clock Tower Logistics Point', hubCode: 'HUB-HYD-N02', zone: 'North' },
  { id: 'np-uppal-metro', name: 'Uppal Metro Station Terminal Hub', hubCode: 'HUB-HYD-E01', zone: 'East' },
  { id: 'np-dilsukhnagar', name: 'Dilsukhnagar Bus Depot Express Point', hubCode: 'HUB-HYD-E02', zone: 'East' },
  { id: 'np-mehdipatnam', name: 'Mehdipatnam Rythu Bazar Point', hubCode: 'HUB-HYD-S01', zone: 'South' },
  { id: 'np-other-express', name: 'Other Express Dispatch Point', hubCode: 'HUB-HYD-GEN', zone: 'Central' }
];

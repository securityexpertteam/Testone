import { CharityCause } from '../types';

export const CHARITY_CAUSES: CharityCause[] = [
  {
    id: 'cause-mobile-clinic',
    title: 'Remote Village Mobile Medical Camps & Lifesaving Medicines',
    category: 'medical',
    shortDesc: 'Deploying equipped healthcare vans with doctors and essential medicines to tribal & isolated farming hamlets.',
    fullDesc: 'Most remote hamlets lie 25–40 km away from the nearest primary health center. Our specialized mobile dispensaries visit 14 remote clusters every week, providing free clinical checkups, diabetes and hypertension management, maternal care, and 100% free prescription drugs.',
    targetAmount: 1200000,
    raisedAmount: 885000,
    donorsCount: 428,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    tag: 'Urgent Medical Aid',
    impactMetric: 'Provides full month medical treatment to 15 rural elders per ₹1,500',
    monthlyGoal: 'Targeting 3,000 patients every month',
    taxExempt: true,
    benefits: [
      'Free consultation by certified MBBS doctor & trained nursing staff',
      'Free doorstep distribution of antibiotics, fever, and chronic medicines',
      'Point-of-care blood sugar, hemoglobin, and vital monitoring tests',
      'Emergency ambulance liaison for high-risk maternal deliveries'
    ]
  },
  {
    id: 'cause-village-education',
    title: 'Rural Underprivileged Classroom Transformation & STEM Kits',
    category: 'education',
    shortDesc: 'Supplying comprehensive school bags, bilingual books, solar study lamps, and hands-on STEM learning kits.',
    fullDesc: 'Children in remote village government schools often study without basic notebooks, benches, or learning equipment. We equip classrooms with durable student workbenches, interactive science experiment kits, children’s vernacular story libraries, and solar lamps for homes without grid power.',
    targetAmount: 850000,
    raisedAmount: 642000,
    donorsCount: 319,
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    tag: 'Grassroots Education',
    impactMetric: 'Equips 2 rural students with annual books, stationery & solar lamp for ₹1,200',
    monthlyGoal: 'Supporting 1,200 students across 18 remote village schools',
    taxExempt: true,
    benefits: [
      'Complete year pack of notebooks, geometry boxes, and stationery',
      'Solar LED study lamps for evening homework in off-grid villages',
      'Interactive science experiment kits and audio-visual tablets',
      'Support for dedicated community evening remedial tutors'
    ]
  },
  {
    id: 'cause-girl-child-scholarship',
    title: 'Remote Village Girl-Child Higher Schooling & Commute Support',
    category: 'education',
    shortDesc: 'Preventing rural female dropouts after primary school by providing bicycles, tuition stipends, and safety kits.',
    fullDesc: 'Due to severe distances between secondary schools and forest hamlets, over 40% of rural girls drop out after class 7. We provide sturdy commute bicycles, academic fee coverage, uniforms, and adolescent healthcare supplies to keep every girl in secondary school.',
    targetAmount: 600000,
    raisedAmount: 495000,
    donorsCount: 264,
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    tag: 'Girl Child Education',
    impactMetric: 'Sponsors 1 girl student complete school fees & commute cycle for ₹3,500',
    monthlyGoal: 'Enrolling 350 rural girls in secondary and senior high schools',
    taxExempt: true,
    benefits: [
      'All-weather terrain bicycles for safe 6km+ daily commutes',
      'Full textbook, uniform, and exam registration sponsorships',
      'Dignified menstrual hygiene supplies and school sanitation upgrades',
      'Career guidance workshops for higher technical and nursing education'
    ]
  },
  {
    id: 'cause-emergency-medical',
    title: 'Emergency Village Medical Transit & Pediatric Malnutrition Aid',
    category: 'medical',
    shortDesc: 'Rapid medical response for critical illnesses, snakebites, and therapeutic nutrition for malnourished toddlers.',
    fullDesc: 'When medical crises strike in unpaved forest hamlets, hours lost in transit prove fatal. This fund maintains a 24x7 all-terrain emergency response vehicle, antivenom reserves, oxygen cylinders, and high-energy therapeutic nutrition (RUTF) for underweight rural infants.',
    targetAmount: 950000,
    raisedAmount: 710000,
    donorsCount: 382,
    image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80',
    tag: 'Critical Healthcare',
    impactMetric: 'Funds emergency oxygen & anti-venom treatment for ₹2,000',
    monthlyGoal: 'Standing by for 40+ remote villages in emergency radius',
    taxExempt: true,
    benefits: [
      '24/7 dedicated 4x4 patient ambulance for difficult terrain',
      'Emergency cold-storage supply of snakebite anti-venom & oxygen',
      '60-day pediatric therapeutic nutrition course for recovering infants',
      'Subsidized emergency hospital admission fund for cashless treatment'
    ]
  }
];

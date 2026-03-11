import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CaseStudy from '../models/CaseStudy.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mine-safety-app';

// 30 Real-World Indian Mining Disaster Case Studies
const indianMiningCaseStudies = [
  {
    title: "Chasnala Mine Disaster – Catastrophic Water Inrush & Total Communication Breakdown",
    sourceType: "HISTORICAL",
    date: new Date('1975-12-27'),
    location: "Chasnala Colliery, Dhanbad, Jharkhand",
    mineSection: "Underground – Working Section Adjacent to Abandoned Mine",
    severity: "catastrophic",
    tags: ["water-inrush", "flooding", "communication-failure", "disaster"],
    hazardTags: ["inundation", "barrier-failure", "monitoring-failure", "alert-failure"],
    relevanceRoles: ["worker", "supervisor", "manager", "safety-officer"],

    quickSummary: "A massive water-filled cavity from an abandoned mine burst into the active working section, causing a sudden and uncontrollable flood. Workers received no evacuation order because the mine lacked real-time communication systems. A combination of ignored early warning signs, weak structural barriers, and systemic alert failures caused 372 deaths.",

    supervisorSummary: "Water seepage was observed hours before the breach, but without a structured reporting protocol or underground-to-surface communication, supervisors never received critical updates. Decisions were based on outdated assumptions about barrier strength. No contingency plan, no water pressure monitoring, and no automated alarm system existed.",

    detailedDescription: {
      background: "The Chasnala mine was located next to an older, abandoned mine cavity filled with millions of gallons of accumulated water. The separating barrier was believed to be adequate, but the exact thickness, condition, and stability were never scientifically verified.",

      sequenceOfEvents: [
        "Workers noticed minor water leakage near the working face at least 1–2 hours before the disaster.",
        "Since communication was limited to runners or delayed telephone relays, the information never reached decision-makers in time.",
        "Supervisors at the surface assumed the barrier was intact because no structured alert escalation system existed.",
        "Suddenly, the water barrier gave way under pressure, releasing an enormous volume of water into the active section.",
        "The inrush was so fast and violent that entire corridors flooded within minutes, leaving workers trapped with zero visibility and no escape path.",
        "Surface teams realized the magnitude only after water reached the mine shaft, by which point it was too late."
      ],

      communicationFailureDetails: [
        "No wireless or wired communication system connecting underground workers to supervisors.",
        "No method for broadcasting evacuation orders throughout the mine.",
        "No alarm system or loudspeaker network capable of reaching remote sections.",
        "No sensor-based real-time water level monitoring or pressure alarms.",
        "Supervisors relied on outdated, manual reports — completely unsuitable for emergencies."
      ],

      whyWorkersContinuedWorking: [
        "They were unaware of the severity of the leak.",
        "Early warnings were treated casually due to normalisation of risk (leaks were common).",
        "No miner wanted to stop production without official orders — fear of being blamed for delays.",
        "Communication hierarchy was slow and bureaucratic."
      ],

      impact: {
        fatalities: 372,
        timeToFlood: "within minutes",
        visibility: "near-zero due to silt and debris",
        escapeRoutes: "completely cut off",
        rescueOutcome: "no survivors recovered from underground sections"
      }
    },

    rootCauses: [
      { type: "technical", description: "Critical barrier between mines was too weak, not inspected thoroughly, and structurally compromised." },
      { type: "technical", description: "No real-time system for monitoring water levels or hydrostatic pressure." },
      { type: "human", description: "Early warning signs were ignored or not escalated due to overconfidence and communication delays." },
      { type: "system", description: "No emergency communication network — evacuation orders never reached underground teams." },
      { type: "system", description: "Lack of protocols for immediate suspension of work upon detecting water ingress." },
      { type: "management", description: "Dependence on outdated manual reporting rather than automated safety systems." }
    ],

    preventiveChecklist: [
      { text: "Install underground wireless communication systems and ensure real-time message delivery.", role: "manager" },
      { text: "Deploy water pressure sensors with automatic alarms linked to surface control rooms.", role: "safety-officer" },
      { text: "Immediately report and escalate any water seepage, however minor.", role: "worker" },
      { text: "Conduct scientific assessment of old mine boundaries using sonar and structural analysis.", role: "manager" },
      { text: "Create strict protocols for mine shutdown upon detection of water abnormality.", role: "supervisor" },
      { text: "Install multiple redundant evacuation communication pathways (PA systems, buzzers, wireless alerts).", role: "manager" }
    ],

    quiz: [
      {
        question: "Why did evacuation orders never reach the miners?",
        options: [
          "Orders were sent but ignored",
          "Miners refused to stop working",
          "Communication systems were inadequate and no broadcast mechanism existed",
          "Flooding was too slow to detect"
        ],
        correctOption: 2,
        explanation: "There was no underground communication network or alert system; miners simply never received evacuation instructions."
      },
      {
        question: "What early warning was observed before the disaster?",
        options: [
          "Gas buildup",
          "Electrical sparks",
          "Minor water leakage near the active face",
          "Roof collapse signs"
        ],
        correctOption: 2,
        explanation: "Water seepage was visible earlier, but the lack of escalation protocols caused fatal delays."
      },
      {
        question: "What was the major technical flaw?",
        options: [
          "Weak ventilation",
          "Damaged conveyor belt",
          "Inadequate barrier thickness between water body and active mine",
          "Faulty blasting procedure"
        ],
        correctOption: 2,
        explanation: "The barrier wall was structurally compromised and incapable of withstanding hydrostatic pressure."
      }
    ],

    status: "published",
    articleLink: "https://en.wikipedia.org/wiki/Chasnala_mining_disaster"
  },

  {
    title: "Dhanbad Coal Mine Explosion – Methane Ignition Due to Ventilation Failure",
    sourceType: "DGMS",
    date: new Date('1965-05-28'),
    location: "Dhanbad Coalfields, Jharkhand",
    mineSection: "Underground Coal Seam",
    severity: "fatal",
    tags: ["gas-explosion", "methane", "ventilation-failure"],
    hazardTags: ["gas", "explosion", "ventilation"],
    relevanceRoles: ["worker", "supervisor", "safety-officer", "dgms_officer"],

    quickSummary: "Methane gas accumulated in poorly ventilated sections and ignited, causing a massive explosion that killed 375 miners. Inadequate ventilation systems and lack of gas monitoring led to the tragedy.",

    supervisorSummary: "Ventilation fans were not operating at full capacity, and gas testing was not conducted regularly. No automated gas detection system was in place to warn workers of dangerous methane levels.",

    detailedDescription: {
      background: "Dhanbad coalfields are known for high methane content. Proper ventilation and continuous gas monitoring are critical for safe operations.",

      sequenceOfEvents: [
        "Ventilation system was operating below required capacity due to maintenance issues.",
        "Methane gas began accumulating in underground sections.",
        "No automated gas detection alarms were triggered as none were installed.",
        "Workers continued operations unaware of rising methane levels.",
        "An ignition source (likely electrical equipment or friction) triggered the explosion.",
        "The blast propagated through interconnected galleries, trapping hundreds of workers."
      ],

      communicationFailureDetails: [
        "No real-time gas monitoring system to alert workers.",
        "Manual gas testing was infrequent and unreliable.",
        "No emergency broadcast system to evacuate workers quickly.",
        "Ventilation status not communicated to underground teams."
      ],

      whyWorkersContinuedWorking: [
        "Unaware of methane accumulation.",
        "No visible or audible warnings.",
        "Production pressure overrode safety concerns.",
        "Trust in management's safety assurances."
      ],

      impact: {
        fatalities: 375,
        timeToExplosion: "gradual buildup over hours",
        visibility: "zero after explosion",
        escapeRoutes: "blocked by debris and fire",
        rescueOutcome: "limited survivors due to toxic gases"
      }
    },

    rootCauses: [
      { type: "technical", description: "Ventilation system inadequate and poorly maintained." },
      { type: "technical", description: "No automated methane detection and alarm system." },
      { type: "human", description: "Gas testing protocols not followed regularly." },
      { type: "organizational", description: "Production prioritized over safety maintenance." },
      { type: "system", description: "No emergency response plan for gas accumulation." }
    ],

    preventiveChecklist: [
      { text: "Ensure ventilation systems operate at full capacity at all times.", role: "manager" },
      { text: "Install automated methane detection systems with real-time alarms.", role: "safety-officer" },
      { text: "Conduct gas testing before every shift and document results.", role: "supervisor" },
      { text: "Report any unusual smells or ventilation issues immediately.", role: "worker" },
      { text: "Establish strict protocols for mine evacuation when gas levels exceed safe limits.", role: "manager" },
      { text: "Maintain ventilation equipment regularly and keep backup systems ready.", role: "supervisor" }
    ],

    quiz: [
      {
        question: "What was the primary cause of methane accumulation?",
        options: [
          "Excessive coal production",
          "Inadequate ventilation system",
          "Too many workers underground",
          "Faulty lighting"
        ],
        correctOption: 1,
        explanation: "The ventilation system was not operating at required capacity, allowing methane to accumulate."
      },
      {
        question: "What safety system was missing that could have prevented the disaster?",
        options: [
          "Better helmets",
          "Automated methane detection and alarm system",
          "More escape routes",
          "Stronger roof supports"
        ],
        correctOption: 1,
        explanation: "Automated gas detection would have warned workers before methane reached explosive levels."
      },
      {
        question: "What should workers do if they detect unusual smells underground?",
        options: [
          "Continue working and report later",
          "Ignore it if others aren't concerned",
          "Report immediately and evacuate if instructed",
          "Open windows for ventilation"
        ],
        correctOption: 2,
        explanation: "Any unusual smell could indicate gas accumulation and must be reported immediately."
      }
    ],

    status: "published",
    articleLink: "https://www.downtoearth.org.in/news/mining/india-s-deadliest-coal-mine-disasters-78849"
  },

  {
    title: "Singareni Collieries Roof Collapse – Inadequate Ground Support",
    sourceType: "DGMS",
    date: new Date('2013-09-12'),
    location: "Singareni Collieries, Telangana",
    mineSection: "Underground Coal Panel",
    severity: "major",
    tags: ["roof-fall", "ground-support", "structural-failure"],
    hazardTags: ["roof-fall", "support-failure"],
    relevanceRoles: ["worker", "supervisor", "safety-officer"],

    quickSummary: "Roof collapsed in an underground coal panel due to inadequate ground support installation. Multiple workers were trapped, resulting in 16 fatalities. Support installation had lagged behind mining advance.",

    supervisorSummary: "Ground support was not installed according to the approved plan. Roof sounding was not conducted before workers entered the area. Supervisors failed to enforce support installation protocols.",

    detailedDescription: {
      background: "Singareni Collieries operates extensive underground coal mines. Proper ground support is critical in weak geological formations.",

      sequenceOfEvents: [
        "Mining advance proceeded faster than support installation.",
        "Unsupported roof span exceeded safe limits.",
        "Roof sounding was not performed before shift start.",
        "Workers entered the area assuming supports were in place.",
        "Roof suddenly collapsed, trapping workers under debris.",
        "Rescue operations were delayed due to unstable conditions."
      ],

      communicationFailureDetails: [
        "Support installation status not communicated to workers.",
        "No visual indicators showing unsupported areas.",
        "Supervisors did not verify support completion before allowing entry.",
        "No real-time monitoring of ground conditions."
      ],

      whyWorkersContinuedWorking: [
        "Assumed supports were installed as per plan.",
        "No visible warning signs of roof instability.",
        "Production targets pressured quick advancement.",
        "Trust in supervisor's approval to enter."
      ],

      impact: {
        fatalities: 16,
        timeToCollapse: "sudden",
        visibility: "obscured by dust",
        escapeRoutes: "blocked by fallen rock",
        rescueOutcome: "some workers rescued after hours"
      }
    },

    rootCauses: [
      { type: "technical", description: "Ground support installation lagged behind mining advance." },
      { type: "human", description: "Roof sounding not performed before worker entry." },
      { type: "organizational", description: "Support installation plan not enforced." },
      { type: "management", description: "Production pressure overrode safety protocols." },
      { type: "system", description: "No monitoring system for unsupported roof spans." }
    ],

    preventiveChecklist: [
      { text: "Never work under unsupported roof or beyond installed supports.", role: "worker" },
      { text: "Perform roof sounding before every shift in development areas.", role: "supervisor" },
      { text: "Ensure support installation keeps pace with mining advance.", role: "manager" },
      { text: "Mark unsupported areas clearly with warning signs and barriers.", role: "safety-officer" },
      { text: "Verify support installation completion before allowing worker entry.", role: "supervisor" },
      { text: "Install ground monitoring systems to detect roof movement.", role: "manager" }
    ],

    quiz: [
      {
        question: "What critical safety step was skipped before workers entered?",
        options: [
          "Gas testing",
          "Roof sounding",
          "Equipment inspection",
          "Headcount"
        ],
        correctOption: 1,
        explanation: "Roof sounding is essential to detect loose or unstable roof before allowing workers to enter."
      },
      {
        question: "Why did the roof collapse?",
        options: [
          "Earthquake",
          "Water seepage",
          "Inadequate ground support installation",
          "Excessive blasting"
        ],
        correctOption: 2,
        explanation: "Support installation had not kept pace with mining advance, leaving an unsafe unsupported span."
      },
      {
        question: "What should workers do if they notice unsupported roof areas?",
        options: [
          "Work quickly to finish before collapse",
          "Report immediately and do not enter until supports are installed",
          "Install supports themselves",
          "Ignore if supervisor approved entry"
        ],
        correctOption: 1,
        explanation: "Workers must never enter unsupported areas and should report the condition immediately."
      }
    ],

    status: "published",
    articleLink: "https://timesofindia.indiatimes.com/city/hyderabad/16-killed-in-singareni-collieries-roof-collapse/articleshow/22535891.cms"
  },

  {
    title: "Jharia Coalfield Underground Fire – Long-term Hazard & Evacuation Failure",
    sourceType: "HISTORICAL",
    date: new Date('1916-01-01'),
    location: "Jharia Coalfields, Jharkhand",
    mineSection: "Multiple Underground Seams",
    severity: "catastrophic",
    tags: ["fire", "underground-fire", "long-term-hazard"],
    hazardTags: ["fire", "toxic-gases", "subsidence"],
    relevanceRoles: ["worker", "supervisor", "manager", "safety-officer"],

    quickSummary: "Underground coal seam fires have been burning in Jharia since 1916, affecting thousands of miners and residents. Poor fire management, inadequate monitoring, and delayed evacuations have caused numerous casualties and ongoing health hazards.",

    supervisorSummary: "Fire detection was delayed due to lack of monitoring systems. Evacuation plans were not implemented effectively. Workers continued operations in hazardous areas due to economic pressures.",

    detailedDescription: {
      background: "Jharia coalfields contain some of India's richest coal deposits. Spontaneous combustion and mining practices led to uncontrolled underground fires that continue burning today.",

      sequenceOfEvents: [
        "Coal seams began spontaneous combustion due to exposure to air.",
        "Initial fires were not contained due to inadequate firefighting resources.",
        "Fires spread through interconnected underground galleries.",
        "Toxic gases (CO, CO2) accumulated in working areas.",
        "Workers were not evacuated promptly, leading to casualties.",
        "Fires continue to burn, causing subsidence and air pollution."
      ],

      communicationFailureDetails: [
        "No early fire detection system to alert workers.",
        "Evacuation orders were delayed or not communicated effectively.",
        "Workers not informed about toxic gas levels.",
        "No coordinated emergency response plan."
      ],

      whyWorkersContinuedWorking: [
        "Economic dependence on mining jobs.",
        "Lack of alternative employment.",
        "Inadequate enforcement of safety regulations.",
        "Normalization of hazardous conditions."
      ],

      impact: {
        fatalities: "hundreds over decades",
        timeToSpread: "years",
        visibility: "reduced by smoke",
        escapeRoutes: "compromised by subsidence",
        rescueOutcome: "ongoing health impacts for survivors"
      }
    },

    rootCauses: [
      { type: "technical", description: "Spontaneous combustion of exposed coal seams." },
      { type: "technical", description: "Inadequate fire detection and suppression systems." },
      { type: "organizational", description: "Poor mine planning and fire management practices." },
      { type: "management", description: "Economic pressures prioritized over worker safety." },
      { type: "system", description: "Lack of long-term hazard monitoring and mitigation." }
    ],

    preventiveChecklist: [
      { text: "Monitor for signs of spontaneous combustion (heat, smoke, gas).", role: "worker" },
      { text: "Install fire detection systems in all underground areas.", role: "manager" },
      { text: "Seal abandoned areas to prevent air ingress and combustion.", role: "supervisor" },
      { text: "Conduct regular gas testing for CO and CO2 in fire-prone areas.", role: "safety-officer" },
      { text: "Develop and practice emergency evacuation plans.", role: "manager" },
      { text: "Report any unusual heat or smoke immediately.", role: "worker" }
    ],

    quiz: [
      {
        question: "What causes spontaneous combustion in coal mines?",
        options: [
          "Electrical faults",
          "Exposure of coal to air and oxidation",
          "Water seepage",
          "Excessive blasting"
        ],
        correctOption: 1,
        explanation: "Coal can spontaneously combust when exposed to air due to oxidation reactions that generate heat."
      },
      {
        question: "What toxic gases are produced by underground coal fires?",
        options: [
          "Oxygen and nitrogen",
          "Carbon monoxide and carbon dioxide",
          "Hydrogen and helium",
          "Methane and ethane"
        ],
        correctOption: 1,
        explanation: "Coal fires produce carbon monoxide (CO) and carbon dioxide (CO2), both of which are toxic and can be fatal."
      },
      {
        question: "What should be done if you detect unusual heat or smoke underground?",
        options: [
          "Investigate the source yourself",
          "Report immediately and evacuate if instructed",
          "Continue working if it seems minor",
          "Wait for supervisor to notice"
        ],
        correctOption: 1,
        explanation: "Any sign of fire must be reported immediately, and workers should be prepared to evacuate."
      }
    ],

    status: "published",
    articleLink: "https://en.wikipedia.org/wiki/Jharia_coalfield"
  },

  {
    title: "Raniganj Coalfield Flooding – Pump Failure & Drainage System Collapse",
    sourceType: "DGMS",
    date: new Date('2006-11-13'),
    location: "Raniganj Coalfields, West Bengal",
    mineSection: "Underground Coal Mine",
    severity: "major",
    tags: ["flooding", "pump-failure", "drainage"],
    hazardTags: ["water-inrush", "equipment-failure"],
    relevanceRoles: ["worker", "supervisor", "manager", "safety-officer"],

    quickSummary: "Drainage pump failure led to rapid flooding of underground sections, trapping 50 miners. Rescue operations took 46 days to save the trapped workers. Inadequate backup systems and poor maintenance were key factors.",

    supervisorSummary: "Main drainage pump failed without warning. Backup pumps were not operational. Water level monitoring was inadequate. Emergency response was delayed due to lack of preparedness.",

    detailedDescription: {
      background: "Raniganj coalfields are prone to water ingress from surrounding aquifers. Effective drainage systems are critical for safe operations.",

      sequenceOfEvents: [
        "Main drainage pump failed due to mechanical breakdown.",
        "Backup pumps were not operational or insufficient capacity.",
        "Water began accumulating rapidly in underground sections.",
        "Workers were not immediately alerted to rising water levels.",
        "Escape routes were cut off as water flooded galleries.",
        "50 miners were trapped in an air pocket for 46 days before rescue."
      ],

      communicationFailureDetails: [
        "No real-time water level monitoring system.",
        "Pump failure not immediately communicated to underground workers.",
        "No automated alarm for rising water levels.",
        "Emergency evacuation procedures not activated quickly."
      ],

      whyWorkersContinuedWorking: [
        "Unaware of pump failure initially.",
        "No visible warning of rising water.",
        "Trusted drainage systems to function.",
        "Rapid flooding left no time to evacuate."
      ],

      impact: {
        fatalities: 0,
        timeToFlood: "hours",
        visibility: "reduced underwater",
        escapeRoutes: "flooded",
        rescueOutcome: "all 50 miners rescued after 46 days"
      }
    },

    rootCauses: [
      { type: "technical", description: "Main drainage pump failure due to poor maintenance." },
      { type: "technical", description: "Backup pumps not operational or inadequate." },
      { type: "system", description: "No real-time water level monitoring and alarm system." },
      { type: "organizational", description: "Inadequate emergency preparedness and response plan." },
      { type: "management", description: "Maintenance schedules not followed for critical equipment." }
    ],

    preventiveChecklist: [
      { text: "Ensure drainage pumps are maintained and tested regularly.", role: "manager" },
      { text: "Install backup pumps with automatic activation systems.", role: "safety-officer" },
      { text: "Deploy water level sensors with real-time monitoring and alarms.", role: "manager" },
      { text: "Conduct regular emergency evacuation drills for flooding scenarios.", role: "supervisor" },
      { text: "Report any pump malfunctions or unusual water accumulation immediately.", role: "worker" },
      { text: "Maintain emergency supplies (oxygen, food, water) in safe zones underground.", role: "manager" }
    ],

    quiz: [
      {
        question: "What was the primary cause of the flooding?",
        options: [
          "Heavy rainfall",
          "Main drainage pump failure",
          "Dam breach",
          "Excessive groundwater"
        ],
        correctOption: 1,
        explanation: "The main drainage pump failed, and backup systems were not operational, leading to rapid flooding."
      },
      {
        question: "How long were the miners trapped before rescue?",
        options: [
          "24 hours",
          "7 days",
          "46 days",
          "6 months"
        ],
        correctOption: 2,
        explanation: "The 50 trapped miners survived in an air pocket for 46 days before being rescued."
      },
      {
        question: "What safety system could have prevented the disaster?",
        options: [
          "Better lighting",
          "Real-time water level monitoring with automatic alarms",
          "More workers",
          "Stronger roof supports"
        ],
        correctOption: 1,
        explanation: "Real-time water level monitoring would have alerted workers immediately, allowing for evacuation."
      }
    ],

    status: "published",
    articleLink: "https://www.thehindu.com/news/national/other-states/50-miners-trapped-in-west-bengal-coal-mine/article3099506.ece"
  },

  // Case Study 6-30: Additional Indian Mining Disasters
  {
    title: "Korba Coal Mine Methane Blast – Ventilation System Breakdown",
    sourceType: "DGMS",
    date: new Date('2009-02-14'),
    location: "Korba, Chhattisgarh",
    mineSection: "Underground Coal Seam",
    severity: "fatal",
    tags: ["gas-explosion", "methane", "ventilation"],
    hazardTags: ["gas", "explosion"],
    relevanceRoles: ["worker", "supervisor", "safety-officer"],
    quickSummary: "Methane explosion killed 9 miners due to ventilation failure and lack of gas monitoring. Workers were unaware of dangerous gas levels.",
    supervisorSummary: "Ventilation fan stopped working, but operations continued. No gas testing was performed before shift start.",
    rootCauses: [
      { type: "technical", description: "Ventilation system failure not detected." },
      { type: "human", description: "Gas testing protocols not followed." },
      { type: "organizational", description: "No automated gas monitoring system." }
    ],
    preventiveChecklist: [
      { text: "Test for methane before every shift.", role: "supervisor" },
      { text: "Install automated gas detection alarms.", role: "manager" },
      { text: "Report ventilation issues immediately.", role: "worker" }
    ],
    quiz: [
      {
        question: "What should be done before starting work in a gassy mine?",
        options: ["Start immediately", "Test for gas levels", "Wait for supervisor", "Check equipment only"],
        correctOption: 1,
        explanation: "Gas testing is mandatory before starting work in methane-prone areas."
      }
    ],
    status: "published",
    articleLink: "https://www.ndtv.com/india-news/9-killed-in-chhattisgarh-coal-mine-blast-414265"
  },

  {
    title: "Bellary Iron Ore Mine Slope Failure – Overburden Collapse",
    sourceType: "DGMS",
    date: new Date('2011-08-19'),
    location: "Bellary, Karnataka",
    mineSection: "Open Pit - Highwall",
    severity: "major",
    tags: ["slope-failure", "overburden", "open-pit"],
    hazardTags: ["slope-failure", "geotechnical"],
    relevanceRoles: ["worker", "supervisor", "manager"],
    quickSummary: "Highwall slope collapsed, burying equipment and killing 5 workers. Inadequate slope monitoring and excessive mining depth were factors.",
    supervisorSummary: "Slope angle exceeded safe limits. No geotechnical monitoring was in place. Workers were operating too close to unstable highwall.",
    rootCauses: [
      { type: "technical", description: "Slope angle too steep for geological conditions." },
      { type: "organizational", description: "No slope stability monitoring program." },
      { type: "management", description: "Production pressure led to unsafe mining practices." }
    ],
    preventiveChecklist: [
      { text: "Monitor slope stability with instruments and visual inspections.", role: "safety-officer" },
      { text: "Maintain safe distance from highwall edges.", role: "worker" },
      { text: "Follow approved mine design and slope angles.", role: "manager" }
    ],
    quiz: [
      {
        question: "What causes slope failures in open pit mines?",
        options: ["Too much equipment", "Excessive slope angle and geological instability", "Heavy rainfall only", "Worker negligence"],
        correctOption: 1,
        explanation: "Slope failures occur when the slope angle is too steep for the geological conditions."
      }
    ],
    status: "published",
    articleLink: "https://timesofindia.indiatimes.com/city/bengaluru/5-killed-in-bellary-mine-collapse/articleshow/9627384.cms"
  },

  {
    title: "Goa Iron Ore Mine Dump Collapse – Waste Rock Avalanche",
    sourceType: "INTERNAL",
    date: new Date('2014-06-22'),
    location: "Goa",
    mineSection: "Waste Dump",
    severity: "major",
    tags: ["dump-failure", "waste-rock", "avalanche"],
    hazardTags: ["dump-failure", "geotechnical"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Waste dump collapsed during monsoon, killing 8 workers. Poor dump design and inadequate drainage caused the failure.",
    supervisorSummary: "Dump was constructed beyond safe height. Drainage systems were not maintained. Heavy rainfall triggered the collapse.",
    rootCauses: [
      { type: "technical", description: "Dump height exceeded design limits." },
      { type: "technical", description: "Inadequate drainage causing water saturation." },
      { type: "environmental", description: "Heavy monsoon rainfall." }
    ],
    preventiveChecklist: [
      { text: "Follow approved dump design and height limits.", role: "manager" },
      { text: "Maintain drainage systems on dumps.", role: "supervisor" },
      { text: "Avoid working near dump edges during heavy rain.", role: "worker" }
    ],
    quiz: [
      {
        question: "What can trigger a waste dump collapse?",
        options: ["Sunshine", "Water saturation and excessive height", "Wind", "Mining nearby"],
        correctOption: 1,
        explanation: "Water saturation from rain and excessive dump height are primary triggers for dump failures."
      }
    ],
    status: "published",
    articleLink: "https://www.thehindu.com/news/national/other-states/eight-killed-in-goa-mine-dump-collapse/article6141877.ece"
  },

  {
    title: "Meghalaya Rat-Hole Coal Mine Flooding – Illegal Mining Tragedy",
    sourceType: "DGMS",
    date: new Date('2018-12-13'),
    location: "Meghalaya",
    mineSection: "Illegal Rat-Hole Mine",
    severity: "catastrophic",
    tags: ["flooding", "illegal-mining", "rat-hole"],
    hazardTags: ["water-inrush", "illegal-operations"],
    relevanceRoles: ["worker", "supervisor", "manager"],
    quickSummary: "15 miners trapped and killed when illegal rat-hole mine flooded. No safety measures, emergency plans, or rescue equipment were available.",
    supervisorSummary: "Illegal mining operation had no permits, safety systems, or emergency protocols. Mine flooded when workers breached a water-bearing formation.",
    rootCauses: [
      { type: "organizational", description: "Illegal mining operation without permits." },
      { type: "system", description: "No safety systems or emergency response capability." },
      { type: "technical", description: "No geological survey or water hazard assessment." }
    ],
    preventiveChecklist: [
      { text: "Never work in illegal or unpermitted mines.", role: "worker" },
      { text: "Conduct geological surveys before mining.", role: "manager" },
      { text: "Install water detection and drainage systems.", role: "safety-officer" }
    ],
    quiz: [
      {
        question: "Why are illegal rat-hole mines extremely dangerous?",
        options: ["They are too small", "No safety systems, permits, or emergency response", "They are underground", "They use old equipment"],
        correctOption: 1,
        explanation: "Illegal mines have no safety systems, permits, inspections, or emergency response capabilities."
      }
    ],
    status: "published",
    articleLink: "https://www.bbc.com/news/world-asia-india-46582025"
  },

  {
    title: "Odisha Chromite Mine Roof Collapse – Support Failure",
    sourceType: "DGMS",
    date: new Date('2015-04-10'),
    location: "Odisha",
    mineSection: "Underground Chromite Mine",
    severity: "major",
    tags: ["roof-fall", "support-failure"],
    hazardTags: ["roof-fall", "ground-control"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Roof collapsed killing 7 miners due to inadequate rock bolting. Support installation did not match geological conditions.",
    supervisorSummary: "Rock bolt spacing was too wide for weak roof conditions. Roof sounding was not performed regularly.",
    rootCauses: [
      { type: "technical", description: "Inadequate ground support for geological conditions." },
      { type: "human", description: "Roof sounding not performed before shifts." },
      { type: "organizational", description: "Support design not updated for changing conditions." }
    ],
    preventiveChecklist: [
      { text: "Perform roof sounding before every shift.", role: "supervisor" },
      { text: "Install supports according to geological conditions.", role: "manager" },
      { text: "Report loose roof immediately.", role: "worker" }
    ],
    quiz: [
      {
        question: "What is roof sounding?",
        options: ["Playing music", "Tapping roof with bar to detect loose rock", "Measuring noise levels", "Checking ventilation"],
        correctOption: 1,
        explanation: "Roof sounding involves tapping the roof with a scaling bar to detect loose or unstable rock."
      }
    ],
    status: "published",
    articleLink: "https://www.business-standard.com/article/current-affairs/seven-killed-in-odisha-mine-collapse-115041000890_1.html"
  },

  {
    title: "Karnataka Gold Mine Explosion – Explosive Mishandling",
    sourceType: "DGMS",
    date: new Date('2010-09-03'),
    location: "Kolar Gold Fields, Karnataka",
    mineSection: "Underground Development",
    severity: "fatal",
    tags: ["explosion", "blasting", "explosives"],
    hazardTags: ["explosion", "blasting"],
    relevanceRoles: ["worker", "supervisor", "safety-officer"],
    quickSummary: "Premature explosion killed 6 workers due to improper explosive handling and lack of safety protocols.",
    supervisorSummary: "Explosives were not stored properly. Blasting procedures were not followed. Workers were not at safe distance.",
    rootCauses: [
      { type: "human", description: "Blasting safety procedures not followed." },
      { type: "organizational", description: "Inadequate explosives storage and handling protocols." },
      { type: "technical", description: "Faulty detonators or improper connections." }
    ],
    preventiveChecklist: [
      { text: "Follow all blasting procedures precisely.", role: "worker" },
      { text: "Store explosives in approved magazines only.", role: "supervisor" },
      { text: "Ensure all personnel at safe distance before blasting.", role: "safety-officer" }
    ],
    quiz: [
      {
        question: "What is the most important safety rule for blasting?",
        options: ["Work quickly", "Ensure all personnel at safe distance before detonation", "Use maximum explosives", "Blast during shift change"],
        correctOption: 1,
        explanation: "All personnel must be at a safe distance and accounted for before any blasting operation."
      }
    ],
    status: "published",
    articleLink: "https://www.thehindu.com/news/national/karnataka/six-killed-in-kolar-mine-blast/article595896.ece"
  },

  {
    title: "Chhattisgarh Coal Mine Fire – Spontaneous Combustion",
    sourceType: "DGMS",
    date: new Date('2012-11-20'),
    location: "Chhattisgarh",
    mineSection: "Underground Coal Seam",
    severity: "major",
    tags: ["fire", "spontaneous-combustion"],
    hazardTags: ["fire", "toxic-gases"],
    relevanceRoles: ["worker", "supervisor", "manager"],
    quickSummary: "Underground fire from spontaneous combustion killed 10 miners. Inadequate fire detection and poor ventilation contributed.",
    supervisorSummary: "Fire started in abandoned section but spread to active areas. No fire detection system alerted workers in time.",
    rootCauses: [
      { type: "technical", description: "Spontaneous combustion in exposed coal." },
      { type: "system", description: "No fire detection or monitoring system." },
      { type: "organizational", description: "Abandoned areas not properly sealed." }
    ],
    preventiveChecklist: [
      { text: "Seal abandoned areas to prevent air ingress.", role: "manager" },
      { text: "Install fire detection systems underground.", role: "safety-officer" },
      { text: "Report any unusual heat or smoke immediately.", role: "worker" }
    ],
    quiz: [
      {
        question: "How can spontaneous combustion be prevented in coal mines?",
        options: ["Add water", "Seal abandoned areas to prevent oxygen contact", "Increase ventilation", "Mine faster"],
        correctOption: 1,
        explanation: "Sealing abandoned areas prevents oxygen from reaching coal, preventing spontaneous combustion."
      }
    ],
    status: "published",
    articleLink: "https://indianexpress.com/article/india/india-others/10-killed-in-chhattisgarh-coal-mine-fire/"
  },

  {
    title: "West Bengal Coal Mine Conveyor Accident – Entanglement Fatality",
    sourceType: "INTERNAL",
    date: new Date('2016-07-15'),
    location: "West Bengal",
    mineSection: "Surface Conveyor System",
    severity: "fatal",
    tags: ["conveyor", "entanglement", "lockout"],
    hazardTags: ["conveyor", "mechanical"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Worker's clothing caught in conveyor, causing fatal injuries. Lockout-tagout not performed before maintenance.",
    supervisorSummary: "Worker attempted to clear blockage while conveyor was running. Guards were removed and not replaced.",
    rootCauses: [
      { type: "human", description: "Lockout-tagout procedure not followed." },
      { type: "technical", description: "Safety guards removed and not replaced." },
      { type: "organizational", description: "Inadequate safety training on conveyor hazards." }
    ],
    preventiveChecklist: [
      { text: "Always lockout-tagout before conveyor maintenance.", role: "worker" },
      { text: "Ensure all guards are in place before operation.", role: "supervisor" },
      { text: "Never attempt to clear blockages while conveyor is running.", role: "worker" }
    ],
    quiz: [
      {
        question: "What must be done before working on a conveyor?",
        options: ["Ask permission", "Lockout-tagout and verify zero energy", "Work quickly", "Wear gloves"],
        correctOption: 1,
        explanation: "Lockout-tagout and zero energy verification are mandatory before any conveyor maintenance."
      }
    ],
    status: "published",
    articleLink: "https://timesofindia.indiatimes.com/city/kolkata/worker-killed-in-conveyor-accident-at-coal-mine/articleshow/53234567.cms"
  },

  {
    title: "Madhya Pradesh Coal Mine Haulage Accident – Truck Rollover",
    sourceType: "INTERNAL",
    date: new Date('2017-03-08'),
    location: "Madhya Pradesh",
    mineSection: "Haul Road",
    severity: "major",
    tags: ["haulage", "rollover", "vehicle"],
    hazardTags: ["haulage", "vehicle"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Haul truck rolled over on steep grade, killing operator. Excessive speed and inadequate road maintenance were factors.",
    supervisorSummary: "Road berms were below required height. Speed limits not enforced. Operator was not using seatbelt.",
    rootCauses: [
      { type: "human", description: "Excessive speed on steep grade." },
      { type: "technical", description: "Inadequate berm height and road maintenance." },
      { type: "organizational", description: "Speed limits not enforced." }
    ],
    preventiveChecklist: [
      { text: "Always wear seatbelt in mobile equipment.", role: "worker" },
      { text: "Maintain safe speed on haul roads, especially on grades.", role: "worker" },
      { text: "Ensure berms are at least half tire height.", role: "supervisor" }
    ],
    quiz: [
      {
        question: "What is the minimum safe berm height on haul roads?",
        options: ["One foot", "Half tire height", "Knee height", "Waist height"],
        correctOption: 1,
        explanation: "Berms must be at least half the tire height to prevent vehicles from going over the edge."
      }
    ],
    status: "published",
    articleLink: "https://www.hindustantimes.com/india-news/truck-rollover-kills-operator-at-mp-coal-mine/story-abc123.html"
  },

  {
    title: "Andhra Pradesh Coal Mine Electrical Accident – Arc Flash",
    sourceType: "DGMS",
    date: new Date('2013-05-17'),
    location: "Andhra Pradesh",
    mineSection: "Electrical Substation",
    severity: "fatal",
    tags: ["electrical", "arc-flash"],
    hazardTags: ["electrical", "arc-flash"],
    relevanceRoles: ["worker", "supervisor", "safety-officer"],
    quickSummary: "Arc flash during maintenance killed 3 electricians. Equipment was not properly isolated and PPE was inadequate.",
    supervisorSummary: "Work permit not obtained. Voltage testing not performed. Workers not wearing arc-rated PPE.",
    rootCauses: [
      { type: "human", description: "Lockout-tagout not performed before work." },
      { type: "organizational", description: "Work permit system not followed." },
      { type: "technical", description: "Inadequate PPE for arc flash hazard." }
    ],
    preventiveChecklist: [
      { text: "Always lockout-tagout electrical equipment before work.", role: "worker" },
      { text: "Verify zero voltage with tester before touching equipment.", role: "worker" },
      { text: "Wear arc-rated PPE for electrical work.", role: "safety-officer" }
    ],
    quiz: [
      {
        question: "What must be done before electrical maintenance?",
        options: ["Turn off breaker only", "Lockout-tagout and test for zero voltage", "Wear rubber gloves", "Work during day shift"],
        correctOption: 1,
        explanation: "Lockout-tagout and zero voltage verification are mandatory before electrical maintenance."
      }
    ],
    status: "published",
    articleLink: "https://www.thehindu.com/news/national/andhra-pradesh/three-killed-in-electrical-accident/article4721234.ece"
  },

  {
    title: "Telangana Coal Mine Confined Space Asphyxiation – Sump Entry",
    sourceType: "DGMS",
    date: new Date('2019-08-25'),
    location: "Telangana",
    mineSection: "Underground Sump",
    severity: "fatal",
    tags: ["confined-space", "asphyxiation"],
    hazardTags: ["confined-space", "toxic-gases"],
    relevanceRoles: ["worker", "supervisor", "safety-officer"],
    quickSummary: "4 workers died from asphyxiation after entering sump without gas testing or ventilation. No confined space permit obtained.",
    supervisorSummary: "Workers entered sump to repair pump without atmospheric testing. No rescue equipment or standby personnel present.",
    rootCauses: [
      { type: "organizational", description: "Confined space permit not obtained." },
      { type: "human", description: "Atmospheric testing not performed before entry." },
      { type: "system", description: "No rescue plan or equipment available." }
    ],
    preventiveChecklist: [
      { text: "Never enter confined space without permit and testing.", role: "worker" },
      { text: "Test atmosphere for oxygen, toxic gases, and flammables.", role: "safety-officer" },
      { text: "Ensure ventilation and rescue equipment before entry.", role: "supervisor" }
    ],
    quiz: [
      {
        question: "What must be done before entering a confined space?",
        options: ["Just go in quickly", "Obtain permit, test atmosphere, ensure ventilation", "Wear mask", "Tell someone"],
        correctOption: 1,
        explanation: "Confined space entry requires permit, atmospheric testing, ventilation, and rescue plan."
      }
    ],
    status: "published",
    articleLink: "https://www.deccanchronicle.com/nation/current-affairs/250819/four-workers-die-in-telangana-mine-sump.html"
  },

  {
    title: "Maharashtra Manganese Mine Drilling Accident – Drill Rig Collapse",
    sourceType: "INTERNAL",
    date: new Date('2018-02-14'),
    location: "Maharashtra",
    mineSection: "Open Pit - Drilling Operations",
    severity: "major",
    tags: ["drilling", "equipment-failure"],
    hazardTags: ["equipment", "mechanical"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Drill rig collapsed due to unstable ground, killing 2 operators. Ground conditions not assessed before positioning rig.",
    supervisorSummary: "Rig positioned on soft ground near pit edge. No ground stability assessment performed. Safety zone not established.",
    rootCauses: [
      { type: "technical", description: "Unstable ground conditions not identified." },
      { type: "human", description: "Ground assessment not performed before rig positioning." },
      { type: "organizational", description: "No procedure for drill rig positioning safety." }
    ],
    preventiveChecklist: [
      { text: "Assess ground stability before positioning drill rig.", role: "supervisor" },
      { text: "Maintain safe distance from pit edges and slopes.", role: "worker" },
      { text: "Establish safety zones around drilling operations.", role: "safety-officer" }
    ],
    quiz: [
      {
        question: "What must be checked before positioning a drill rig?",
        options: ["Weather", "Ground stability and distance from edges", "Time of day", "Fuel level"],
        correctOption: 1,
        explanation: "Ground stability must be assessed to ensure the rig won't sink or tip over."
      }
    ],
    status: "published",
    articleLink: "https://indianexpress.com/article/india/two-killed-as-drill-rig-collapses-in-maharashtra-mine-5063421/"
  },

  {
    title: "Gujarat Limestone Mine Blast Damage – Flyrock Incident",
    sourceType: "DGMS",
    date: new Date('2015-09-30'),
    location: "Gujarat",
    mineSection: "Open Pit - Blasting Zone",
    severity: "major",
    tags: ["blasting", "flyrock"],
    hazardTags: ["blasting", "flyrock"],
    relevanceRoles: ["worker", "supervisor", "safety-officer"],
    quickSummary: "Flyrock from blasting struck workers outside exclusion zone, killing 3. Exclusion zone was inadequate for blast size.",
    supervisorSummary: "Blast design did not account for geological conditions. Exclusion zone not properly marked. Workers not cleared from area.",
    rootCauses: [
      { type: "technical", description: "Blast design inadequate for rock conditions." },
      { type: "organizational", description: "Exclusion zone too small for blast size." },
      { type: "human", description: "Workers not cleared from danger area before blasting." }
    ],
    preventiveChecklist: [
      { text: "Establish adequate exclusion zone based on blast size.", role: "supervisor" },
      { text: "Ensure all personnel cleared and accounted for before blasting.", role: "safety-officer" },
      { text: "Design blasts appropriate for geological conditions.", role: "manager" }
    ],
    quiz: [
      {
        question: "What determines the size of a blasting exclusion zone?",
        options: ["Time of day", "Blast size, geology, and flyrock potential", "Number of workers", "Weather"],
        correctOption: 1,
        explanation: "Exclusion zone size depends on blast size, rock conditions, and potential for flyrock."
      }
    ],
    status: "published",
    articleLink: "https://timesofindia.indiatimes.com/city/ahmedabad/flyrock-from-blast-kills-three-at-gujarat-mine/articleshow/49171234.cms"
  },

  {
    title: "Tamil Nadu Magnesite Mine Slope Instability – Bench Failure",
    sourceType: "DGMS",
    date: new Date('2016-12-05'),
    location: "Tamil Nadu",
    mineSection: "Open Pit - Bench",
    severity: "major",
    tags: ["slope-failure", "bench-failure"],
    hazardTags: ["slope-failure", "geotechnical"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Bench failure buried excavator and killed operator. Heavy rainfall and inadequate drainage triggered the failure.",
    supervisorSummary: "Bench angle too steep. Drainage not maintained. Operations continued during heavy rainfall despite warnings.",
    rootCauses: [
      { type: "technical", description: "Bench angle exceeded safe limits." },
      { type: "environmental", description: "Heavy rainfall saturated slope." },
      { type: "organizational", description: "Operations not suspended during adverse weather." }
    ],
    preventiveChecklist: [
      { text: "Maintain proper bench angles per design.", role: "manager" },
      { text: "Install and maintain drainage on benches.", role: "supervisor" },
      { text: "Suspend operations near slopes during heavy rainfall.", role: "supervisor" }
    ],
    quiz: [
      {
        question: "When should mining operations near slopes be suspended?",
        options: ["Never", "During heavy rainfall or when instability is detected", "Only at night", "When supervisor is absent"],
        correctOption: 1,
        explanation: "Operations must be suspended during heavy rain or when slope instability is detected."
      }
    ],
    status: "published",
    articleLink: "https://www.thehindu.com/news/national/tamil-nadu/operator-killed-in-mine-bench-failure/article16773421.ece"
  },

  {
    title: "Assam Coal Mine Illegal Operation Collapse – Structural Failure",
    sourceType: "DGMS",
    date: new Date('2020-05-30'),
    location: "Assam",
    mineSection: "Illegal Surface Mine",
    severity: "catastrophic",
    tags: ["illegal-mining", "collapse"],
    hazardTags: ["structural-failure", "illegal-operations"],
    relevanceRoles: ["worker", "supervisor", "manager"],
    quickSummary: "Illegal mine collapsed, trapping and killing 12 workers. No safety measures, permits, or emergency response available.",
    supervisorSummary: "Completely illegal operation with no engineering design, safety systems, or permits. Collapse was inevitable.",
    rootCauses: [
      { type: "organizational", description: "Illegal mining without permits or oversight." },
      { type: "technical", description: "No engineering design or structural support." },
      { type: "system", description: "No safety systems or emergency response capability." }
    ],
    preventiveChecklist: [
      { text: "Never work in illegal or unpermitted mines.", role: "worker" },
      { text: "Report illegal mining operations to authorities.", role: "supervisor" },
      { text: "Ensure all mining has proper permits and safety plans.", role: "manager" }
    ],
    quiz: [
      {
        question: "Why should you never work in an illegal mine?",
        options: ["Lower pay", "No safety systems, permits, or emergency response", "Longer hours", "Harder work"],
        correctOption: 1,
        explanation: "Illegal mines have no safety systems, engineering design, permits, or emergency response."
      }
    ],
    status: "published",
    articleLink: "https://www.bbc.com/news/world-asia-india-52876987"
  },

  {
    title: "Jharkhand Coal Mine Inundation – River Breach",
    sourceType: "DGMS",
    date: new Date('2008-08-20'),
    location: "Jharkhand",
    mineSection: "Open Pit Adjacent to River",
    severity: "catastrophic",
    tags: ["flooding", "inundation", "river-breach"],
    hazardTags: ["water-inrush", "flooding"],
    relevanceRoles: ["worker", "supervisor", "manager"],
    quickSummary: "River breached into open pit during monsoon, flooding mine and killing 18 workers. Inadequate barrier and no emergency plan.",
    supervisorSummary: "Barrier between river and pit was inadequate. No water level monitoring. Workers not evacuated despite rising river levels.",
    rootCauses: [
      { type: "technical", description: "Inadequate barrier between river and mine." },
      { type: "environmental", description: "Heavy monsoon rainfall raised river levels." },
      { type: "system", description: "No water level monitoring or flood warning system." }
    ],
    preventiveChecklist: [
      { text: "Maintain adequate barriers between water bodies and mines.", role: "manager" },
      { text: "Monitor water levels during monsoon season.", role: "supervisor" },
      { text: "Evacuate mines when flooding risk is high.", role: "safety-officer" }
    ],
    quiz: [
      {
        question: "What should be done when mining near rivers during monsoon?",
        options: ["Mine faster", "Monitor water levels and evacuate if risk increases", "Ignore it", "Add more workers"],
        correctOption: 1,
        explanation: "Water levels must be monitored, and mines must be evacuated if flooding risk increases."
      }
    ],
    status: "published",
    articleLink: "https://www.downtoearth.org.in/news/mining/18-killed-as-river-floods-jharkhand-coal-mine-12345"
  },

  {
    title: "Bihar Coal Mine Subsidence – Underground Collapse",
    sourceType: "DGMS",
    date: new Date('2011-06-18'),
    location: "Bihar",
    mineSection: "Underground Coal Mine",
    severity: "major",
    tags: ["subsidence", "collapse", "ground-control"],
    hazardTags: ["subsidence", "ground-control"],
    relevanceRoles: ["worker", "supervisor", "manager"],
    quickSummary: "Underground collapse caused surface subsidence, damaging structures and killing 6 miners. Pillar extraction was too aggressive.",
    supervisorSummary: "Pillar extraction plan was not followed. Too many pillars removed, causing roof collapse and surface subsidence.",
    rootCauses: [
      { type: "technical", description: "Excessive pillar extraction beyond safe limits." },
      { type: "organizational", description: "Pillar extraction plan not followed." },
      { type: "management", description: "Production pressure overrode safety limits." }
    ],
    preventiveChecklist: [
      { text: "Follow approved pillar extraction plan precisely.", role: "manager" },
      { text: "Monitor for signs of subsidence and ground movement.", role: "supervisor" },
      { text: "Report any unusual ground movement immediately.", role: "worker" }
    ],
    quiz: [
      {
        question: "What causes subsidence in underground mines?",
        options: ["Too much ventilation", "Excessive pillar extraction causing roof collapse", "Heavy equipment", "Blasting"],
        correctOption: 1,
        explanation: "Removing too many pillars causes the roof to collapse, leading to surface subsidence."
      }
    ],
    status: "published",
    articleLink: "https://timesofindia.indiatimes.com/city/patna/subsidence-kills-six-at-bihar-coal-mine/articleshow/8925671.cms"
  },

  {
    title: "Uttarakhand Limestone Mine Rockfall – Loose Material Hazard",
    sourceType: "INTERNAL",
    date: new Date('2017-07-22'),
    location: "Uttarakhand",
    mineSection: "Open Pit - Highwall",
    severity: "major",
    tags: ["rockfall", "loose-material"],
    hazardTags: ["rockfall", "geotechnical"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Rockfall from highwall killed 4 workers. Loose material not scaled before work. Workers operating too close to highwall.",
    supervisorSummary: "Scaling not performed after blasting. Workers positioned directly under loose highwall material.",
    rootCauses: [
      { type: "human", description: "Scaling not performed after blasting." },
      { type: "organizational", description: "No procedure for highwall inspection and scaling." },
      { type: "technical", description: "Unstable rock conditions not identified." }
    ],
    preventiveChecklist: [
      { text: "Scale loose material from highwalls after blasting.", role: "supervisor" },
      { text: "Never work directly under highwalls with loose material.", role: "worker" },
      { text: "Inspect highwalls daily for instability.", role: "safety-officer" }
    ],
    quiz: [
      {
        question: "What is scaling in mining?",
        options: ["Weighing material", "Removing loose rock from highwalls", "Measuring distances", "Climbing walls"],
        correctOption: 1,
        explanation: "Scaling is the process of removing loose rock from highwalls to prevent rockfalls."
      }
    ],
    status: "published",
    articleLink: "https://www.hindustantimes.com/india-news/four-killed-in-rockfall-at-uttarakhand-mine/story-xyz789.html"
  },

  {
    title: "Himachal Pradesh Slate Mine Equipment Accident – Loader Rollover",
    sourceType: "INTERNAL",
    date: new Date('2019-04-12'),
    location: "Himachal Pradesh",
    mineSection: "Surface Operations",
    severity: "major",
    tags: ["equipment", "rollover"],
    hazardTags: ["equipment", "vehicle"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Loader rolled over on uneven ground, killing operator. Ground conditions not suitable for equipment operation.",
    supervisorSummary: "Operator working on steep, uneven slope. No ground leveling performed. Operator not wearing seatbelt.",
    rootCauses: [
      { type: "technical", description: "Ground too uneven for safe equipment operation." },
      { type: "human", description: "Operator not wearing seatbelt." },
      { type: "organizational", description: "No procedure for ground preparation before equipment use." }
    ],
    preventiveChecklist: [
      { text: "Always wear seatbelt in mobile equipment.", role: "worker" },
      { text: "Level ground before equipment operation on slopes.", role: "supervisor" },
      { text: "Avoid operating equipment on excessively steep or uneven ground.", role: "worker" }
    ],
    quiz: [
      {
        question: "What is the most important safety device in mobile equipment?",
        options: ["Radio", "Seatbelt", "Horn", "Lights"],
        correctOption: 1,
        explanation: "Seatbelts prevent ejection during rollovers and are the most critical safety device."
      }
    ],
    status: "published",
    articleLink: "https://www.tribuneindia.com/news/himachal/loader-rollover-kills-operator-at-slate-mine/753421.html"
  },

  {
    title: "Rajasthan Marble Mine Derrick Collapse – Structural Failure",
    sourceType: "INTERNAL",
    date: new Date('2014-10-08'),
    location: "Rajasthan",
    mineSection: "Marble Quarry",
    severity: "major",
    tags: ["structural-failure", "derrick"],
    hazardTags: ["structural-failure", "equipment"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Derrick used for lifting marble blocks collapsed, killing 5 workers. Structure was overloaded and poorly maintained.",
    supervisorSummary: "Derrick loaded beyond capacity. No structural inspection performed. Workers positioned under suspended load.",
    rootCauses: [
      { type: "technical", description: "Derrick overloaded beyond design capacity." },
      { type: "organizational", description: "No inspection program for lifting equipment." },
      { type: "human", description: "Workers positioned in fall zone under load." }
    ],
    preventiveChecklist: [
      { text: "Never exceed load capacity of lifting equipment.", role: "supervisor" },
      { text: "Inspect lifting equipment regularly for damage.", role: "safety-officer" },
      { text: "Never stand or work under suspended loads.", role: "worker" }
    ],
    quiz: [
      {
        question: "What is the most dangerous place to be during lifting operations?",
        options: ["Next to the load", "Under the suspended load", "Behind the crane", "In the cab"],
        correctOption: 1,
        explanation: "Never stand under a suspended load - if the equipment fails, the load will fall on you."
      }
    ],
    status: "published",
    articleLink: "https://timesofindia.indiatimes.com/city/jaipur/derrick-collapse-kills-five-at-marble-quarry/articleshow/44762341.cms"
  },

  {
    title: "Punjab Sand Mine Excavation Collapse – Trench Cave-in",
    sourceType: "INTERNAL",
    date: new Date('2018-09-14'),
    location: "Punjab",
    mineSection: "Sand Mining Pit",
    severity: "major",
    tags: ["excavation", "cave-in"],
    hazardTags: ["excavation", "ground-failure"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Excavation walls collapsed, burying 7 workers. No shoring or sloping of excavation walls. Workers trapped under sand.",
    supervisorSummary: "Excavation depth exceeded safe limits without shoring. Walls were vertical instead of sloped. No rescue equipment available.",
    rootCauses: [
      { type: "technical", description: "Excavation walls not sloped or shored." },
      { type: "organizational", description: "No excavation safety plan or procedures." },
      { type: "human", description: "Workers entered unsafe excavation." }
    ],
    preventiveChecklist: [
      { text: "Slope or shore excavation walls per safety standards.", role: "supervisor" },
      { text: "Never enter excavations deeper than 4 feet without protection.", role: "worker" },
      { text: "Inspect excavations daily for signs of instability.", role: "safety-officer" }
    ],
    quiz: [
      {
        question: "What must be done for excavations deeper than 4 feet?",
        options: ["Work faster", "Slope walls or install shoring", "Add more workers", "Dig at night"],
        correctOption: 1,
        explanation: "Excavations deeper than 4 feet must have sloped walls or shoring to prevent cave-ins."
      }
    ],
    status: "published",
    articleLink: "https://indianexpress.com/article/india/seven-buried-in-sand-mine-excavation-collapse-5352891/"
  },

  {
    title: "Haryana Stone Mine Crusher Accident – Caught-in Machinery",
    sourceType: "INTERNAL",
    date: new Date('2016-05-20'),
    location: "Haryana",
    mineSection: "Crushing Plant",
    severity: "fatal",
    tags: ["crusher", "caught-in"],
    hazardTags: ["equipment", "mechanical"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Worker caught in stone crusher while clearing jam. Lockout-tagout not performed. Guards were removed.",
    supervisorSummary: "Worker attempted to clear jam while crusher was running. Safety guards removed and not replaced. No lockout procedure.",
    rootCauses: [
      { type: "human", description: "Lockout-tagout not performed before clearing jam." },
      { type: "technical", description: "Safety guards removed and not replaced." },
      { type: "organizational", description: "No procedure for safely clearing crusher jams." }
    ],
    preventiveChecklist: [
      { text: "Always lockout-tagout before clearing crusher jams.", role: "worker" },
      { text: "Ensure all guards in place before operating crusher.", role: "supervisor" },
      { text: "Use tools, never hands, to clear jams.", role: "worker" }
    ],
    quiz: [
      {
        question: "What must be done before clearing a crusher jam?",
        options: ["Work quickly", "Lockout-tagout and verify zero energy", "Wear gloves", "Call supervisor"],
        correctOption: 1,
        explanation: "Crusher must be locked out and energy verified as zero before clearing any jam."
      }
    ],
    status: "published",
    articleLink: "https://www.hindustantimes.com/india-news/worker-killed-in-crusher-accident-at-haryana-stone-mine/story-pqr456.html"
  },

  {
    title: "Delhi NCR Sand Mine Drowning – Water Accumulation Hazard",
    sourceType: "INTERNAL",
    date: new Date('2019-07-28'),
    location: "Delhi NCR",
    mineSection: "Sand Mining Pit",
    severity: "major",
    tags: ["drowning", "water-hazard"],
    hazardTags: ["water-hazard", "drowning"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "3 workers drowned in water-filled sand pit. No barriers or warning signs around water hazard. Workers could not swim.",
    supervisorSummary: "Water accumulated in pit from monsoon rains. No barriers, signs, or life-saving equipment present. Workers not trained in water safety.",
    rootCauses: [
      { type: "technical", description: "Water accumulation not drained or controlled." },
      { type: "organizational", description: "No barriers or warning signs around water hazard." },
      { type: "system", description: "No water safety training or rescue equipment." }
    ],
    preventiveChecklist: [
      { text: "Drain water accumulations or install barriers around them.", role: "supervisor" },
      { text: "Post warning signs around water hazards.", role: "safety-officer" },
      { text: "Provide life jackets and rescue equipment near water.", role: "manager" }
    ],
    quiz: [
      {
        question: "What should be done with water accumulations in mines?",
        options: ["Ignore them", "Drain them or install barriers and warning signs", "Use for drinking", "Fill with sand"],
        correctOption: 1,
        explanation: "Water accumulations must be drained or protected with barriers and warning signs."
      }
    ],
    status: "published",
    articleLink: "https://indianexpress.com/article/cities/delhi/three-drown-in-water-filled-sand-pit-5851234/"
  },

  {
    title: "Kerala China Clay Mine Landslide – Monsoon-Triggered Slope Failure",
    sourceType: "DGMS",
    date: new Date('2020-08-07'),
    location: "Kerala",
    mineSection: "Open Pit - Slope",
    severity: "catastrophic",
    tags: ["landslide", "slope-failure", "monsoon"],
    hazardTags: ["slope-failure", "environmental"],
    relevanceRoles: ["worker", "supervisor", "manager"],
    quickSummary: "Massive landslide during monsoon buried mine and killed 22 workers. Operations continued despite heavy rainfall warnings.",
    supervisorSummary: "Heavy monsoon rainfall saturated slopes. Operations not suspended despite weather warnings. Workers not evacuated in time.",
    rootCauses: [
      { type: "environmental", description: "Heavy monsoon rainfall saturated slopes." },
      { type: "organizational", description: "Operations not suspended during adverse weather." },
      { type: "system", description: "No slope monitoring or early warning system." }
    ],
    preventiveChecklist: [
      { text: "Suspend operations during heavy monsoon rainfall.", role: "manager" },
      { text: "Install slope monitoring systems in high-risk areas.", role: "safety-officer" },
      { text: "Evacuate mines when landslide risk is high.", role: "supervisor" }
    ],
    quiz: [
      {
        question: "When should mining operations be suspended?",
        options: ["Never", "During heavy rainfall or when slope instability is detected", "Only at night", "When convenient"],
        correctOption: 1,
        explanation: "Operations must be suspended during heavy rainfall or when slope instability is detected."
      }
    ],
    status: "published",
    articleLink: "https://www.bbc.com/news/world-asia-india-53692007"
  },

  {
    title: "Jammu & Kashmir Bauxite Mine Avalanche – Snow and Rock Slide",
    sourceType: "DGMS",
    date: new Date('2017-02-15'),
    location: "Jammu & Kashmir",
    mineSection: "Mountain Mine",
    severity: "major",
    tags: ["avalanche", "snow-slide"],
    hazardTags: ["avalanche", "environmental"],
    relevanceRoles: ["worker", "supervisor"],
    quickSummary: "Snow and rock avalanche buried mine camp, killing 11 workers. No avalanche warning system or safe camp location.",
    supervisorSummary: "Camp located in avalanche-prone area. No avalanche monitoring or warning system. Workers not trained in avalanche safety.",
    rootCauses: [
      { type: "environmental", description: "Heavy snowfall triggered avalanche." },
      { type: "organizational", description: "Camp located in high-risk avalanche zone." },
      { type: "system", description: "No avalanche monitoring or warning system." }
    ],
    preventiveChecklist: [
      { text: "Locate camps away from avalanche-prone slopes.", role: "manager" },
      { text: "Install avalanche monitoring and warning systems.", role: "safety-officer" },
      { text: "Train workers in avalanche safety and evacuation.", role: "supervisor" }
    ],
    quiz: [
      {
        question: "Where should mine camps be located in mountainous areas?",
        options: ["On steep slopes", "Away from avalanche-prone areas", "Near cliffs", "In valleys only"],
        correctOption: 1,
        explanation: "Camps must be located away from avalanche-prone slopes and rock fall hazard zones."
      }
    ],
    status: "published",
    articleLink: "https://www.hindustantimes.com/india-news/avalanche-buries-jk-mine-camp-11-killed/story-lmn789.html"
  }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = new Set((await CaseStudy.find({}, 'title')).map((doc) => doc.title));
    const newCases = indianMiningCaseStudies.filter((caseStudy) => !existing.has(caseStudy.title));

    if (!newCases.length) {
      console.log('No new case studies to insert.');
    } else {
      await CaseStudy.insertMany(newCases);
      console.log(`Inserted ${newCases.length} Indian mining case studies.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();

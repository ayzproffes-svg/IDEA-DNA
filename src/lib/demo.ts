import type { Tree, Idea, Person } from "@/types";
export const people: Person[] = [
  [
    "Maya Chen",
    "mayachen",
    "Environmental engineer. Making resilient systems accessible to everyone.",
  ],
  [
    "Arjun Patel",
    "arjunp",
    "Hardware tinkerer, community builder, and open source contributor.",
  ],
  [
    "Sofia Rivera",
    "sofiar",
    "Designing tools for more connected neighborhoods.",
  ],
  [
    "Theo Brooks",
    "theob",
    "Networks, field research, and things that work off-grid.",
  ],
].map(([display_name, username, bio], i) => ({
  id: `00000000-0000-4000-8000-00000000000${i + 1}`,
  display_name,
  username,
  bio,
  avatar_url: "",
}));
export const trees: Tree[] = [
  {
    title: "Low-Cost Water Monitoring System",
    slug: "water-monitoring",
    description:
      "Clean water starts with clear information. An affordable, community-owned way to understand what’s in our water.",
    tags: ["Climate tech", "Hardware", "Open source"],
  },
  {
    title: "Neighborhood Tool Library",
    slug: "neighborhood-tool-library",
    description:
      "What if your next project started with a neighbor? A shared toolkit for a less wasteful neighborhood.",
    tags: ["Community", "Circular economy"],
  },
  {
    title: "Open Source Disaster Response Kit",
    slug: "disaster-response-kit",
    description:
      "Communication and essential supplies when infrastructure goes down. Built openly, ready for the field.",
    tags: ["Resilience", "Hardware", "Open source"],
  },
].map((t, i) => ({
  ...t,
  id: `10000000-0000-4000-8000-00000000000${i + 1}`,
  creator_id: people[i].id,
  visibility: "public",
  created_at: "2026-10-18T10:00:00Z",
}));
const branches = [
  [
    "Affordable water-quality monitoring",
    "Low-power turbidity sensor",
    "A little sunlight goes a long way",
    "Let communities own the data",
    "How do we calibrate in the field?",
    "Solar-powered community water monitor",
    "A replaceable sensor cartridge",
    "Offline-first reporting",
  ],
  [
    "A shared toolkit for every block",
    "Simple reservations, fewer no-shows",
    "Repair skills worth sharing",
    "A neighborhood delivery loop",
    "Who covers accidental damage?",
    "The neighborhood workshop network",
    "Start with a trusted steward",
    "Borrow without a smartphone",
  ],
  [
    "An offline lifeline in a crisis",
    "Mesh networks without cell towers",
    "Solar charging at every hub",
    "Track essential medical supplies",
    "How do we verify urgent requests?",
    "A resilient community response hub",
    "Weatherproof modular enclosure",
    "Practice before the emergency",
  ],
];
export const demoNodes: Idea[] = trees.flatMap((t, ti) =>
  branches[ti].map((title, i) => ({
    id: `${ti + 2}0000000-0000-4000-8000-00000000000${i + 1}`,
    tree_id: t.id,
    parent_id:
      i === 0
        ? null
        : `${ti + 2}0000000-0000-4000-8000-00000000000${i === 6 ? 2 : i === 7 ? 4 : 1}`,
    author_id: people[i % 4].id,
    title,
    content:
      i === 0
        ? t.description
        : i === 1
          ? "Use a low-power, modular approach with parts available locally. Publish the bill of materials and test a small prototype with the people who will actually use it."
          : i === 2
            ? "A compact solar module and a rechargeable battery could keep the system running where reliable power is hard to find. Measure energy use before sizing the panel."
            : i === 5
              ? "Combine the strongest technical branches with a community-led maintenance model. Begin with a four-week pilot, document what breaks, and share the results openly."
              : "Keep the system accessible and maintainable. Test this contribution with community partners, document constraints, and share the results so the next contributor can build on them.",
    node_type: (
      [
        "root",
        "extension",
        "improvement",
        "extension",
        "question",
        "synthesis",
        "improvement",
        "constraint",
      ] as const
    )[i],
    status: "published",
    contribution_score: [24, 18, 21, 12, 8, 29, 9, 6][i],
    metadata: {},
    created_at: `2026-10-${18 + Math.min(i, 4)}T10:00:00Z`,
  })),
);
const specificCopy = [
  [
    "Affordable water monitoring should cost less than a household appliance and be maintainable without specialist tools. Start with turbidity and temperature, then evaluate conductivity after a field pilot. Publish the circuit and bill of materials.",
    "Sample turbidity every fifteen minutes using an LED and photodiode in a shaded chamber. Sleep the microcontroller between readings and budget for biofouling. Compare the first prototype against a calibrated reference meter.",
    "A 5 W solar panel and a protected rechargeable battery could support off-grid operation. Measure daily energy demand first; aim for three cloudy days of reserve capacity.",
    "Let a local water committee own the readings and decide what is published. Show trends with clear uncertainty labels. Support maintenance decisions without claiming that untreated water is safe to drink.",
    "How will a steward detect sensor drift without a lab? Test sealed reference samples, publish the calibration procedure, and distinguish a maintenance warning from a water-quality alert.",
    "Combine the sensor and solar module into a locally repairable monitoring station. A steward checks calibration weekly, and an offline log preserves readings until a connection is available. Pilot one station before expanding.",
    "Put the optical chamber on a sealed connector so a trained steward can swap it in minutes. Test corrosion and record the cartridge serial number with every calibration.",
    "Retain thirty days of readings and synchronize when connectivity returns. Keep timestamps, deduplicate uploads, and make a CSV export available without a cloud account.",
  ],
  [
    "Many households need a drill twice a year but cannot justify buying one. Start a shared collection at a community center, with a named steward and a clear borrowing agreement.",
    "Use a simple calendar with pickup windows and return reminders. Let stewards reserve tools by phone so residents do not need a smartphone to participate.",
    "Run a monthly repair workshop alongside pickup. Pair experienced volunteers with first-time borrowers, document common repairs, and set aside tools needing professional inspection.",
    "Try one scheduled cargo-bike loop each Saturday. Batch nearby deliveries and compare volunteer hours with collection at the library before promising home delivery.",
    "What is a fair policy for wear, accidents, and loss? Could an optional solidarity fund cover repairs without excluding residents who cannot afford a deposit?",
    "Combine reservations, workshops, and a delivery loop into a neighborhood workshop network. A steward coordinates inventory, volunteers teach safe use, and a six-week pilot measures utilization and repair costs.",
    "Begin with one trained steward and ten durable tools. Photograph each item at handoff and record the inspection date. Grow the collection only when maintenance capacity grows.",
    "Keep borrowing possible by phone or at the front desk. Print availability weekly and let stewards enter paper reservations into the shared calendar.",
  ],
  [
    "When cell towers fail, neighborhoods need to coordinate requests and supplies. Build a documented kit with offline messaging, local power, and a clear operating procedure for trained volunteers.",
    "Use mesh radios to relay short, structured messages between hubs. Test range in the actual terrain and document local radio regulations before choosing hardware.",
    "Pair each hub with a folding solar panel and protected battery. Publish a budget for radios, lighting, and limited phone charging. Provide a fuse and battery health indicators.",
    "Track supplies with an offline ledger and printable labels. Record transfers with timestamps and receiving hubs; avoid collecting patient medical details.",
    "Urgent requests can be mistaken, duplicated, or malicious. Use local volunteer verification and message identifiers. Distinguish unverified reports from confirmed needs.",
    "Combine mesh communication, solar charging, and a minimal supply ledger. Volunteers exchange verified requests without internet access and reconcile inventories when hubs reconnect. Validate the kit in a community drill.",
    "Use a gasketed enclosure with replaceable modules and accessible fuses. Test rain ingress, cable strain relief, and heat buildup in direct sun.",
    "Schedule quarterly drills, retain printed instructions, and review failures with the community. A kit is useful only if people can operate it under pressure.",
  ],
];
demoNodes.forEach((n, index) => {
  n.content = specificCopy[Math.floor(index / 8)][index % 8];
  if (n.node_type === "synthesis") {
    const siblings = demoNodes.filter((x) => x.tree_id === n.tree_id);
    n.parent_id = siblings[1].id;
    n.metadata = {
      sources: [siblings[1].id, siblings[2].id],
      model: "sample-blueprint",
      blueprint: {
        title: n.title,
        concept: n.content,
        problem_statement: trees.find((t) => t.id === n.tree_id)!.description,
        proposed_mechanism:
          "Integrate both technical branches with a named local steward, a documented maintenance process, and an offline operating mode.",
        key_components: [
          siblings[1].title,
          siblings[2].title,
          siblings[3].title,
        ],
        complementary_strengths: [
          "Infrastructure independence",
          "Local repair and ownership",
        ],
        conflicts_and_constraints: [
          "Energy and maintenance budgets need field measurements.",
          "A named steward must own routine checks.",
        ],
        risks_or_open_questions: [
          "What fails first in a four-week pilot?",
          "Can repairs use locally available parts?",
        ],
        suggested_next_contribution:
          "Publish a pilot protocol with a bill of materials and measurable success criteria.",
      },
    };
  }
});

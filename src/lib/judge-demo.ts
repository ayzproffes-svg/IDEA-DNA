import { demoNodes, trees } from "@/lib/demo";
// Isolated browser fixtures. Never written to Supabase or real-account storage.
export function seedJudgeSandbox() {
  const nodes = demoNodes.filter((n) => n.tree_id === trees[0].id),
    root = nodes.find((n) => n.node_type === "root")!,
    a = nodes.find((n) => n.node_type === "extension")!,
    b = nodes.find((n) => n.node_type === "improvement")!;
  const key = "ideadna-judge-innovation-" + trees[0].id;
  if (!localStorage.getItem(key))
    localStorage.setItem(
      key,
      JSON.stringify([
        {
          id: "sample-connection",
          node_id: a.id,
          target_id: b.id,
          author_id: trees[0].creator_id,
          kind: "relationship",
          body: JSON.stringify({
            summary:
              "Illustrative AI-style suggestion, prewritten for this sandbox; no AI request was run. Solar power may complement the low-power sensor.",
            similarities: ["Both address field deployment."],
            differences: ["One addresses sensing, the other power."],
            contradictions: [
              "Battery autonomy depends on actual sunlight and sensor duty cycle.",
            ],
            recommendations: [
              "Measure daily energy use before selecting a panel.",
            ],
            questions: ["What is the worst-case seasonal sunlight?"],
            model: "Prewritten demonstration fixture",
          }),
          relation: "combines_with",
          source_url: null,
          origin: "ai",
          status: "proposed",
          created_at: root.created_at,
        },
        {
          id: "sample-assumption",
          node_id: root.id,
          target_id: null,
          author_id: trees[0].creator_id,
          kind: "assumption",
          body: "Sample unverified assumption: local volunteers can calibrate the sensor reliably. Run a supervised calibration exercise before field deployment.",
          relation: null,
          source_url: null,
          origin: "human",
          status: "proposed",
          created_at: root.created_at,
        },
      ]),
    );
  if (!localStorage.getItem("ideadna-judge-revisions"))
    localStorage.setItem(
      "ideadna-judge-revisions",
      JSON.stringify([
        {
          id: "sample-revision",
          node_id: root.id,
          title: "Community water sensor concept",
          content:
            "Build an affordable water sensor. Power, calibration and maintenance methods remain undecided.",
          created_at: "2026-10-17T10:00:00Z",
        },
      ]),
    );
}

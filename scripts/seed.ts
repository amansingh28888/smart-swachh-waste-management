/**
 * SmartSwachh demo data seeder.
 *
 * Creates demo auth users (citizen/admin/worker + extra citizens & workers),
 * then inserts realistic fictional waste reports, identifications, tasks,
 * and notifications so every dashboard has data on first run.
 *
 * Usage:
 *   1. Fill .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   2. Run the SQL migration in supabase/migrations/0001_init.sql first
 *   3. npm run seed
 *
 * This script uses the SERVICE ROLE key and must never run in the browser.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const AREAS = ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"];
const WARDS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];

const CITIZEN_NAMES = [
  "Aditya Sharma", "Priya Verma", "Rohit Kumar", "Sneha Singh", "Amit Das",
  "Kavita Oraon", "Manish Tiwari", "Neha Kujur", "Suresh Mahato", "Pooja Nag",
];

const WORKER_NAMES = [
  { name: "Raj Kumar", area: "Ward 5" },
  { name: "Sunil Mahto", area: "Ward 2" },
  { name: "Deepak Soren", area: "Ward 3" },
  { name: "Vikram Yadav", area: "Ward 1" },
  { name: "Anil Kachhap", area: "Ward 4" },
];

const PROBLEM_SAMPLES = [
  { desc: "Garbage dumped beside the main road near the market.", type: "Garbage Accumulation", severity: "High" as const },
  { desc: "Overflowing community dustbin, not collected for 3 days.", type: "Overflowing Bin", severity: "Medium" as const },
  { desc: "Open drain blocked with plastic waste, water stagnating.", type: "Drainage Blockage", severity: "High" as const },
  { desc: "Scattered litter near the park entrance.", type: "Litter", severity: "Low" as const },
  { desc: "Construction debris left on footpath for over a week.", type: "Debris Dumping", severity: "Medium" as const },
];

const WASTE_ITEMS = [
  { name: "Plastic Bottle", category: "Dry Waste", type: "Recyclable", bin: "Blue / Dry Waste Bin", method: "Recycling" },
  { name: "Banana Peel", category: "Wet Waste", type: "Biodegradable", bin: "Green / Wet Waste Bin", method: "Composting" },
  { name: "Used Battery", category: "Hazardous Waste", type: "Hazardous", bin: "Hazardous Waste Bin", method: "Hazardous Treatment" },
  { name: "Cardboard Box", category: "Dry Waste", type: "Recyclable", bin: "Blue / Dry Waste Bin", method: "Recycling" },
  { name: "Food Wrapper", category: "Dry Waste", type: "Non-Recyclable", bin: "Black / Landfill Bin", method: "Landfill" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createUser(email: string, full_name: string, role: "citizen" | "admin" | "worker") {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "Demo@12345",
    email_confirm: true,
    user_metadata: { full_name, role },
  });
  if (error) {
    // If the user already exists, look them up instead of failing the whole seed.
    console.warn(`  (skip) ${email}: ${error.message}`);
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === email);
    return existing?.id ?? null;
  }
  return data.user?.id ?? null;
}

async function main() {
  console.log("Seeding SmartSwachh demo data...\n");

  console.log("Creating core demo accounts...");
  const adminId = await createUser("admin@demo.com", "Municipal Admin", "admin");
  const citizenMainId = await createUser("citizen@demo.com", "Demo Citizen", "citizen");
  const workerMainId = await createUser("worker@demo.com", "Raj Kumar", "worker");

  console.log("Creating additional citizens...");
  const citizenIds: string[] = [];
  for (let i = 0; i < CITIZEN_NAMES.length; i++) {
    const id = await createUser(`citizen${i + 1}@demo.com`, CITIZEN_NAMES[i], "citizen");
    if (id) citizenIds.push(id);
  }
  if (citizenMainId) citizenIds.unshift(citizenMainId);

  console.log("Creating additional workers...");
  const workerProfileIds: string[] = [];
  for (let i = 0; i < WORKER_NAMES.length; i++) {
    const id = await createUser(`worker${i + 1}@demo.com`, WORKER_NAMES[i].name, "worker");
    if (id) workerProfileIds.push(id);
  }

  // Turn worker profiles into `workers` rows
  console.log("Registering worker records...");
  const workerRowIds: string[] = [];
  const allWorkerProfiles = workerMainId
    ? [{ id: workerMainId, area: "Ward 5" }, ...workerProfileIds.map((id, i) => ({ id, area: WORKER_NAMES[i].area }))]
    : workerProfileIds.map((id, i) => ({ id, area: WORKER_NAMES[i].area }));

  for (let i = 0; i < allWorkerProfiles.length; i++) {
    const wp = allWorkerProfiles[i];
    const { data, error } = await supabase
      .from("workers")
      .upsert(
        {
          profile_id: wp.id,
          employee_code: `SW-${String(i + 1).padStart(3, "0")}`,
          assigned_area: wp.area,
          availability: "available",
        },
        { onConflict: "profile_id" }
      )
      .select("id")
      .single();
    if (error) console.warn("  worker upsert error:", error.message);
    if (data) workerRowIds.push(data.id);
  }

  if (citizenIds.length === 0) {
    console.error("No citizens available — aborting report seeding.");
    return;
  }

  console.log("Creating waste identifications (20)...");
  for (let i = 0; i < 20; i++) {
    const item = pick(WASTE_ITEMS);
    await supabase.from("waste_identifications").insert({
      citizen_id: pick(citizenIds),
      image_url: `https://placehold.co/600x400?text=${encodeURIComponent(item.name)}`,
      waste_name: item.name,
      category: item.category,
      waste_type: item.type,
      recommended_bin: item.bin,
      disposal_method: item.method,
      ai_response: {
        wasteName: item.name,
        category: item.category,
        type: item.type,
        recommendedBin: item.bin,
        disposalMethod: item.method,
        instructions: "Follow local segregation guidelines before disposal.",
        confidence: 0.8 + Math.random() * 0.19,
      },
    });
  }

  console.log("Creating waste reports + tasks (30)...");
  const statuses: Array<"pending" | "verified" | "assigned" | "in_progress" | "completed" | "rejected"> = [
    "pending", "verified", "assigned", "in_progress", "completed", "rejected",
  ];

  for (let i = 0; i < 30; i++) {
    const problem = pick(PROBLEM_SAMPLES);
    const area = pick(AREAS);
    const ward = pick(WARDS);
    const status = pick(statuses);

    const { data: report, error } = await supabase
      .from("waste_reports")
      .insert({
        citizen_id: pick(citizenIds),
        image_url: `https://placehold.co/600x400?text=${encodeURIComponent(problem.type)}`,
        description: problem.desc,
        location_text: `${ward}, ${area}`,
        latitude: 23.3 + Math.random() * 1.2,
        longitude: 85.3 + Math.random() * 1.2,
        problem_type: problem.type,
        waste_type: pick(["Mixed Waste", "Dry Waste", "Wet Waste", "Hazardous Waste"]),
        category: "Sanitation",
        severity: problem.severity,
        final_priority: problem.severity,
        ai_analysis: {
          problemType: problem.type,
          wasteType: "Mixed Waste",
          severity: problem.severity,
          recommendedAction:
            problem.severity === "High" ? "Immediate Collection" : "Scheduled Collection",
          reason: "Pattern consistent with reported sanitation issue.",
          confidence: 0.7 + Math.random() * 0.29,
        },
        status,
      })
      .select("id")
      .single();

    if (error || !report) {
      console.warn("  report insert error:", error?.message);
      continue;
    }

    if (["assigned", "in_progress", "completed"].includes(status) && workerRowIds.length > 0) {
      const taskStatus =
        status === "assigned" ? "assigned" : status === "in_progress" ? "in_progress" : "completed";

      await supabase.from("tasks").insert({
        report_id: report.id,
        worker_id: pick(workerRowIds),
        task_type: "Collection",
        priority: problem.severity,
        status: taskStatus,
        disposal_method: taskStatus === "completed" ? pick(["Recycling", "Composting", "Landfill", "Hazardous Treatment"]) : null,
        before_image_url: taskStatus !== "assigned" ? `https://placehold.co/600x400?text=Before` : null,
        after_image_url: taskStatus === "completed" ? `https://placehold.co/600x400?text=After` : null,
        started_at: taskStatus !== "assigned" ? new Date().toISOString() : null,
        completed_at: taskStatus === "completed" ? new Date().toISOString() : null,
      });
    }
  }

  console.log("Creating a few notifications...");
  if (adminId) {
    await supabase.from("notifications").insert({
      user_id: adminId,
      title: "New garbage report received",
      message: "A new high-priority sanitation report was just submitted.",
      type: "report",
    });
  }

  console.log("\nSeed complete. Demo logins (password: Demo@12345):");
  console.log("  citizen@demo.com / admin@demo.com / worker@demo.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export type UserRole = "citizen" | "admin" | "worker";

export type ReportStatus =
  | "pending"
  | "verified"
  | "assigned"
  | "in_progress"
  | "completed"
  | "rejected";

export type Severity = "Low" | "Medium" | "High";

export type WorkerAvailability = "available" | "busy" | "offline";

export type TaskStatus = "assigned" | "accepted" | "in_progress" | "completed";

export type DisposalMethod =
  | "Recycling"
  | "Composting"
  | "Landfill"
  | "Hazardous Treatment"
  | "Other";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface WasteIdentification {
  id: string;
  citizen_id: string;
  image_url: string;
  waste_name: string;
  category: string;
  waste_type: string;
  recommended_bin: string;
  disposal_method: string;
  ai_response: WasteAIResult;
  created_at: string;
}

export interface WasteReport {
  id: string;
  citizen_id: string;
  image_url: string | null;
  description: string;
  latitude: number | null;
  longitude: number | null;
  location_text: string;
  problem_type: string | null;
  waste_type: string | null;
  category: string | null;
  severity: Severity | null;
  final_priority: Severity | null;
  ai_analysis: ComplaintAIResult | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  profile_id: string;
  employee_code: string;
  assigned_area: string;
  availability: WorkerAvailability;
  created_at: string;
  profile?: Profile;
}

export interface Task {
  id: string;
  report_id: string;
  worker_id: string | null;
  task_type: string;
  priority: Severity;
  status: TaskStatus;
  before_image_url: string | null;
  after_image_url: string | null;
  disposal_method: DisposalMethod | null;
  notes: string | null;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  report?: WasteReport;
  worker?: Worker;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "report" | "task" | "system";
  read: boolean;
  created_at: string;
}

// ---- AI result shapes ----

export interface WasteAIResult {
  wasteName: string;
  category: "Wet Waste" | "Dry Waste" | "Hazardous Waste" | "Recyclable" | "Other";
  type: string;
  recommendedBin: string;
  disposalMethod: string;
  instructions: string;
  confidence: number;
  demoMode?: boolean;
}

export interface ComplaintAIResult {
  problemType: string;
  wasteType: string;
  severity: Severity;
  recommendedAction: string;
  reason: string;
  confidence: number;
  demoMode?: boolean;
}

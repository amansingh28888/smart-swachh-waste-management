"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ImageUploader } from "@/components/ImageUploader";
import type { ComplaintAIResult } from "@/types";

export default function ReportGarbagePage() {
  const router = useRouter();
  const [uploaded, setUploaded] = useState<{ url: string; base64: string; mimeType: string } | null>(null);
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [category, setCategory] = useState("Sanitation");
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<ComplaintAIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser. Please enter it manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationText(`Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`);
      },
      () => setError("Couldn't access your location. Please enter it manually."),
      { timeout: 8000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationText.trim()) {
      setError("Please add a location for this report.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/analyze-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          imageBase64: uploaded?.base64,
          mimeType: uploaded?.mimeType,
          imageUrl: uploaded?.url,
          locationText,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          category,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setAssessment(json.result);
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("Couldn't submit your report right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done && assessment) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-900">Report submitted</h1>
          <p className="mt-1 text-slate-500">Thank you — your report is now with the municipality.</p>

          <Card className="mt-6 text-left">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">AI Assessment</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Problem</dt>
                <dd className="font-medium text-slate-900">{assessment.problemType}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Severity</dt>
                <dd><Badge tone={assessment.severity === "High" ? "red" : assessment.severity === "Medium" ? "yellow" : "green"}>{assessment.severity}</Badge></dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-400">Recommended Action</dt>
                <dd className="font-medium text-slate-900">{assessment.recommendedAction}</dd>
              </div>
            </dl>
          </Card>

          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/citizen/reports")}>
              Track my reports
            </Button>
            <Button onClick={() => router.push("/citizen/dashboard")}>Back to dashboard</Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Report Garbage</h1>
        <p className="mb-6 text-slate-500">Tell us what&apos;s wrong — AI will help assess priority.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <label className="mb-2 block text-sm font-medium text-slate-700">Photo (optional)</label>
            <ImageUploader
              bucket="waste-images"
              label="Upload a photo of the problem"
              onUploaded={(url, base64, mimeType) => setUploaded({ url, base64, mimeType })}
            />
          </Card>

          <Card className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <Textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Garbage dumped beside the road near the market."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
              <div className="flex gap-2">
                <Input
                  required
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g. Ward 5, Main Market, Ranchi"
                />
                <Button type="button" variant="outline" onClick={useMyLocation}>
                  <LocateFixed className="h-4 w-4" /> Use my location
                </Button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Category (optional)</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Sanitation</option>
                <option>Overflowing Bin</option>
                <option>Drainage</option>
                <option>Illegal Dumping</option>
                <option>Other</option>
              </Select>
            </div>
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
            AI-generated classification is a recommendation. Final action may be verified by
            municipal staff.
          </div>

          <Button type="submit" className="w-full" loading={submitting}>
            Submit Report
          </Button>
        </form>
      </main>
    </>
  );
}

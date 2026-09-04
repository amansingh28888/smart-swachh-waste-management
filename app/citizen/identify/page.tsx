"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageUploader } from "@/components/ImageUploader";
import type { WasteAIResult } from "@/types";

export default function IdentifyWastePage() {
  const [uploaded, setUploaded] = useState<{ url: string; base64: string; mimeType: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<WasteAIResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!uploaded) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze-waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: uploaded.base64,
          mimeType: uploaded.mimeType,
          imageUrl: uploaded.url,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      setResult(json.result);
      setSaved(true); // API route already persists the identification
    } catch (err) {
      console.error(err);
      setError("Couldn't analyze this image right now. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Identify My Waste</h1>
        <p className="mb-6 text-slate-500">Upload a photo to find out how to segregate and dispose of it.</p>

        <Card>
          <ImageUploader
            bucket="waste-images"
            label="Drop a waste photo here, or click to upload"
            onUploaded={(url, base64, mimeType) => {
              setUploaded({ url, base64, mimeType });
              setResult(null);
              setSaved(false);
            }}
          />

          {uploaded && !result && (
            <Button className="mt-4 w-full" loading={analyzing} onClick={handleAnalyze}>
              <Sparkles className="h-4 w-4" />
              {analyzing ? "AI is identifying the waste..." : "Analyze with AI"}
            </Button>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </Card>

        {result && (
          <Card className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">AI Result</h2>
              <div className="flex items-center gap-2">
                {result.demoMode && <Badge tone="purple">AI Demo Mode</Badge>}
                <Badge tone={result.confidence < 0.6 ? "yellow" : "green"}>
                  AI Confidence: {Math.round(result.confidence * 100)}%
                </Badge>
              </div>
            </div>

            {result.confidence < 0.6 && (
              <p className="mb-3 text-sm text-yellow-700">
                AI is uncertain. Please verify the classification.
              </p>
            )}

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Waste" value={result.wasteName} />
              <Field label="Category" value={result.category} />
              <Field label="Type" value={result.type} />
              <Field label="Recommended Bin" value={result.recommendedBin} />
              <Field label="Disposal" value={result.disposalMethod} className="col-span-2" />
              <Field label="Instructions" value={result.instructions} className="col-span-2" />
            </dl>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
              AI-generated classification is a recommendation. Final action may be verified by
              municipal staff.
            </div>

            {saved && (
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-brand-700">
                <CheckCircle2 className="h-4 w-4" /> Result saved to your identification history.
              </div>
            )}
          </Card>
        )}
      </main>
    </>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
    </div>
  );
}

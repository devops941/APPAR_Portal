"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileCheck2,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StateDistrictSelect } from "@/components/ui/StateDistrictSelect";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { EmailInput } from "@/components/ui/EmailInput";
import { formatIndianPhone } from "@/lib/data/india-geo";
import {
  InstitutionDocumentUploader,
  type InstitutionDocItem,
} from "@/components/institutions/InstitutionDocumentUploader";

const CATEGORIES = [
  { value: "ENGINEERING", label: "Engineering & Technology (B.E. / B.Tech / M.Tech)" },
  { value: "POLYTECHNIC", label: "Polytechnic / Diploma Technical Institute" },
  { value: "MANAGEMENT", label: "Management Studies (MBA / PGDM)" },
  { value: "PHARMACY", label: "Pharmacy & Pharmaceutical Sciences" },
  { value: "ARTS_SCIENCE", label: "Arts, Humanities, Science & Commerce" },
];

export default function NewInstitutionPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    code: "",
    category: "ENGINEERING",
    approvalReference: "",
    street: "",
    city: "",
    district: "",
    state: "Tamil Nadu",
    pincode: "",
    contactEmail: "",
    contactPhone: "",
    principalName: "",
  });

  const [documents, setDocuments] = useState<InstitutionDocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchNextCode = async (name?: string) => {
    setGeneratingCode(true);
    try {
      const url = name ? `/api/institutions/next-code?name=${encodeURIComponent(name)}` : "/api/institutions/next-code";
      const res = await fetch(url).then((r) => r.json());
      if (res?.success && res.data?.nextCode) {
        setForm((prev) => ({ ...prev, code: res.data.nextCode }));
      }
    } catch (e) {
      console.error("Failed to fetch next code:", e);
    } finally {
      setGeneratingCode(false);
    }
  };

  useEffect(() => {
    fetchNextCode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!form.state || !form.district) {
      setErrorMsg("Please select a valid Indian State and District from the dropdown.");
      setLoading(false);
      return;
    }

    const formattedPhone = form.contactPhone.startsWith("+91")
      ? form.contactPhone
      : formatIndianPhone(form.contactPhone);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      category: form.category,
      approvalReference: form.approvalReference.trim() || `AICTE-${Date.now()}`,
      address: {
        street: form.street.trim() || "Main Campus",
        city: form.city.trim() || form.district.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      },
      contactEmail: form.contactEmail.trim().toLowerCase(),
      contactPhone: formattedPhone || form.contactPhone.trim(),
      principalName: form.principalName.trim(),
      documents,
    };

    try {
      const res = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/institutions/${data.data._id}`);
      } else {
        setErrorMsg(data.error?.message || "Failed to register institution. Please verify your entries.");
      }
    } catch (err) {
      console.error("Failed to register institution:", err);
      setErrorMsg("A network error occurred while communicating with the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Link
          href="/institutions"
          className="flex items-center gap-1.5 font-medium hover:text-emerald-600 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Institutions Directory</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Register New Institution</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Register New Institution
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <Sparkles className="h-3.5 w-3.5" /> AICTE Statutory Onboarding
            </span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Onboard an accredited university, engineering college, or polytechnic campus for APAAR student tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => router.push("/institutions")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
          >
            {loading ? "Registering..." : "Submit Registration"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-xs font-medium text-danger animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Registration Unsuccessful</p>
            <p className="mt-0.5 text-danger/90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Structured Full-Width Form Layout */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Column (8 cols): Identity & Campus Geo */}
          <div className="space-y-6 lg:col-span-8">
            {/* Card 1: Statutory Identity & Regulatory Ref */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-border/80 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text">Institutional Identity & Classification</h2>
                  <p className="text-xs text-text-secondary">Statutory legal name and accreditation identifier</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Legal Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Full Legal Institution Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Institute of Technology, Tiruchirappalli"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Institution Unique Code with Auto-Generated Badge */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Institution Code (Unique Identifier) <span className="text-danger">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ⚡ Auto-Generated
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. INST-001"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-border px-3.5 py-2.5 pr-10 text-sm font-mono font-bold uppercase text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                    <button
                      type="button"
                      title="Generate code based on college name"
                      disabled={generatingCode}
                      onClick={() => fetchNextCode(form.name)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${generatingCode ? "animate-spin text-emerald-600" : ""}`} />
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-text-secondary">
                    Sequential unique code automatically allocated for this institution.
                  </p>
                </div>

                {/* AICTE Approval Reference */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    AICTE / UGC Approval Reference <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-332910411 or F.No. 431/2026"
                    value={form.approvalReference}
                    onChange={(e) => setForm({ ...form, approvalReference: e.target.value })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Institution Category */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Institution Category & Academic Domain <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Campus Geographical Location & Postal Identity */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-border/80 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text">Campus Geographical Location & Postal Code</h2>
                  <p className="text-xs text-text-secondary">
                    Official Indian States, statutory districts, and municipal cities powered by country-state-city
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {/* Campus Street Address */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Campus Postal Address / Street <span className="text-danger">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Complete postal campus address (e.g. Tanjore Main Road, National Highway 67)..."
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Dynamic State & District Cascade Component */}
                <StateDistrictSelect
                  selectedState={form.state}
                  selectedDistrict={form.district}
                  selectedCity={form.city}
                  pincode={form.pincode}
                  onStateChange={(state) => setForm((prev) => ({ ...prev, state }))}
                  onDistrictChange={(district) => setForm((prev) => ({ ...prev, district }))}
                  onCityChange={(city) => setForm((prev) => ({ ...prev, city }))}
                  onPincodeChange={(pincode) => setForm((prev) => ({ ...prev, pincode }))}
                  required
                />
              </div>
            </div>

            {/* Card 3: Statutory Accreditation Documents (Cloudinary Multi-Upload) */}
            <InstitutionDocumentUploader
              documents={documents}
              onChange={setDocuments}
              disabled={loading}
            />
          </div>

          {/* Sidebar Column (4 cols): Contacts & Compliance Guidance */}
          <div className="space-y-6 lg:col-span-4">
            {/* Card 3: Institutional Governance & Official Contacts */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-border/80 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text">Leadership & Contacts</h2>
                  <p className="text-xs text-text-secondary">
                    Authorized principal & primary contact channels
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {/* Principal Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Principal / Director Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. G. Aghila"
                    value={form.principalName}
                    onChange={(e) => setForm({ ...form, principalName: e.target.value })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Email Input */}
                <EmailInput
                  label="Official Institutional Email"
                  placeholder="principal@institution.edu.in"
                  value={form.contactEmail}
                  onChange={(contactEmail) => setForm((prev) => ({ ...prev, contactEmail }))}
                  required
                />

                {/* Phone Input */}
                <PhoneInput
                  label="Official Contact Phone"
                  placeholder="98765 43210"
                  value={form.contactPhone}
                  onChange={(contactPhone) => setForm((prev) => ({ ...prev, contactPhone }))}
                  required
                />
              </div>
            </div>

            {/* Card 4: Statutory Onboarding Guidelines */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                  Statutory Scrutiny Checklist
                </h3>
              </div>

              <ul className="mt-3 space-y-2.5 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>Profile registers immediately in <strong>DRAFT</strong> status for administrative review.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>Permanent AICTE/UGC ID will be cross-checked against AISHE records.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>Location cascade conforms to official Census of India district registry.</span>
                </li>
              </ul>
            </div>

            {/* Card 5: Submission Actions */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Registering Institution...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Register Institution
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/institutions")}
                disabled={loading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
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

export default function EditInstitutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [form, setForm] = useState({
    name: "",
    code: "",
    category: "ENGINEERING",
    approvalReference: "",
    street: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    contactEmail: "",
    contactPhone: "",
    principalName: "",
  });

  const [status, setStatus] = useState<string>("DRAFT");
  const [documents, setDocuments] = useState<InstitutionDocItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadInstitution() {
      try {
        const res = await fetch(`/api/institutions/${id}`);
        const data = await res.json();
        if (data.success && data.data?.institution) {
          const inst = data.data.institution;
          setForm({
            name: inst.name || "",
            code: inst.code || "",
            category: inst.category || "ENGINEERING",
            approvalReference: inst.approvalReference || "",
            street: inst.address?.street || "",
            city: inst.address?.city || "",
            district: inst.address?.district || "",
            state: inst.address?.state || "",
            pincode: inst.address?.pincode || "",
            contactEmail: inst.contactEmail || "",
            contactPhone: inst.contactPhone || "",
            principalName: inst.principalName || "",
          });
          setStatus(inst.status || "DRAFT");
          setDocuments(inst.documents || []);
        } else {
          setErrorMsg(data.error?.message || "Failed to load institution details.");
        }
      } catch (err) {
        console.error("Error loading institution:", err);
        setErrorMsg("Failed to connect to the server.");
      } finally {
        setInitialLoading(false);
      }
    }

    loadInstitution();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!form.state || !form.district) {
      setErrorMsg("Please select a valid Indian State and District.");
      setSaving(false);
      return;
    }

    const formattedPhone = form.contactPhone.startsWith("+91")
      ? form.contactPhone
      : formatIndianPhone(form.contactPhone);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      category: form.category,
      approvalReference: form.approvalReference.trim(),
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
      const res = await fetch(`/api/institutions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Institution details updated successfully!");
        setTimeout(() => {
          router.push(`/institutions/${id}`);
        }, 800);
      } else {
        setErrorMsg(data.error?.message || "Failed to update institution.");
      }
    } catch (err) {
      console.error("Failed to update institution:", err);
      setErrorMsg("A network error occurred while updating the institution.");
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-text-secondary">Loading institution profile for editing...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Link
          href="/institutions"
          className="flex items-center gap-1.5 font-medium hover:text-emerald-600 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Institutions</span>
        </Link>
        <span>/</span>
        <Link
          href={`/institutions/${id}`}
          className="font-medium hover:text-emerald-600 transition truncate max-w-[240px]"
        >
          {form.name || "Institution"}
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Edit Details</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Edit Institution Details
            </h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Update statutory accreditation records, leadership contacts, and postal geo coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/institutions/${id}`)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-xs font-medium text-danger animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Update Failed</p>
            <p className="mt-0.5 text-danger/90">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg} Redirecting back to profile...</span>
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
                  <p className="text-xs text-text-secondary">Legal institution name and unique accreditation code</p>
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
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Institution Unique Code */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Institution Code (Unique Identifier) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-mono uppercase text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* AICTE Approval Reference */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    AICTE / Regulatory Approval Ref <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.approvalReference}
                    onChange={(e) => setForm({ ...form, approvalReference: e.target.value })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Institution Category */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Institution Category & Domain <span className="text-danger">*</span>
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
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Dynamic State & District Cascade Component with Pre-filled Data */}
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

            {/* Statutory Accreditation Documents (Cloudinary Multi-Upload) */}
            <InstitutionDocumentUploader
              documents={documents}
              onChange={setDocuments}
              disabled={saving}
              institutionId={id}
            />
          </div>

          {/* Sidebar Column (4 cols): Contacts & Update Controls */}
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
                    value={form.principalName}
                    onChange={(e) => setForm({ ...form, principalName: e.target.value })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-text bg-surface transition outline-none hover:border-emerald-500/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>

                {/* Email Input */}
                <EmailInput
                  label="Official Institutional Email"
                  value={form.contactEmail}
                  onChange={(contactEmail) => setForm((prev) => ({ ...prev, contactEmail }))}
                  required
                />

                {/* Phone Input */}
                <PhoneInput
                  label="Official Contact Phone"
                  value={form.contactPhone}
                  onChange={(contactPhone) => setForm((prev) => ({ ...prev, contactPhone }))}
                  required
                />
              </div>
            </div>

            {/* Card 4: Audit Trail Note */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                  Statutory Record Trail
                </h3>
              </div>

              <p className="mt-3 text-xs text-text-secondary leading-relaxed">
                Modifications to institutional contact details and campus geo coordinates are logged in the platform compliance audit trail under Super Administrator authority.
              </p>
            </div>

            {/* Card 5: Action Controls */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-3">
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving Changes...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Save className="h-4 w-4" />
                    Save & Update Institution
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/institutions/${id}`)}
                disabled={saving}
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

"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Save, CalendarDays, MapPin, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  tournamentInfoSchema,
  type TournamentInfoFormData,
} from "@/lib/validators/tournament-info";
import type { Tournament } from "@/lib/types/tournament";
import { PageHeader, PageBody } from "../../_components/PageLayout";

const TABS = [
  "Cơ bản",
  "Chi tiết & Thể lệ",
  "Nhà tài trợ",
  "Banner & Hình ảnh",
] as const;
type Tab = (typeof TABS)[number];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function formatDateDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}`;
}

// ——— Preview Card ———
function PreviewCard({
  data,
  categories,
}: {
  data: TournamentInfoFormData;
  categories: string[];
}) {
  return (
    <div className="w-[280px] flex-shrink-0 border-l border-zinc-800 p-5 flex flex-col gap-4">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
        Preview · Thẻ giải
      </p>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {/* Banner area */}
        <div className="h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-start p-2.5">
          <span className="flex items-center gap-1 text-[11px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="p-3.5">
          <p className="text-[15px] font-bold text-white leading-snug line-clamp-2">
            {data.name || "Tên giải"}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5">
            {data.location
              ? (data.location.split(",").at(-2)?.trim() ?? data.location)
              : "Địa điểm"}
            {data.startDate && data.endDate
              ? ` · ${formatDateDisplay(data.startDate)} — ${formatDateDisplay(data.endDate)}`
              : ""}
          </p>
          <div className="flex flex-wrap gap-1 mt-2.5">
            {categories.length > 0 ? (
              categories.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                — hạng mục —
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-600 italic leading-relaxed">
        Cập nhật khi bạn lưu. Có thể khác với public sau cache CDN.
      </p>
    </div>
  );
}

// ——— Field wrappers ———
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] text-zinc-300 font-medium">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = cn(
  "w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2",
  "text-sm text-white placeholder:text-zinc-600",
  "focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500",
  "transition-colors",
);

// ——— Main component ———
export function TournamentInfoClient({
  tournament,
  categories,
}: {
  tournament: Tournament;
  categories: string[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Cơ bản");
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TournamentInfoFormData, unknown, TournamentInfoFormData>({
    resolver: zodResolver(
      tournamentInfoSchema,
    ) as Resolver<TournamentInfoFormData>,
    defaultValues: {
      name: tournament.name,
      slug: tournament.slug,
      description: tournament.description,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      location: tournament.location,
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");
  const formData = watch();

  // Auto-generate slug từ tên — chỉ khi user chưa tự sửa slug
  useEffect(() => {
    if (!slugManual && nameValue) {
      setValue("slug", slugify(nameValue), { shouldDirty: true });
    }
  }, [nameValue, slugManual, setValue]);

  async function onSubmit(data: TournamentInfoFormData) {
    setSaving(true);
    // TODO: gọi Cloud Function updateTournamentInfo(tournamentId, data)
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    // TODO: toast success + trigger audit log
  }

  const actions = (
    <>
      <a
        href={`https://fbtournament.vn/giai/${slugValue}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 h-8 px-3 text-[13px] border border-zinc-700 rounded-md text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        Xem trang public
      </a>
      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        disabled={saving || !isDirty}
        className={cn(
          "flex items-center gap-1.5 h-8 px-3 text-[13px] rounded-md font-medium transition-colors",
          isDirty && !saving
            ? "bg-orange-500 hover:bg-orange-600 text-white"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
        )}
      >
        <Save className="w-3.5 h-3.5" />
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </>
  )

  return (
    <>
      <PageHeader
        title="Thông tin giải"
        description="Cấu hình cơ bản, chi tiết, nhà tài trợ, thanh toán. Mọi thay đổi đều có audit log."
        actions={actions}
      />

      <PageBody sidePanel={<PreviewCard data={formData} categories={categories} />}>
        {/* Tabs nav */}
        <div className="px-8 border-b border-zinc-800">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors",
                  activeTab === tab
                    ? "border-orange-500 text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300",
                )}
              >
                {tab}
                {tab === "Nhà tài trợ" && (
                  <span className="ml-1.5 text-[11px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                    {tournament.sponsors.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Form content */}
        <form
          id="tournament-info-form"
          onSubmit={handleSubmit(onSubmit)}
          className="px-8 py-6 space-y-5"
        >
          {activeTab === "Cơ bản" && (
            <>
              <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                <h2 className="text-[13px] font-semibold text-zinc-300">Định danh</h2>

                <Field label="Tên giải" required error={errors.name?.message}>
                  <input
                    {...register("name")}
                    placeholder="VD: Giải Cầu Lông Mở Rộng Sài Gòn 2026"
                    className={inputCls}
                  />
                </Field>

                <Field label="Slug URL (tự sinh, có thể sửa)" error={errors.slug?.message}>
                  <div className="flex items-center">
                    <span className="flex-shrink-0 h-9 flex items-center px-3 bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-md text-[12px] text-zinc-500 whitespace-nowrap">
                      fbtournament.vn/giai/
                    </span>
                    <div className="relative flex-1">
                      <input
                        {...register("slug")}
                        onFocus={() => setSlugManual(true)}
                        placeholder="ten-giai-2026"
                        className={cn(
                          inputCls,
                          "rounded-l-none pr-8",
                          !errors.slug && slugValue && "border-emerald-600 focus:ring-emerald-500",
                        )}
                      />
                      {!errors.slug && slugValue && (
                        <BadgeCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                </Field>

                <Field label="Mô tả ngắn" error={errors.description?.message}>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Mô tả ngắn gọn về giải đấu..."
                    className={cn(inputCls, "resize-y min-h-[80px]")}
                  />
                </Field>
              </section>

              <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                <h2 className="text-[13px] font-semibold text-zinc-300">Thời gian & Địa điểm</h2>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ngày bắt đầu" required error={errors.startDate?.message}>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                      <input {...register("startDate")} type="date" className={cn(inputCls, "pl-8")} />
                    </div>
                  </Field>
                  <Field label="Ngày kết thúc" required error={errors.endDate?.message}>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                      <input {...register("endDate")} type="date" className={cn(inputCls, "pl-8")} />
                    </div>
                  </Field>
                </div>

                <Field label="Địa điểm" required error={errors.location?.message}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                    <input
                      {...register("location")}
                      placeholder="VD: Nhà thi đấu Phú Thọ, 219 Lý Thường Kiệt, Q.Phú Nhuận, TP.HCM"
                      className={cn(inputCls, "pl-8")}
                    />
                  </div>
                </Field>
              </section>
            </>
          )}

          {activeTab !== "Cơ bản" && (
            <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-zinc-800 text-zinc-600 text-sm">
              Tab &quot;{activeTab}&quot; — sẽ implement ở phase tương ứng
            </div>
          )}
        </form>
      </PageBody>
    </>
  );
}

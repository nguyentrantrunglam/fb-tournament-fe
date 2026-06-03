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
import { PageHeader, PageBody } from "../../_components/PageLayout";
import { useTournament, useTournamentRefresh } from "../../_components/tournament-context";
import { updateTournament } from "@/lib/tournaments/api";
import { authErrorMessage } from "@/lib/auth/auth-error";
import { TournamentHeroCard } from "@/components/tournament-hero-card";
import { DetailsRulesTab } from "./DetailsRulesTab";
import { SponsorsTab } from "./SponsorsTab";
import { MediaTab } from "./MediaTab";

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


// ——— Preview Card (dùng chung TournamentHeroCard) ———
function PreviewCard({
  data,
  categories,
}: {
  data: TournamentInfoFormData;
  categories: string[];
}) {
  // Banner/logo/status/sponsors lấy từ giải thật (live qua context); name/địa điểm/ngày từ form đang sửa.
  const t = useTournament();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
        Preview · Thẻ giải
      </p>

      <TournamentHeroCard
        name={data.name || "Tên giải"}
        location={data.location}
        startDate={data.startDate}
        endDate={data.endDate}
        status={t.status}
        bannerUrl={t.bannerUrl}
        logoUrl={t.logoUrl}
      >
        {data.description && (
          <p className="text-[11px] text-zinc-500 line-clamp-2">{data.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {categories.length > 0 ? (
            categories.slice(0, 4).map((c) => (
              <span key={c} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                {c}
              </span>
            ))
          ) : (
            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">— hạng mục —</span>
          )}
        </div>
        {t.sponsors.length > 0 && (
          <p className="text-[10px] text-zinc-600 mt-2">{t.sponsors.length} nhà tài trợ</p>
        )}
      </TournamentHeroCard>

      <p className="text-[11px] text-zinc-600 italic leading-relaxed">
        Banner/logo/nhà tài trợ cập nhật ngay khi lưu. Tên & thời gian cập nhật khi bạn lưu tab Cơ bản.
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
export function TournamentInfoClient({ categories }: { categories: string[] }) {
  const tournament = useTournament();
  const refresh = useTournamentRefresh();
  const [activeTab, setActiveTab] = useState<Tab>("Cơ bản");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!slugManual && nameValue) {
      setValue("slug", slugify(nameValue), { shouldDirty: true });
    }
  }, [nameValue, slugManual, setValue]);

  async function onSubmit(data: TournamentInfoFormData) {
    setSaving(true);
    setSaveError(null);
    try {
      await updateTournament(tournament.id, {
        name: data.name,
        slug: data.slug,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
      });
      await refresh(); // sync context so other tabs reflect the saved basics
    } catch (e) {
      setSaveError(authErrorMessage(e));
    } finally {
      setSaving(false);
    }
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
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Thông tin giải"
        description="Cấu hình cơ bản, chi tiết, nhà tài trợ, thanh toán. Mọi thay đổi đều có audit log."
        actions={actions}
      />

      {/* Tabs nav (cố định cùng header) */}
      <div className="flex-shrink-0 px-8 border-b border-zinc-800">
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

      <PageBody preview={<PreviewCard data={formData} categories={categories} />}>
        {activeTab === "Cơ bản" && (
          <form
            id="tournament-info-form"
            onSubmit={handleSubmit(onSubmit)}
            className="px-8 py-6 space-y-5"
          >
            {saveError && (
              <div className="text-[13px] text-red-300 bg-red-950/50 border border-red-900/60 rounded-md px-3 py-2">
                {saveError}
              </div>
            )}
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
          </form>
        )}

        {activeTab === "Chi tiết & Thể lệ" && (
          <DetailsRulesTab tournamentId={tournament.id} initialRules={tournament.rulesText} />
        )}
        {activeTab === "Nhà tài trợ" && (
          <SponsorsTab tournamentId={tournament.id} initialSponsors={tournament.sponsors} />
        )}
        {activeTab === "Banner & Hình ảnh" && (
          <MediaTab tournamentId={tournament.id} initialBanner={tournament.bannerUrl} initialLogo={tournament.logoUrl} />
        )}
      </PageBody>
    </div>
  );
}

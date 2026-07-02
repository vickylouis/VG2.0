import { Bell } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import AiCoachSettingsCard from "@/components/admin/settings/AiCoachSettingsCard";
import GoalsSettingsCard from "@/components/admin/settings/GoalsSettingsCard";
import HabitsSettingsCard from "@/components/admin/settings/HabitsSettingsCard";
import MissionSettingsCard from "@/components/admin/settings/MissionSettingsCard";
import PreferencesSettingsCard from "@/components/admin/settings/PreferencesSettingsCard";
import ProfileSettingsCard from "@/components/admin/settings/ProfileSettingsCard";
import ScoringSettingsCard from "@/components/admin/settings/ScoringSettingsCard";
import SettingsBackupCard from "@/components/admin/settings/SettingsBackupCard";
import {
  displaySettingValue,
  settingsCardClassName,
} from "@/components/admin/settings/settingsStyles";
import {
  type AppSettings,
  type AppSettingsConfig,
} from "@/lib/settings";

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#D4AF37]/10 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <dt className="text-sm text-[#A3A3A3]">{label}</dt>
      <dd className="text-right text-sm font-medium text-[#F5F5F5]">
        {displaySettingValue(value)}
      </dd>
    </div>
  );
}

function ReadOnlySettingsCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <article className={settingsCardClassName}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
          <Icon className="size-5 text-[#D4AF37]" aria-hidden />
        </div>
        <h2 className="text-lg font-bold text-[#F5F5F5]">{title}</h2>
      </div>
      <dl>{children}</dl>
    </article>
  );
}

type SettingsSectionsProps = {
  settings: AppSettings;
  brandName: string;
};

export default function SettingsSections({
  settings,
  brandName,
}: SettingsSectionsProps) {
  const config = settings.config ?? {};

  if (!settings.id) {
    return null;
  }

  return (
    <div className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-2">
      <SettingsBackupCard
        settingsId={settings.id}
        config={config}
        brandName={brandName}
      />
      <ProfileSettingsCard
        settingsId={settings.id}
        profile={config.profile}
      />
      <MissionSettingsCard
        settingsId={settings.id}
        mission={config.mission}
      />
      <GoalsSettingsCard settingsId={settings.id} goals={config.goals} />
      <HabitsSettingsCard settingsId={settings.id} habits={config.habits} />
      <ScoringSettingsCard settingsId={settings.id} config={config} />
      <AiCoachSettingsCard settingsId={settings.id} config={config} />
      <PreferencesSettingsCard
        settingsId={settings.id}
        preferences={config.preferences}
      />
      <ReadOnlySettingsCard title="Notifications" icon={Bell}>
        <SettingRow
          label="Daily check-in enabled"
          value={config.notifications?.daily_checkin_enabled}
        />
        <SettingRow
          label="Daily check-in time"
          value={config.notifications?.daily_checkin_time}
        />
      </ReadOnlySettingsCard>
    </div>
  );
}

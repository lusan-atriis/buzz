import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { AgentAvailabilityReader } from "@/features/agents/lib/useAgentAvailability";
import {
  getPresenceDotClassName,
  getPresenceLabel,
} from "@/features/presence/lib/presence";
import { useUserProfileQuery } from "@/features/profile/hooks";
import type { RelayAgent } from "@/shared/api/types";
import type { ProfilePanelOpenOptions } from "@/shared/context/ProfilePanelContext";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { AgentIdentityCard } from "./AgentIdentityCard";
import { OtherSetupAgentMarker } from "./OtherSetupAgentMarker";
import { IDENTITY_CARD_GRID_CLASS } from "./UnifiedAgentsSection";

export const OWNED_ELSEWHERE_LABEL = "Your agents on other devices";

/**
 * The viewer's agents that this app doesn't manage (selectOwnedElsewhereAgents):
 * read-only cards — name, presence, the shared "Not managed on this device"
 * marker — that open the agent's profile. No Start, Stop, Edit or Delete:
 * those belong to whatever runs the agent, and presence never grants them
 * (docs/agent-availability.md).
 */
export function OwnedElsewhereAgentsSection({
  agents,
  getAvailability,
  onOpenAgentProfile,
}: {
  agents: readonly RelayAgent[];
  getAvailability: AgentAvailabilityReader;
  onOpenAgentProfile: (
    pubkey: string,
    options?: ProfilePanelOpenOptions,
  ) => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  if (agents.length === 0) return null;

  return (
    <section className="space-y-2" data-testid="owned-elsewhere-agents">
      <button
        aria-expanded={!collapsed}
        className="group flex items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/50"
        data-testid="owned-elsewhere-agents-toggle"
        onClick={() => setCollapsed((value) => !value)}
        type="button"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{OWNED_ELSEWHERE_LABEL}</span>
        <span className="text-xs text-muted-foreground">({agents.length})</span>
      </button>
      {!collapsed ? (
        <>
          <p className="px-1 text-xs text-muted-foreground">
            Agents you own that run outside this app. Open one to see its
            profile and activity; start, stop and change it where it runs.
          </p>
          <div className={IDENTITY_CARD_GRID_CLASS}>
            {agents.map((agent) => (
              <OwnedElsewhereAgentCard
                agent={agent}
                getAvailability={getAvailability}
                key={agent.pubkey}
                onOpenAgentProfile={onOpenAgentProfile}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function OwnedElsewhereAgentCard({
  agent,
  getAvailability,
  onOpenAgentProfile,
}: {
  agent: RelayAgent;
  getAvailability: AgentAvailabilityReader;
  onOpenAgentProfile: (
    pubkey: string,
    options?: ProfilePanelOpenOptions,
  ) => void;
}) {
  const profileQuery = useUserProfileQuery(agent.pubkey);
  const availability = getAvailability(agent.pubkey);
  const availabilityLabel = availability
    ? getPresenceLabel(availability)
    : "Availability unknown";
  const channelCount = agent.channels.length;
  const subtitle =
    profileQuery.data?.about?.trim() ||
    (channelCount === 1 ? "1 channel" : `${channelCount} channels`);

  return (
    <AgentIdentityCard
      ariaLabel={`${agent.name} agent profile`}
      avatarUrl={profileQuery.data?.avatarUrl}
      dataTestId={`owned-elsewhere-agent-${agent.pubkey}`}
      footerAccessory={
        <OtherSetupAgentMarker
          testId={`owned-elsewhere-agent-marker-${agent.pubkey}`}
        />
      }
      label={agent.name}
      subtitle={subtitle}
      onClick={() => {
        onOpenAgentProfile(agent.pubkey);
      }}
      statusBadge={
        <Badge
          className="gap-1.5"
          data-testid={`owned-elsewhere-agent-availability-${agent.pubkey}`}
          variant="secondary"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-2 w-2 rounded-full",
              availability
                ? getPresenceDotClassName(availability)
                : "bg-muted-foreground/35",
            )}
          />
          {availabilityLabel}
        </Badge>
      }
    />
  );
}

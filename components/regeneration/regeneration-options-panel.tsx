"use client";

import type { RegenerationRequest, RegenerationSectionOption } from "@/lib/regeneration/types";

interface RegenerationOptionsPanelProps {
  request: RegenerationRequest;
  sections: RegenerationSectionOption[];
  disabled: boolean;
  onChange: (request: RegenerationRequest) => void;
}

export function RegenerationOptionsPanel({ request, sections, disabled, onChange }: RegenerationOptionsPanelProps) {
  return (
    <section className="regeneration-options-panel" aria-label="Regeneration options">
      <label>
        Mode
        <select value={request.mode} onChange={(event) => onChange({ ...request, mode: event.target.value as RegenerationRequest["mode"] })} disabled={disabled}>
          <option value="rewrite">Rewrite</option>
          <option value="improve">Improve</option>
          <option value="expand">Expand</option>
          <option value="shorten">Shorten</option>
          <option value="simplify">Simplify</option>
          <option value="adjust_tone">Adjust tone</option>
        </select>
      </label>

      <label>
        Level
        <select value={request.level} onChange={(event) => onChange({ ...request, level: event.target.value as RegenerationRequest["level"] })} disabled={disabled}>
          <option value="full">Full content</option>
          <option value="section">Section/block</option>
          <option value="field">Field</option>
        </select>
      </label>

      {request.level === "section" || request.level === "field" ? (
        <label>
          Section / block
          <select
            value={request.target.sectionId ?? ""}
            onChange={(event) => onChange({ ...request, target: { ...request.target, sectionId: event.target.value || undefined } })}
            disabled={disabled}
          >
            <option value="">Select section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>{section.heading}</option>
            ))}
          </select>
        </label>
      ) : null}

      {request.level === "field" ? (
        <label>
          Field
          <select
            value={request.target.fieldKey ?? ""}
            onChange={(event) =>
              onChange({
                ...request,
                target: { ...request.target, fieldKey: event.target.value as RegenerationRequest["target"]["fieldKey"] },
              })}
            disabled={disabled}
          >
            <option value="">Select field</option>
            <option value="headline">Headline</option>
            <option value="title">Title</option>
            <option value="summary">Summary</option>
            <option value="cta">CTA</option>
            <option value="caption">Caption</option>
          </select>
        </label>
      ) : null}

      {request.mode === "adjust_tone" ? (
        <label>
          Tone
          <select
            value={request.tone ?? ""}
            onChange={(event) => onChange({ ...request, tone: (event.target.value || undefined) as RegenerationRequest["tone"] })}
            disabled={disabled}
          >
            <option value="">Select tone</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="premium">Premium</option>
            <option value="friendly">Friendly</option>
            <option value="bold">Bold</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      ) : null}

      <label>
        Extra instructions
        <textarea
          value={request.instructions ?? ""}
          onChange={(event) => onChange({ ...request, instructions: event.target.value || undefined })}
          disabled={disabled}
          placeholder="Optional instruction for regenerate request"
        />
      </label>
    </section>
  );
}


"use client";

import { useState } from "react";
import type { SectionType, WebsiteSection } from "@/lib/ai/structure";

interface EditorSectionSelectorProps {
  sections: WebsiteSection[];
  selectedSectionId?: string;
  onSelect: (sectionId?: string) => void;
  onToggleVisibility: (sectionId: string, visible: boolean) => void;
  onRemove: (sectionId: string) => void;
  onMoveUp: (sectionId: string) => void;
  onMoveDown: (sectionId: string) => void;
  onAdd: (type: SectionType) => void;
}

const SECTION_TYPES: SectionType[] = ["hero", "about", "services", "testimonials", "cta", "contact", "footer", "custom"];

export function EditorSectionSelector({
  sections,
  selectedSectionId,
  onSelect,
  onToggleVisibility,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAdd,
}: EditorSectionSelectorProps) {
  const [nextType, setNextType] = useState<SectionType>("about");

  return (
    <section className="editor-section-selector">
      <div className="editor-section-selector-header">
        <h3>Sections</h3>
        <div className="editor-inline-actions">
          <select
            value={nextType}
            onChange={(event) => setNextType(event.target.value as SectionType)}
            aria-label="Select section type to add"
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => onAdd(nextType)}>
            Add section
          </button>
        </div>
      </div>

      <ul>
        {sections
          .slice()
          .sort((left, right) => left.order - right.order)
          .map((section) => (
            <li key={section.id}>
              <button
                type="button"
                className={selectedSectionId === section.id ? "is-active" : undefined}
                onClick={() => onSelect(section.id)}
              >
                {section.type} #{section.order}
              </button>
              <div className="editor-inline-actions">
                <button type="button" onClick={() => onMoveUp(section.id)} aria-label={`Move ${section.type} up`}>
                  ↑
                </button>
                <button type="button" onClick={() => onMoveDown(section.id)} aria-label={`Move ${section.type} down`}>
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onToggleVisibility(section.id, !section.visible)}
                  aria-label={section.visible ? `Hide ${section.type}` : `Show ${section.type}`}
                >
                  {section.visible ? "Hide" : "Show"}
                </button>
                <button type="button" onClick={() => onRemove(section.id)} aria-label={`Remove ${section.type}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}

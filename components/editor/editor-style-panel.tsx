import type { LayoutVariantName } from "@/lib/ai/layout";
import type { StylePreset, TonePreset } from "@/lib/ai/structure";

interface EditorStylePanelProps {
  tone: TonePreset;
  style: StylePreset;
  layoutTemplate?: LayoutVariantName;
  themeMode?: "light" | "dark" | "auto";
  onToneChange: (value: TonePreset) => void;
  onStyleChange: (value: StylePreset) => void;
  onLayoutTemplateChange: (value: LayoutVariantName) => void;
  onThemeModeChange: (value: "light" | "dark" | "auto") => void;
}

const LAYOUT_VARIANTS: LayoutVariantName[] = [
  "hero-first",
  "content-heavy",
  "minimal",
  "grid-based",
  "services-first",
  "contact-focused",
];

const TONE_OPTIONS: TonePreset[] = ["professional", "casual", "premium", "friendly", "bold", "custom"];
const STYLE_OPTIONS: StylePreset[] = ["minimalist", "modern", "corporate", "editorial", "playful", "custom"];

export function EditorStylePanel({
  tone,
  style,
  layoutTemplate,
  themeMode,
  onToneChange,
  onStyleChange,
  onLayoutTemplateChange,
  onThemeModeChange,
}: EditorStylePanelProps) {
  return (
    <section className="editor-panel">
      <h3>Style and theme</h3>
      <p className="editor-panel-description">Update the generated website&apos;s existing visual direction and layout settings.</p>
      <div className="editor-panel-fields">
        <label>
          <span>Tone</span>
          <select value={tone} onChange={(event) => onToneChange(event.target.value as TonePreset)}>
            {TONE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Style</span>
          <select value={style} onChange={(event) => onStyleChange(event.target.value as StylePreset)}>
            {STYLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Layout template</span>
          <select
            value={layoutTemplate || "hero-first"}
            onChange={(event) => onLayoutTemplateChange(event.target.value as LayoutVariantName)}
          >
            {LAYOUT_VARIANTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Theme mode</span>
          <select
            value={themeMode || "auto"}
            onChange={(event) => onThemeModeChange(event.target.value as "light" | "dark" | "auto")}
          >
            <option value="auto">auto</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
      </div>
      <div className="editor-planned-style-note">
        <strong>Theme tokens planned</strong>
        <p>Color palettes, typography, button treatments, container shapes, and spacing scales are not persisted controls yet.</p>
      </div>
    </section>
  );
}

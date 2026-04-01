import type { WebsiteComponent } from "@/lib/ai/structure/types";

interface ComponentRendererProps {
  component: WebsiteComponent;
}

/**
 * Render a single website component by dispatching on `component.type`.
 *
 * This renderer provides the MVP foundation for component-level structure.
 * Additional component types can be added here as the editor evolves.
 */
export function ComponentRenderer({ component }: ComponentRendererProps) {
  switch (component.type) {
    case "heading":
      return (
        <h2 className="gs-component gs-component-heading">
          {String(component.props.text ?? "")}
        </h2>
      );
    case "paragraph":
      return (
        <p className="gs-component gs-component-paragraph">
          {String(component.props.text ?? "")}
        </p>
      );
    case "button":
      return (
        <button className="gs-component gs-component-button" type="button">
          {String(component.props.label ?? "")}
        </button>
      );
    case "list": {
      const items = Array.isArray(component.props.items)
        ? (component.props.items as unknown[]).map(String)
        : [];
      return (
        <ul className="gs-component gs-component-list">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    case "card": {
      const title =
        typeof component.props.title === "string"
          ? component.props.title
          : undefined;
      const body =
        typeof component.props.body === "string"
          ? component.props.body
          : undefined;
      return (
        <div className="gs-component gs-component-card">
          {title && <h3>{title}</h3>}
          {body && <p>{body}</p>}
        </div>
      );
    }
    default:
      return null;
  }
}

import octicons from "@primer/octicons";
export function Icon({
  name,
  size = 16,
  color = "currentColor",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const icon = octicons[name]?.heights["16"];
  if (!icon) return null;
  return (
    <svg
      width={(size * icon.width) / 16}
      height={size}
      viewBox={`0 0 ${icon.width} 16`}
      fill={color}
      aria-hidden="true"
    >
      {icon.ast.children.map((node, i) => (
        <path key={i} {...node.attributes} />
      ))}
    </svg>
  );
}

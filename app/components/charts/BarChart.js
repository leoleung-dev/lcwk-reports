"use client";

import styles from "./Charts.module.css";

function getMaxValue(groups) {
  return Math.max(
    ...groups.flatMap((group) =>
      (group.bars || []).map((bar) => Number(bar.value) || 0)
    ),
    0
  );
}

export default function BarChart({
  groups,
  maxValue,
  columns,
  onGroupClick,
  activeGroupKey,
  groupClassName,
  formatValue,
  formatValueLabel,
  showValueLabels = true,
  minBarHeight = 6,
  chartHeight,
  ariaLabel,
}) {
  const resolvedMax = Number.isFinite(maxValue) ? maxValue : getMaxValue(groups);
  const valueFormatter = formatValue || ((value) => String(value ?? ""));
  const valueLabelFormatter = formatValueLabel || valueFormatter;
  const gridStyle = columns
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : undefined;
  const chartStyle = {
    ...(gridStyle || {}),
    ...(chartHeight ? { "--bar-group-height": `${chartHeight}px` } : null),
  };

  return (
    <div className={styles.barChart} style={chartStyle} aria-label={ariaLabel}>
      {groups.map((group) => {
        const isActive = activeGroupKey === group.key;
        const extraClassName =
          typeof groupClassName === "function"
            ? groupClassName(group)
            : groupClassName;
        const resolvedGroupClassName = `${styles.barGroup} ${
          isActive ? styles.barGroupActive : ""
        } ${extraClassName || ""}`;
        const groupMax = Number.isFinite(group.maxValue)
          ? group.maxValue
          : resolvedMax;
        return (
          <div key={group.key} className={resolvedGroupClassName}>
            <div className={styles.barGroupBars}>
              {(group.bars || []).map((bar) => {
                const value = Number(bar.value) || 0;
                const height = groupMax
                  ? Math.max((value / groupMax) * 100, value > 0 ? minBarHeight : 0)
                  : 0;
                const tooltipLabel =
                  bar.tooltipLabel || bar.label || group.label || "";
                const Wrapper =
                  bar.onClick || onGroupClick ? "button" : "div";
                const wrapperProps =
                  bar.onClick || onGroupClick
                    ? {
                        type: "button",
                        onClick: bar.onClick || (() => onGroupClick(group.key)),
                      }
                    : {};
                return (
                  <Wrapper
                    key={bar.key}
                    className={`${styles.barItem} ${
                      bar.onClick || onGroupClick ? styles.barItemButton : ""
                    }`}
                    style={{
                      "--bar-height": `${height}%`,
                      "--bar-color": bar.color || undefined,
                    }}
                    {...wrapperProps}
                  >
                    <span className={styles.barTooltip}>
                      {tooltipLabel ? `${tooltipLabel}: ` : ""}
                      {valueFormatter(value)}
                    </span>
                    {showValueLabels ? (
                      <span className={styles.barValue}>
                        {Number.isFinite(value) ? valueLabelFormatter(value) : "-"}
                      </span>
                    ) : null}
                    <div className={styles.barFill} />
                  </Wrapper>
                );
              })}
            </div>
            <span className={styles.barLabel}>{group.label}</span>
          </div>
        );
      })}
    </div>
  );
}

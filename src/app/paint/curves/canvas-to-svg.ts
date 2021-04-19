// Part of https://github.com/gliffy/canvas2svg/blob/master/canvas2svg.js

export const arc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise: boolean): string => {
  startAngle = startAngle % (2 * Math.PI);
  endAngle = endAngle % (2 * Math.PI);
  if (startAngle === endAngle) {
    // circle time! subtract some of the angle so svg is happy (svg elliptical arc can't draw a full circle)
    endAngle = ((endAngle + (2 * Math.PI)) - 0.001 * (counterClockwise ? -1 : 1)) % (2 * Math.PI);
  }
  const endX = x + radius * Math.cos(endAngle);
  const endY = y + radius * Math.sin(endAngle);
  const startX = x + radius * Math.cos(startAngle);
  const startY = y + radius * Math.sin(startAngle);
  const sweepFlag = counterClockwise ? 0 : 1;
  let largeArcFlag = 0;
  let diff = endAngle - startAngle;

  // https://github.com/gliffy/canvas2svg/issues/4
  if (diff < 0) {
    diff += 2 * Math.PI;
  }

  if (counterClockwise) {
    largeArcFlag = diff > Math.PI ? 0 : 1;
  } else {
    largeArcFlag = diff > Math.PI ? 1 : 0;
  }

  return `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
};

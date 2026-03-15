const ones = [
  "",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

function readGroup(
  hundreds: number,
  tens: number,
  units: number,
  showZeroHundred: boolean,
): string {
  const parts: string[] = [];

  if (hundreds > 0) {
    parts.push(ones[hundreds] + " trăm");
    if (tens === 0 && units > 0) {
      parts.push("lẻ");
    }
  } else if (showZeroHundred) {
    parts.push("không trăm");
    if (tens === 0 && units > 0) {
      parts.push("lẻ");
    }
  }

  if (tens > 1) {
    parts.push(ones[tens] + " mươi");
    if (units === 1) {
      parts.push("mốt");
    } else if (units === 4 && tens >= 2) {
      parts.push("tư");
    } else if (units === 5) {
      parts.push("lăm");
    } else if (units > 0) {
      parts.push(ones[units]);
    }
  } else if (tens === 1) {
    parts.push("mười");
    if (units === 5) {
      parts.push("lăm");
    } else if (units > 0) {
      parts.push(ones[units]);
    }
  } else if (units > 0) {
    parts.push(ones[units]);
  }

  return parts.join(" ");
}

const units = ["", " nghìn", " triệu", " tỷ"];

/**
 * Converts a number to Vietnamese words.
 * Supports numbers up to billions.
 * Returns empty string for 0 or negative/NaN.
 */
export function numberToVietnameseWords(n: number): string {
  if (!n || n <= 0 || !Number.isFinite(n)) return "";

  const num = Math.floor(n);
  if (num === 0) return "";

  const str = num.toString();
  // Pad to multiple of 3
  const padded = str.padStart(Math.ceil(str.length / 3) * 3, "0");

  const groups: number[][] = [];
  for (let i = 0; i < padded.length; i += 3) {
    groups.push([
      parseInt(padded[i]),
      parseInt(padded[i + 1]),
      parseInt(padded[i + 2]),
    ]);
  }

  const totalGroups = groups.length;
  const result: string[] = [];

  for (let i = 0; i < totalGroups; i++) {
    const [h, t, u] = groups[i];
    const unitIndex = totalGroups - 1 - i;
    if (h === 0 && t === 0 && u === 0) continue;

    const showZeroHundred = i > 0 && h === 0 && (t > 0 || u > 0);
    const text = readGroup(h, t, u, showZeroHundred);
    if (text) {
      result.push(text + (units[unitIndex] || ""));
    }
  }

  const output = result.join(" ").trim();
  // Capitalize first letter
  return output.charAt(0).toUpperCase() + output.slice(1) + " đồng";
}

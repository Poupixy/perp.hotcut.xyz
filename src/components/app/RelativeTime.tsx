import { useEffect, useState } from "react";

export function RelativeTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    let txt: string;
    if (diff < 60) txt = `${Math.floor(diff)}s ago`;
    else if (diff < 3600) txt = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) txt = `${Math.floor(diff / 3600)}h ago`;
    else txt = `${Math.floor(diff / 86400)}d ago`;
    setText(txt);
  }, [iso]);

  return <span>{text}</span>;
}

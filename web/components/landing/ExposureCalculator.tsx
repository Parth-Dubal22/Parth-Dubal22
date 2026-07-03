"use client";

import { useState } from "react";
import Link from "next/link";

/** Exposure Calculator — landing lead magnet (Website_Teardown Part 3, addition #1).
 *  Pure client-side arithmetic on user-entered numbers; nothing is stored or sent. */
export default function ExposureCalculator() {
  const [builders, setBuilders] = useState(3);
  const [avgOwed, setAvgOwed] = useState(12000);

  const total = Math.max(0, Math.floor(builders)) * Math.max(0, avgOwed);
  const fmt = "$" + total.toLocaleString("en-AU");

  return (
    <div className="appcard pro rv wrap-narrow">
      <h3>How much of your money is riding on your builders?</h3>
      <p className="sub" style={{ fontSize: ".92rem" }}>
        Enter your numbers — the maths happens on your device and nothing is stored.
      </p>
      <div className="grid2">
        <label htmlFor="exp-builders">
          Builders you work under
          <input
            id="exp-builders"
            type="number"
            min={0}
            step={1}
            value={builders}
            onChange={(e) => setBuilders(Number(e.target.value) || 0)}
            aria-label="Number of builders you work under"
          />
        </label>
        <label htmlFor="exp-avg">
          Average amount owed per builder ($)
          <input
            id="exp-avg"
            type="number"
            min={0}
            step={500}
            value={avgOwed}
            onChange={(e) => setAvgOwed(Number(e.target.value) || 0)}
            aria-label="Average amount owed per builder in dollars"
          />
        </label>
      </div>
      <div className="mcard strip-or">
        <b style={{ fontSize: "1.05rem" }}>
          You could have {fmt} riding on builders&rsquo; solvency right now. Check them free.
        </b>
        <span>YOUR NUMBERS · CALCULATED ON THIS PAGE · NOT STORED</span>
      </div>
      <div className="actions">
        <Link className="btn btn-p btn-lg" href="/check">
          Check your builders free →
        </Link>
      </div>
    </div>
  );
}

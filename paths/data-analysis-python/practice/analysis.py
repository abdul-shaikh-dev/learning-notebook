"""Reference report for the fictional completed-ticket dataset."""
from pathlib import Path
import argparse
import hashlib
import json
import platform
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
BASE = Path(__file__).resolve().parent
REQUIRED = {"ticket_id", "created_date", "channel", "priority", "team", "customer_messages", "resolution_hours", "breached"}

def validate(frame):
    if not REQUIRED.issubset(frame.columns):
        raise ValueError("Missing required columns")
    df = frame.copy()
    if df.empty or df[list(REQUIRED)].isna().any().any():
        raise ValueError("Required values must be present in a nonempty table")
    if not df.ticket_id.astype(str).str.strip().ne("").all() or df.ticket_id.duplicated().any():
        raise ValueError("Ticket IDs must be nonblank and unique")
    for column, allowed in {"channel": {"email", "chat"}, "priority": {"low", "high"}, "team": {"billing", "technical"}}.items():
        if not df[column].isin(allowed).all():
            raise ValueError("Unknown " + column)
    df["created_date"] = pd.to_datetime(df.created_date, format="%Y-%m-%d", errors="raise")
    if df.created_date.isna().any():
        raise ValueError("Missing parsed date")
    for column in ["customer_messages", "resolution_hours", "breached"]:
        df[column] = pd.to_numeric(df[column], errors="raise")
        if not np.isfinite(df[column].to_numpy(dtype=float)).all():
            raise ValueError("Nonfinite " + column)
    if (df.resolution_hours < 0).any():
        raise ValueError("Negative duration")
    if ((df.customer_messages < 0) | (df.customer_messages % 1 != 0)).any():
        raise ValueError("Message counts must be nonnegative whole numbers")
    if not df.breached.isin([0, 1]).all() or not (df.breached == (df.resolution_hours > 24).astype(int)).all():
        raise ValueError("Breach flag disagrees with strict 24-hour rule")
    return df

def attach_owners(df, teams):
    if not {"team", "owner"}.issubset(teams.columns) or teams[["team", "owner"]].isna().any().any():
        raise ValueError("Lookup requires team and owner")
    joined = df.merge(teams, on="team", how="left", validate="many_to_one", indicator=True)
    if not joined["_merge"].eq("both").all():
        raise ValueError("Unmatched team")
    return joined.drop(columns="_merge")

def summarize(df):
    return df.groupby("team", sort=True).agg(tickets=("ticket_id", "size"), breaches=("breached", "sum"), breach_rate=("breached", "mean"), mean_hours=("resolution_hours", "mean")).reset_index()

def threshold_rates(df):
    return {str(t): float((df.resolution_hours > t).mean()) for t in [12, 24, 48]}

def run(out, source=BASE / "support_tickets.csv", lookup=BASE / "teams.csv"):
    source = Path(source)
    df = validate(pd.read_csv(source, dtype={"ticket_id": "string"}))
    joined = attach_owners(df, pd.read_csv(lookup))
    table = summarize(joined)
    report = {"rows": len(df), "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "versions": {"python": platform.python_version(), "numpy": np.__version__, "pandas": pd.__version__, "matplotlib": matplotlib.__version__}, "teams": table.to_dict(orient="records"), "overall_breach_rate": float(df.breached.mean()), "threshold_rates": threshold_rates(df), "limitation": "Fictional completed tickets only. These results do not estimate real service performance or causal effects."}
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "report.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.bar(table.team, table.tickets, color="#356c9b")
    ax.set(xlabel="Team", ylabel="Ticket count", title="Fictional completed tickets by team", ylim=(0, max(table.tickets) + 2))
    for i, value in enumerate(table.tickets):
        ax.text(i, value + .15, str(value), ha="center")
    fig.tight_layout()
    fig.savefig(out / "counts.png", dpi=120)
    plt.close(fig)
    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("report-output"))
    args = parser.parse_args()
    result = run(args.out)
    print(f"Wrote report.json and counts.png for {result['rows']} fictional tickets")

import re, json, sys
from decimal import Decimal, ROUND_HALF_EVEN, ROUND_HALF_UP
src = open(sys.argv[1]).read()
rows = re.findall(r"\('550e8400-e29b-41d4-a716-446655440000', '(770e[^']+)', '(\d{4}-\d\d-\d\d)', ([\d.]+), (\d+), (\d+), (\d+), ([\d.]+)\)", src)
out = {}
for cid, d, spend, imp, clk, conv, rev in rows:
    out.setdefault(cid, []).append(dict(date=d, spend=float(spend), revenue=float(rev), clicks=int(clk), impressions=int(imp), conversions=int(conv), _s=spend, _r=rev))
print(len(rows), file=sys.stderr)
def agg(fr, to, ids=None):
    S=R=Decimal(0); C=I=V=0
    for cid, rs in out.items():
        if ids and cid not in ids: continue
        for r in rs:
            if fr <= r['date'] <= to:
                S+=Decimal(r['_s']); R+=Decimal(r['_r']); C+=r['clicks']; I+=r['impressions']; V+=r['conversions']
    return S,R,C,I,V
for name,(fr,to) in {'all':('2025-10-21','2026-08-20'),'30':('2026-07-22','2026-08-20'),'7':('2026-08-14','2026-08-20'),'prev30':('2026-06-22','2026-07-21')}.items():
    S,R,C,I,V = agg(fr,to)
    q=Decimal('0.01')
    print(name, S, R, C, I, V, 'ctr', (Decimal(C)/I*100).quantize(q, ROUND_HALF_UP), 'cpa', (S/V).quantize(q, ROUND_HALF_UP), (S/V), 'roas', (R/S).quantize(q,ROUND_HALF_UP), R/S, file=sys.stderr)
for cid in out:
    for r in out[cid]: del r['_s']; del r['_r']
    # add backend ratio fields
    for r in out[cid]:
        r['ctr']= r['clicks']/r['impressions'] if r['impressions'] else None
        r['cpc']= r['spend']/r['clicks'] if r['clicks'] else None
        r['cpa']= r['spend']/r['conversions'] if r['conversions'] else None
        r['roas']= r['revenue']/r['spend'] if r['spend'] else None
json.dump(out, open('seed.json','w'))

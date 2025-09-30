#!/usr/bin/env python3
import csv
import re
import sys
from pathlib import Path


def find_task_records(xer_text):
    lines = xer_text.splitlines()
    in_task_table = False
    fields = []
    records = []

    for line in lines:
        if line.startswith('%T'):
            table = line[2:].strip().split('\t', 1)[-1].strip().upper()
            if in_task_table and table != 'TASK':
                # End of TASK table
                break
            in_task_table = table == 'TASK'
            fields = []
            continue

        if not in_task_table:
            continue

        if line.startswith('%F'):
            fields = line[2:].strip().split('\t')
            continue

        if line.startswith('%R') and fields:
            values = line[2:].split('\t')
            if len(values) < len(fields):
                values += [''] * (len(fields) - len(values))
            records.append(dict(zip(fields, values)))

    return fields, records


def pick_field(keys, candidates, contains_rules=None):
    lower_map = {k.lower(): k for k in keys}
    for cand in candidates:
        if cand in lower_map:
            return lower_map[cand]
    if contains_rules:
        for key in keys:
            lk = key.lower()
            ok = True
            for substr, must_exist in contains_rules:
                if must_exist and substr not in lk:
                    ok = False
                    break
                if (not must_exist) and substr in lk:
                    ok = False
                    break
            if ok:
                return key
    return None


def compile_aliases():
    # Trade list from user (keeping exact labels)
    # Structural Steel, Equipment Placement, Structural Piles, Concrete Pour, Concrte Formwork,
    # Concrete Rebar, Generator Placement, DWTR Installation, MWT Installation, Conveyance,
    # Backfill, Equipment, Conduit, Roofing Metal Deck, Roofing Membrane, Roofing Flashing
    alias = {
        'Structural Steel': [
            r'structural\s+steel', r'steel\s+erection', r'erect\s+steel', r'set\s+columns?', r'set\s+beams?',
            r'hang\s+joists?', r'bar\s+joists?', r'\bowsj\b', r'bolt[- ]?up', r'field\s+weld',
            r'base\s*plate\s*grout', r'moment\s+connection', r'shear\s+studs?'
        ],
        'Equipment Placement': [
            r'equipment\s+placement', r'set\s+equipment', r'place\s+equipment',
            r'(?:rig(?:ging)?)\b.*equipment|equipment.*rig(?:ging)?', r'equipment\s+setting',
            r'hoist(?:ing)?\b.*equipment', r'set\s+skid', r'\brigg?\b'
        ],
        'Structural Piles': [
            r'pile\s+driv', r'drive\s+piles?', r'install\s+piles?', r'auger\s*cast', r'\bacip\b',
            r'drilled\s+shafts?', r'caissons?', r'micro\s*piles?', r'\bh[- ]?piles?\b', r'test\s+piles?', r'\bpda\b'
        ],
        'Concrete Pour': [
            r'place\s+concrete', r'\bslab\s+pour\b', r'\bsog\b', r'slab\s+on\s+grade', r'deck\s+pour',
            r'mat\s+pour', r'wall\s+pour', r'column\s+pour', r'topping\s+slab', r'cast[- ]?in[- ]?place|\bcip\b',
            r'concrete\s+placement'
        ],
        'Concrte Formwork': [
            r'formwork', r'\bforms?\b', r'edge\s+forms?', r'wall\s+forms?', r'deck\s+forms?', r'shoring', r'reshore', r'falsework'
        ],
        'Concrete Rebar': [
            r'\brebar\b', r'reinforcing\s+steel', r'place\s+reinforce', r'tie\s+rebar', r'\bdowels?\b',
            r'\bww[fm]\b', r'welded\s+wire\s+(fabric|mesh)', r'\bpt\b', r'post[- ]?tension'
        ],
        'Generator Placement': [
            r'genset', r'generator\s+placement', r'install\s+generator', r'place\s+generator', r'rig\s+gen',
            r'emergency\s+generator', r'\bdg\s*set\b', r'gen\s+rigging'
        ],
        'DWTR Installation': [
            r'dewater(?:ing)?', r'wellpoints?', r'deep\s+well\s+dewater', r'sump\s+pumps?', r'header\s+pipe',
            r'dewater\s+system', r'drawdown\s+wells?'
        ],
        'MWT Installation': [
            r'make[- ]?up\s+water\s+tank', r'\bmuwt\b', r'\bmwt\b.*tank|tank.*\bmwt\b', r'set\s+mwt',
            r'place\s+mwt', r'mwt\s+rigging', r'water\s+tank\s+install'
        ],
        'Conveyance': [
            r'elevators?', r'\blifts?\b', r'escalators?', r'car\s+install', r'rails\b.*hoistway|hoistway.*rails',
            r'hoistway\s+equipment', r'machine[- ]?room\s+equipment', r'\bmrl\b', r'elevator\s+pit'
        ],
        'Backfill': [
            r'\bbackfill\b', r'compact(?:ion)?\b', r'trench\s+backfill', r'\bbedding\b', r'select\s+fill',
            r'\bclsm\b', r'flowable\s+fill', r'structural\s+fill'
        ],
        'Equipment': [
            r'install\s+equipment', r'equipment\s+install', r'equipment\s+hook\s*up', r'commission(?:ing)?\b'
        ],
        'Conduit': [
            r'\bconduit\b', r'duct\s*bank', r'\bductbank\b', r'underground\s+conduit|\bug\b\s*conduit|\bu/g\b\s*conduit',
            r'\brgs\b', r'\bemt\b', r'pvc\s+conduit', r'trench\s+and\s+conduit', r'\b(mh|hh)\b', r'handholes?|manholes?', r'pull\s+box'
        ],
        'Roofing Metal Deck': [
            r'metal\s+deck', r'roof\s+deck', r'floor\s+deck', r'pour\s+stop\b', r'edge\s+angle', r'deck\s+support',
            r'\bb[- ]?deck\b', r'\bq[- ]?deck\b'
        ],
        'Roofing Membrane': [
            r'\btpo\b', r'\bepdm\b', r'pvc\s+membrane', r'\bsbs\b', r'\bbur\b', r'torch[- ]?down', r'single[- ]?ply',
            r'install\s+membrane', r'roof\s+membrane'
        ],
        'Roofing Flashing': [
            r'\bflashing\b', r'base\s+flashing', r'counter\s*flashing', r'curb\s+flashing', r'parapet\s+flashing',
            r'\bcoping\b', r'roof\s+edge\s+metal', r'scuppers?|sleeve\s+flashing'
        ],
    }

    return {trade: [re.compile(pat, re.IGNORECASE) for pat in pats] for trade, pats in alias.items()}


def map_tasks_to_trades(xer_path, out_path):
    text = xer_path.read_text(errors='ignore')
    fields, records = find_task_records(text)
    if not records:
        print('No TASK records found', file=sys.stderr)
        sys.exit(2)

    all_keys = list({k for r in records for k in r.keys()})
    name_key = pick_field(
        all_keys,
        candidates=[
            'task_name', 'task_long_name', 'task_descr', 'task_desc', 'task_short_name', 'task_title'
        ],
        contains_rules=[('name', True), ('proj', False)],
    )
    id_key = pick_field(
        all_keys,
        candidates=['task_code', 'task_id', 'taskid', 'task_uid', 'id', 'code'],
        contains_rules=[('task', True), ('id', True)],
    )

    if not name_key:
        print('No task name field found. Keys seen: ' + ', '.join(sorted(all_keys)), file=sys.stderr)
        sys.exit(3)

    patterns = compile_aliases()

    rows = []
    for rec in records:
        name = (rec.get(name_key, '') or '').strip()
        if not name:
            continue
        task_id = (rec.get(id_key, '') or '').strip() if id_key else ''

        matches = []
        reasons = []
        for trade, pats in patterns.items():
            matched_pat = None
            for p in pats:
                if p.search(name):
                    matched_pat = p.pattern
                    break
            if matched_pat:
                matches.append(trade)
                reasons.append("{}: matched '{}' in '{}'".format(trade, matched_pat, name))

        # Prefer specific over generic equipment
        if 'Equipment Placement' in matches and 'Equipment' in matches:
            matches = [m for m in matches if m != 'Equipment']
            reasons = [r for r in reasons if not r.startswith('Equipment:')]

        judgement = '; '.join(dict.fromkeys(matches)) if matches else 'Unassigned'
        reason_text = '; '.join(reasons) if reasons else 'No alias match'
        rows.append((task_id, name, judgement, reason_text))

    with out_path.open('w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['TaskID', 'TaskName', 'TradeJudgement', 'Reasoning'])
        w.writerows(rows)


def main():
    if len(sys.argv) != 3:
        print('Usage: xer_trade_map.py <input.xer> <output.csv>')
        sys.exit(1)
    inp = Path(sys.argv[1])
    outp = Path(sys.argv[2])
    map_tasks_to_trades(inp, outp)
    print(str(outp))


if __name__ == '__main__':
    main()



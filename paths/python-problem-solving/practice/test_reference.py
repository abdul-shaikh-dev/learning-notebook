"""Reference checks using small independent oracles; stdlib only, no timing claims."""
import copy
import itertools
import json
import random
import unittest
from collections import Counter
from pathlib import Path

import check
import reference

BASE = Path(__file__).resolve().parent


class ReferenceTests(unittest.TestCase):
    def answer(self, function, args, expected):
        inputs = copy.deepcopy(args)
        before = copy.deepcopy(inputs)
        actual = getattr(reference, function)(*inputs)
        self.assertTrue(check.equivalent(actual, expected),
                        f"{function}{args!r}: expected {expected!r}, got {actual!r}")
        self.assertTrue(check.equivalent(inputs, before), f"{function} mutated its input")

    def test_published_cases_and_no_mutation(self):
        cases = json.loads((BASE/"cases.json").read_text(encoding="utf-8"))
        self.assertEqual(len(cases), 37)
        for id, job in cases.items():
            for index, case in enumerate(job["cases"]):
                with self.subTest(challenge=id, case=index):
                    self.answer(job["function"], case["args"], case["expected"])

    def test_windows_against_all_subarrays(self):
        # Enumerating each slice is intentionally different from a sliding window.
        for length in range(5):
            for values in itertools.product(range(3), repeat=length):
                values = list(values)
                for width in range(1, length+2):
                    scores = [sum(values[i:i+width]) for i in range(length-width+1)]
                    expected = scores.index(max(scores)) if scores else -1
                    self.answer("busiest_block", [values, width], expected)
                for budget in range(4):
                    expected = max((j-i for i in range(length+1) for j in range(i,length+1)
                                    if sum(values[i:j]) <= budget), default=0)
                    self.answer("affordable_stretch", [values,budget], expected)

    def test_search_and_pairs_against_linear_enumeration(self):
        for length in range(5):
            for values in itertools.combinations_with_replacement(range(4), length):
                values = list(values)
                for target in range(7):
                    first = next((i for i,v in enumerate(values) if v >= target), length)
                    self.answer("first_suitable", [values,target], first)
                    pair = any(values[i]+values[j] == target for i in range(length) for j in range(i+1,length))
                    self.answer("can_fill_pair", [values,target], pair)
        # Negative values exercise the same sorted-pointer contract.
        self.answer("can_fill_pair", [[-9,-4,-4,0,5],-8], True)

    def test_prefix_and_balance_against_slices(self):
        for length in range(5):
            for values in itertools.product((-1,0,1), repeat=length):
                values=list(values)
                queries=[[i,j] for i in range(length+1) for j in range(i,length+1)]
                self.answer("range_totals",[values,queries],[sum(values[i:j]) for i,j in queries])
                index=next((i for i in range(length) if sum(values[:i])==sum(values[i+1:])), -1)
                self.answer("balance_marker",[values],index)

    def test_peak_requests_against_every_integer_start(self):
        for length in range(5):
            for times in itertools.combinations_with_replacement(range(5), length):
                for width in (1,2,3,6):
                    expected=max(sum(start <= t < start+width for t in times) for start in range(-width,6))
                    self.answer("peak_requests",[list(times),width],expected)

    def test_intervals_against_unit_cell_coverage_and_subsets(self):
        rng=random.Random(90421)
        population=[[a,b] for a in range(6) for b in range(a+1,7)]
        for _ in range(90):
            intervals=[rng.choice(population)[:] for _ in range(rng.randrange(8))]
            cells={t for a,b in intervals for t in range(a,b)}
            expected=[]
            for cell in sorted(cells):
                if expected and expected[-1][1]==cell:
                    expected[-1][1]=cell+1
                else:
                    expected.append([cell,cell+1])
            self.answer("maintenance_coverage",[intervals],expected)
            for duration in range(1,8):
                start=next((s for s in range(7-duration+1)
                            if all(t not in cells for t in range(s,s+duration))),-1)
                self.answer("first_open_slot",[intervals,7,duration],start)
            optimum=0
            for mask in range(1<<len(intervals)):
                chosen=[intervals[i] for i in range(len(intervals)) if mask>>i&1]
                if all(b<=c or d<=a for (a,b),(c,d) in itertools.combinations(chosen,2)):
                    optimum=max(optimum,len(chosen))
            self.answer("book_most_sessions",[intervals],optimum)

    def test_dependency_order_against_all_permutations(self):
        tasks=["a","b","c"]
        edges=list(itertools.product(tasks,repeat=2))
        # All directed graphs of three nodes, including cycles and self-edges.
        for mask in range(1<<len(edges)):
            requirements=[list(edge) for i,edge in enumerate(edges) if mask>>i&1]
            valid=[list(order) for order in itertools.permutations(tasks)
                   if all(order.index(pre)<order.index(task) for task,pre in requirements)]
            expected=min(valid) if valid else None
            self.answer("ready_order",[list(reversed(tasks)),requirements],expected)
        self.answer("ready_order",[tasks,[["b","a"],["b","a"]]],tasks)

    def test_stacks_by_repeated_pair_removal(self):
        for length in range(5):
            for letters in itertools.product("()[]",repeat=length):
                original="".join(letters)
                reduced=original
                while True:
                    next_text=reduced.replace("()","").replace("[]","")
                    if next_text==reduced:
                        break
                    reduced=next_text
                self.answer("balanced_groups",[original],reduced=="")
        self.answer("balanced_groups",["letter { [word] (more) }"],True)

    def test_duplicate_intersection_and_frequency_ties(self):
        rng=random.Random(718)
        for _ in range(100):
            left=sorted(rng.choices(range(-2,3),k=rng.randrange(9)))
            right=sorted(rng.choices(range(-2,3),k=rng.randrange(9)))
            expected=sorted((Counter(left)&Counter(right)).elements())
            self.answer("shared_readings",[left,right],expected)
            labels=rng.choices(["","a","A","b"],k=rng.randrange(10))
            winner=min(set(labels),key=lambda s:(-labels.count(s),labels.index(s))) if labels else None
            self.answer("most_requested",[labels],winner)

    def test_robot_and_neighbours_against_direct_rules(self):
        rng=random.Random(901)
        steps={"R":(1,0),"L":(-1,0),"D":(0,1),"U":(0,-1)}
        for _ in range(200):
            width,height=rng.randint(1,4),rng.randint(1,4)
            moves="".join(rng.choice("RLUD") for _ in range(rng.randrange(15)))
            x=y=0
            for move in moves:
                dx,dy=steps[move]
                if (x+dx) in range(width) and (y+dy) in range(height):
                    x,y=x+dx,y+dy
            self.answer("robot_position",[moves,width,height],[x,y])
            grid=[[rng.randint(0,1) for _ in range(width)] for _ in range(height)]
            cells={(r,c):v for r,row in enumerate(grid) for c,v in enumerate(row)}
            expected=[[sum(cells.get((r+a,c+b),0) for a in (-1,0,1) for b in (-1,0,1) if a or b)
                       for c in range(width)] for r in range(height)]
            self.answer("occupied_neighbours",[grid],expected)

    def test_rooms_against_busiest_instant(self):
        rng=random.Random(902)
        for _ in range(300):
            meetings=[[s,s+rng.randint(1,6)] for s in (rng.randint(0,15) for _ in range(rng.randrange(8)))]
            expected=max((sum(s<=t<e for s,e in meetings) for t in range(25)),default=0)
            self.answer("rooms_needed",[meetings],expected)

    def test_folders_against_flattened_totals(self):
        rng=random.Random(903)
        def make(depth):
            return {"files":[rng.randint(0,9) for _ in range(rng.randrange(3))],
                    "folders":[make(depth+1) for _ in range(rng.randrange(3) if depth<3 else 0)]}
        def everything(folder):
            yield folder
            for sub in folder["folders"]:
                yield from everything(sub)
        for _ in range(150):
            root,limit=make(0),rng.randint(0,40)
            totals=[sum(sum(f["files"]) for f in everything(folder)) for folder in everything(root)]
            self.answer("count_large_folders",[root,limit],sum(total>=limit for total in totals))

    def test_route_against_repeated_relaxation(self):
        rng=random.Random(904)
        for _ in range(200):
            rows,cols=rng.randint(1,4),rng.randint(2,4)
            cells=[[rng.choice("..#") for _ in range(cols)] for _ in range(rows)]
            (sr,sc),(er,ec)=rng.sample([(r,c) for r in range(rows) for c in range(cols)],2)
            cells[sr][sc],cells[er][ec]="S","E"
            dist={(sr,sc):0}
            for _ in range(rows*cols):
                for (r,c),d in list(dist.items()):
                    for n in ((r+1,c),(r-1,c),(r,c+1),(r,c-1)):
                        if 0<=n[0]<rows and 0<=n[1]<cols and cells[n[0]][n[1]]!="#" and dist.get(n,99)>d+1:
                            dist[n]=d+1
            self.answer("shortest_route",[["".join(row) for row in cells]],dist.get((er,ec),-1))

    def test_coins_against_enumerated_combinations(self):
        rng=random.Random(905)
        for _ in range(120):
            coins=sorted(rng.sample(range(1,8),rng.randint(1,3)))
            amount=rng.randint(0,12)
            expected=next((n for n in range(amount+1)
                           if any(sum(c)==amount for c in itertools.combinations_with_replacement(coins,n))),-1)
            self.answer("fewest_coins",[coins,amount],expected)

    def test_seating_against_all_permutations(self):
        rng=random.Random(906)
        for _ in range(100):
            guests=list("ABCDE")[:rng.randint(0,5)]
            rivals=[rng.sample(guests,2) for _ in range(rng.randrange(4))] if len(guests)>1 else []
            banned={frozenset(pair) for pair in rivals}
            expected=sum(all(frozenset(order[i:i+2]) not in banned for i in range(len(order)-1))
                         for order in itertools.permutations(guests))
            self.answer("seating_orders",[guests,rivals],expected)


if __name__ == "__main__":
    unittest.main()

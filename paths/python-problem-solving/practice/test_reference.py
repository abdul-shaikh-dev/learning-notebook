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
        self.assertEqual(len(cases), 30)
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


if __name__ == "__main__":
    unittest.main()

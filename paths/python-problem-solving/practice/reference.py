"""Worked solutions. Open after an attempt; check.py uses solutions.py by default."""

from __future__ import annotations



# 1. Total approved minutes

def sum_approved(minutes: list[int], minimum: int) -> int:
    total = 0
    for duration in minutes:
        if duration >= minimum:
            total += duration
    return total



# 2. Keep readings within limits

def clamp_readings(readings: list[int], low: int, high: int) -> list[int]:
    result = []
    for value in readings:
        if value < low:
            result.append(low)
        elif value > high:
            result.append(high)
        else:
            result.append(value)
    return result



# 3. Find the first label that fits

def first_long_label(labels: list[str], minimum: int) -> int:
    for index, label in enumerate(labels):
        if len(label) >= minimum:
            return index
    return -1



# 4. Measure an active streak

def longest_active_run(flags: list[int]) -> int:
    current = 0
    best = 0
    for flag in flags:
        if flag == 1:
            current += 1
            best = max(best, current)
        else:
            current = 0
    return best



# 5. Normalize a display label

def clean_label(text: str) -> str:
    words = []
    for word in text.lower().split(" "):
        if word:
            words.append(word)
    return " ".join(words)



# 6. Report changes between readings

def reading_changes(readings: list[int]) -> list[int]:
    changes = []
    for index in range(1, len(readings)):
        changes.append(readings[index] - readings[index - 1])
    return changes



# 7. Keep the first occurrence

def keep_first_labels(labels: list[str]) -> list[str]:
    seen = set()
    result = []
    for label in labels:
        if label not in seen:
            seen.add(label)
            result.append(label)
    return result



# 8. Combine delivery quantities

def stock_totals(deliveries: list[list]) -> dict[str, int]:
    totals = {}
    for item, quantity in deliveries:
        totals[item] = totals.get(item, 0) + quantity
    return totals



# 9. Total uneven rows

def column_totals(rows: list[list[int]]) -> list[int]:
    totals = []
    for row in rows:
        for index, value in enumerate(row):
            if index == len(totals):
                totals.append(0)
            totals[index] += value
    return totals



# 10. Keep a robot inside the grid

def robot_position(moves: str, width: int, height: int) -> list[int]:
    steps = {"R": (1, 0), "L": (-1, 0), "D": (0, 1), "U": (0, -1)}
    column = row = 0
    for move in moves:
        dx, dy = steps[move]
        new_column, new_row = column + dx, row + dy
        if 0 <= new_column < width and 0 <= new_row < height:
            column, row = new_column, new_row
    return [column, row]



# 11. Count occupied neighbouring desks

def occupied_neighbours(grid: list[list[int]]) -> list[list[int]]:
    rows = len(grid)
    result = []
    for r in range(rows):
        cols = len(grid[r])
        line = []
        for c in range(cols):
            count = 0
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    if (dr or dc) and 0 <= r + dr < rows and 0 <= c + dc < cols:
                        count += grid[r + dr][c + dc]
            line.append(count)
        result.append(line)
    return result



# 12. Group names by initial

def group_by_initial(names: list[str]) -> dict[str, list[str]]:
    groups = {}
    for name in names:
        if not name:
            continue
        initial = name[0]
        if initial not in groups:
            groups[initial] = []
        groups[initial].append(name)
    return groups



# 13. Choose the most requested label

def most_requested(labels: list[str]) -> str | None:
    counts = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1
    winner = None
    best = 0
    for label in labels:
        if counts[label] > best:
            winner = label
            best = counts[label]
    return winner



# 14. Pack exactly two entries

def can_fill_pair(sizes: list[int], target: int) -> bool:
    left = 0
    right = len(sizes) - 1
    while left < right:
        total = sizes[left] + sizes[right]
        if total == target:
            return True
        if total < target:
            left += 1
        else:
            right -= 1
    return False



# 15. Match repeated readings

def shared_readings(left: list[int], right: list[int]) -> list[int]:
    i = 0
    j = 0
    result = []
    while i < len(left) and j < len(right):
        if left[i] == right[j]:
            result.append(left[i])
            i += 1
            j += 1
        elif left[i] < right[j]:
            i += 1
        else:
            j += 1
    return result



# 16. Find the busiest fixed block

def busiest_block(counts: list[int], width: int) -> int:
    if width > len(counts):
        return -1
    current = 0
    for index in range(width):
        current += counts[index]
    best = current
    best_start = 0
    for end in range(width, len(counts)):
        current += counts[end] - counts[end - width]
        if current > best:
            best = current
            best_start = end - width + 1
    return best_start



# 17. Fit consecutive costs into a budget

def affordable_stretch(costs: list[int], budget: int) -> int:
    left = 0
    current = 0
    best = 0
    for right, cost in enumerate(costs):
        current += cost
        while current > budget:
            current -= costs[left]
            left += 1
        best = max(best, right - left + 1)
    return best



# 18. Answer several range totals

def range_totals(values: list[int], queries: list[list[int]]) -> list[int]:
    prefix = [0]
    for value in values:
        prefix.append(prefix[-1] + value)
    return [prefix[stop] - prefix[start] for start, stop in queries]



# 19. Place a balanced marker

def balance_marker(values: list[int]) -> int:
    total = sum(values)
    left = 0
    for index, value in enumerate(values):
        if left == total - left - value:
            return index
        left += value
    return -1



# 20. Find the first suitable capacity

def first_suitable(capacities: list[int], required: int) -> int:
    low = 0
    high = len(capacities)
    while low < high:
        middle = (low + high) // 2
        if capacities[middle] < required:
            low = middle + 1
        else:
            high = middle
    return low



# 21. Check nested groups

def balanced_groups(text: str) -> bool:
    stack = []
    openers = "([{"
    pairs = {")": "(", "]": "[", "}": "{"}
    for char in text:
        if char in openers:
            stack.append(char)
        elif char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False
    return not stack



# 22. Count rooms for overlapping meetings

import heapq

def rooms_needed(meetings: list[list[int]]) -> int:
    ends = []
    most = 0
    for start, end in sorted(meetings):
        while ends and ends[0] <= start:
            heapq.heappop(ends)
        heapq.heappush(ends, end)
        most = max(most, len(ends))
    return most



# 23. Count folders over a size limit

def count_large_folders(folder: dict, limit: int) -> int:
    def visit(current: dict) -> tuple[int, int]:
        total, count = sum(current["files"]), 0
        for sub in current["folders"]:
            sub_total, sub_count = visit(sub)
            total += sub_total
            count += sub_count
        return total, count + (total >= limit)
    return visit(folder)[1]



# 24. Apply note edits with undo

def undo_notes(commands: list[str]) -> list[str]:
    notes = []
    for command in commands:
        if command == "undo":
            if notes:
                notes.pop()
        else:
            notes.append(command[4:])
    return notes



# 25. Read small settings lines

def read_settings(lines: list[str]) -> dict[str, str]:
    result = {}
    allowed = "abcdefghijklmnopqrstuvwxyz_"
    for line in lines:
        line = line.strip(" ")
        if not line or line.startswith("#"):
            continue
        key, separator, value = line.partition("=")
        key = key.strip(" ")
        if not separator or not key or any(char not in allowed for char in key):
            continue
        result[key] = value.strip(" ")
    return result



# 26. Keep the latest device sample

def latest_samples(samples: list[list]) -> dict[str, list[int]]:
    latest = {}
    for device, timestamp, reading in samples:
        if device not in latest or timestamp >= latest[device][0]:
            latest[device] = [timestamp, reading]
    return latest



# 27. Combine maintenance coverage

def maintenance_coverage(intervals: list[list[int]]) -> list[list[int]]:
    result = []
    for start, end in sorted(intervals):
        if not result or start > result[-1][1]:
            result.append([start, end])
        else:
            result[-1][1] = max(result[-1][1], end)
    return result



# 28. Find time for a short appointment

def first_open_slot(busy: list[list[int]], day_end: int, duration: int) -> int:
    candidate = 0
    for start, end in sorted(busy):
        if candidate + duration <= start:
            return candidate
        candidate = max(candidate, end)
    if candidate + duration <= day_end:
        return candidate
    return -1



# 29. Measure a request burst

def peak_requests(timestamps: list[int], width: int) -> int:
    left = 0
    best = 0
    for right, timestamp in enumerate(timestamps):
        while timestamp - timestamps[left] >= width:
            left += 1
        best = max(best, right - left + 1)
    return best



# 30. Convert a price into cents

def parse_price(text: str) -> int | None:
    parts = text.split(".")
    if len(parts) not in (1, 2):
        return None
    whole = parts[0]
    if not 1 <= len(whole) <= 6 or any(c not in "0123456789" for c in whole):
        return None
    fraction = "00"
    if len(parts) == 2:
        fraction = parts[1]
        if len(fraction) != 2 or any(c not in "0123456789" for c in fraction):
            return None
    return int(whole) * 100 + int(fraction)



# 31. Compare numeric release labels

def compare_releases(left: str, right: str) -> int:
    a = [int(part) for part in left.split(".")]
    b = [int(part) for part in right.split(".")]
    for index in range(max(len(a), len(b))):
        x = a[index] if index < len(a) else 0
        y = b[index] if index < len(b) else 0
        if x < y:
            return -1
        if x > y:
            return 1
    return 0



# 32. Plan a small preparation list

def ready_order(tasks: list[str], requirements: list[list[str]]) -> list[str] | None:
    needed = {task: set() for task in tasks}
    for task, prerequisite in requirements:
        needed[task].add(prerequisite)
    ordered = sorted(tasks)
    done = set()
    result = []
    while len(result) < len(tasks):
        selected = None
        for task in ordered:
            if task not in done and needed[task] <= done:
                selected = task
                break
        if selected is None:
            return None
        done.add(selected)
        result.append(selected)
    return result



# 33. Process complete stock requests

def fulfill_orders(stock: dict[str, int], orders: list[list]) -> list[bool]:
    remaining = stock.copy()
    accepted = []
    for item, quantity in orders:
        if remaining.get(item, 0) >= quantity:
            remaining[item] -= quantity
            accepted.append(True)
        else:
            accepted.append(False)
    return accepted



# 34. Find the shortest route through a floor plan

from collections import deque

def shortest_route(grid: list[str]) -> int:
    rows, cols = len(grid), len(grid[0])
    start = next((r, c) for r in range(rows) for c in range(cols) if grid[r][c] == "S")
    queue = deque([(start, 0)])
    seen = {start}
    while queue:
        (r, c), steps = queue.popleft()
        if grid[r][c] == "E":
            return steps
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append(((nr, nc), steps + 1))
    return -1



# 35. Pay an exact amount with the fewest coins

def fewest_coins(coins: list[int], amount: int) -> int:
    impossible = amount + 1
    best = [0] + [impossible] * amount
    for value in range(1, amount + 1):
        for coin in coins:
            if coin <= value and best[value - coin] + 1 < best[value]:
                best[value] = best[value - coin] + 1
    return -1 if best[amount] == impossible else best[amount]



# 36. Count seating orders that keep rivals apart

def seating_orders(guests: list[str], rivals: list[list[str]]) -> int:
    banned = {frozenset(pair) for pair in rivals}
    order: list[str] = []
    seated: set[str] = set()

    def place() -> int:
        if len(order) == len(guests):
            return 1
        total = 0
        for guest in guests:
            if guest in seated:
                continue
            if order and frozenset((order[-1], guest)) in banned:
                continue
            order.append(guest)
            seated.add(guest)
            total += place()
            order.pop()
            seated.remove(guest)
        return total

    return place()



# 37. Fit the most optional sessions

def book_most_sessions(sessions: list[list[int]]) -> int:
    count = 0
    last_end = 0
    for start, end in sorted(sessions, key=lambda interval: (interval[1], interval[0])):
        if start >= last_end:
            count += 1
            last_end = end
    return count



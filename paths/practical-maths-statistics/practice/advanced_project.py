"""Small real-vector operations, with explicit shape validation."""
import math
from foundation_project import finite

def vector(values):
    result = [finite(v) for v in values]
    if not result:
        raise ValueError("nonempty vector required")
    return result

def dot(left, right):
    left, right = vector(left), vector(right)
    if len(left) != len(right):
        raise ValueError("matching dimensions required")
    return sum(a*b for a,b in zip(left,right))

def matvec(matrix, values):
    values = vector(values)
    rows = [vector(row) for row in matrix]
    if not rows or any(len(row) != len(values) for row in rows):
        raise ValueError("nonempty rectangular matrix must match vector")
    return [dot(row,values) for row in rows]

def cosine(left, right):
    left, right = vector(left), vector(right)
    numerator = dot(left,right)
    denominator = math.sqrt(dot(left,left)) * math.sqrt(dot(right,right))
    if denominator == 0:
        raise ValueError("zero vector has no cosine direction")
    return numerator / denominator

if __name__ == "__main__":
    candidates = [[0.9,0.4],[0.6,0.8]]
    for weights in ([0.8,0.2],[0.5,0.5]):
        print([round(v,2) for v in matvec(candidates,weights)])
